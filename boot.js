/* ════════════════════════════════════════════════════════════════════════════
   新世界 · SHINSEKAI // EARLY BOOT (anti-FOUC)
   Loaded synchronously in <head>, right after theme-core.js. Lives in its own
   file (not an inline <script>) because Chromium extension pages (Manifest V3,
   used for the New Tab override) refuse to run inline scripts and inline
   event handlers — the old inline version silently did nothing there.
   ════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var VALID_THEMES = { crimson: 1, tokyonight: 1, sakura: 1, catppuccin: 1, cyberpunk: 1, custom: 1 };
  var VALID_TIERS = { high: 1, mid: 1, eco: 1 };
  var SCENE_ALIASES = { eyes: 'crimson', rengoku: 'crimson', sukuna: 'crimson', gojo: 'tokyonight', sasuke: 'catppuccin' };

  function store(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  try {
    var params = new URLSearchParams(window.location.search);
    var root = document.documentElement;

    var t = params.get('theme') || store('shinsekai-theme') || 'crimson';
    if (!VALID_THEMES[t]) t = 'crimson';
    var s = params.get('scene') || store('shinsekai-scene') || 'crimson';
    s = SCENE_ALIASES[s] || s;
    var tier = params.get('tier') || store('shinsekai-tier') || 'mid';
    if (!VALID_TIERS[tier]) tier = 'mid';

    root.setAttribute('data-theme', t);
    root.setAttribute('data-scene', s);
    root.setAttribute('data-tier', tier);

    // Adaptive visual cost (see FX_LEVELS in script.js): Firefox defaults to 'lite'.
    var fx = params.get('fx') || store('shinsekai-fx');
    if (fx !== 'full' && fx !== 'lite' && fx !== 'min') {
      fx = (window.CSS && CSS.supports && CSS.supports('-moz-appearance', 'none')) ? 'lite' : 'full';
    }
    root.setAttribute('data-fx', fx);

    var THEME_BASE_COLORS = {
      tokyonight: '#0b0f19',
      crimson: '#0d080e',
      sakura: '#140d18',
      catppuccin: '#11111b',
      cyberpunk: '#040710',
      custom: '#080c14'
    };
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', THEME_BASE_COLORS[t] || THEME_BASE_COLORS.crimson);

    if (t === 'custom' && window.SHINSEKAI_deriveThemeVars) {
      var c = params.get('color') || params.get('hex') || store('shinsekai-custom-theme-color') || '#a6e3a1';
      var v = window.SHINSEKAI_deriveThemeVars(c);
      meta.setAttribute('content', v.themeBase);
      var decl =
        '--theme-base:' + v.themeBase + ' !important;' +
        '--accent:' + v.accent + ' !important;' +
        '--accent-glow:' + v.accentGlow + ' !important;' +
        '--accent-soft:' + v.accentSoft + ' !important;' +
        '--accent-alt:' + v.accentAlt + ' !important;' +
        '--accent-cyan:' + v.accentCyan + ' !important;' +
        '--glass-bg:' + v.glassBg + ' !important;' +
        '--glass-border:' + v.glassBorder + ' !important;' +
        '--glass-border-hover:' + v.glassBorderHover + ' !important;' +
        '--particle-color:' + v.particleColor + ' !important;' +
        '--text-main:' + v.textMain + ' !important;' +
        '--text-bright:' + v.textBright + ' !important;' +
        '--text-muted:' + v.textMuted + ' !important;';
      // Inline on <html> (wins over everything) + a stylesheet copy so <body>
      // and any other [data-theme="custom"] element pick the same values up.
      root.style.cssText += ';' + decl;
      var earlyStyle = document.createElement('style');
      earlyStyle.id = 'shinsekai-custom-theme-vars';
      earlyStyle.textContent = ':root[data-theme="custom"],html[data-theme="custom"],body[data-theme="custom"],[data-theme="custom"]{' + decl + '}';
      document.head.appendChild(earlyStyle);
    }

    document.addEventListener('DOMContentLoaded', function () {
      var b = document.body;
      if (!b) return;
      if (!b.getAttribute('data-theme')) b.setAttribute('data-theme', t);
      if (!b.getAttribute('data-scene')) b.setAttribute('data-scene', s);
      if (!b.getAttribute('data-tier')) b.setAttribute('data-tier', tier);
      if (!b.getAttribute('data-fx')) b.setAttribute('data-fx', fx);
    });

    var u = params.get('user') || params.get('operator') || store('shinsekai-operator-name') || 'MIMOGU';
    var h = store('shinsekai-operator-honorific');
    if (h === null) h = '-SAMA';
    var formatted = (h && h !== 'none')
      ? ((h.charAt(0) === '-' || h.charAt(0) === ' ' || h.charAt(0) === '・') ? (u + h) : (u + '-' + h))
      : u;
    window.__SHINSEKAI_OPERATOR__ = { name: u, honorific: h, formatted: formatted };
  } catch (e) {}
})();
