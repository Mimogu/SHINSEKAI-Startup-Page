/* ════════════════════════════════════════════════════════════════════════════
   新世界 · SHINSEKAI // THEME CORE
   Single source of truth for hex/RGB/HSL/HSV color math and the custom-theme
   CSS-variable derivation. Loaded synchronously (no `defer`) BEFORE the
   anti-FOUC boot script in index.html <head>, so both that inline script and
   script.js (loaded later, deferred) call the exact same functions instead
   of each keeping its own hand-copied implementation. See fix directive §3 —
   this file exists specifically so the two can never drift out of sync again.
   ════════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  function hexToRgb(hex) {
    let c = (hex || '#a6e3a1').replace('#', '').trim();
    if (c.length === 3) {
      c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    const num = parseInt(c, 16);
    if (isNaN(num)) return { r: 166, g: 227, b: 161 };
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function rgbToHex(r, g, b) {
    const toHex = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h *= 60;
    }
    return { h, s: s * 100, l: l * 100 };
  }

  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function hexToHue(hex) {
    const { r, g, b } = hexToRgb(hex);
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const delta = max - min;
    if (delta === 0) return 0;
    let hue;
    if (max === rNorm) {
      hue = ((gNorm - bNorm) / delta) % 6;
    } else if (max === gNorm) {
      hue = (bNorm - rNorm) / delta + 2;
    } else {
      hue = (rNorm - gNorm) / delta + 4;
    }
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;
    return hue;
  }

  // HSV helpers for the in-DOM Saturation/Value pad (fix directive §2) —
  // a separate plane from the HSL math above, but sharing the same hue axis.
  function hsvToHex(h, s, v) {
    s /= 100; v /= 100;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = c; g = 0; b = x; }
    else { r = x; g = 0; b = c; }
    return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }

  function hexToHsv(hex) {
    const { r, g, b } = hexToRgb(hex);
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === rn) h = ((gn - bn) / d) % 6;
      else if (max === gn) h = (bn - rn) / d + 2;
      else h = (rn - gn) / d + 4;
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }
    const s = max === 0 ? 0 : (d / max) * 100;
    const v = max * 100;
    return { h, s, v };
  }

  // Fix directive §1: a raw picked color that's too dark (near-black) or too
  // washed out has no minimum-luminance floor anywhere downstream, so every
  // derived accent/glow/particle/border variable collapses to the same
  // near-invisible value against the app's near-black glass panels. This
  // returns a same-hue "working" color clamped to a legible lightness/
  // saturation range for anything rendered as text, a border, or a glow.
  // The caller's own raw hex is left completely untouched — callers that
  // need the literal picked value (swatch dot, hex readout, background
  // tint) should keep using it directly; only this derived copy is clamped.
  function getLegibleAccent(hex) {
    const { r, g, b } = hexToRgb(hex);
    const { h, s, l } = rgbToHsl(r, g, b);
    const safeS = Math.max(35, s);
    const safeL = Math.min(80, Math.max(45, l));
    const safeHex = hslToHex(Math.round(h), safeS, safeL);
    const safeRgb = hexToRgb(safeHex);
    return { hex: safeHex, r: safeRgb.r, g: safeRgb.g, b: safeRgb.b };
  }

  // The one function both the anti-FOUC boot script and script.js call to
  // go from a picked hex to every CSS variable the custom theme needs.
  // Background-ish variables (themeBase, glassBg) use the raw picked RGB —
  // they're fine at any lightness since they're always heavily darkened.
  // Everything rendered as an accent, border, glow, or particle uses the
  // legibility-clamped color instead, so a near-black or washed-out pick
  // never turns into invisible-on-invisible UI.
  function deriveThemeVars(hex) {
    const { r, g, b } = hexToRgb(hex);
    const { r: ar, g: ag, b: ab, hex: accentHex } = getLegibleAccent(hex);

    const themeBase = `rgb(${Math.max(4, Math.floor(r * 0.05))}, ${Math.max(5, Math.floor(g * 0.05))}, ${Math.max(10, Math.floor(b * 0.06))})`;
    const accentGlow = `rgba(${ar}, ${ag}, ${ab}, 0.55)`;
    const accentSoft = `rgba(${ar}, ${ag}, ${ab}, 0.18)`;
    const accentAlt = `rgb(${Math.min(255, Math.floor(ar * 1.15))}, ${Math.min(255, Math.floor(ag * 0.85))}, ${Math.min(255, Math.floor(ab * 1.15))})`;
    const accentCyan = `rgb(${Math.min(255, Math.floor(ar * 0.85))}, ${Math.min(255, Math.floor(ag * 1.15))}, ${Math.min(255, Math.floor(ab * 1.15))})`;
    const glassBg = `rgba(${Math.max(6, Math.floor(r * 0.07))}, ${Math.max(8, Math.floor(g * 0.07))}, ${Math.max(16, Math.floor(b * 0.08))}, 0.80)`;
    const glassBorder = `rgba(${ar}, ${ag}, ${ab}, 0.35)`;
    const glassBorderHover = `rgba(${ar}, ${ag}, ${ab}, 0.85)`;
    const particleColor = `rgba(${ar}, ${ag}, ${ab}, 0.75)`;
    const textMain = `rgb(${Math.min(255, Math.floor(225 + r * 0.10))}, ${Math.min(255, Math.floor(225 + g * 0.10))}, ${Math.min(255, Math.floor(230 + b * 0.10))})`;
    const textMuted = `rgb(${Math.min(255, Math.floor(130 + r * 0.25))}, ${Math.min(255, Math.floor(140 + g * 0.25))}, ${Math.min(255, Math.floor(160 + b * 0.25))})`;

    return {
      themeBase,
      accent: accentHex,
      accentGlow,
      accentSoft,
      accentAlt,
      accentCyan,
      glassBg,
      glassBorder,
      glassBorderHover,
      particleColor,
      textMain,
      textBright: '#ffffff',
      textMuted
    };
  }

  const api = {
    hexToRgb,
    rgbToHex,
    rgbToHsl,
    hslToHex,
    hexToHue,
    hsvToHex,
    hexToHsv,
    getLegibleAccent,
    deriveThemeVars
  };

  global.SHINSEKAI_THEME_CORE = api;
  // Matches the name the anti-FOUC boot script in index.html already calls.
  global.SHINSEKAI_deriveThemeVars = deriveThemeVars;
})(typeof window !== 'undefined' ? window : this);
