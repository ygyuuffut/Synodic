/* Read-only, test-only ownership census. Not declared in modules.json. */
const assert=require('node:assert/strict');
function instrument(html){
 const edits={
  'lunar.buffer.store':"window.SYNODIC_AUDIT.buffer=()=>({scope,entries:values.size,storyEntries:[...values.keys()].filter(k=>k.includes('|story|')).length,storyQueue:(values.get(key('story','queue'))||[]).length});",
  'lunar.bridge.port':"window.SYNODIC_AUDIT.port=()=>({handles:handles.size,nodeOwners:[...handles.values()].filter(e=>e.owner instanceof Node).length,detachedOwners:[...handles.values()].filter(e=>e.owner instanceof Node&&!e.owner.isConnected).length,queries:queries.size,uiActions:uiActions.size,subscribers:changes.size});",
  'lunar.bridge.native':"window.SYNODIC_AUDIT.native=()=>({nodes:nodes.size,detached:[...nodes.values()].filter(n=>!n.isConnected).length,sources:sources.size});",
  'lunar.assets.core':"window.SYNODIC_AUDIT.assets=()=>({pending:pending.size,loaded:loaded.size,unavailable:unavailable.size,listeners:listeners.size});",
  'lunar.adapter.images':"window.SYNODIC_AUDIT.imagePolicy=()=>({approved:approved.size,fallbacks:visualFallbacks.size,cardSources:cardSources.size});",
  'lunar.bridge.story':"window.SYNODIC_AUDIT.story=()=>({active:active.size,detached:[...active.keys()].filter(n=>!n.isConnected).length});",
  'lunar.bridge.pause':"window.SYNODIC_AUDIT.timing=()=>({timers:timers.size,frames:frames.size,owners:owners.size,listeners:listeners.size,media:playing.size,deferred:deferred.length});",
  'moonshine.view.workspace':"window.SYNODIC_AUDIT.workspace=()=>({nodes:nodes.size,detached:[...nodes.values()].filter(n=>!n.isConnected).length,retiredImages:[...nodes.values()].filter(n=>n.nodeType===1&&!n.isConnected&&(n.matches('img,video,canvas')||n.style.backgroundImage.includes('url('))).length,bases:bases.size,sourceKeys:sourceKeys.size,callbacks:callbacks.size,scratch:scratch.size,subscriptions:subscriptions.size,workspaceElements:body.querySelectorAll('*').length});",
  'moonshine.animation.prose':"window.SYNODIC_AUDIT.prose=()=>({active:active.size,detached:[...active.values()].filter(r=>!r.node.isConnected).length});",
  'moonshine.view.background':"window.SYNODIC_AUDIT.background=()=>({live:live.size,detached:[...live].filter(r=>!r.node.isConnected).length,incoming:[...live].filter(r=>r.request).length,dynamicPending:pending.size,dynamicDecoded:decoded.size});"
 };
 for(const [id,addition] of Object.entries(edits)){
  const start=`<script id="${id}">\n`,a=html.indexOf(start);assert(a>=0,id);
  const b=html.indexOf('</script>',a),c=html.slice(a+start.length,b),at=c.lastIndexOf('})();');assert(at>=0,id);
  html=html.slice(0,a+start.length)+c.slice(0,at)+addition+'\n'+c.slice(at)+html.slice(b);
 }
 return html.replace('</head>',`<script id="SYNODIC-audit-test-only">(${browserProbe.toString()})();</script></head>`);
}
function browserProbe(){
 window.SYNODIC_AUDIT={};window.SYNODIC_AUDIT_IO={decode:[],urls:new Set(),createdURLs:0,revokedURLs:0};
 const decode=HTMLImageElement.prototype.decode;
 HTMLImageElement.prototype.decode=function(){const url=this.currentSrc||this.src,t=performance.now();const dimensions={width:this.naturalWidth,height:this.naturalHeight};return decode.call(this).then(v=>{SYNODIC_AUDIT_IO.decode.push({url,ms:performance.now()-t,...dimensions,ok:true});return v;},e=>{SYNODIC_AUDIT_IO.decode.push({url,ms:performance.now()-t,...dimensions,ok:false,error:e.name});throw e;});};
 const create=URL.createObjectURL,revoke=URL.revokeObjectURL;
 URL.createObjectURL=function(blob){const url=create.call(this,blob);SYNODIC_AUDIT_IO.urls.add(url);SYNODIC_AUDIT_IO.createdURLs++;return url;};
 URL.revokeObjectURL=function(url){SYNODIC_AUDIT_IO.urls.delete(url);SYNODIC_AUDIT_IO.revokedURLs++;return revoke.call(this,url);};
}
module.exports={instrument};
