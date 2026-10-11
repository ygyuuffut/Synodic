/* Pure data conversion; all external data is normalized here. */
(function(){
 'use strict';
 var L=window.LUNAR;
 L.adapter.data={
  clone:function(value){return value==null?value:JSON.parse(JSON.stringify(value));},
  snapshot:function(value){var ancestors=new Set();function visit(v){if(v==null||typeof v==='string'||typeof v==='boolean')return v;if(typeof v==='number')return Number.isFinite(v)?v:null;if(typeof v!=='object'||typeof Node!=='undefined'&&v instanceof Node)return undefined;if(ancestors.has(v))return undefined;ancestors.add(v);var type=Object.prototype.toString.call(v),out;if(type==='[object Date]')out=isNaN(v.getTime())?null:v.toISOString();else if(type==='[object Map]')out={format:'map',entries:Array.from(v).map(visit)};else if(type==='[object Set]')out={format:'set',items:Array.from(v).map(visit)};else out=Array.isArray(v)?v.map(visit):Object.fromEntries(Object.entries(v).map(function(pair){return [pair[0],visit(pair[1])];}).filter(function(pair){return pair[1]!==undefined;}));ancestors.delete(v);return out;}return visit(value);},
  number:function(value,fallback){var n=Number(value);return Number.isFinite(n)?n:(fallback||0);},
  richText:function(html,metadata){return Object.assign({html:String(html||''),format:'html',phase:'pending'},metadata||{});},
  shop:function(items,costs){return (items||[]).map(function(item,i){return {id:item.id,title:item.title,description:item.desc||'',price:Number(costs[i])||0,nativeIndex:i};});}
 };
})();
