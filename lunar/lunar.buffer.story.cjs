(function () {
  'use strict';
  var L=window.LUNAR, B=L.buffer;
 var sequence=0;
 B.story={
  enqueue:function(source,html,metadata){var id=source+':'+(++sequence),entry=L.adapter.data.richText(html,Object.assign({id:id,source:source,order:sequence,paragraphId:id},metadata));B.write('story',id,entry);var queue=B.read('story','queue')||[];queue.push(id);B.write('story','queue',queue);B.write('story','latest:'+source,id);return id;},
  update:function(id,patch){var entry=B.read('story',id);if(entry)B.write('story',id,Object.assign(entry,patch));},
  latest:function(source){return B.read('story','latest:'+source);},
  pending:function(){return (B.read('story','queue')||[]).map(function(id){return B.read('story',id);}).filter(function(e){return e&&e.phase!=='displayed';});},
  acknowledge:function(id){B.story.update(id,{phase:'displayed'});},
  get:function(id){return B.read('story',id);}
 };

})();
