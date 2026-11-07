/* ════════════════════════════════════════════════════════════════════════════
   新世界 · SHINSEKAI // EARLY WALLPAPER STAGE
   Synchronous external script placed right after the <video>/<img> stage in
   index.html, so the right wallpaper starts loading before script.js (deferred)
   runs. External rather than inline so it also works on MV3 extension pages.

   It reads the same `shinsekai-active-wallpaper` record script.js writes, so
   it never starts downloading a default video that script.js is about to
   replace (custom uploads, web URLs, Eco mode) and never flashes a stale
   custom thumbnail over a default artwork.
   ════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  function store(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  try {
    var op = window.__SHINSEKAI_OPERATOR__;
    var bootLog = document.getElementById('boot-log');
    if (op && op.formatted && bootLog) bootLog.textContent = 'INIT_CORE: ' + op.formatted + ' AUTHENTICATED';
  } catch (e) {}

  try {
    var VALID = { crimson: 1, tokyonight: 1, sakura: 1, catppuccin: 1, cyberpunk: 1 };
    var ALIASES = { eyes: 'crimson', gojo: 'tokyonight', sasuke: 'catppuccin', rengoku: 'crimson', sukuna: 'crimson' };
    var params = new URLSearchParams(location.search);
    var body = document.body;
    var video = document.getElementById('bg-video');
    var source = document.getElementById('video-source');
    var still = document.getElementById('bg-static');

    var active = null;
    try { active = JSON.parse(store('shinsekai-active-wallpaper') || 'null'); } catch (e) {}

    var scene = params.get('scene') || (active && active.source && active.source.indexOf('default') === 0 ? active.id : null) || store('shinsekai-scene') || 'crimson';
    scene = ALIASES[scene] || scene;
    var mode = params.get('mode') || (active && active.type) || store('shinsekai-wallpaper-mode') || 'live';
    var ultra = params.get('ultra') === '1' || params.get('hd') === '1' || store('shinsekai-ultra') === 'true';
    var origin = (params.get('scene') || params.get('mode')) ? 'default' : ((active && active.source) || 'default');

    var showStill = function (src) {
      body.setAttribute('data-wallpaper-mode', 'static');
      if (still && src) still.src = src;
    };

    if (origin === 'custom-file') {
      // Blob lives in IndexedDB (async) — script.js loads it. Show the tiny
      // cached thumbnail meanwhile for images; nothing for videos.
      if (mode === 'static') showStill(store('shinsekai-custom-wallpaper-thumb'));
      else body.setAttribute('data-wallpaper-mode', 'live');
    } else if (origin === 'custom-url') {
      if (mode === 'static') showStill(active.url);
      else body.setAttribute('data-wallpaper-mode', 'live');
    } else if (scene === 'eco') {
      body.setAttribute('data-wallpaper-mode', 'static');
    } else if (mode === 'static') {
      showStill('assets/previews/' + (VALID[scene] ? scene : 'crimson') + '.webp');
    } else if (VALID[scene]) {
      body.setAttribute('data-wallpaper-mode', 'live');
      if (video) video.poster = 'assets/previews/' + scene + '.webp';
      if (source) source.src = (ultra ? 'assets/animated/' : 'assets/animated/720p/') + scene + '.mp4';
    }

    var p = params.get('particles');
    var particlesOff = p === '0' || p === 'off' || p === 'false' || (p === null && store('shinsekai-particles') === 'off');
    body.setAttribute('data-particles', particlesOff ? 'off' : 'on');
  } catch (e) {}
})();
