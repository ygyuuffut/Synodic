/* LUNAR data-only memory buffer. DOM lifetime never determines data lifetime. */
(function () {
  'use strict';
  var scope='boot', values=new Map(), revision=0;
  function copy(value){return value == null ? value : JSON.parse(JSON.stringify(value));}
  function key(kind,id){return scope+'|'+kind+'|'+id;}
  window.LUNAR={version:1, bridge:{}, adapter:{}, api:{}, buffer:{
    domains:Object.freeze(['game','story','shop','presentation','ui']),
    setScope:function(next){if(next!==scope){scope=next;values.clear();revision++;}},
    getScope:function(){return scope;},
    read:function(kind,id){return copy(values.get(key(kind,id)));},
    write:function(kind,id,value){values.set(key(kind,id),copy(value));revision++;return copy(value);},
    once:function(kind,id,create){var k=key(kind,id);if(!values.has(k))values.set(k,copy(create()));return copy(values.get(k));},
    invalidate:function(kind,id){values.delete(key(kind,id));revision++;},
    clear:function(){values.clear();revision++;},
    get revision(){return revision;}
  }};
})();
