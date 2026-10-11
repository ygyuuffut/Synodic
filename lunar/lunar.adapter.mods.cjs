/* Pure metadata/version compatibility. Numeric releases accept 0.1 as 0.1.0. */
(function(){'use strict';
 function version(value){var match=/^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(String(value).trim());return match?[Number(match[1]),Number(match[2]||0),Number(match[3]||0)]:null;}
 function compare(a,b){a=version(a);b=version(b);if(!a||!b)return null;for(var i=0;i<3;i++)if(a[i]!==b[i])return a[i]>b[i]?1:-1;return 0;}
 function satisfies(current,requirement){
  if(!version(current))return false;if(!requirement)return true;
  var match=/^\s*(>=|>|<=|<|=)?\s*(\d+(?:\.\d+){0,2})\s*$/.exec(requirement);if(!match)return false;
  var result=compare(current,match[2]);return match[1]==='>='?result>=0:match[1]==='>'?result>0:match[1]==='<='?result<=0:match[1]==='<'?result<0:result===0;
 }
 function metadata(data){return {id:String(data.id),core:data.core===true,title:String(data.title||data.id),author:String(data.author||''),description:String(data.description||''),version:String(data.version||''),apiVersion:String(data.apiVersion||''),requiresApi:String(data.requiresApi||'')};}
 window.LUNAR.adapter.mods=Object.freeze({version:version,compare:compare,satisfies:satisfies,metadata:metadata});
})();
