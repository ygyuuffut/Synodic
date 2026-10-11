"""Read-only, bounded Chrome crash metadata. Never exports dump memory or URLs.

Crashpad structures: minidump/minidump_extensions.h (official Crashpad source).
This offline diagnostic helper is not part of the SYNODIC runtime or Logger.
"""
import argparse
import datetime
import json
import pathlib
import struct

SAFE_KEYS = {
    'ptype', 'ax_mode', 'devtools_present', 'gpu-glver', 'view-count',
    'web-frame-count', 'discardable-memory-free', 'discardable-memory-allocated',
}


def inspect(file):
    data = pathlib.Path(file).read_bytes()

    def unpack(fmt, offset):
        return struct.unpack_from(fmt, data, offset)

    def u32(offset):
        return unpack('<I', offset)[0]

    def string(offset, encoding='utf8'):
        if not offset:
            return ''
        length = u32(offset)
        if length > 8192:
            raise ValueError('Annotation string exceeds diagnostic bound')
        return data[offset + 4:offset + 4 + length].decode(encoding, 'replace')

    if data[:4] != b'MDMP':
        raise ValueError('Not a minidump')
    count, directory = unpack('<II', 8)
    if count > 256:
        raise ValueError('Unexpected stream count')
    streams = {kind: (size, rva) for kind, size, rva in
               (unpack('<III', directory + i * 12) for i in range(count))}
    _, exception = streams[6]
    thread = u32(exception)
    address = unpack('<Q', exception + 24)[0]
    _, modules = streams[4]
    module_count = u32(modules)
    if module_count > 4096:
        raise ValueError('Unexpected module count')
    owner = None
    for i in range(module_count):
        offset = modules + 4 + i * 108
        base = unpack('<Q', offset)[0]
        if base <= address < base + u32(offset + 8):
            cv_size, cv = unpack('<II', offset + 76)
            # RSDS is stored with mixed-endian UUID fields; keep raw identity
            # explicit instead of presenting it as a canonical UUID string.
            owner = {'name': pathlib.Path(string(u32(offset + 20), 'utf-16-le')).name,
                     'base': hex(base), 'offset': hex(address - base),
                     'rsdsIdentityBytes': data[cv + 4:cv + 20].hex()
                     if cv_size >= 24 and data[cv:cv + 4] == b'RSDS' else None}
            break
    result = {'dump': pathlib.Path(file).name,
              'utc': datetime.datetime.fromtimestamp(u32(20), datetime.timezone.utc).isoformat(),
              'exceptionCode': hex(u32(exception + 8)), 'threadId': thread,
              'module': owner, 'annotations': {}}
    if 0x43500001 in streams:
        _, crashpad = streams[0x43500001]
        dictionary = u32(crashpad + 40)
        for i in range(min(u32(dictionary), 256)) if dictionary else []:
            key, value = unpack('<II', dictionary + 4 + i * 8)
            if string(key) in {'ver', 'plat', 'prod'}:
                result['annotations'][string(key)] = string(value)
        module_list = u32(crashpad + 48)
        for i in range(min(u32(module_list), 4096)) if module_list else []:
            _, _, info = unpack('<III', module_list + 4 + i * 12)
            annotations = u32(info + 24)
            for j in range(min(u32(annotations), 1024)) if annotations else []:
                name, _, _, value = unpack('<IHHI', annotations + 4 + j * 12)
                key = string(name)
                if key in SAFE_KEYS:
                    result['annotations'][key] = string(value)[:200]
    # ARM64 frame-pointer chain from captured thread stack only. No scan of
    # arbitrary memory, argument strings, other threads, or application data.
    _, system = streams[7]
    context_size, context = unpack('<II', exception + 160)
    if unpack('<H', system)[0] in {12, 0x8003} and context_size >= 272:
        registers = unpack('<31Q', context + 8)
        frame = registers[29]
        _, threads = streams[3]
        stack = None
        for i in range(min(u32(threads), 256)):
            offset = threads + 4 + i * 48
            if u32(offset) == thread:
                stack = unpack('<QII', offset + 24)
                break
        chain = []
        if stack and owner:
            start, size, rva = stack
            base = int(owner['base'], 16)
            for _ in range(32):
                if not (start <= frame and frame + 16 <= start + size):
                    break
                next_frame, return_address = unpack('<QQ', rva + frame - start)
                return_address &= 0x0000007fffffffff
                chain.append(hex(return_address - base)
                             if base <= return_address < base + 0x20000000 else 'other-module')
                if next_frame <= frame:
                    break
                frame = next_frame
        result['framePointerReturnOffsets'] = chain
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('dump', nargs='+')
    parser.add_argument('--output', type=pathlib.Path)
    args = parser.parse_args()
    output = json.dumps([inspect(file) for file in args.dump], indent=2)
    if args.output:
        args.output.write_text(output + '\n', encoding='utf8')
    else:
        print(output)
