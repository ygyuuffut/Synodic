/* Test-only paths: generated games belong to SYNODIC; native inputs are external. */
const fs = require('node:fs');
const path = require('node:path');
const projectRoot = path.resolve(__dirname, '../..');

exports.root = projectRoot;
exports.input = function () {
  return path.resolve(process.env.STG_GAME_INPUT || path.join(projectRoot, '..', 'STG 0.2m-b5.html'));
};

exports.game = function (filename) {
  if (path.isAbsolute(filename)) return filename;
  if (filename === 'STG 0.2m-b5.html' && process.env.STG_GAME_INPUT) return exports.input();
  if (filename.startsWith('SYNODIC/')) return path.resolve(projectRoot, '..', filename);
  if (filename.includes('/') || filename.includes('\\')) return path.resolve(projectRoot, filename);
  const generated = path.join(projectRoot, 'builds', filename);
  if (fs.existsSync(generated)) return generated;
  return path.resolve(projectRoot, '..', filename);
};
