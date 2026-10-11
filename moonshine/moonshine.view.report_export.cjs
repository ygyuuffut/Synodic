/* Explicit long PNG export of owned, translated report geometry. No DOM mutation. */
(function(){'use strict';var api=LUNAR.api.moonshine;
 function image(url,deadline){return new Promise(function(resolve){if(!url){resolve(null);return;}var img=new Image(),done=false,timer;img.dataset.msArtRole='cg';img.crossOrigin='anonymous';function finish(value){if(done)return;done=true;clearTimeout(timer);img.onload=img.onerror=null;if(!value)img.removeAttribute('src');resolve(value);}img.onload=function(){img.decode().then(function(){finish(img);},function(){finish(null);});};img.onerror=function(){finish(null);};api.timing.ui(function(){timer=setTimeout(function(){finish(null);},deadline);});api.resources.withResolved(function(){img.src=url;});});}
 function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,w/2,h/2));}
 async function capture(view,model){var id=model.id,missing=[],source=view.background.style.backgroundImage,paint=api.resources.withResolved(function(){return api.resources.backgroundImage(!source||source==='none'?model.background.image:source);}),art=await image(paint.url,Math.min(5000,api.graphicsQuality.status().animationDeadlineMs));
  if(!api.runReport.valid(id)||!view.root.isConnected)throw new Error('Report changed during export');
  var content=view.content,box=content.getBoundingClientRect(),scrollCSS=getComputedStyle(view.scroll),padTop=parseFloat(scrollCSS.paddingTop),padBottom=parseFloat(scrollCSS.paddingBottom),width=Math.ceil(view.root.getBoundingClientRect().width),height=Math.ceil(Math.max(view.scroll.clientHeight,content.scrollHeight+padTop+padBottom)),scale=Math.min(devicePixelRatio||1,2,32760/Math.max(width,height),Math.sqrt(32000000/(width*height)));
  function position(n){var r=n.getBoundingClientRect();return {x:r.left,y:r.top-box.top+padTop,width:r.width,height:r.height};}
  var canvas=document.createElement('canvas');canvas.width=Math.ceil(width*scale);canvas.height=Math.ceil(height*scale);var ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);
  // Keep the live viewport's CG framing at the top. A long deck must not
  // magnify the picture to the entire PNG height; black is reached before
  // either the picture's lower edge or the mandatory attribution footer.
  var footer=position(content.querySelector('.MOONSHINE-report-attribution')),frameHeight=Math.min(view.background.getBoundingClientRect().height,height),fadeEnd=Math.max(1,Math.min(frameHeight,footer.y));
  if(art){var factor=Math.max(width/art.naturalWidth,frameHeight/art.naturalHeight);ctx.save();ctx.beginPath();ctx.rect(0,0,width,frameHeight);ctx.clip();ctx.drawImage(art,(width-art.naturalWidth*factor)/2,0,art.naturalWidth*factor,art.naturalHeight*factor);ctx.restore();art.removeAttribute('src');}else if(model.background.image!=='none'){missing.push(paint.assetId||'background');}
  var shade=ctx.createLinearGradient(0,0,0,fadeEnd);shade.addColorStop(0,'rgba(0,0,0,.68)');shade.addColorStop(.4,'rgba(0,0,0,.8)');shade.addColorStop(.8,'rgba(0,0,0,.96)');shade.addColorStop(1,'#000');ctx.fillStyle=shade;ctx.fillRect(0,0,width,height);
  // CSS clips the full-height fill before drawing its overlaid contour.
  // Canvas must do the same rather than export the child's bare rectangle.
  content.querySelectorAll('.MOONSHINE-report-track').forEach(function(n){var r=position(n),fill=n.querySelector('.MOONSHINE-report-fill'),s=getComputedStyle(n),stroke=parseFloat(getComputedStyle(n,'::after').borderTopWidth)||1;ctx.save();rounded(ctx,r.x,r.y,r.width,r.height,r.height/2);ctx.clip();ctx.fillStyle=getComputedStyle(fill).backgroundColor;ctx.fillRect(r.x,r.y,fill.getBoundingClientRect().width,r.height);ctx.restore();rounded(ctx,r.x+stroke/2,r.y+stroke/2,r.width-stroke,r.height-stroke,(r.height-stroke)/2);ctx.strokeStyle=s.color;ctx.lineWidth=stroke;ctx.stroke();});
  content.querySelectorAll('.MOONSHINE-report-card,.MOONSHINE-report-upgrade,.MOONSHINE-report-alignment-chip').forEach(function(n){var r=position(n),s=getComputedStyle(n);rounded(ctx,r.x,r.y,r.width,r.height,parseFloat(s.borderRadius)||0);if(s.backgroundColor!=='rgba(0, 0, 0, 0)'){ctx.fillStyle=s.backgroundColor;ctx.fill();}if(parseFloat(s.borderTopWidth)){ctx.strokeStyle=s.borderTopColor;ctx.lineWidth=parseFloat(s.borderTopWidth);ctx.stroke();}});
  var line=position(content.querySelector('.MOONSHINE-report-alignment'));ctx.strokeStyle='#aa92cf';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(line.x,line.y+line.height);ctx.lineTo(line.x+line.width,line.y+line.height);ctx.stroke();ctx.setLineDash([]);
  // Export-only range measurement retains actual wrapping, browser translation
  // and aligned columns. One linear pass over text; no hidden cloned tree.
  var walker=document.createTreeWalker(content,NodeFilter.SHOW_TEXT),node;while((node=walker.nextNode())){if(!node.nodeValue.trim())continue;var parent=node.parentElement,s=getComputedStyle(parent);if(s.visibility==='hidden'||s.display==='none')continue;ctx.font=s.fontStyle+' '+s.fontWeight+' '+s.fontSize+' '+s.fontFamily;ctx.fillStyle=s.color;ctx.textBaseline='alphabetic';var range=document.createRange(),lines=[];
   for(var i=0;i<node.length;i++){range.setStart(node,i);range.setEnd(node,i+1);var r=range.getBoundingClientRect(),last=lines[lines.length-1];if(!r.width&&!r.height)continue;if(last&&Math.abs(last.top-r.top)<1){last.text+=node.nodeValue[i];}else lines.push({x:r.left,top:r.top,height:r.height,text:node.nodeValue[i]});}
   lines.forEach(function(l){ctx.fillText(l.text,l.x,l.top-box.top+padTop+l.height*.8);});range.detach();
  }
  var blob=await new Promise(function(resolve){canvas.toBlob(resolve,'image/png');});if(!blob)throw new Error('PNG export unavailable');return {blob:blob,width:canvas.width,height:canvas.height,missing:missing};
 }
 window.MOONSHINE_REPORT_EXPORT=Object.freeze({capture:capture});
})();
