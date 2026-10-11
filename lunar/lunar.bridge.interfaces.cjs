/* Functions stay in this registry, never in serialized data. */
(function(){'use strict';var L=window.LUNAR;
 var interfaces=new Map(), metadata=new Map(),log=L.logger.scope('LUNAR.native'),commandSequence=0;
 L.bridge.interfaces={
  register:function(name,fn,details){interfaces.set(name,fn);metadata.set(name,Object.assign({category:name.split('.')[0]},details||{}));},
  unregister:function(name){interfaces.delete(name);metadata.delete(name);},
  call:function(name){var fn=interfaces.get(name);if(!fn)throw new Error('Unknown LUNAR interface: '+name);var command=/^(?:game\.stg(?!Get|Read|Build|List|Can|Format|Owned|Icon)|controls\.)/.test(name),id=command?++commandSequence:0;
   if(command)log.info('COMMAND_SENT',{id:id,command:name});try{var result=fn.apply(null,Array.prototype.slice.call(arguments,1));if(command)log.info('COMMAND_RESULT',{id:id,command:name,phase:'returned',async:!!(result&&typeof result.then==='function')});return result;}catch(error){if(L.recovery)L.recovery.remember(error);if(command)log.error('COMMAND_RESULT',error,{id:id,command:name,ok:false});throw error;}},
  list:function(){return Array.from(interfaces.keys());},
  describe:function(category){return Array.from(metadata).filter(function(pair){return !category||pair[1].category===category;}).map(function(pair){return Object.assign({name:pair[0]},pair[1]);});}
 };

})();
