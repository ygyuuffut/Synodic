/* Pause the run's scheduled work, not the menu UI or background music.
   Loaded before the game boots so pending callbacks can retain remaining time. */
(function () {
  'use strict';
  var nativeTimeout = window.setTimeout.bind(window), nativeClear = window.clearTimeout.bind(window);
  var nativeRaf = window.requestAnimationFrame.bind(window), nativeCancel = window.cancelAnimationFrame.bind(window);
  var timers = new Map(), frames = new Map(), owners = new Set(), listeners = new Set(), controls = new WeakMap();
  function notify(){var value=active();listeners.forEach(function(fn){fn(value);});}
  // Exact old-value records keep bridge-owned input suppression out of game updates.
  function control(node,attribute,write){var attributes=controls.get(node)||new Map(),values=attributes.get(attribute)||new Map(),old=node.getAttribute(attribute);values.set(old,(values.get(old)||0)+1);attributes.set(attribute,values);controls.set(node,attributes);write();}
  function inert(node,value){if(node.inert!==value)control(node,'inert',function(){node.inert=value;});}
  function pausedClass(value){if(document.body.classList.contains('LUNAR-run-paused')!==value)control(document.body,'class',function(){document.body.classList.toggle('LUNAR-run-paused',value);});}
  function controlMutation(record){if(record.type!=='attributes')return false;var attributes=controls.get(record.target),values=attributes&&attributes.get(record.attributeName),count=values&&values.get(record.oldValue);if(!count)return false;if(count===1)values.delete(record.oldValue);else values.set(record.oldValue,count-1);if(!values.size)attributes.delete(record.attributeName);if(!attributes.size)controls.delete(record.target);return true;}
  var uiDepth = 0, started = 0, pausedStats = null, heldAnimations = [], heldMedia = [], inertNodes = [];
  var playing = new Set(), mediaHooks = new WeakSet(), deferred = [];
  var safe = '#stg-mobile-tiny-info, #stg-mobile-ingame-options, .stg-mobile-deck-modal, .stg-card-popup-scrim, #stg-confirm-modal, #stg-alert-modal, #stg-slot-picker, .stg-msave-root, #stg-prompt-modal';
  function active() { return owners.size > 0; }
  function ui(fn) { uiDepth++; try { return fn(); } finally { uiDepth--; } }
  function isUi() {
    var event = window.event, target = event && event.target;
    return uiDepth > 0 || !!(active() && target && target.closest && target.closest(safe));
  }
  function musicIds() {
    return ['_stgMapBgmFadeIv','_stgMapBgmFadeInIv','_stgBattleBgmDelay','_stgBattleBgmFade','_stgBgmCrossfade']
      .map(function (key) { return window[key]; });
  }
  function schedule(record, delay) {
    record.remaining = Math.max(0, delay);
    record.due = performance.now() + record.remaining;
    record.handle = nativeTimeout(function () {
      if (!timers.has(record.id)) return;
      if (active() && !record.ui && musicIds().indexOf(record.id) === -1) { record.remaining = 0; record.handle = null; return; }
      if (!record.repeat) timers.delete(record.id);
      var invoke = function () { if (typeof record.fn === 'function') record.fn.apply(window, record.args); else (0,eval)(String(record.fn)); };
      try { if (record.ui || musicIds().indexOf(record.id) !== -1) ui(invoke); else {invoke();if(window.LUNAR&&LUNAR.bridge.port)LUNAR.bridge.port.emit();} }
      finally { if (record.repeat && timers.has(record.id)) schedule(record, record.delay); }
    }, record.remaining);
    if (record.id == null) { record.id = record.handle; timers.set(record.id, record); }
  }
  function timer(fn, delay, args, repeat) {
    var record = { fn: fn, args: args, delay: Math.max(0, Number(delay) || 0), repeat: repeat, ui: isUi(), id: null };
    schedule(record, record.delay);
    if (active() && !record.ui) { nativeClear(record.handle); record.handle = null; }
    return record.id;
  }
  window.setTimeout = function (fn, delay) { return timer(fn, delay, Array.prototype.slice.call(arguments,2), false); };
  window.setInterval = function (fn, delay) { return timer(fn, Math.max(1, Number(delay)||0), Array.prototype.slice.call(arguments,2), true); };
  window.clearTimeout = window.clearInterval = function (id) {
    var record = timers.get(id);
    if (record) { nativeClear(record.handle); timers.delete(id); } else nativeClear(id);
  };
  function frame(record) {
    record.handle = nativeRaf(function (time) {
      if (active() && !record.ui) { record.handle = null; return; }
      frames.delete(record.id);
      if (record.ui) ui(function () { record.fn(time); }); else record.fn(time);
    });
    if (record.id == null) { record.id = record.handle; frames.set(record.id, record); }
  }
  window.requestAnimationFrame = function (fn) {
    var record = { fn: fn, ui: isUi(), id: null }; frame(record);
    if (active() && !record.ui) { nativeCancel(record.handle); record.handle = null; }
    return record.id;
  };
  window.cancelAnimationFrame = function (id) {
    var record = frames.get(id); nativeCancel(record ? record.handle : id); frames.delete(id);
  };
  function isMusic(media) { return media === window.STG_BGM || media === window.STG_BATTLE_BGM || (media.tagName === 'AUDIO' && media.loop); }
  var nativePlay = HTMLMediaElement.prototype.play, nativePause = HTMLMediaElement.prototype.pause;
  function afterResume(fn) { if (active()) deferred.push(fn); else fn(); }
  var addMediaListener = HTMLMediaElement.prototype.addEventListener;
  var removeMediaListener = HTMLMediaElement.prototype.removeEventListener;
  var mediaListeners = new WeakMap();
  HTMLMediaElement.prototype.addEventListener = function (type, listener, options) {
    if (!listener || !/^(ended|playing|loadedmetadata)$/.test(type)) return addMediaListener.call(this,type,listener,options);
    var media = this, entries = mediaListeners.get(media) || [], capture = typeof options === 'boolean' ? options : !!(options && options.capture);
    var entry = entries.find(function (item) { return item.type === type && item.listener === listener && item.capture === capture; });
    if (!entry) {
      entry = { type:type, listener:listener, capture:capture, removed:false };
      entry.wrapped = function (event) {
        var invoke = function () { if (!entry.removed) { if (typeof listener === 'function') listener.call(media,event); else listener.handleEvent(event); } };
        if (isMusic(media)) invoke(); else afterResume(invoke);
      };
      entries.push(entry); mediaListeners.set(media,entries);
    }
    return addMediaListener.call(media,type,entry.wrapped,options);
  };
  HTMLMediaElement.prototype.removeEventListener = function (type, listener, options) {
    var capture = typeof options === 'boolean' ? options : !!(options && options.capture);
    var entries = mediaListeners.get(this) || [];
    var entry = entries.find(function (item) { return item.type === type && item.listener === listener && item.capture === capture; });
    if (entry) { entry.removed = true; entries.splice(entries.indexOf(entry),1); }
    return removeMediaListener.call(this,type,entry ? entry.wrapped : listener,options);
  };
  HTMLMediaElement.prototype.play = function () {
    var media = this;
    if (!mediaHooks.has(media)) {
      mediaHooks.add(media);
      addMediaListener.call(media,'ended',function () { playing.delete(media); });
    }
    if (active() && !isMusic(media) && !isUi()) {
      return new Promise(function (resolve,reject) { deferred.push(function () { media.play().then(resolve,reject); }); });
    }
    playing.add(media);
    var result = nativePlay.call(media);
    if (!result || isMusic(media) || isUi()) return result;
    return new Promise(function (resolve,reject) {
      result.then(function (value) { afterResume(function () { resolve(value); }); },function (error) {
        playing.delete(media); afterResume(function () { reject(error); });
      });
    });
  };
  HTMLMediaElement.prototype.pause = function () { playing.delete(this); return nativePause.call(this); };
  function acquire(owner) {
    if (owners.has(owner)) return;
    if(!active()&&window.LUNAR.bridge.port)window.LUNAR.bridge.port.revision();
    owners.add(owner); if (owners.size > 1) return;
    notify();
    started = Date.now();
    pausedStats = window._STG && window._STG.runStats;
    var now = performance.now(), music = musicIds();
    timers.forEach(function (record) {
      if (record.ui || music.indexOf(record.id) !== -1) return;
      record.remaining = Math.max(0, record.due - now); nativeClear(record.handle); record.handle = null;
    });
    frames.forEach(function (record) { if (!record.ui) { nativeCancel(record.handle); record.handle = null; } });
    document.querySelectorAll('body > *').forEach(function (node) {
      if (/^(MOONSHINE|HECATE)/.test(node.id) || node.matches(safe) || /^(SCRIPT|STYLE|LINK)$/.test(node.tagName)) return;
      inertNodes.push({ node: node, inert: node.inert }); inert(node,true);
    });
    document.getAnimations().forEach(function (animation) {
      var target = animation.effect && animation.effect.target;
      if (target && !target.closest('[data-MOONSHINE-owned],[data-HECATE-owned]') && !target.closest(safe) && animation.playState === 'running') { heldAnimations.push(animation); animation.pause(); }
    });
    playing.forEach(function (media) {
      if (!media.paused && !isMusic(media)) { heldMedia.push(media); nativePause.call(media); }
    });
    pausedClass(true);
  }
  function release(owner) {
    if (!owners.delete(owner) || active()) return;
    if(window.LUNAR.bridge.port)window.LUNAR.bridge.port.revision();
    var duration = Date.now() - started;
    var stats = window._STG && window._STG.runStats;
    if (stats && stats === pausedStats && stats.startedAt) stats.startedAt += duration;
    inertNodes.forEach(function (entry) { inert(entry.node,entry.inert); }); inertNodes = [];
    pausedClass(false);
    heldAnimations.forEach(function (animation) { if (animation.playState === 'paused') animation.play(); }); heldAnimations = [];
    var media = heldMedia; heldMedia = [];
    media.forEach(function (item) { nativePlay.call(item).catch(function () {}); });
    var callbacks = deferred; deferred = []; callbacks.forEach(function (callback) { callback(); });
    timers.forEach(function (record) { if (record.handle == null) schedule(record, record.remaining); });
    frames.forEach(function (record) { if (record.handle == null) frame(record); });
    notify();
  }
  // Background keyboard shortcuts must not advance a turn or skip narrative.
  window.addEventListener('keydown', function (event) {
    if (!active()) return;
    if(event.target instanceof Element && event.target.closest('[data-MOONSHINE-owned],[data-HECATE-owned]'))return;
    event.stopImmediatePropagation();
  }, true);
  function mount() {
    var elapsed = window.stgRunElapsedMs;
    if (typeof elapsed === 'function' && !elapsed._stgPause) {
      var wrapped = function () { return Math.max(0, elapsed.apply(this,arguments) - (active() ? Date.now()-started : 0)); };
      wrapped._stgPause = true; window.stgRunElapsedMs = wrapped;
    }
    var closeSave = window.stgCloseSlotPicker;
    if (typeof closeSave === 'function' && !closeSave._stgPause) {
      var wrappedClose = function () { var result = closeSave.apply(this,arguments); release('save'); return result; };
      Object.assign(wrappedClose, closeSave); wrappedClose._stgPause = true; window.stgCloseSlotPicker = wrappedClose;
    }
  }
  window.LUNAR.bridge.pause = { acquire: acquire, release: release, active: active, ui: ui, controlMutation:controlMutation, subscribe:function(fn){listeners.add(fn);return function(){listeners.delete(fn);};}, game:function(fn){var previous=uiDepth;uiDepth=0;try{return fn();}finally{uiDepth=previous;}}, mount: mount,
    elapsed: function () { return active() ? Date.now()-started : 0; } };
})();
