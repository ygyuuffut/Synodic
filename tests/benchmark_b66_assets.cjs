/* Run sequentially: no concurrent browser CPU contention. */
const {spawnSync}=require('child_process'),path=require('path');
for(const stage of ['before','after'])for(let i=0;i<3;i++){
 const result=spawnSync(process.execPath,[path.join(__dirname,'test_b66_assets_startup_live.cjs')],{env:{...process.env,STG_TEST_HTML:stage==='before'?'builds/assets-b66-before.html':'builds/.STG 0.2m-b6.6.pending.html',ASSET_REPORT:`builds/performance-b66-assets/${stage}-real-${i}.json`,ASSET_OBSERVE_MS:'5000'},encoding:'utf8',maxBuffer:8e6});
 if(result.status!==0){console.error(result.stdout,result.stderr);process.exit(result.status||1);}const output=JSON.parse(result.stdout),lcp=output.lcp.at(-1)?.time;console.log(stage,i,JSON.stringify({paint:output.paint,uiDOM:output.uiObservedTime,interactiveUI:output.interactiveUIObservedTime,requests:output.requests.length,lcp,assets:output.assets}));
}
