/* One stage at a time; sequential fresh Chrome instances, no other benchmarks. */
const {spawnSync}=require('node:child_process'),path=require('node:path');
const stage=process.env.FONT_STAGE||'before';
for(let i=0;i<3;i++){
 const r=spawnSync(process.execPath,[path.join(__dirname,'test_b66_fonts_startup_live.cjs')],{env:{...process.env,STG_TEST_HTML:stage==='before'?'builds/fonts-b66-before.html':'builds/.STG 0.2m-b6.6.pending.html',ASSET_CPU:'9.8',ASSET_REPORT:`builds/performance-b66-fonts/${stage}-3g-${i}.json`,ASSET_OBSERVE_MS:'5000'},encoding:'utf8',maxBuffer:8e6});
 if(r.status!==0){console.error(r.stdout,r.stderr);process.exit(r.status||1);}const x=JSON.parse(r.stdout);console.log(stage,i,JSON.stringify({paint:x.paint,shellLcp:x.firstShellLcp,lcp:x.lcp.at(-1)?.time,interactive:x.interactiveUIObservedTime,fontRequests:x.remoteFontRequests,fontBytes:x.completedFontTransferBytes}));
}
