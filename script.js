/* ════════════════════════════════════════════════════════════════════════════
   新世界 · SHINSEKAI // ANIME CINEMATIC OS
   Engine Controller · Particle Canvas · Subtitle System · Web Audio Synth
   ════════════════════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  /* Safe Storage Wrapper (resilient to browser file:// restrictions) */
  const safeStorage = {
    _mem: {},
    getItem(key) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch (e) {}
      return this._mem[key] || null;
    },
    setItem(key, val) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, val);
          return;
        }
      } catch (e) {}
      this._mem[key] = String(val);
    },
    removeItem(key) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (e) {}
      delete this._mem[key];
    }
  };

  function initShinsekai() {
    document.title = 'shinsekai';
    let isAppSuspended = false;

    /* ─── TIER CONFIG (performance presets) ─── */
    const TIER_CONFIG = {
      high: { particleCount: 30, blurPx: 16, grain: true  },
      mid:  { particleCount: 18, blurPx: 8,  grain: true  },
      eco:  { particleCount: 0,  blurPx: 0,  grain: false }
    };

    function detectTier() {
      const dm = navigator.deviceMemory;
      const hc = navigator.hardwareConcurrency || 4;
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const saveData = navigator.connection && navigator.connection.saveData;
      const smallScreen = window.innerWidth < 900;
      if (reducedMotion) return 'eco';
      if (saveData || (dm && dm <= 4) || smallScreen) return 'mid';
      if (dm === undefined) return 'mid'; // Firefox/Safari don't expose deviceMemory
      if (dm >= 8 && hc >= 8) return 'high';
      return 'mid';
    }

    let currentTier = safeStorage.getItem('shinsekai-tier') || detectTier();
    if (!safeStorage.getItem('shinsekai-tier')) safeStorage.setItem('shinsekai-tier', currentTier);

    function applyTierPreset(tier) {
      currentTier = tier;
      safeStorage.setItem('shinsekai-tier', tier);
      const cfg = TIER_CONFIG[tier] || TIER_CONFIG.mid;
      document.body.style.setProperty('--blur-px', cfg.blurPx + 'px');
      if (!cfg.grain) setGrain(false);
      if (typeof respawnParticles === 'function') respawnParticles(); // Directly respawn particles matching count without re-running initCanvas() or adding resize listeners
    }

    if (typeof window !== 'undefined') {
      window.applyTierPreset = applyTierPreset;
      window.detectTier = detectTier;
    }

    // Apply blur-px CSS var on boot from stored/detected tier
    (function() {
      const cfg = TIER_CONFIG[currentTier] || TIER_CONFIG.mid;
      document.body.style.setProperty('--blur-px', cfg.blurPx + 'px');
    })();

    const urlParams = (typeof window !== 'undefined' && window.location) ? new URLSearchParams(window.location.search) : null;
    const paramScene = urlParams ? urlParams.get('scene') : null;
    const paramTheme = urlParams ? urlParams.get('theme') : null;
    const paramPinned = urlParams ? urlParams.get('pinned') : null;
    const paramUser = urlParams ? (urlParams.get('user') || urlParams.get('operator')) : null;
    const paramHonorific = urlParams ? (urlParams.get('honorific') || urlParams.get('title')) : null;
    const paramParticles = urlParams ? urlParams.get('particles') : null;
    const paramColor = urlParams ? (urlParams.get('color') || urlParams.get('hex')) : null;

    /* ─── 0. DOM ELEMENTS ─── */
    const bgVideo = document.getElementById('bg-video');
    const bgStatic = document.getElementById('bg-static');
    const videoSource = document.getElementById('video-source');
    const canvas = document.getElementById('ambient-canvas');

    const epTag = document.getElementById('ep-tag');
    const epArc = document.getElementById('ep-arc');
    const epTitle = document.getElementById('ep-title');
    const epSub = document.getElementById('ep-sub');

    const clockMain = document.getElementById('clock-main');
    const clockSec = document.getElementById('clock-sec');
    const chronoAmpm = document.getElementById('chrono-ampm');
    const clockEra = document.getElementById('clock-era');
    const clockEraEn = document.getElementById('clock-era-en');
    const chronometerBox = document.getElementById('chronometer-box');

    const themeBtn = document.getElementById('theme-btn');
    const themeLabel = document.getElementById('theme-label');
    const themeColorDot = document.getElementById('theme-color-dot');
    const themePopover = document.getElementById('theme-popover');
    const themeItems = document.querySelectorAll('#theme-popover .pop-item:not(.pop-item-custom)');
    const customThemeItem = document.getElementById('custom-theme-item');
    const customThemeDot = document.getElementById('custom-theme-dot');
    const customThemeHex = document.getElementById('custom-theme-hex');
    const customThemeColorInput = document.getElementById('custom-theme-color-input');

    const sceneBtn = document.getElementById('scene-btn');
    const sceneLabel = document.getElementById('scene-label');
    const sceneLabelSub = document.getElementById('scene-label-sub');
    const sceneToolIcon = document.getElementById('scene-tool-icon');
    const scenePopover = document.getElementById('scene-popover');
    const wallpaperModeSwitch = document.getElementById('wallpaper-mode-switch');
    const modeTabLive = document.getElementById('mode-tab-live');
    const modeTabStatic = document.getElementById('mode-tab-static');
    const modeTabCustom = document.getElementById('mode-tab-custom');
    const uploadWallpaperBtn = document.getElementById('upload-wallpaper-btn');
    const wallpaperFileInput = document.getElementById('wallpaper-file-input');
    const urlWallpaperBtn = document.getElementById('url-wallpaper-btn');
    const restoreDefaultsBtn = document.getElementById('restore-defaults-btn');
    const restoreLiveBtn = document.getElementById('restore-live-btn');
    const restoreStaticBtn = document.getElementById('restore-static-btn');
    const panelLive = document.getElementById('panel-live');
    const panelStatic = document.getElementById('panel-static');
    const panelCustom = document.getElementById('panel-custom');
    const listLive = document.getElementById('list-live');
    const listStatic = document.getElementById('list-static');
    const listCustomLive = document.getElementById('list-custom-live');
    const listCustomStatic = document.getElementById('list-custom-static');
    const listCustomWeb = document.getElementById('list-custom-web');
    const customSubLive = document.getElementById('custom-sub-live');
    const customSubStatic = document.getElementById('custom-sub-static');
    const customSubWeb = document.getElementById('custom-sub-web');
    const customLiveCount = document.getElementById('custom-live-count');
    const customStaticCount = document.getElementById('custom-static-count');
    const customWebCount = document.getElementById('custom-web-count');
    const customEmptyMsg = document.getElementById('custom-empty-msg');
    const customPillCount = document.getElementById('custom-pill-count');
    const liveCountBadge = document.getElementById('live-count-badge');
    const staticCountBadge = document.getElementById('static-count-badge');
    const popHeaderModeStatus = document.getElementById('pop-header-mode-status');

    const particlesToggleBtn = document.getElementById('particles-toggle-btn');
    const particlesStatusIcon = document.getElementById('particles-status-icon');
    const particlesStatusText = document.getElementById('particles-status-text');

    const grainToggleBtn = document.getElementById('grain-toggle-btn');
    const grainStatusText = document.getElementById('grain-status-text');

    const pinDockBtn = document.getElementById('pin-dock-btn');
    const pinStatusText = document.getElementById('pin-status-text');

    const voiceBtn = document.getElementById('voice-btn');
    const welcomeAudio = document.getElementById('welcome-voice');

    const bootOverlay = document.getElementById('boot-overlay');
    const bootProgressBar = document.getElementById('boot-progress-bar');
    const bootPct = document.getElementById('boot-pct');
    const bootLog = document.getElementById('boot-log');
    const bootPill = document.getElementById('boot-pill');
    const bootKanji = document.getElementById('boot-kanji');
    const bootSub = document.getElementById('boot-sub');

    const commandInput = document.getElementById('command-input');
    const bangChips = document.querySelectorAll('.bang-chip');

    const bladeLauncher = document.getElementById('blade-launcher');
    const launcherTabsBar = document.getElementById('launcher-tabs-bar');
    const hologramDrawer = document.getElementById('hologram-drawer');

    const editLinksBtn = document.getElementById('edit-links-btn');
    const linkEditorModal = document.getElementById('link-editor-modal');
    const editorCloseBtn = document.getElementById('editor-close-btn');
    const editorDoneBtn = document.getElementById('editor-done-btn');
    const editorTabsBar = document.getElementById('editor-tabs-bar');
    const editorLinksList = document.getElementById('editor-links-list');
    const addLinkTitle = document.getElementById('add-link-title');
    const addLinkUrl = document.getElementById('add-link-url');
    const addLinkDesc = document.getElementById('add-link-desc');
    const addLinkSeal = document.getElementById('add-link-seal');
    const sealPreviewBox = document.getElementById('seal-preview-box');
    const previewFaviconImg = document.getElementById('preview-favicon-img');
    const previewSealFallback = document.getElementById('preview-seal-fallback');
    const addLinkBtn = document.getElementById('add-link-btn');
    const editLinkIndex = document.getElementById('edit-link-index');
    const editorFormHeading = document.getElementById('editor-form-heading');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editorExportBtn = document.getElementById('editor-export-btn');
    const editorImportBtn = document.getElementById('editor-import-btn');
    const editorImportFile = document.getElementById('editor-import-file');
    const editorResetBtn = document.getElementById('editor-reset-btn');

    const operatorBtn = document.getElementById('operator-btn');
    const operatorPillName = document.getElementById('operator-pill-name');
    const operatorModal = document.getElementById('operator-modal');
    const operatorCloseBtn = document.getElementById('operator-close-btn');
    const operatorDoneBtn = document.getElementById('operator-done-btn');
    const operatorNameInput = document.getElementById('operator-name-input');
    const honorificChips = document.querySelectorAll('#honorific-chips .honorific-chip');
    const customHonorificWrap = document.getElementById('custom-honorific-wrap');
    const operatorCustomHonorific = document.getElementById('operator-custom-honorific');
    const previewLineAuth = document.getElementById('preview-line-auth');
    const previewLineStep = document.getElementById('preview-line-step');
    const previewLineWelcome = document.getElementById('preview-line-welcome');
    const previewLineMatrix = document.getElementById('preview-line-matrix');
    const testBootBtn = document.getElementById('test-boot-btn');
    const operatorResetBtn = document.getElementById('operator-reset-btn');
    const operatorSaveBtn = document.getElementById('operator-save-btn');
    const operatorSaveStatus = document.getElementById('operator-save-status');

    const navToOperatorBtn = document.getElementById('nav-to-operator-btn');
    const navToLinksBtn = document.getElementById('nav-to-links-btn');
    const linkModalNavToOperator = document.getElementById('link-modal-nav-to-operator');
    const linkModalNavToLinks = document.getElementById('link-modal-nav-to-links');

    const shortcutsBtn = document.getElementById('shortcuts-btn');
    const shortcutsModal = document.getElementById('shortcuts-modal');
    const shortcutsCloseBtn = document.getElementById('shortcuts-close-btn');
    const shortcutsDoneBtn = document.getElementById('shortcuts-done-btn');

    const subtitlesBar = document.getElementById('subtitles-bar');
    const subSpeaker = document.getElementById('sub-speaker');
    const subJp = document.getElementById('sub-jp');
    const subEn = document.getElementById('sub-en');

    /* ─── 1. LIVE ANIME EPISODE CLOCK & JAPANESE ERA ─── */
    const kanjiDays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    const kanjiMonths = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const kanjiNumbers = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
                          '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                          '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十', '三十一'];
    const enDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const enMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const episodeLore = [
      {
        hours: [5, 11],
        tag: '第壱話 · EP.01',
        arc: '黎明始動 · DAWN ARC',
        title: '黎明の覚醒 · 新たなる誓い',
        sub: 'ACT I: AWAKENING AT DAWN // NEW OATH'
      },
      {
        hours: [12, 17],
        tag: '第拾弐話 · EP.12',
        arc: '領域決闘 · DUEL ARC',
        title: '頂上決戦の刻 · 限界突破',
        sub: 'ACT XII: CLASH AT THE SUMMIT // BEYOND LIMITS'
      },
      {
        hours: [18, 22],
        tag: '第廿四話 · EP.24',
        arc: '終極決戦 · CLIMAX ARC',
        title: '黎明の咆哮 · 魂の境界',
        sub: 'ACT XXIV: BORDER OF SOULS // SPECIAL GRADE'
      },
      {
        hours: [23, 4],
        tag: '終章 · FINALE',
        arc: '月下待機 · STANDBY ARC',
        title: '月下の静寂 · 静謐なる刃',
        sub: 'FINAL ACT: SILENCE UNDER THE MOON // STANDBY'
      }
    ];

    let is12HourFormat = safeStorage.getItem('shinsekai-clock-12h') === 'true';
    let lastLoreHour = -1;
    let lastDateDay = -1;
    let lastClockMainStr = '';

    function toggleClockFormat() {
      is12HourFormat = !is12HourFormat;
      safeStorage.setItem('shinsekai-clock-12h', is12HourFormat ? 'true' : 'false');
      lastClockMainStr = '';
      updateEpisodeClock();
    }

    if (chronometerBox) {
      chronometerBox.addEventListener('click', toggleClockFormat);
    }

    function updateEpisodeClock() {
      if (document.hidden || isAppSuspended) return;

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      const displayHours = is12HourFormat ? (hours % 12 || 12) : hours;
      const mainStr = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      if (mainStr !== lastClockMainStr) {
        lastClockMainStr = mainStr;
        if (clockMain) clockMain.textContent = mainStr;
      }
      if (clockSec) clockSec.textContent = `:${String(seconds).padStart(2, '0')}`;
      if (chronoAmpm) {
        chronoAmpm.textContent = is12HourFormat
          ? (hours < 12 ? '午前 / AM' : '午後 / PM')
          : '24時間 / 24H';
      }

      const dayIdx = now.getDate();
      if (dayIdx !== lastDateDay) {
        lastDateDay = dayIdx;
        const dayOfWeek = kanjiDays[now.getDay()];
        const month = kanjiMonths[now.getMonth()];
        const dateKanji = kanjiNumbers[dayIdx] ? `${kanjiNumbers[dayIdx]}日` : `${dayIdx}日`;

        const reiwaYear = now.getFullYear() - 2018;
        const reiwaKanji = reiwaYear === 1 ? '元' : (kanjiNumbers[reiwaYear] || String(reiwaYear));
        if (clockEra) clockEra.textContent = `令和${reiwaKanji}年 ${month}${dateKanji} ${dayOfWeek}`;
        if (clockEraEn) {
          clockEraEn.textContent = `${enMonths[now.getMonth()]} ${dayIdx}, ${now.getFullYear()} · ${enDays[now.getDay()]}`;
        }
      }

      // Update episode title card based on hour only when the hour changes
      if (hours !== lastLoreHour) {
        lastLoreHour = hours;
        const lore = episodeLore.find(ep => {
          const [start, end] = ep.hours;
          if (start <= end) return hours >= start && hours <= end;
          return hours >= start || hours <= end; // Cross midnight
        }) || episodeLore[0];

        if (epTag) epTag.textContent = lore.tag;
        if (epArc) epArc.textContent = lore.arc;
        if (epTitle) epTitle.textContent = lore.title;
        if (epSub) epSub.textContent = lore.sub;
      }
    }

    updateEpisodeClock();
    setInterval(updateEpisodeClock, 1000);

    /* ─── 2. ATMOSPHERIC PARTICLE CANVAS ENGINE (PEAK OPTIMIZATION) ─── */
    let particles = [];
    let animFrameId = null;
    let currentThemeKey = (() => {
      try { return localStorage.getItem('shinsekai-theme') || 'crimson'; } catch (e) { return 'crimson'; }
    })();

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

    const THEME_PARTICLE_ICONS = {
      crimson: '🔥',
      tokyonight: '✨',
      sakura: '🌸',
      catppuccin: '🌌',
      cyberpunk: '⚡',
      custom: '🎨'
    };

    let particlesActive = (() => {
      if (paramParticles === '0' || paramParticles === 'off' || paramParticles === 'false') return false;
      if (paramParticles === '1' || paramParticles === 'on' || paramParticles === 'true') return true;
      return safeStorage.getItem('shinsekai-particles') !== 'off';
    })();

    let startCanvasAnim = () => {};
    let stopCanvasAnim = () => {};
    let refreshParticleColors = () => {};
    let respawnParticles = () => {};

    function setParticles(active) {
      particlesActive = !!active;
      safeStorage.setItem('shinsekai-particles', particlesActive ? 'on' : 'off');
      document.body.setAttribute('data-particles', particlesActive ? 'on' : 'off');

      const themeIcon = THEME_PARTICLE_ICONS[currentThemeKey] || '🌸';
      if (particlesStatusIcon) {
        particlesStatusIcon.textContent = particlesActive ? themeIcon : '✧';
      }
      if (particlesStatusText) {
        particlesStatusText.textContent = particlesActive ? '粒子: ON' : '粒子: OFF';
      }
      if (particlesToggleBtn) {
        particlesToggleBtn.classList.toggle('active', particlesActive);
      }

      if (particlesActive) {
        if (typeof respawnParticles === 'function') respawnParticles();
        if (typeof startCanvasAnim === 'function') startCanvasAnim();
      } else {
        if (typeof stopCanvasAnim === 'function') stopCanvasAnim();
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }

    function initCanvas() {
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

      function resize() {
        // High-DPI / 4K optimization: atmospheric dust/embers do not require 1:1 screen pixel density.
        // Rendering at 0.5x internal resolution scaled to 100vw/100vh via CSS reduces canvas VRAM by 75%
        // (e.g. from 33MB down to 8MB on 4K, and 8MB down to 2MB on 1080p).
        const scale = 0.5;
        canvas.width = Math.max(320, Math.floor(window.innerWidth * scale));
        canvas.height = Math.max(180, Math.floor(window.innerHeight * scale));
        if (particlesActive) {
          spawnParticles();
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      function updateParticleColors() {
        const len = particles.length;
        if (currentThemeKey === 'crimson') {
          for (let i = 0; i < len; i++) {
            const p = particles[i];
            p.glowColor = `rgba(255, 60, 20, ${(p.opacity * 0.25).toFixed(3)})`;
            p.coreColor = `rgba(255, 95, 40, ${p.opacity.toFixed(3)})`;
          }
        } else if (currentThemeKey === 'catppuccin') {
          for (let i = 0; i < len; i++) {
            const p = particles[i];
            p.glowColor = `rgba(203, 166, 247, ${(p.opacity * 0.28).toFixed(3)})`;
            p.coreColor = `rgba(203, 166, 247, ${p.opacity.toFixed(3)})`;
          }
        } else if (currentThemeKey === 'tokyonight') {
          for (let i = 0; i < len; i++) {
            const p = particles[i];
            p.glowColor = `rgba(122, 162, 247, ${(p.opacity * 0.28).toFixed(3)})`;
            p.coreColor = `rgba(122, 162, 247, ${p.opacity.toFixed(3)})`;
          }
        } else if (currentThemeKey === 'custom') {
          const hex = safeStorage.getItem('shinsekai-custom-theme-color') || '#a6e3a1';
          const { r, g, b } = hexToRgb(hex);
          for (let i = 0; i < len; i++) {
            const p = particles[i];
            p.glowColor = `rgba(${r}, ${g}, ${b}, ${(p.opacity * 0.35).toFixed(3)})`;
            p.coreColor = `rgba(${r}, ${g}, ${b}, ${p.opacity.toFixed(3)})`;
          }
        }
      }

      function spawnParticles() {
        particles = [];
        if (!particlesActive) return;
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        // Tier-driven particle density (see TIER_CONFIG / detectTier)
        const count = (TIER_CONFIG[currentTier] || TIER_CONFIG.mid).particleCount;

        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2.2 + 1.2,
            speedY: Math.random() * 1.0 + 0.3,
            speedX: (Math.random() - 0.5) * 0.8,
            opacity: Math.random() * 0.7 + 0.3,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.04,
            life: Math.random() * 100,
            cyberColor: Math.random() > 0.4 ? 'rgba(0, 240, 255, 0.85)' : 'rgba(255, 0, 85, 0.85)',
            glowColor: '',
            coreColor: ''
          });
        }
        updateParticleColors();
      }

      let resizeTimer = null;
      window.addEventListener('resize', () => {
        if (resizeTimer) cancelAnimationFrame(resizeTimer);
        resizeTimer = requestAnimationFrame(resize);
      }, { passive: true });
      resize();

      let lastFrameTime = performance.now();

      function render(timestamp) {
        if (!particlesActive) {
          stopAnimation();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          return;
        }

        const now = timestamp || performance.now();
        // Frame throttle: cap at max ~60 FPS (15.1ms) to prevent burning GPU/CPU on 120Hz/144Hz/240Hz screens without dropping frames on 60Hz displays
        if (now - lastFrameTime < 15.1) {
          animFrameId = requestAnimationFrame(render);
          return;
        }

        const deltaMs = Math.min(64, Math.max(1, now - lastFrameTime));
        lastFrameTime = now;
        const dtScale = deltaMs / 16.667;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const len = particles.length;
        if (!len) {
          stopAnimation();
          return;
        }

        if (currentThemeKey === 'crimson') {
          for (let i = 0; i < len; i++) {
            const p = particles[i];
            p.life += 0.5 * dtScale;
            p.y -= p.speedY * 1.4 * dtScale;
            p.x += Math.sin(p.life * 0.05) * 0.8 * dtScale;
            if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }

            ctx.fillStyle = p.glowColor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = p.coreColor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (currentThemeKey === 'sakura') {
          // Optimized without ctx.save()/ctx.restore() overhead: uses native ctx.ellipse rotation parameter
          ctx.fillStyle = 'rgba(244, 184, 228, 0.85)';
          for (let i = 0; i < len; i++) {
            const p = particles[i];
            p.life += 0.5 * dtScale;
            p.y += p.speedY * 1.1 * dtScale;
            p.x += (Math.cos(p.life * 0.04) * 1.5 + 0.8) * dtScale;
            p.rotation += p.rotSpeed * dtScale;
            if (p.y > canvas.height + 10) { p.y = -10; p.x = Math.random() * canvas.width; }

            ctx.beginPath();
            ctx.ellipse(p.x, p.y, p.size * 1.4, p.size * 0.7, p.rotation, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (currentThemeKey === 'cyberpunk') {
          for (let i = 0; i < len; i++) {
            const p = particles[i];
            p.life += 0.5 * dtScale;
            p.y += p.speedY * 3.2 * dtScale;
            if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }

            ctx.fillStyle = p.cyberColor;
            ctx.fillRect(p.x, p.y, 1.8, p.size * 3.5);
          }
        } else {
          for (let i = 0; i < len; i++) {
            const p = particles[i];
            p.life += 0.5 * dtScale;
            p.y -= p.speedY * 0.6 * dtScale;
            p.x += Math.sin(p.life * 0.04) * 0.7 * dtScale;
            if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }

            ctx.fillStyle = p.glowColor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 1.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = p.coreColor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        animFrameId = requestAnimationFrame(render);
      }

      function startAnimation() {
        if (!particlesActive) return;
        if (!animFrameId && particles.length > 0) {
          lastFrameTime = performance.now();
          animFrameId = requestAnimationFrame(render);
        }
      }

      function stopAnimation() {
        if (animFrameId) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
      }

      startCanvasAnim = startAnimation;
      stopCanvasAnim = stopAnimation;
      refreshParticleColors = updateParticleColors;
      respawnParticles = spawnParticles;

      if (particlesActive) {
        startAnimation();
      }
    }

    initCanvas();
    setParticles(particlesActive);

    if (particlesToggleBtn) {
      particlesToggleBtn.addEventListener('click', () => {
        setParticles(!particlesActive);
      });
    }

    /* ─── 3. CINEMATIC SUBTITLE DIALOGUE SYSTEM ─── */
    const animeQuotes = [
      {
        speaker: '煉獄 杏寿郎',
        speakerEn: 'Kyojuro Rengoku',
        jp: '「心を燃やせ、歯を食いしばって前を向け」',
        en: 'Set your heart ablaze. Grit your teeth and move forward.'
      },
      {
        speaker: '五条 悟',
        speakerEn: 'Satoru Gojo',
        jp: '「大丈夫、僕 最強だから」',
        en: "Don't worry. After all, I'm the strongest."
      },
      {
        speaker: '両面 宿儺',
        speakerEn: 'Ryomen Sukuna',
        jp: '「誇れ、お前は強い」',
        en: 'Stand proud. You are strong.'
      },
      {
        speaker: 'うずまき ナルト',
        speakerEn: 'Naruto Uzumaki',
        jp: '「まっすぐ自分の言葉は曲げねぇ、それがオレの忍道だ！」',
        en: "I never go back on my word—that's my ninja way!"
      },
      {
        speaker: 'うちは サスケ',
        speakerEn: 'Sasuke Uchiha',
        jp: '「オレはお前を倒して、過去を断ち切る」',
        en: 'I will defeat you and sever the ties of the past.'
      },
      {
        speaker: '無幻 (ムゲン)',
        speakerEn: 'Mugen (Samurai Champloo)',
        jp: '「死ぬまで戦うのが侍ってもんだろ」',
        en: 'Fighting until the bitter end is what being a samurai is.'
      },
      {
        speaker: 'デイビッド',
        speakerEn: 'David Martinez',
        jp: '「俺はお前を月へ連れて行く」',
        en: "I'm taking you to the moon, no matter what."
      },
      {
        speaker: '乙骨 憂太',
        speakerEn: 'Yuta Okkotsu',
        jp: '「失礼だな、純愛だよ」',
        en: "How rude. This is pure love."
      },
      {
        speaker: 'セイバー (アルトリア)',
        speakerEn: 'Saber (Fate/stay night)',
        jp: '「問おう、貴方が私のマスターか」',
        en: 'I ask of you: Are you my Master?'
      },
      {
        speaker: 'アーチャー (エミヤ)',
        speakerEn: 'Archer (Unlimited Blade Works)',
        jp: '「体は剣で出来ている。血潮は鉄で、心は硝子」',
        en: 'I am the bone of my sword. Steel is my body, and fire is my blood.'
      },
      {
        speaker: 'カミナ',
        speakerEn: 'Kamina (Gurren Lagann)',
        jp: '「お前が信じる、お前を信じろ！」',
        en: 'Believe in the you who believes in yourself!'
      },
      {
        speaker: '竈門 炭治郎',
        speakerEn: 'Tanjiro Kamado (Demon Slayer)',
        jp: '「人は心が原動力だから、心はどこまでも強くなれる」',
        en: 'The heart is the driving force of people. Your heart can grow stronger without limit.'
      },
      {
        speaker: '言峰 綺礼',
        speakerEn: 'Kirei Kotomine (Fate)',
        jp: '「喜べ少年、君の願いはようやく叶う」',
        en: 'Rejoice, young man. Your wish will finally come true.'
      },
      {
        speaker: '衛宮 切嗣',
        speakerEn: 'Kiritsugu Emiya (Fate/Zero)',
        jp: '「誰かを救うということは、誰かを救わないということだ」',
        en: 'To save one life means having to abandon another.'
      },
      {
        speaker: 'ルルーシュ',
        speakerEn: 'Lelouch Lamperouge (Code Geass)',
        jp: '「撃っていいのは、撃たれる覚悟のある奴だけだ」',
        en: 'The only ones who should shoot are those prepared to be shot.'
      },
      {
        speaker: 'リヴァイ',
        speakerEn: 'Levi Ackerman (Attack on Titan)',
        jp: '「悔いなき選択を自分で選べ」',
        en: "Make the choice you'll regret the least."
      },
      {
        speaker: 'エルヴィン',
        speakerEn: 'Erwin Smith (Attack on Titan)',
        jp: '「我が兵士よ怒れ、我が兵士よ叫べ、我が兵士よ戦え！」',
        en: 'My soldiers, rage! My soldiers, scream! My soldiers, fight!'
      },
      {
        speaker: 'エドワード',
        speakerEn: 'Edward Elric (Fullmetal Alchemist)',
        jp: '「立って歩け、前へ進め。あんたには立派な足がついてるじゃないか」',
        en: "Stand up and walk. Keep moving forward. You have two good legs, don't you?"
      },
      {
        speaker: 'ロロノア・ゾロ',
        speakerEn: 'Roronoa Zoro (One Piece)',
        jp: '「背中の傷は剣士の恥だ」',
        en: "A wound on one's back is the greatest shame of a swordsman."
      },
      {
        speaker: 'モンキー・D・ルフィ',
        speakerEn: 'Monkey D. Luffy (One Piece)',
        jp: '「海賊王に、おれはなる！」',
        en: "I'm going to be the King of the Pirates!"
      }
    ];

    let currentQuoteIdx = 0;
    let quoteTimer = null;

    function startQuoteTimer() {
      clearInterval(quoteTimer);
      quoteTimer = setInterval(cycleQuote, 10000);
    }

    function cycleQuote() {
      if (!subJp || !subEn || !subSpeaker) return;
      currentQuoteIdx = (currentQuoteIdx + 1) % animeQuotes.length;
      const q = animeQuotes[currentQuoteIdx];
      const subSpeakerEn = document.getElementById('sub-speaker-en');

      subJp.style.opacity = '0';
      subEn.style.opacity = '0';
      subSpeaker.style.opacity = '0';
      if (subSpeakerEn) subSpeakerEn.style.opacity = '0';

      setTimeout(() => {
        subSpeaker.textContent = q.speaker;
        if (subSpeakerEn) subSpeakerEn.textContent = q.speakerEn || '';
        subJp.textContent = q.jp;
        subEn.textContent = q.en;
        subJp.style.opacity = '1';
        subEn.style.opacity = '1';
        subSpeaker.style.opacity = '1';
        if (subSpeakerEn) subSpeakerEn.style.opacity = '1';
      }, 200);

      startQuoteTimer();
    }

    if (subtitlesBar) {
      subtitlesBar.addEventListener('click', cycleQuote);
      // Start auto-cycling quotes only after boot sequence finishes (1.5s + 0.5s buffer)
      setTimeout(() => { startQuoteTimer(); }, 2000);
    }

    /* ─── 4. VIDEO & STATIC WALLPAPER CONTROLLER ─── */
    /* ─── 4.0. INDEXEDDB MULTI-FILE STORAGE FOR CUSTOM WALLPAPERS (MP4 / WEBM / PNG / JPG / WEBP / GIF) ─── */
    const IDB_NAME = 'shinsekai-wallpaper-db';
    const IDB_VERSION = 2;
    const IDB_STORE_CUSTOM = 'custom_wallpapers';
    const IDB_STORE_LEGACY = 'wallpapers';

    let currentCustomObjectUrl = null;

    function revokeCustomObjectUrl() {
      if (currentCustomObjectUrl) {
        try {
          URL.revokeObjectURL(currentCustomObjectUrl);
        } catch (e) {}
        currentCustomObjectUrl = null;
      }
    }

    function openWallpaperDB() {
      return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB not supported'));
        const req = indexedDB.open(IDB_NAME, IDB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(IDB_STORE_CUSTOM)) {
            db.createObjectStore(IDB_STORE_CUSTOM, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(IDB_STORE_LEGACY)) {
            db.createObjectStore(IDB_STORE_LEGACY);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }

    function addCustomWallpaperToDB(file) {
      return openWallpaperDB().then(db => {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(IDB_STORE_CUSTOM, 'readwrite');
          const store = tx.objectStore(IDB_STORE_CUSTOM);
          const isVideo = file.type.startsWith('video/') || /\.(mp4|webm)$/i.test(file.name);
          const record = {
            id: 'cust_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            name: file.name,
            type: isVideo ? 'live' : 'static',
            mimeType: file.type || (isVideo ? 'video/mp4' : 'image/png'),
            size: file.size,
            blob: file,
            addedAt: Date.now()
          };
          const req = store.put(record);
          req.onsuccess = () => resolve(record);
          req.onerror = () => reject(req.error);
        });
      });
    }

    function getAllCustomWallpapersFromDB() {
      return openWallpaperDB().then(db => {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(IDB_STORE_CUSTOM, 'readonly');
          const store = tx.objectStore(IDB_STORE_CUSTOM);
          const req = store.getAll();
          req.onsuccess = () => {
            const list = Array.isArray(req.result) ? req.result : [];
            list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
            resolve(list);
          };
          req.onerror = () => resolve([]);
        });
      }).catch(() => []);
    }

    function getCustomWallpaperByIdFromDB(id) {
      return openWallpaperDB().then(db => {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(IDB_STORE_CUSTOM, 'readonly');
          const store = tx.objectStore(IDB_STORE_CUSTOM);
          const req = store.get(id);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        });
      }).catch(() => null);
    }

    function deleteCustomWallpaperFromDB(id) {
      return openWallpaperDB().then(db => {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(IDB_STORE_CUSTOM, 'readwrite');
          const store = tx.objectStore(IDB_STORE_CUSTOM);
          const req = store.delete(id);
          req.onsuccess = () => resolve(true);
          req.onerror = () => reject(req.error);
        });
      }).catch(() => false);
    }

    /* ─── WEB URL CUSTOM WALLPAPERS STORAGE ─── */
    function getCustomWebWallpapers() {
      try {
        const raw = safeStorage.getItem('shinsekai-custom-web-wallpapers');
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }

    function saveCustomWebWallpapers(list) {
      safeStorage.setItem('shinsekai-custom-web-wallpapers', JSON.stringify(list));
    }

    function addCustomWebWallpaper(url, name = null) {
      const list = getCustomWebWallpapers();
      const isVideo = /\.(mp4|webm)($|\?)/i.test(url);
      let displayName = name ? name.trim() : '';
      if (!displayName) {
        try {
          const u = new URL(url);
          const pathParts = u.pathname.split('/').filter(Boolean);
          displayName = pathParts.length ? pathParts[pathParts.length - 1] : u.hostname;
        } catch (e) {
          displayName = url.slice(0, 24);
        }
      }
      const record = {
        id: 'web_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name: displayName,
        url: url.trim(),
        type: isVideo ? 'live' : 'static',
        addedAt: Date.now()
      };
      list.unshift(record);
      saveCustomWebWallpapers(list);
      return record;
    }

    function deleteCustomWebWallpaper(id) {
      const list = getCustomWebWallpapers().filter(it => it.id !== id);
      saveCustomWebWallpapers(list);
    }

    /* ─── DEFAULT LIVE SCENES & STATIC ARTWORKS ─── */
    const DEFAULT_LIVE_SCENES = [
      { key: 'crimson',    fileName: 'crimson.mp4',    label: '映像: 紅蓮',     labelEn: 'Crimson',       badge: '720p / 1080p MP4', video: { default: 'assets/animated/720p/crimson.mp4',    ultra: 'assets/animated/crimson.mp4'    }, preview: 'assets/previews/crimson.png' },
      { key: 'tokyonight', fileName: 'tokyonight.mp4', label: '映像: 東京夜',   labelEn: 'TokyoNight',    badge: '720p / 1080p MP4', video: { default: 'assets/animated/720p/tokyonight.mp4', ultra: 'assets/animated/tokyonight.mp4' }, preview: 'assets/previews/tokyonight.png' },
      { key: 'sakura',     fileName: 'sakura.mp4',     label: '映像: 桜吹雪',   labelEn: 'Sakura',        badge: '720p / 1080p MP4', video: { default: 'assets/animated/720p/sakura.mp4',    ultra: 'assets/animated/sakura.mp4'    }, preview: 'assets/previews/sakura.png' },
      { key: 'catppuccin', fileName: 'catppuccin.mp4', label: '映像: 終末谷',   labelEn: 'Catppuccin',    badge: '720p / 1080p MP4', video: { default: 'assets/animated/720p/catppuccin.mp4', ultra: 'assets/animated/catppuccin.mp4' }, preview: 'assets/previews/catppuccin.png' },
      { key: 'cyberpunk',  fileName: 'cyberpunk.mp4',  label: '映像: 電脳都市', labelEn: 'Cyberpunk',     badge: '720p / 1080p MP4', video: { default: 'assets/animated/720p/cyberpunk.mp4', ultra: 'assets/animated/cyberpunk.mp4' }, preview: 'assets/previews/cyberpunk.png' },
      { key: 'eco',        fileName: 'eco',            label: '省電力: 静止画', labelEn: 'Eco (Low RAM)', badge: 'ECO / LOW RAM',    video: null, preview: null }
    ];

    const scenes = DEFAULT_LIVE_SCENES;

    const DEFAULT_STATIC_ARTWORKS = [
      { key: 'crimson',    fileName: 'crimson.png',    label: '静止画: 紅蓮',     labelEn: 'Crimson',    badge: 'PNG · 1080p', src: 'assets/previews/crimson.png' },
      { key: 'tokyonight', fileName: 'tokyonight.png', label: '静止画: 東京夜',   labelEn: 'TokyoNight', badge: 'PNG · 1080p', src: 'assets/previews/tokyonight.png' },
      { key: 'sakura',     fileName: 'sakura.png',     label: '静止画: 桜吹雪',   labelEn: 'Sakura',     badge: 'PNG · 1080p', src: 'assets/previews/sakura.png' },
      { key: 'catppuccin', fileName: 'catppuccin.png', label: '静止画: 終末谷',   labelEn: 'Catppuccin', badge: 'PNG · 1080p', src: 'assets/previews/catppuccin.png' },
      { key: 'cyberpunk',  fileName: 'cyberpunk.png',  label: '静止画: 電脳都市', labelEn: 'Cyberpunk',  badge: 'PNG · 1080p', src: 'assets/previews/cyberpunk.png' }
    ];

    const sceneAliasMap = {
      eyes: 'crimson',
      gojo: 'tokyonight',
      sasuke: 'catppuccin',
      rengoku: 'crimson',
      sukuna: 'crimson'
    };

    let currentSceneIdx = 0;
    const rawSavedScene = paramScene || safeStorage.getItem('shinsekai-scene') || 'crimson';
    const savedScene = sceneAliasMap[rawSavedScene] || rawSavedScene;
    const foundScene = scenes.findIndex(s => s.key === savedScene);
    if (foundScene !== -1) currentSceneIdx = foundScene;

    /* ─── DELETED DEFAULTS TRACKING ─── */
    function getDeletedDefaultsLive() {
      try {
        const raw = safeStorage.getItem('shinsekai-deleted-defaults-live');
        return raw ? JSON.parse(raw) : [];
      } catch (e) { return []; }
    }

    function saveDeletedDefaultsLive(list) {
      safeStorage.setItem('shinsekai-deleted-defaults-live', JSON.stringify(list));
    }

    function getDeletedDefaultsStatic() {
      try {
        const raw = safeStorage.getItem('shinsekai-deleted-defaults-static');
        return raw ? JSON.parse(raw) : [];
      } catch (e) { return []; }
    }

    function saveDeletedDefaultsStatic(list) {
      safeStorage.setItem('shinsekai-deleted-defaults-static', JSON.stringify(list));
    }

    function deleteDefaultLive(key) {
      const list = getDeletedDefaultsLive();
      if (!list.includes(key)) {
        list.push(key);
        saveDeletedDefaultsLive(list);
      }
    }

    function deleteDefaultStatic(key) {
      const list = getDeletedDefaultsStatic();
      if (!list.includes(key)) {
        list.push(key);
        saveDeletedDefaultsStatic(list);
      }
    }

    function restoreAllDefaults() {
      safeStorage.removeItem('shinsekai-deleted-defaults-live');
      safeStorage.removeItem('shinsekai-deleted-defaults-static');
    }

    function restoreDefaultsLive() {
      safeStorage.removeItem('shinsekai-deleted-defaults-live');
    }

    function restoreDefaultsStatic() {
      safeStorage.removeItem('shinsekai-deleted-defaults-static');
    }

    /* ─── ACTIVE WALLPAPER STATE ─── */
    let activeWallpaper = {
      source: 'default-live', // 'default-live' | 'default-static' | 'custom-file' | 'custom-url'
      id: 'crimson',
      name: 'crimson.mp4',
      type: 'live' // 'live' | 'static'
    };

    let currentWallpaperMode = (urlParams ? urlParams.get('mode') : null) || safeStorage.getItem('shinsekai-wallpaper-mode') || 'live';
    let isCustomWallpaper = false;

    function saveActiveWallpaperState(item) {
      activeWallpaper = Object.assign({}, item);
      safeStorage.setItem('shinsekai-active-wallpaper', JSON.stringify(activeWallpaper));
      safeStorage.setItem('shinsekai-wallpaper-mode', activeWallpaper.type);
      if (activeWallpaper.source === 'default-live' || activeWallpaper.source === 'default-static') {
        safeStorage.setItem('shinsekai-scene', activeWallpaper.id);
      }
    }

    function formatFileSize(bytes) {
      if (!bytes || isNaN(bytes)) return '';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function switchWallpaperCategoryTab(cat) {
      if (modeTabLive) {
        modeTabLive.classList.toggle('active', cat === 'live');
        modeTabLive.setAttribute('aria-selected', cat === 'live' ? 'true' : 'false');
      }
      if (modeTabStatic) {
        modeTabStatic.classList.toggle('active', cat === 'static');
        modeTabStatic.setAttribute('aria-selected', cat === 'static' ? 'true' : 'false');
      }
      if (modeTabCustom) {
        modeTabCustom.classList.toggle('active', cat === 'custom');
        modeTabCustom.setAttribute('aria-selected', cat === 'custom' ? 'true' : 'false');
      }

      if (panelLive) panelLive.style.display = (cat === 'live' ? 'block' : 'none');
      if (panelStatic) panelStatic.style.display = (cat === 'static' ? 'block' : 'none');
      if (panelCustom) panelCustom.style.display = (cat === 'custom' ? 'block' : 'none');
    }

    function updateWallpaperListHighlights() {
      if (popHeaderModeStatus) {
        if (activeWallpaper.source === 'default-live') {
          popHeaderModeStatus.textContent = '▶ LIVE VIDEO';
        } else if (activeWallpaper.source === 'default-static') {
          popHeaderModeStatus.textContent = '🖼 STATIC ARTWORK';
        } else if (activeWallpaper.source === 'custom-file') {
          popHeaderModeStatus.textContent = activeWallpaper.type === 'live' ? '▶ CUSTOM VIDEO' : '🖼 CUSTOM IMAGE';
        } else if (activeWallpaper.source === 'custom-url') {
          popHeaderModeStatus.textContent = '🔗 WEB URL';
        } else {
          popHeaderModeStatus.textContent = 'WALLPAPER';
        }
      }

      const allRows = document.querySelectorAll('.pop-wallpaper-row');
      allRows.forEach(row => {
        let isActive = false;
        if (activeWallpaper.source === 'default-live' && row.dataset.category === 'live' && row.dataset.key === activeWallpaper.id) {
          isActive = true;
        } else if (activeWallpaper.source === 'default-static' && row.dataset.category === 'static' && row.dataset.key === activeWallpaper.id) {
          isActive = true;
        } else if (activeWallpaper.source === 'custom-file' && row.dataset.category === 'custom' && row.dataset.id === activeWallpaper.id) {
          isActive = true;
        } else if (activeWallpaper.source === 'custom-url' && row.dataset.category === 'custom' && row.dataset.id === activeWallpaper.id) {
          isActive = true;
        }
        row.classList.toggle('active', isActive);
      });
    }

    /* ─── DYNAMIC WALLPAPER LIST RENDERING ─── */
    async function renderWallpaperLists() {
      const deletedLive = getDeletedDefaultsLive();
      const deletedStatic = getDeletedDefaultsStatic();

      // Update header status text based on active wallpaper
      if (popHeaderModeStatus) {
        if (activeWallpaper.source === 'default-live') {
          popHeaderModeStatus.textContent = '▶ LIVE VIDEO';
        } else if (activeWallpaper.source === 'default-static') {
          popHeaderModeStatus.textContent = '🖼 STATIC ARTWORK';
        } else if (activeWallpaper.source === 'custom-file') {
          popHeaderModeStatus.textContent = activeWallpaper.type === 'live' ? '▶ CUSTOM VIDEO' : '🖼 CUSTOM IMAGE';
        } else if (activeWallpaper.source === 'custom-url') {
          popHeaderModeStatus.textContent = '🔗 WEB URL';
        } else {
          popHeaderModeStatus.textContent = 'WALLPAPER';
        }
      }

      // 1. Render Live Default Scenes
      const visibleLive = DEFAULT_LIVE_SCENES.filter(s => !deletedLive.includes(s.key));
      if (liveCountBadge) {
        liveCountBadge.textContent = String(visibleLive.length);
      }
      if (restoreLiveBtn) {
        restoreLiveBtn.style.display = deletedLive.length > 0 ? 'inline-flex' : 'none';
      }

      if (listLive) {
        listLive.innerHTML = '';
        if (visibleLive.length === 0) {
          listLive.innerHTML = '<div class="pop-empty-msg">動的映像がありません<br><span style="opacity:0.6;font-size:0.65rem;">「初期動画を復元」または同名ファイル追加で復元</span></div>';
        } else {
          visibleLive.forEach(s => {
            const row = document.createElement('div');
            const isActive = activeWallpaper.source === 'default-live' && activeWallpaper.id === s.key;
            row.className = 'pop-wallpaper-row' + (isActive ? ' active' : '');
            row.dataset.key = s.key;
            row.dataset.category = 'live';

            const selBtn = document.createElement('button');
            selBtn.type = 'button';
            selBtn.className = 'pop-wallpaper-select';
            selBtn.title = s.labelEn;
            selBtn.innerHTML = `
              <span class="pop-icon">${s.video ? '▶' : '🍃'}</span>
              <div class="pop-wallpaper-info">
                <span class="pop-wallpaper-name">${escapeHtml(s.fileName)}</span>
                <span class="pop-wallpaper-badge">${escapeHtml(s.labelEn)} · ${escapeHtml(s.badge)}</span>
              </div>
            `;
            selBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              applyDefaultLiveScene(s.key);
              scenePopover.classList.remove('open');
            });

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'pop-wallpaper-delete-btn';
            delBtn.title = '削除 (Delete)';
            delBtn.textContent = '✕';
            delBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              deleteDefaultLive(s.key);
              if (activeWallpaper.source === 'default-live' && activeWallpaper.id === s.key) {
                const remaining = DEFAULT_LIVE_SCENES.filter(it => !getDeletedDefaultsLive().includes(it.key));
                if (remaining.length > 0) {
                  applyDefaultLiveScene(remaining[0].key);
                } else {
                  applyDefaultStaticScene('crimson');
                }
              }
              renderWallpaperLists();
            });

            row.appendChild(selBtn);
            row.appendChild(delBtn);
            listLive.appendChild(row);
          });
        }
      }

      // 2. Render Static Artworks
      const visibleStatic = DEFAULT_STATIC_ARTWORKS.filter(s => !deletedStatic.includes(s.key));
      if (staticCountBadge) {
        staticCountBadge.textContent = String(visibleStatic.length);
      }
      if (restoreStaticBtn) {
        restoreStaticBtn.style.display = deletedStatic.length > 0 ? 'inline-flex' : 'none';
      }

      if (listStatic) {
        listStatic.innerHTML = '';
        if (visibleStatic.length === 0) {
          listStatic.innerHTML = '<div class="pop-empty-msg">静止画アートワークがありません<br><span style="opacity:0.6;font-size:0.65rem;">「初期静止画を復元」または同名ファイル追加で復元</span></div>';
        } else {
          visibleStatic.forEach(s => {
            const row = document.createElement('div');
            const isActive = activeWallpaper.source === 'default-static' && activeWallpaper.id === s.key;
            row.className = 'pop-wallpaper-row' + (isActive ? ' active' : '');
            row.dataset.key = s.key;
            row.dataset.category = 'static';

            const selBtn = document.createElement('button');
            selBtn.type = 'button';
            selBtn.className = 'pop-wallpaper-select';
            selBtn.title = s.labelEn;
            selBtn.innerHTML = `
              <span class="pop-icon">🖼</span>
              <div class="pop-wallpaper-info">
                <span class="pop-wallpaper-name">${escapeHtml(s.fileName)}</span>
                <span class="pop-wallpaper-badge">${escapeHtml(s.labelEn)} · ${escapeHtml(s.badge)}</span>
              </div>
            `;
            selBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              applyDefaultStaticScene(s.key);
              scenePopover.classList.remove('open');
            });

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'pop-wallpaper-delete-btn';
            delBtn.title = '削除 (Delete)';
            delBtn.textContent = '✕';
            delBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              deleteDefaultStatic(s.key);
              if (activeWallpaper.source === 'default-static' && activeWallpaper.id === s.key) {
                const remaining = DEFAULT_STATIC_ARTWORKS.filter(it => !getDeletedDefaultsStatic().includes(it.key));
                if (remaining.length > 0) {
                  applyDefaultStaticScene(remaining[0].key);
                } else {
                  applyDefaultLiveScene('crimson');
                }
              }
              renderWallpaperLists();
            });

            row.appendChild(selBtn);
            row.appendChild(delBtn);
            listStatic.appendChild(row);
          });
        }
      }

      if (restoreDefaultsBtn) {
        const hasDeleted = deletedLive.length > 0 || deletedStatic.length > 0;
        restoreDefaultsBtn.style.display = hasDeleted ? 'inline-flex' : 'none';
      }

      // 3. Render Custom Wallpapers (Divided into Live Videos, Static Images, and Web URLs)
      const customFiles = await getAllCustomWallpapersFromDB();
      const customWebUrls = getCustomWebWallpapers();

      const customLiveFiles = customFiles.filter(f => f.type === 'live');
      const customStaticFiles = customFiles.filter(f => f.type !== 'live');

      const totalCustom = customFiles.length + customWebUrls.length;
      if (customPillCount) {
        customPillCount.textContent = String(totalCustom);
      }

      if (customEmptyMsg) {
        customEmptyMsg.style.display = totalCustom === 0 ? 'block' : 'none';
      }

      // Subsection A: Custom Live Videos
      if (customSubLive && listCustomLive) {
        listCustomLive.innerHTML = '';
        if (customLiveCount) customLiveCount.textContent = String(customLiveFiles.length);
        if (customLiveFiles.length === 0) {
          customSubLive.style.display = 'none';
        } else {
          customSubLive.style.display = 'block';
          customLiveFiles.forEach(fileRec => {
            const row = document.createElement('div');
            const isActive = activeWallpaper.source === 'custom-file' && activeWallpaper.id === fileRec.id;
            row.className = 'pop-wallpaper-row' + (isActive ? ' active' : '');
            row.dataset.id = fileRec.id;
            row.dataset.category = 'custom';

            const selBtn = document.createElement('button');
            selBtn.type = 'button';
            selBtn.className = 'pop-wallpaper-select';
            selBtn.title = fileRec.name;
            selBtn.innerHTML = `
              <span class="pop-icon">▶</span>
              <div class="pop-wallpaper-info">
                <span class="pop-wallpaper-name">${escapeHtml(fileRec.name)}</span>
                <span class="pop-wallpaper-badge">MP4/WEBM · LIVE · ${formatFileSize(fileRec.size)}</span>
              </div>
            `;
            selBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              applyCustomFileWallpaper(fileRec);
              scenePopover.classList.remove('open');
            });

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'pop-wallpaper-delete-btn';
            delBtn.title = '削除 (Delete)';
            delBtn.textContent = '✕';
            delBtn.addEventListener('click', async (e) => {
              e.stopPropagation();
              await deleteCustomWallpaperFromDB(fileRec.id);
              if (activeWallpaper.source === 'custom-file' && activeWallpaper.id === fileRec.id) {
                safeStorage.removeItem('shinsekai-custom-wallpaper-thumb');
                applyDefaultLiveScene('crimson');
              }
              renderWallpaperLists();
            });

            row.appendChild(selBtn);
            row.appendChild(delBtn);
            listCustomLive.appendChild(row);
          });
        }
      }

      // Subsection B: Custom Static Images
      if (customSubStatic && listCustomStatic) {
        listCustomStatic.innerHTML = '';
        if (customStaticCount) customStaticCount.textContent = String(customStaticFiles.length);
        if (customStaticFiles.length === 0) {
          customSubStatic.style.display = 'none';
        } else {
          customSubStatic.style.display = 'block';
          customStaticFiles.forEach(fileRec => {
            const row = document.createElement('div');
            const isActive = activeWallpaper.source === 'custom-file' && activeWallpaper.id === fileRec.id;
            row.className = 'pop-wallpaper-row' + (isActive ? ' active' : '');
            row.dataset.id = fileRec.id;
            row.dataset.category = 'custom';

            const isGif = fileRec.mimeType === 'image/gif';
            const typeBadge = isGif ? 'GIF · ANIM' : 'IMAGE · STATIC';

            const selBtn = document.createElement('button');
            selBtn.type = 'button';
            selBtn.className = 'pop-wallpaper-select';
            selBtn.title = fileRec.name;
            selBtn.innerHTML = `
              <span class="pop-icon">🖼</span>
              <div class="pop-wallpaper-info">
                <span class="pop-wallpaper-name">${escapeHtml(fileRec.name)}</span>
                <span class="pop-wallpaper-badge">${escapeHtml(typeBadge)} · ${formatFileSize(fileRec.size)}</span>
              </div>
            `;
            selBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              applyCustomFileWallpaper(fileRec);
              scenePopover.classList.remove('open');
            });

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'pop-wallpaper-delete-btn';
            delBtn.title = '削除 (Delete)';
            delBtn.textContent = '✕';
            delBtn.addEventListener('click', async (e) => {
              e.stopPropagation();
              await deleteCustomWallpaperFromDB(fileRec.id);
              if (activeWallpaper.source === 'custom-file' && activeWallpaper.id === fileRec.id) {
                safeStorage.removeItem('shinsekai-custom-wallpaper-thumb');
                applyDefaultLiveScene('crimson');
              }
              renderWallpaperLists();
            });

            row.appendChild(selBtn);
            row.appendChild(delBtn);
            listCustomStatic.appendChild(row);
          });
        }
      }

      // Subsection C: Custom Web URLs
      if (customSubWeb && listCustomWeb) {
        listCustomWeb.innerHTML = '';
        if (customWebCount) customWebCount.textContent = String(customWebUrls.length);
        if (customWebUrls.length === 0) {
          customSubWeb.style.display = 'none';
        } else {
          customSubWeb.style.display = 'block';
          customWebUrls.forEach(webRec => {
            const row = document.createElement('div');
            const isActive = activeWallpaper.source === 'custom-url' && activeWallpaper.id === webRec.id;
            row.className = 'pop-wallpaper-row' + (isActive ? ' active' : '');
            row.dataset.id = webRec.id;
            row.dataset.category = 'custom';

            const selBtn = document.createElement('button');
            selBtn.type = 'button';
            selBtn.className = 'pop-wallpaper-select';
            selBtn.title = webRec.url;
            selBtn.innerHTML = `
              <span class="pop-icon">🔗</span>
              <div class="pop-wallpaper-info">
                <span class="pop-wallpaper-name">${escapeHtml(webRec.name)}</span>
                <span class="pop-wallpaper-badge">WEB · ${(webRec.type || 'static').toUpperCase()}</span>
              </div>
            `;
            selBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              applyCustomWebWallpaper(webRec);
              scenePopover.classList.remove('open');
            });

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'pop-wallpaper-delete-btn';
            delBtn.title = '削除 (Delete)';
            delBtn.textContent = '✕';
            delBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              deleteCustomWebWallpaper(webRec.id);
              if (activeWallpaper.source === 'custom-url' && activeWallpaper.id === webRec.id) {
                applyDefaultLiveScene('crimson');
              }
              renderWallpaperLists();
            });

            row.appendChild(selBtn);
            row.appendChild(delBtn);
            listCustomWeb.appendChild(row);
          });
        }
      }
    }

    /* ─── WALLPAPER ACTIVATION CONTROLLER ─── */
    function applyDefaultLiveScene(sceneKey, isUltra = null) {
      const resolvedKey = sceneAliasMap[sceneKey] || sceneKey;
      let s = DEFAULT_LIVE_SCENES.find(it => it.key === resolvedKey);
      if (!s) s = DEFAULT_LIVE_SCENES[0];
      currentSceneIdx = DEFAULT_LIVE_SCENES.indexOf(s);

      saveActiveWallpaperState({
        source: 'default-live',
        id: s.key,
        name: s.fileName,
        type: s.key === 'eco' ? 'static' : 'live'
      });

      isCustomWallpaper = false;
      currentWallpaperMode = 'live';
      document.body.setAttribute('data-wallpaper-mode', 'live');
      document.body.setAttribute('data-scene', s.key);
      if (sceneToolIcon) sceneToolIcon.textContent = s.key === 'eco' ? '🍃' : '▶';

      revokeCustomObjectUrl();
      if (bgStatic) bgStatic.style.opacity = '0';

      const ultraActive = isUltra !== null
        ? !!isUltra
        : ((urlParams && (urlParams.get('ultra') === '1' || urlParams.get('hd') === '1')) || safeStorage.getItem('shinsekai-ultra') === 'true');
      safeStorage.setItem('shinsekai-ultra', ultraActive ? 'true' : 'false');

      const videoSrc = (ultraActive && s.video && s.video.ultra)
        ? s.video.ultra
        : (s.video ? (s.video.default || s.video[currentTier] || s.video.mid) : null);

      if (sceneLabel) sceneLabel.textContent = s.label + (ultraActive ? ' HD' : '');
      if (sceneLabelSub) sceneLabelSub.textContent = (s.labelEn || s.key.toUpperCase()) + (ultraActive ? ' (1080p)' : '');

      if (bgVideo) {
        bgVideo.poster = s.preview || '';
        if (!videoSrc) {
          bgVideo.pause();
          bgVideo.removeAttribute('src');
          if (videoSource) videoSource.removeAttribute('src');
          bgVideo.load();
          bgVideo.style.opacity = '0';
        } else {
          bgVideo.muted = true;
          bgVideo.defaultMuted = true;
          bgVideo.playsInline = true;
          bgVideo.setAttribute('muted', '');
          bgVideo.setAttribute('playsinline', '');

          const activeSrc = String(bgVideo.currentSrc || (videoSource ? videoSource.src : '') || '');
          if (!activeSrc || !activeSrc.includes(videoSrc)) {
            bgVideo.style.opacity = '0.2';
            bgVideo.src = videoSrc;
            if (videoSource) videoSource.src = videoSrc;
            bgVideo.load();
            bgVideo.playbackRate = 1.15;

            const onReady = () => {
              bgVideo.removeEventListener('canplay', onReady);
              bgVideo.playbackRate = 1.15;
              const p = bgVideo.play();
              if (p !== undefined) p.catch(() => {});
              setTimeout(() => { bgVideo.style.opacity = '1'; }, 80);
            };
            if (bgVideo.readyState >= 3) {
              onReady();
            } else {
              bgVideo.addEventListener('canplay', onReady, { once: true });
            }
          } else {
            bgVideo.style.opacity = '1';
            bgVideo.playbackRate = 1.15;
            if (bgVideo.paused) {
              const p = bgVideo.play();
              if (p !== undefined) p.catch(() => {});
            }
          }
        }
      }

      updateWallpaperListHighlights();
    }

    function applyDefaultStaticScene(artKey) {
      let s = DEFAULT_STATIC_ARTWORKS.find(it => it.key === artKey);
      if (!s) s = DEFAULT_STATIC_ARTWORKS[0];

      saveActiveWallpaperState({
        source: 'default-static',
        id: s.key,
        name: s.fileName,
        type: 'static'
      });

      isCustomWallpaper = false;
      currentWallpaperMode = 'static';
      document.body.setAttribute('data-wallpaper-mode', 'static');
      document.body.setAttribute('data-scene', s.key);
      if (sceneToolIcon) sceneToolIcon.textContent = '🖼';

      revokeCustomObjectUrl();

      if (bgVideo) {
        if (!bgVideo.paused) bgVideo.pause();
        bgVideo.style.opacity = '0';
      }

      if (bgStatic) {
        bgStatic.src = s.src;
        bgStatic.style.opacity = '1';
      }

      if (sceneLabel) sceneLabel.textContent = s.label;
      if (sceneLabelSub) sceneLabelSub.textContent = (s.labelEn || s.key.toUpperCase()) + ' (PNG)';

      updateWallpaperListHighlights();
    }

    async function applyCustomFileWallpaper(recordOrId) {
      let record = recordOrId;
      if (typeof recordOrId === 'string') {
        record = await getCustomWallpaperByIdFromDB(recordOrId);
      }
      if (!record || !record.blob) {
        applyDefaultLiveScene('crimson');
        return;
      }

      revokeCustomObjectUrl();
      currentCustomObjectUrl = URL.createObjectURL(record.blob);

      saveActiveWallpaperState({
        source: 'custom-file',
        id: record.id,
        name: record.name,
        type: record.type || 'static'
      });

      isCustomWallpaper = true;
      currentWallpaperMode = record.type || 'static';
      document.body.setAttribute('data-wallpaper-mode', currentWallpaperMode);

      const displayName = record.name.length > 14 ? record.name.slice(0, 12) + '…' : record.name;

      if (record.type === 'live') {
        if (sceneToolIcon) sceneToolIcon.textContent = '▶';
        if (bgStatic) bgStatic.style.opacity = '0';
        if (bgVideo) {
          bgVideo.muted = true;
          bgVideo.defaultMuted = true;
          bgVideo.playsInline = true;
          bgVideo.setAttribute('muted', '');
          bgVideo.setAttribute('playsinline', '');
          bgVideo.src = currentCustomObjectUrl;
          bgVideo.playbackRate = 1.0;
          bgVideo.load();
          bgVideo.play().catch(() => {});
          bgVideo.style.opacity = '1';
        }
        if (sceneLabel) sceneLabel.textContent = 'カスタム: ' + displayName;
        if (sceneLabelSub) sceneLabelSub.textContent = 'CUSTOM VIDEO';
      } else {
        if (sceneToolIcon) sceneToolIcon.textContent = '🖼';
        if (bgVideo) {
          if (!bgVideo.paused) bgVideo.pause();
          bgVideo.style.opacity = '0';
        }
        if (bgStatic) {
          bgStatic.src = currentCustomObjectUrl;
          bgStatic.style.opacity = '1';
        }
        if (sceneLabel) sceneLabel.textContent = 'カスタム: ' + displayName;
        if (sceneLabelSub) sceneLabelSub.textContent = 'CUSTOM IMAGE';
      }

      updateWallpaperListHighlights();
    }

    function applyCustomWebWallpaper(recordOrId) {
      let record = recordOrId;
      if (typeof recordOrId === 'string') {
        const list = getCustomWebWallpapers();
        record = list.find(it => it.id === recordOrId);
      }
      if (!record || !record.url) {
        applyDefaultLiveScene('crimson');
        return;
      }

      revokeCustomObjectUrl();

      saveActiveWallpaperState({
        source: 'custom-url',
        id: record.id,
        name: record.name,
        url: record.url,
        type: record.type || 'static'
      });

      isCustomWallpaper = true;
      currentWallpaperMode = record.type || 'static';
      document.body.setAttribute('data-wallpaper-mode', currentWallpaperMode);

      const displayName = record.name.length > 14 ? record.name.slice(0, 12) + '…' : record.name;

      if (record.type === 'live') {
        if (sceneToolIcon) sceneToolIcon.textContent = '▶';
        if (bgStatic) bgStatic.style.opacity = '0';
        if (bgVideo) {
          bgVideo.muted = true;
          bgVideo.defaultMuted = true;
          bgVideo.playsInline = true;
          bgVideo.setAttribute('muted', '');
          bgVideo.setAttribute('playsinline', '');
          bgVideo.src = record.url;
          bgVideo.playbackRate = 1.0;
          bgVideo.load();
          bgVideo.play().catch(() => {});
          bgVideo.style.opacity = '1';
        }
        if (sceneLabel) sceneLabel.textContent = 'Web: ' + displayName;
        if (sceneLabelSub) sceneLabelSub.textContent = 'ONLINE VIDEO';
      } else {
        if (sceneToolIcon) sceneToolIcon.textContent = '🖼';
        if (bgVideo) {
          if (!bgVideo.paused) bgVideo.pause();
          bgVideo.style.opacity = '0';
        }
        if (bgStatic) {
          bgStatic.src = record.url;
          bgStatic.style.opacity = '1';
        }
        if (sceneLabel) sceneLabel.textContent = 'Web: ' + displayName;
        if (sceneLabelSub) sceneLabelSub.textContent = 'ONLINE IMAGE';
      }

      updateWallpaperListHighlights();
    }

    // Bridge functions for backward compatibility with existing engine calls
    function applyScene(sceneKey, isUltra = null) {
      applyDefaultLiveScene(sceneKey, isUltra);
    }

    function applyStaticWallpaper(specificSrc = null, sceneKey = null) {
      if (sceneKey) {
        applyDefaultStaticScene(sceneKey);
      } else if (specificSrc) {
        const webRec = addCustomWebWallpaper(specificSrc, 'Custom Image');
        applyCustomWebWallpaper(webRec);
      } else {
        applyDefaultStaticScene(DEFAULT_STATIC_ARTWORKS[0].key);
      }
    }

    function setWallpaperMode(mode) {
      if (mode === 'static') {
        switchWallpaperCategoryTab('static');
        applyDefaultStaticScene(DEFAULT_STATIC_ARTWORKS[0].key);
      } else if (mode === 'custom') {
        switchWallpaperCategoryTab('custom');
      } else {
        switchWallpaperCategoryTab('live');
        applyDefaultLiveScene(DEFAULT_LIVE_SCENES[0].key);
      }
    }

    if (typeof window !== 'undefined') {
      window.applyScene = applyScene;
      window.setWallpaperMode = setWallpaperMode;
      window.applyStaticWallpaper = applyStaticWallpaper;
      window.renderWallpaperLists = renderWallpaperLists;
    }

    function isVideoActive() {
      return (
        (currentWallpaperMode === 'live' || activeWallpaper.type === 'live') &&
        activeWallpaper.id !== 'eco' &&
        document.body.getAttribute('data-scene') !== 'eco' &&
        !!bgVideo
      );
    }

    /* ─── 4.1. BULLETPROOF VIDEO AUTO-RESUME & FREEZE-RECOVERY ─── */
    function ensureVideoPlayback() {
      if (!isVideoActive()) return;
      bgVideo.muted = true;
      bgVideo.defaultMuted = true;
      bgVideo.playsInline = true;
      bgVideo.setAttribute('muted', '');
      bgVideo.setAttribute('playsinline', '');

      if (bgVideo.paused || bgVideo.ended) {
        if (bgVideo.ended || (bgVideo.duration && bgVideo.currentTime >= bgVideo.duration - 0.15)) {
          bgVideo.currentTime = 0;
        }
        const promise = bgVideo.play();
        if (promise !== undefined) {
          promise.catch(() => {});
        }
      }
    }

    /* ─── 4.2. UNIFIED POWER & MEMORY LIFECYCLE MANAGER ─── */
    function pauseAllEngines() {
      if (isAppSuspended) return;
      isAppSuspended = true;
      stopCanvasAnim();
      if (bgVideo && !bgVideo.paused) {
        bgVideo.pause();
      }
      clearInterval(quoteTimer);
    }

    function resumeAllEngines() {
      // Never resume if document is hidden or any blocking modal is open
      if (document.hidden) return;
      const blockingModalOpen = [linkEditorModal, operatorModal, shortcutsModal]
        .some(m => m && m.classList.contains('open'));
      if (blockingModalOpen) return;

      isAppSuspended = false;
      lastClockMainStr = '';
      lastDateDay = -1;
      lastLoreHour = -1;
      updateEpisodeClock();
      startCanvasAnim();
      ensureVideoPlayback();
      startQuoteTimer();
    }

    // Deep-suspend: pause immediately on hide; after 20s hidden, unload src entirely to free GPU/RAM.
    // On return, if deep-suspended, re-call applyScene to reload cleanly from the 720p default.
    let deepSuspendTimer = null;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pauseAllEngines();
        deepSuspendTimer = setTimeout(() => {
          if (document.hidden && isVideoActive()) {
            bgVideo.pause();
            bgVideo.removeAttribute('src');
            if (videoSource) videoSource.removeAttribute('src');
            bgVideo.load();
            bgVideo.dataset.deepSuspended = 'true';
          }
        }, 20000);
      } else {
        clearTimeout(deepSuspendTimer);
        if (bgVideo && bgVideo.dataset.deepSuspended === 'true') {
          delete bgVideo.dataset.deepSuspended;
          if (isVideoActive()) {
            if (activeWallpaper && (activeWallpaper.source === 'custom-file' || activeWallpaper.source === 'custom-url')) {
              initActiveWallpaper();
            } else {
              const sceneKey = (scenes && scenes[currentSceneIdx]) ? scenes[currentSceneIdx].key : (activeWallpaper.id || 'crimson');
              applyScene(sceneKey);
            }
          } else {
            resumeAllEngines();
          }
        } else {
          resumeAllEngines();
        }
      }
    });

    // Suspend non-critical rendering when user shifts focus to another window/application
    window.addEventListener('blur', () => {
      pauseAllEngines();
    });

    window.addEventListener('focus', () => {
      resumeAllEngines();
    });

    window.addEventListener('pageshow', () => {
      resumeAllEngines();
    });

    if (bgVideo) {
      bgVideo.muted = true;
      bgVideo.defaultMuted = true;

      // Auto-resume if paused unexpectedly while page is visible
      bgVideo.addEventListener('pause', () => {
        if (!document.hidden && !isAppSuspended && isVideoActive()) {
          setTimeout(() => {
            if (!document.hidden && !isAppSuspended && isVideoActive() && bgVideo.paused) {
              ensureVideoPlayback();
            }
          }, 120);
        }
      });

      // Loop guarantee across all browser decoders
      bgVideo.addEventListener('ended', () => {
        bgVideo.currentTime = 0;
        ensureVideoPlayback();
      });

      // Recover from decoder stalls or waiting state
      bgVideo.addEventListener('stalled', () => {
        if (!document.hidden && !isAppSuspended && isVideoActive()) ensureVideoPlayback();
      });
      bgVideo.addEventListener('waiting', () => {
        if (!document.hidden && !isAppSuspended && isVideoActive()) ensureVideoPlayback();
      });
      let videoErrorCount = 0;
      bgVideo.addEventListener('playing', () => { videoErrorCount = 0; });
      bgVideo.addEventListener('error', () => {
        if (!isVideoActive()) return;
        if (++videoErrorCount >= 2) { applyScene('eco'); return; }
        try { bgVideo.load(); ensureVideoPlayback(); } catch (e) {}
      });

      // Watchdog: checks every 4s to unfreeze video if frame gets stuck (dormant when paused/hidden/eco/static)
      let lastVideoTime = -1;
      let freezeCount = 0;
      setInterval(() => {
        if (document.hidden || isAppSuspended || !isVideoActive()) return;
        if (bgVideo.paused) {
          ensureVideoPlayback();
          return;
        }
        if (Math.abs(bgVideo.currentTime - lastVideoTime) < 0.05 && bgVideo.readyState >= 2) {
          freezeCount++;
          if (freezeCount >= 2) {
            freezeCount = 0;
            try {
              bgVideo.currentTime = (bgVideo.currentTime + 0.1) % (bgVideo.duration || 10);
              ensureVideoPlayback();
            } catch (e) {}
          }
        } else {
          freezeCount = 0;
          lastVideoTime = bgVideo.currentTime;
        }
      }, 4000);
    }

    function cycleScene() {
      if (activeWallpaper.source === 'default-static') {
        const deletedStatic = getDeletedDefaultsStatic();
        const visibleStatic = DEFAULT_STATIC_ARTWORKS.filter(s => !deletedStatic.includes(s.key));
        if (visibleStatic.length === 0) return;
        const currentKey = activeWallpaper.id;
        let idx = visibleStatic.findIndex(s => s.key === currentKey);
        const nextIdx = (idx + 1) % visibleStatic.length;
        applyDefaultStaticScene(visibleStatic[nextIdx].key);
        applyTheme(visibleStatic[nextIdx].key, false);
      } else {
        const deletedLive = getDeletedDefaultsLive();
        const visibleLive = DEFAULT_LIVE_SCENES.filter(s => !deletedLive.includes(s.key));
        if (visibleLive.length === 0) return;
        const currentKey = activeWallpaper.id;
        let idx = visibleLive.findIndex(s => s.key === currentKey);
        const nextIdx = (idx + 1) % visibleLive.length;
        applyDefaultLiveScene(visibleLive[nextIdx].key);
      }
    }

    /* ─── WALLPAPER POPOVER & ACTION HANDLERS ─── */
    if (sceneBtn && scenePopover) {
      sceneBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (themePopover) themePopover.classList.remove('open');
        scenePopover.classList.toggle('open');
        if (scenePopover.classList.contains('open')) {
          renderWallpaperLists();
        }
      });

      // Segmented mode switcher tabs: Live vs Static vs Custom
      if (modeTabLive) {
        modeTabLive.addEventListener('click', (e) => {
          e.stopPropagation();
          switchWallpaperCategoryTab('live');
        });
      }
      if (modeTabStatic) {
        modeTabStatic.addEventListener('click', (e) => {
          e.stopPropagation();
          switchWallpaperCategoryTab('static');
        });
      }
      if (modeTabCustom) {
        modeTabCustom.addEventListener('click', (e) => {
          e.stopPropagation();
          switchWallpaperCategoryTab('custom');
        });
      }

      // Restore default wallpapers button
      if (restoreDefaultsBtn) {
        restoreDefaultsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          restoreAllDefaults();
          renderWallpaperLists();
        });
      }

      if (restoreLiveBtn) {
        restoreLiveBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          restoreDefaultsLive();
          renderWallpaperLists();
        });
      }

      if (restoreStaticBtn) {
        restoreStaticBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          restoreDefaultsStatic();
          renderWallpaperLists();
        });
      }

      // Multi-file upload handler (MP4, WebM, PNG, JPG, WebP, GIF)
      if (uploadWallpaperBtn && wallpaperFileInput) {
        uploadWallpaperBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          wallpaperFileInput.click();
        });

        wallpaperFileInput.addEventListener('change', async () => {
          const files = Array.from(wallpaperFileInput.files || []);
          if (!files.length) return;

          const MAX_WALLPAPER_SIZE = 35 * 1024 * 1024; // 35 MB max limit
          let addedCount = 0;
          let restoredCount = 0;
          let lastAddedCustom = null;
          let lastRestoredDefault = null;

          const deletedLive = getDeletedDefaultsLive();
          const deletedStatic = getDeletedDefaultsStatic();

          for (const file of files) {
            if (file.size > MAX_WALLPAPER_SIZE) {
              alert(`ファイル "${file.name}" が大きすぎます (最大35MB)。\nFile exceeds 35MB limit: ${file.name}`);
              continue;
            }

            const isVideo = file.type.startsWith('video/') || /\.(mp4|webm)$/i.test(file.name);
            const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(file.name);

            if (!isVideo && !isImage) {
              alert(`対応していないファイル形式です: ${file.name}\nSupported formats: MP4, WebM, PNG, JPG, WebP, GIF.`);
              continue;
            }

            const cleanFileName = file.name.trim().toLowerCase();
            const baseName = file.name.replace(/\.[^/.]+$/, '').trim().toLowerCase();

            // Check if matches a deleted default live video
            if (isVideo) {
              const matched = DEFAULT_LIVE_SCENES.find(s => deletedLive.includes(s.key) && (s.fileName.toLowerCase() === cleanFileName || s.key.toLowerCase() === baseName));
              if (matched) {
                const updated = getDeletedDefaultsLive().filter(k => k !== matched.key);
                saveDeletedDefaultsLive(updated);
                restoredCount++;
                lastRestoredDefault = { type: 'live', key: matched.key };
                continue;
              }
            } else if (isImage) {
              // Check if matches a deleted default static artwork
              const matched = DEFAULT_STATIC_ARTWORKS.find(s => deletedStatic.includes(s.key) && (s.fileName.toLowerCase() === cleanFileName || s.key.toLowerCase() === baseName));
              if (matched) {
                const updated = getDeletedDefaultsStatic().filter(k => k !== matched.key);
                saveDeletedDefaultsStatic(updated);
                restoredCount++;
                lastRestoredDefault = { type: 'static', key: matched.key };
                continue;
              }
            }

            // Not a deleted default: store in Custom collection
            try {
              const record = await addCustomWallpaperToDB(file);
              addedCount++;
              lastAddedCustom = record;

              // Generate lightweight low-res thumbnail for synchronous zero-flash boot
              if (isImage && file.type !== 'image/gif') {
                try {
                  const img = new Image();
                  const tempUrl = URL.createObjectURL(file);
                  img.onload = () => {
                    try {
                      const cvs = document.createElement('canvas');
                      cvs.width = 64;
                      cvs.height = 36;
                      const ctx = cvs.getContext('2d');
                      if (ctx) {
                        ctx.drawImage(img, 0, 0, 64, 36);
                        safeStorage.setItem('shinsekai-custom-wallpaper-thumb', cvs.toDataURL('image/webp', 0.5));
                      }
                    } catch (e) {}
                    URL.revokeObjectURL(tempUrl);
                  };
                  img.src = tempUrl;
                } catch (e) {}
              }
            } catch (err) {
              console.error('Failed to save custom wallpaper:', err);
            }
          }

          wallpaperFileInput.value = '';

          if (addedCount > 0 && lastAddedCustom) {
            switchWallpaperCategoryTab('custom');
            applyCustomFileWallpaper(lastAddedCustom);
          } else if (restoredCount > 0 && lastRestoredDefault) {
            if (lastRestoredDefault.type === 'live') {
              switchWallpaperCategoryTab('live');
              applyDefaultLiveScene(lastRestoredDefault.key);
            } else {
              switchWallpaperCategoryTab('static');
              applyDefaultStaticScene(lastRestoredDefault.key);
            }
          }

          await renderWallpaperLists();
        });
      }

      // Online Web URL input
      if (urlWallpaperBtn) {
        urlWallpaperBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const inputUrl = prompt('壁紙のURLを入力してください (Enter Image or Video URL):\nSupports PNG, JPG, WebP, GIF, or MP4/WebM direct links');
          if (!inputUrl) return;
          const cleanUrl = inputUrl.trim();
          if (!cleanUrl) return;

          let defaultTitle = '';
          try {
            const u = new URL(cleanUrl);
            const parts = u.pathname.split('/').filter(Boolean);
            defaultTitle = parts.length ? parts[parts.length - 1] : u.hostname;
          } catch (e) {
            defaultTitle = cleanUrl.slice(0, 20);
          }

          const inputTitle = prompt('表示名を入力してください (Optional Display Name):', defaultTitle);
          const finalTitle = (inputTitle && inputTitle.trim()) ? inputTitle.trim() : defaultTitle;

          const record = addCustomWebWallpaper(cleanUrl, finalTitle);
          switchWallpaperCategoryTab('custom');
          applyCustomWebWallpaper(record);
          await renderWallpaperLists();
        });
      }
    }

    /* ─── INITIALIZE ACTIVE WALLPAPER ON BOOT ─── */
    function initActiveWallpaper() {
      let savedActive = null;
      try {
        const raw = safeStorage.getItem('shinsekai-active-wallpaper');
        if (raw) savedActive = JSON.parse(raw);
      } catch (e) {}

      if (!savedActive) {
        const savedMode = (urlParams ? urlParams.get('mode') : null) || safeStorage.getItem('shinsekai-wallpaper-mode') || 'live';
        const legacyCustomUrl = safeStorage.getItem('shinsekai-custom-wallpaper-url');
        const rawSavedScene = paramScene || safeStorage.getItem('shinsekai-scene') || 'crimson';
        const sceneKey = sceneAliasMap[rawSavedScene] || rawSavedScene;

        if (savedMode === 'static') {
          if (legacyCustomUrl) {
            const webRec = addCustomWebWallpaper(legacyCustomUrl, 'Saved Online Image');
            applyCustomWebWallpaper(webRec);
            switchWallpaperCategoryTab('custom');
          } else {
            applyDefaultStaticScene(sceneKey);
            switchWallpaperCategoryTab('static');
          }
        } else {
          applyDefaultLiveScene(sceneKey);
          switchWallpaperCategoryTab('live');
        }
        renderWallpaperLists();
        return;
      }

      if (savedActive.source === 'custom-file') {
        getCustomWallpaperByIdFromDB(savedActive.id).then(record => {
          if (record) {
            applyCustomFileWallpaper(record);
            switchWallpaperCategoryTab('custom');
          } else {
            applyDefaultLiveScene('crimson');
            switchWallpaperCategoryTab('live');
          }
          renderWallpaperLists();
        });
      } else if (savedActive.source === 'custom-url') {
        const webList = getCustomWebWallpapers();
        const found = webList.find(w => w.id === savedActive.id) || (savedActive.url ? addCustomWebWallpaper(savedActive.url, savedActive.name) : null);
        if (found) {
          applyCustomWebWallpaper(found);
          switchWallpaperCategoryTab('custom');
        } else {
          applyDefaultLiveScene('crimson');
          switchWallpaperCategoryTab('live');
        }
        renderWallpaperLists();
      } else if (savedActive.source === 'default-static') {
        applyDefaultStaticScene(savedActive.id || 'crimson');
        switchWallpaperCategoryTab('static');
        renderWallpaperLists();
      } else {
        applyDefaultLiveScene(savedActive.id || 'crimson');
        switchWallpaperCategoryTab('live');
        renderWallpaperLists();
      }
    }

    initActiveWallpaper();

    /* ─── 5. THEME FACTION CONTROLLER ─── */
    const themes = [
      { key: 'crimson',    label: '紅蓮',   labelEn: 'Crimson',    color: '#f7768e', defaultScene: 'crimson' },
      { key: 'tokyonight', label: '東京夜', labelEn: 'TokyoNight', color: '#7aa2f7', defaultScene: 'tokyonight' },
      { key: 'sakura',     label: '桜吹雪', labelEn: 'Sakura',     color: '#f4b8e4', defaultScene: 'sakura' },
      { key: 'catppuccin', label: '終末谷', labelEn: 'Catppuccin', color: '#cba6f7', defaultScene: 'catppuccin' },
      { key: 'cyberpunk',  label: '電脳都市', labelEn: 'Cyberpunk',  color: '#00f0ff', defaultScene: 'cyberpunk' },
      { key: 'custom',     label: 'カスタム', labelEn: 'Custom',     color: '#a6e3a1', defaultScene: null }
    ];

    /* ─── OPERATOR IDENTITY PROTOCOL ─── */
    let currentOperatorName = paramUser || safeStorage.getItem('shinsekai-operator-name') || 'MIMOGU';
    let currentOperatorHonorific = paramHonorific !== null ? paramHonorific : safeStorage.getItem('shinsekai-operator-honorific');
    if (currentOperatorHonorific === null) currentOperatorHonorific = '-SAMA';

    function getOperatorFormattedName(name = currentOperatorName, honorific = currentOperatorHonorific) {
      const cleanName = (name !== undefined && name !== null ? String(name) : '').trim() || 'MIMOGU';
      const cleanHon = (honorific !== undefined && honorific !== null ? String(honorific) : '').trim();
      if (!cleanHon || cleanHon === 'none') {
        return cleanName;
      }
      if (cleanHon.startsWith('-') || cleanHon.startsWith(' ') || cleanHon.startsWith('・')) {
        return `${cleanName}${cleanHon}`;
      }
      return `${cleanName}-${cleanHon}`;
    }

    function updateOperatorPill() {
      if (operatorPillName) {
        operatorPillName.textContent = currentOperatorName;
      }
    }

    const themeBootLoreTemplates = {
      crimson: {
        tag: 'SHINSEKAI // 紅蓮 FLAME CORE',
        kanji: '紅蓮 · 炎獄始動',
        subTemplate: 'SYNCHRONIZING CRIMSON FLAME MATRIX // {OPERATOR}',
        step: '[BOOT 03/04] 紅蓮 FLAME COGNITION ONLINE // SYNC RATE: 99.8%'
      },
      tokyonight: {
        tag: 'SHINSEKAI // 東京夜 CURSED CORE',
        kanji: '東京夜 · 無量空処',
        subTemplate: 'SYNCHRONIZING INFINITE VOID MATRIX // {OPERATOR}',
        step: '[BOOT 03/04] 東京夜 VOID COGNITION ONLINE // SYNC RATE: 99.8%'
      },
      sakura: {
        tag: 'SHINSEKAI // 桜吹雪 RONIN CORE',
        kanji: '桜吹雪 · 侍刀一閃',
        subTemplate: 'SYNCHRONIZING SAKURA BLOSSOM MATRIX // {OPERATOR}',
        step: '[BOOT 03/04] 桜吹雪 BLOSSOM COGNITION ONLINE // SYNC RATE: 99.8%'
      },
      catppuccin: {
        tag: 'SHINSEKAI // 終末谷 SPIRAL CORE',
        kanji: '終末谷 · 宿命螺旋',
        subTemplate: 'SYNCHRONIZING CATPPUCCIN SPIRAL MATRIX // {OPERATOR}',
        step: '[BOOT 03/04] 終末谷 SPIRAL COGNITION ONLINE // SYNC RATE: 99.8%'
      },
      cyberpunk: {
        tag: 'SHINSEKAI // 電脳都市 NEON CORE',
        kanji: '電脳都市 · 超限界',
        subTemplate: 'SYNCHRONIZING CYBERPUNK NEON MATRIX // {OPERATOR}',
        step: '[BOOT 03/04] 電脳都市 NEON COGNITION ONLINE // SYNC RATE: 99.8%'
      },
      custom: {
        tag: 'SHINSEKAI // カスタム SPECTRUM CORE',
        kanji: '領域展開 · カスタム',
        subTemplate: 'SYNCHRONIZING CUSTOM SPECTRUM MATRIX // {OPERATOR}',
        step: '[BOOT 03/04] カスタム SPECTRUM ONLINE // SYNC RATE: 99.8%'
      }
    };

    const themeBootLore = {
      crimson:    { ...themeBootLoreTemplates.crimson, sub: '' },
      tokyonight: { ...themeBootLoreTemplates.tokyonight, sub: '' },
      sakura:     { ...themeBootLoreTemplates.sakura, sub: '' },
      catppuccin: { ...themeBootLoreTemplates.catppuccin, sub: '' },
      cyberpunk:  { ...themeBootLoreTemplates.cyberpunk, sub: '' },
      custom:     { ...themeBootLoreTemplates.custom, sub: '' }
    };

    let currentThemeIdx = 0;
    const savedTheme = paramTheme || safeStorage.getItem('shinsekai-theme') || 'crimson';
    const foundTheme = themes.findIndex(t => t.key === savedTheme);
    if (foundTheme !== -1) currentThemeIdx = foundTheme;

    function refreshThemeBootLore() {
      const formatted = getOperatorFormattedName();
      Object.keys(themeBootLoreTemplates).forEach(k => {
        themeBootLore[k].sub = themeBootLoreTemplates[k].subTemplate.replace('{OPERATOR}', formatted);
      });
      if (bootSub && typeof themes !== 'undefined' && themes[currentThemeIdx]) {
        const lore = themeBootLore[themes[currentThemeIdx].key] || themeBootLore.crimson;
        bootSub.textContent = lore.sub;
      }
    }

    refreshThemeBootLore();
    updateOperatorPill();

    /* ─── CUSTOM COLOR THEME CONTROLLER ─── */
    function applyCustomThemeColor(hex) {
      const { r, g, b } = hexToRgb(hex);
      const root = document.documentElement;

      root.style.setProperty('--theme-base', `rgb(${Math.max(4, Math.floor(r * 0.05))}, ${Math.max(5, Math.floor(g * 0.05))}, ${Math.max(10, Math.floor(b * 0.06))})`);
      root.style.setProperty('--accent', hex);
      root.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.55)`);
      root.style.setProperty('--accent-soft', `rgba(${r}, ${g}, ${b}, 0.18)`);
      root.style.setProperty('--accent-alt', `rgb(${Math.min(255, Math.floor(r * 1.15))}, ${Math.min(255, Math.floor(g * 0.85))}, ${Math.min(255, Math.floor(b * 1.15))})`);
      root.style.setProperty('--accent-cyan', `rgb(${Math.min(255, Math.floor(r * 0.85))}, ${Math.min(255, Math.floor(g * 1.15))}, ${Math.min(255, Math.floor(b * 1.15))})`);
      root.style.setProperty('--glass-bg', `rgba(${Math.max(6, Math.floor(r * 0.07))}, ${Math.max(8, Math.floor(g * 0.07))}, ${Math.max(16, Math.floor(b * 0.08))}, 0.80)`);
      root.style.setProperty('--glass-border', `rgba(${r}, ${g}, ${b}, 0.35)`);
      root.style.setProperty('--glass-border-hover', `rgba(${r}, ${g}, ${b}, 0.85)`);
      root.style.setProperty('--particle-color', `rgba(${r}, ${g}, ${b}, 0.75)`);
    }

    function removeCustomThemeStyles() {
      const root = document.documentElement;
      root.style.removeProperty('--theme-base');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-glow');
      root.style.removeProperty('--accent-soft');
      root.style.removeProperty('--accent-alt');
      root.style.removeProperty('--accent-cyan');
      root.style.removeProperty('--glass-bg');
      root.style.removeProperty('--glass-border');
      root.style.removeProperty('--glass-border-hover');
      root.style.removeProperty('--particle-color');
    }

    function applyCustomTheme(hexColor, syncScene = false) {
      let rawHex = String(hexColor || safeStorage.getItem('shinsekai-custom-theme-color') || '#a6e3a1').trim();
      if (!rawHex.startsWith('#')) rawHex = '#' + rawHex;
      if (rawHex.length === 4) rawHex = '#' + rawHex[1] + rawHex[1] + rawHex[2] + rawHex[2] + rawHex[3] + rawHex[3];
      const hex = /^#[0-9a-fA-F]{6}$/.test(rawHex) ? rawHex : '#a6e3a1';
      currentThemeKey = 'custom';
      currentThemeIdx = themes.findIndex(t => t.key === 'custom');
      if (currentThemeIdx === -1) currentThemeIdx = themes.length - 1;
      themes[currentThemeIdx].color = hex;

      safeStorage.setItem('shinsekai-theme', 'custom');
      safeStorage.setItem('shinsekai-custom-theme-color', hex);

      document.documentElement.setAttribute('data-theme', 'custom');
      document.body.setAttribute('data-theme', 'custom');

      applyCustomThemeColor(hex);

      if (themeLabel) themeLabel.textContent = 'カスタム';
      const themeLabelSub = document.getElementById('theme-label-sub');
      if (themeLabelSub) themeLabelSub.textContent = 'Custom';
      if (themeColorDot) themeColorDot.style.background = hex;

      if (customThemeDot) customThemeDot.style.background = hex;
      if (customThemeHex) customThemeHex.textContent = hex.toUpperCase() + ' · Custom';
      if (customThemeColorInput && customThemeColorInput.value.toLowerCase() !== hex.toLowerCase()) {
        customThemeColorInput.value = hex;
      }

      const lore = themeBootLore.custom || themeBootLoreTemplates.custom;
      if (bootPill) bootPill.textContent = lore.tag;
      if (bootKanji) bootKanji.textContent = lore.kanji;
      if (bootSub) bootSub.textContent = lore.sub || ('SYNCHRONIZING CUSTOM SPECTRUM // ' + getOperatorFormattedName());

      themeItems.forEach(item => {
        item.classList.remove('active');
      });
      if (customThemeItem) customThemeItem.classList.add('active');

      refreshParticleColors();
      if (particlesStatusIcon && particlesActive) {
        particlesStatusIcon.textContent = '🎨';
      }
    }

    function applyTheme(themeKey, syncScene = false) {
      if (themeKey === 'custom') {
        const savedHex = safeStorage.getItem('shinsekai-custom-theme-color') || '#a6e3a1';
        applyCustomTheme(savedHex, syncScene);
        return;
      }

      removeCustomThemeStyles();
      const t = themes.find(item => item.key === themeKey) || themes[0];
      currentThemeIdx = themes.indexOf(t);
      currentThemeKey = t.key;
      safeStorage.setItem('shinsekai-theme', t.key);

      document.documentElement.setAttribute('data-theme', t.key);
      document.body.setAttribute('data-theme', t.key);
      if (themeLabel) themeLabel.textContent = t.label;
      const themeLabelSub = document.getElementById('theme-label-sub');
      if (themeLabelSub) themeLabelSub.textContent = t.labelEn || '';
      if (themeColorDot) themeColorDot.style.background = t.color;

      const lore = themeBootLore[t.key] || themeBootLore.crimson;
      if (bootPill) bootPill.textContent = lore.tag;
      if (bootKanji) bootKanji.textContent = lore.kanji;
      if (bootSub) bootSub.textContent = lore.sub;

      themeItems.forEach(item => {
        item.classList.toggle('active', item.dataset.theme === t.key);
      });
      if (customThemeItem) customThemeItem.classList.remove('active');

      refreshParticleColors();
      if (particlesStatusIcon && particlesActive) {
        particlesStatusIcon.textContent = THEME_PARTICLE_ICONS[t.key] || '🌸';
      }

      if (syncScene && t.defaultScene) {
        if (currentWallpaperMode === 'static') {
          if (!isCustomWallpaper) {
            applyStaticWallpaper(null, t.defaultScene);
            const s = scenes.find(it => it.key === t.defaultScene) || scenes[0];
            currentSceneIdx = scenes.indexOf(s);
            safeStorage.setItem('shinsekai-scene', s.key);
            document.body.setAttribute('data-scene', s.key);
          }
        } else {
          applyScene(t.defaultScene);
        }
      }
    }

    function cycleTheme() {
      currentThemeIdx = (currentThemeIdx + 1) % themes.length;
      const nextTheme = themes[currentThemeIdx];
      if (nextTheme.key === 'custom') {
        applyCustomTheme(safeStorage.getItem('shinsekai-custom-theme-color') || '#a6e3a1', true);
      } else {
        applyTheme(nextTheme.key, true);
      }
    }

    if (themeBtn && themePopover) {
      themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (scenePopover) scenePopover.classList.remove('open');
        themePopover.classList.toggle('open');
      });

      themeItems.forEach(item => {
        item.addEventListener('click', () => {
          applyTheme(item.dataset.theme, true);
          themePopover.classList.remove('open');
        });
      });

      if (customThemeItem) {
        customThemeItem.addEventListener('click', (e) => {
          if (e.target.closest('.custom-color-picker-label')) return;
          const currentColor = (customThemeColorInput && customThemeColorInput.value) || safeStorage.getItem('shinsekai-custom-theme-color') || '#a6e3a1';
          applyCustomTheme(currentColor, false);
          themePopover.classList.remove('open');
        });
        customThemeItem.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const currentColor = (customThemeColorInput && customThemeColorInput.value) || safeStorage.getItem('shinsekai-custom-theme-color') || '#a6e3a1';
            applyCustomTheme(currentColor, false);
            themePopover.classList.remove('open');
          }
        });
      }

      if (customThemeColorInput) {
        customThemeColorInput.addEventListener('input', (e) => {
          applyCustomTheme(e.target.value, false);
        });
        customThemeColorInput.addEventListener('change', (e) => {
          applyCustomTheme(e.target.value, false);
        });
      }
    }

    const initialTheme = paramTheme || safeStorage.getItem('shinsekai-theme') || 'crimson';
    if (initialTheme === 'custom') {
      const initialColor = paramColor || safeStorage.getItem('shinsekai-custom-theme-color') || '#a6e3a1';
      applyCustomTheme(initialColor, false);
    } else {
      applyTheme(initialTheme, false);
    }

    /* ─── 6. CRT SCANLINES & FILM GRAIN TOGGLE ─── */
    let grainActive = safeStorage.getItem('shinsekai-grain') !== 'off';

    function setGrain(active) {
      grainActive = active;
      safeStorage.setItem('shinsekai-grain', active ? 'on' : 'off');
      document.body.setAttribute('data-grain', active ? 'on' : 'off');
      if (grainStatusText) grainStatusText.textContent = active ? 'CRT: ON' : 'CRT: OFF';
      if (grainToggleBtn) grainToggleBtn.classList.toggle('active', active);
    }

    if (grainToggleBtn) {
      grainToggleBtn.addEventListener('click', () => {
        setGrain(!grainActive);
      });
    }

    setGrain(grainActive);

    /* ─── 7. DOCK PINNING MODE ─── */
    let dockPinned = paramPinned === 'true' || paramPinned === '1' || safeStorage.getItem('shinsekai-dock-pinned') === 'true';

    function setDockPinned(pinned) {
      dockPinned = pinned;
      safeStorage.setItem('shinsekai-dock-pinned', pinned ? 'true' : 'false');
      document.body.setAttribute('data-dock-pinned', pinned ? 'true' : 'false');
      if (pinStatusText) pinStatusText.textContent = pinned ? '固定: ON' : '固定: OFF';
      if (pinDockBtn) pinDockBtn.classList.toggle('active', pinned);
      if (bladeLauncher) {
        if (pinned) {
          bladeLauncher.classList.add('open-active');
        } else {
          bladeLauncher.classList.remove('open-active');
        }
      }
    }

    if (pinDockBtn) {
      pinDockBtn.addEventListener('click', () => {
        setDockPinned(!dockPinned);
      });
    }

    setDockPinned(dockPinned);

    /* ─── 8. DYNAMIC BLADE LAUNCHER & IN-BROWSER LINK EDITOR ─── */
    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function sanitizeUrl(rawUrl) {
      if (!rawUrl) return '#';
      const trimmed = String(rawUrl).trim();
      if (/^(javascript|data|vbscript):/i.test(trimmed)) {
        return '#';
      }
      if (!/^https?:\/\/|^\/|^#|^mailto:|^tel:/i.test(trimmed)) {
        return 'https://' + trimmed;
      }
      return trimmed;
    }

    /* ─── 8.0. FAVICON & PERSISTENT OFFLINE ICON CACHE ─── */
    const ICON_CACHE_PREFIX = 'shinsekai-icon-';

    function getHostname(href) {
      if (!href || href === '#' || href.startsWith('mailto:') || href.startsWith('tel:')) return '';
      try {
        const clean = sanitizeUrl(href);
        if (!clean || clean === '#' || clean.startsWith('javascript:') || clean.startsWith('mailto:') || clean.startsWith('tel:')) return '';
        const { hostname } = new URL(clean);
        return hostname || '';
      } catch (e) {
        return '';
      }
    }

    /** Returns Google S2 CDN URL for any href. */
    function getFaviconUrl(href) {
      const hostname = getHostname(href);
      if (!hostname) return '';
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
    }

    /**
     * Builds the inner HTML for a .tile-seal or .editor-link-seal element.
     * Priority:
     *  1. Cached base64 data URL from localStorage (instant, works offline, survives cache wipe)
     *  2. Google S2 CDN direct in <img> (instant, works online without CORS restrictions)
     *  3. Kanji seal fallback text on error
     */
    function buildTileIconHtml(url, seal, fallback) {
      const sealText = escapeHtml(seal || fallback || '★');
      const hostname = getHostname(url);
      if (!hostname) {
        return `<span class="tile-seal-text">${sealText}</span>`;
      }

      // Check localStorage first — if previously saved, works completely offline
      const cached = safeStorage.getItem(ICON_CACHE_PREFIX + hostname);
      const iconSrc = cached || getFaviconUrl(url);

      return `<img class="tile-icon-img"
          src="${escapeHtml(iconSrc)}"
          alt="${sealText}"
          loading="lazy"
          decoding="async"
          onerror="this.style.display='none';var s=this.nextElementSibling;if(s)s.style.display='';"
          onload="var s=this.nextElementSibling;if(s)s.style.display='none';"
        /><span class="tile-seal-text" style="display:none;">${sealText}</span>`;
    }

    const inFlightIconFetches = new Set();

    /**
     * Saves an icon to localStorage as a compact 32x32 base64 PNG data URL.
     * ONLY runs when there is an active internet connection.
     * Silent and non-blocking: never interferes with the visible <img> elements.
     */
    async function cacheIconForOffline(url) {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      const hostname = getHostname(url);
      if (!hostname) return;

      const key = ICON_CACHE_PREFIX + hostname;
      if (safeStorage.getItem(key)) return;
      if (inFlightIconFetches.has(hostname)) return;
      inFlightIconFetches.add(hostname);

      let blobUrl = null;
      let offCanvas = null;
      try {
        const resp = await fetch(`https://icon.horse/icon/${encodeURIComponent(hostname)}`, { mode: 'cors' });
        if (!resp.ok) return;
        const blob = await resp.blob();
        if (!blob || blob.size === 0) return;

        const img = new Image();
        blobUrl = URL.createObjectURL(blob);
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = blobUrl;
        });

        offCanvas = document.createElement('canvas');
        offCanvas.width = 32;
        offCanvas.height = 32;
        const ctx = offCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 32, 32);
        const compactDataUrl = offCanvas.toDataURL('image/png');

        safeStorage.setItem(key, compactDataUrl);

        // Update any live images on page for this domain that previously fell back to seal
        document.querySelectorAll(`img.tile-icon-img[src*="${hostname}"]`).forEach(el => {
          el.src = compactDataUrl;
          el.style.display = '';
          const fallback = el.nextElementSibling;
          if (fallback && fallback.classList.contains('tile-seal-text')) {
            fallback.style.display = 'none';
          }
        });
      } catch (e) {
      } finally {
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
        if (offCanvas) {
          offCanvas.width = 0;
          offCanvas.height = 0;
        }
        inFlightIconFetches.delete(hostname);
      }
    }

    /**
     * Syncs icon cache with active links — removes cached icons for domains no longer pinned.
     * Keeps localStorage permanently lean and trimmed to only active links.
     */
    function syncIconCache() {
      const activeDomains = new Set();
      currentLinks.forEach(sec => {
        (sec.items || []).forEach(item => {
          const host = getHostname(item.url);
          if (host) activeDomains.add(host);
        });
      });

      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(ICON_CACHE_PREFIX)) {
              const domain = k.slice(ICON_CACHE_PREFIX.length);
              if (!activeDomains.has(domain)) {
                keysToRemove.push(k);
              }
            }
          }
          keysToRemove.forEach(k => { safeStorage.removeItem(k); });
        }
      } catch (e) {}
    }

    /**
     * Iterates all links and caches their icons for offline use.
     * ONLY runs when online, debounced and rate-limited to avoid request bursts.
     */
    let iconSyncTimer = null;
    function syncAllIconsOffline() {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      if (iconSyncTimer) clearTimeout(iconSyncTimer);
      iconSyncTimer = setTimeout(async () => {
        const urls = [];
        currentLinks.forEach(sec => {
          (sec.items || []).forEach(item => {
            if (item.url) urls.push(item.url);
          });
        });
        for (const url of urls) {
          if (typeof navigator !== 'undefined' && navigator.onLine === false) break;
          try {
            await cacheIconForOffline(url);
          } catch (e) {}
          await new Promise(r => setTimeout(r, 120));
        }
      }, 350);
    }

    function getInitialLinks() {
      const custom = safeStorage.getItem('shinsekai-custom-links');
      if (custom) {
        try {
          const parsed = JSON.parse(custom);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].items) {
            return parsed;
          }
        } catch (e) {}
      }
      if (typeof window !== 'undefined' && window.SHINSEKAI_DEFAULT_LINKS) {
        return JSON.parse(JSON.stringify(window.SHINSEKAI_DEFAULT_LINKS));
      }
      return [];
    }

    let currentLinks = getInitialLinks();
    let currentActiveSector = 'anime';

    function switchSector(sectorName) {
      currentActiveSector = sectorName;
      const dynamicBlades = launcherTabsBar ? launcherTabsBar.querySelectorAll('.tab-blade') : [];
      const dynamicPanels = hologramDrawer ? hologramDrawer.querySelectorAll('.sector-panel') : [];

      dynamicBlades.forEach(blade => {
        blade.classList.toggle('active', blade.dataset.sector === sectorName);
      });

      dynamicPanels.forEach(panel => {
        panel.classList.toggle('active', panel.id === `sector-${sectorName}`);
      });

      if (bladeLauncher) {
        bladeLauncher.classList.add('open-active');
      }
    }

    function renderBladeLauncher(linksData) {
      if (!launcherTabsBar || !hologramDrawer || !linksData || !linksData.length) return;

      if (!linksData.some(s => s.id === currentActiveSector)) {
        currentActiveSector = linksData[0].id;
      }

      // Render Category Tab Blades
      launcherTabsBar.innerHTML = linksData.map(sec => `
        <button class="tab-blade ${sec.id === currentActiveSector ? 'active' : ''}" data-sector="${escapeHtml(sec.id)}">
          <span class="blade-index">${escapeHtml(sec.index)}</span>
          <span class="blade-kanji">${escapeHtml(sec.kanji)}</span>
          <div class="blade-meta">
            <span class="blade-main">${escapeHtml(sec.main)}</span>
            <span class="blade-sub">${escapeHtml(sec.sub)}</span>
          </div>
          <kbd class="tab-hotkey">${escapeHtml(sec.hotkey)}</kbd>
        </button>
      `).join('');

      // Render Sector Panels & Tiles
      hologramDrawer.innerHTML = linksData.map(sec => `
        <div class="sector-panel ${sec.id === currentActiveSector ? 'active' : ''}" id="sector-${escapeHtml(sec.id)}">
          <div class="sector-grid">
            ${sec.items.map(item => `
              <a href="${escapeHtml(sanitizeUrl(item.url))}" class="holo-tile" target="_blank" rel="noopener noreferrer">
                <span class="tile-seal">${buildTileIconHtml(item.url, item.seal, item.title.slice(0, 1))}</span>
                <div class="tile-info">
                  <span class="tile-title">${escapeHtml(item.title)}</span>
                  <span class="tile-sub">${escapeHtml(item.desc || '')}</span>
                </div>
                <span class="tile-arrow">↗</span>
              </a>
            `).join('')}
          </div>
        </div>
      `).join('');

    }

    if (launcherTabsBar) {
      const handleBladeActivation = (e) => {
        const blade = e.target.closest('.tab-blade');
        if (blade && blade.dataset.sector) {
          switchSector(blade.dataset.sector);
        }
      };
      launcherTabsBar.addEventListener('click', handleBladeActivation);
      launcherTabsBar.addEventListener('mouseover', handleBladeActivation);
    }

    if (bladeLauncher) {
      bladeLauncher.addEventListener('mouseleave', () => {
        if (!dockPinned) {
          bladeLauncher.classList.remove('open-active');
        }
      });
    }

    // Initialize blade launcher tiles from config
    renderBladeLauncher(currentLinks);

    /* ─── 8.1. LINK EDITOR MODAL CONTROLLER ─── */
    let activeEditorSectorId = 'anime';

    /**
     * Refreshes the live seal preview box in the editor form.
     * Shows the favicon from Google CDN if the URL is valid;
     * otherwise shows the kanji seal text or '印' as a placeholder.
     */
    function updateSealPreview(url, sealText) {
      if (!previewFaviconImg || !previewSealFallback) return;
      const hostname = getHostname(url);
      const displaySeal = sealText || '印';

      previewSealFallback.textContent = displaySeal;

      if (!hostname) {
        previewFaviconImg.style.display = 'none';
        previewFaviconImg.src = '';
        previewSealFallback.style.display = '';
        return;
      }

      const cached = safeStorage.getItem(ICON_CACHE_PREFIX + hostname);
      const faviconUrl = cached || getFaviconUrl(url);

      previewFaviconImg.src = faviconUrl;
      previewFaviconImg.alt = displaySeal;
      previewFaviconImg.style.display = '';
      previewSealFallback.style.display = 'none';

      previewFaviconImg.onerror = () => {
        previewFaviconImg.style.display = 'none';
        previewSealFallback.style.display = '';
      };
      previewFaviconImg.onload = () => {
        previewFaviconImg.style.display = '';
        previewSealFallback.style.display = 'none';
        if (!cached) cacheIconForOffline(url);
      };
    }

    function resetEditorForm() {
      if (editLinkIndex) editLinkIndex.value = '-1';
      if (addLinkTitle) addLinkTitle.value = '';
      if (addLinkUrl) addLinkUrl.value = '';
      if (addLinkDesc) addLinkDesc.value = '';
      if (addLinkSeal) addLinkSeal.value = '';
      // Reset seal preview to blank state
      updateSealPreview('', '');
      if (addLinkBtn) {
        addLinkBtn.textContent = '追加 / ADD';
        addLinkBtn.classList.remove('editor-btn-accent');
        addLinkBtn.classList.add('editor-btn-primary');
      }
      if (cancelEditBtn) cancelEditBtn.style.display = 'none';
      if (editorFormHeading) editorFormHeading.textContent = '＋ 新規リンク追加 / ADD NEW LINK';
      if (editorLinksList) {
        editorLinksList.querySelectorAll('.editor-link-card').forEach(card => {
          card.classList.remove('editing-active');
        });
      }
    }

    function openLinkEditor() {
      if (!linkEditorModal) return;
      linkEditorModal.classList.add('open');
      linkEditorModal.setAttribute('aria-hidden', 'false');
      pauseAllEngines();
      renderEditorModal();
    }

    function closeLinkEditor() {
      if (!linkEditorModal) return;
      linkEditorModal.classList.remove('open');
      linkEditorModal.setAttribute('aria-hidden', 'true');
      resetEditorForm();
      resumeAllEngines();
    }

    function saveLinks() {
      safeStorage.setItem('shinsekai-custom-links', JSON.stringify(currentLinks));
      syncIconCache();
      syncAllIconsOffline();
    }

    function renderEditorModal() {
      if (!editorTabsBar || !editorLinksList || !currentLinks.length) return;

      if (!currentLinks.some(s => s.id === activeEditorSectorId)) {
        activeEditorSectorId = currentLinks[0].id;
      }

      // Render Category Selector Tabs in Modal with dual JP/EN labels
      editorTabsBar.innerHTML = currentLinks.map(sec => `
        <button class="editor-tab-btn ${sec.id === activeEditorSectorId ? 'active' : ''}" data-sector="${escapeHtml(sec.id)}">
          <span class="editor-tab-kanji">${escapeHtml(sec.kanji)}</span>
          <div class="editor-tab-text">
            <span class="editor-tab-main">${escapeHtml(sec.main)}</span>
            <span class="editor-tab-sub">${escapeHtml(sec.sub || sec.id.toUpperCase())}</span>
          </div>
        </button>
      `).join('');

      // Render Link Cards in Active Sector
      const currentSec = currentLinks.find(s => s.id === activeEditorSectorId) || currentLinks[0];
      if (!currentSec || !currentSec.items || currentSec.items.length === 0) {
        editorLinksList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.82rem; padding: 2rem; text-align: center; grid-column: 1 / -1;">リンクが登録されていません (No links registered in this sector)</div>';
        return;
      }

      const currentEditingIdx = editLinkIndex ? parseInt(editLinkIndex.value, 10) : -1;

      editorLinksList.innerHTML = currentSec.items.map((item, idx) => `
        <div class="editor-link-card ${idx === currentEditingIdx ? 'editing-active' : ''}" data-idx="${idx}">
          <div class="editor-link-main">
            <span class="editor-link-seal">${buildTileIconHtml(item.url, item.seal, item.title ? item.title.slice(0, 1) : '★')}</span>
            <div class="editor-link-info">
              <span class="editor-link-title">${escapeHtml(item.title)}</span>
              <span class="editor-link-sub">${escapeHtml(item.desc || item.url)}</span>
            </div>
          </div>
          <div class="editor-link-actions">
            <a href="${escapeHtml(sanitizeUrl(item.url))}" target="_blank" rel="noopener noreferrer" class="editor-btn editor-btn-ghost" style="text-decoration:none; padding: 0.28rem 0.55rem; font-size: 0.68rem;" title="リンク先を開く / Open link">開く ↗</a>
            <button type="button" class="editor-edit-btn" data-idx="${idx}" title="このリンクを編集 / Edit this link">✏️ 編集 / EDIT</button>
            <button type="button" class="editor-del-btn" data-idx="${idx}" title="このリンクを削除 / Delete this link">🗑️ 削除 / DEL</button>
          </div>
        </div>
      `).join('');
    }

    // High-performance single-point event delegation for editor tabs & link cards
    if (editorTabsBar) {
      editorTabsBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.editor-tab-btn');
        if (btn && btn.dataset.sector && activeEditorSectorId !== btn.dataset.sector) {
          activeEditorSectorId = btn.dataset.sector;
          resetEditorForm();
          renderEditorModal();
        }
      });
    }

    if (editorLinksList) {
      editorLinksList.addEventListener('click', (e) => {
        const currentSec = currentLinks.find(s => s.id === activeEditorSectorId) || currentLinks[0];
        if (!currentSec || !currentSec.items) return;

        const editBtn = e.target.closest('.editor-edit-btn');
        if (editBtn) {
          const idx = parseInt(editBtn.dataset.idx, 10);
          const item = currentSec.items[idx];
          if (!item) return;

          if (editLinkIndex) editLinkIndex.value = String(idx);
          if (addLinkTitle) addLinkTitle.value = item.title || '';
          if (addLinkUrl) addLinkUrl.value = item.url || '';
          if (addLinkDesc) addLinkDesc.value = item.desc || '';
          if (addLinkSeal) addLinkSeal.value = item.seal || '';

          updateSealPreview(item.url || '', item.seal || '');

          if (addLinkBtn) {
            addLinkBtn.textContent = '✓ 更新 / UPDATE';
            addLinkBtn.classList.remove('editor-btn-primary');
            addLinkBtn.classList.add('editor-btn-accent');
          }
          if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block';
          if (editorFormHeading) {
            editorFormHeading.textContent = `✏️ リンク情報更新 / EDIT LINK: ${item.title}`;
          }

          editorLinksList.querySelectorAll('.editor-link-card').forEach(c => c.classList.remove('editing-active'));
          const card = editorLinksList.querySelector(`.editor-link-card[data-idx="${idx}"]`);
          if (card) card.classList.add('editing-active');

          if (addLinkTitle) {
            addLinkTitle.focus();
            addLinkTitle.select();
          }
          return;
        }

        const delBtn = e.target.closest('.editor-del-btn');
        if (delBtn) {
          const idx = parseInt(delBtn.dataset.idx, 10);
          const editingIdx = editLinkIndex ? parseInt(editLinkIndex.value, 10) : -1;
          currentSec.items.splice(idx, 1);
          saveLinks();
          if (editingIdx === idx) {
            resetEditorForm();
          } else if (editingIdx > idx && editLinkIndex) {
            editLinkIndex.value = String(editingIdx - 1);
          }
          renderEditorModal();
          renderBladeLauncher(currentLinks);
          return;
        }
      });
    }

    if (editLinksBtn) editLinksBtn.addEventListener('click', openLinkEditor);
    if (editorCloseBtn) editorCloseBtn.addEventListener('click', closeLinkEditor);
    if (editorDoneBtn) editorDoneBtn.addEventListener('click', closeLinkEditor);

    if (linkEditorModal) {
      linkEditorModal.addEventListener('click', (e) => {
        if (e.target === linkEditorModal) {
          closeLinkEditor();
        }
      });
    }

    if (addLinkBtn) {
      addLinkBtn.addEventListener('click', () => {
        const title = (addLinkTitle ? addLinkTitle.value : '').trim();
        let url = (addLinkUrl ? addLinkUrl.value : '').trim();
        const desc = (addLinkDesc ? addLinkDesc.value : '').trim();
        let seal = (addLinkSeal ? addLinkSeal.value : '').trim();

        if (!title || !url) {
          alert('サイト名とURLを入力してください (Please enter title and URL)');
          return;
        }

        url = sanitizeUrl(url);
        if (url === '#') {
          alert('安全な有効URLを入力してください (Please enter a valid HTTP/HTTPS URL)');
          return;
        }

        if (!seal) {
          seal = title.slice(0, 1);
        }

        const currentSec = currentLinks.find(s => s.id === activeEditorSectorId) || currentLinks[0];
        if (currentSec) {
          const editingIdx = editLinkIndex ? parseInt(editLinkIndex.value, 10) : -1;
          if (editingIdx >= 0 && editingIdx < currentSec.items.length) {
            // Update existing link
            currentSec.items[editingIdx] = { title, url, desc, seal };
          } else {
            // Add new link
            currentSec.items.push({ title, url, desc, seal });
          }
          saveLinks();
          resetEditorForm();
          renderEditorModal();
          renderBladeLauncher(currentLinks);
        }
      });
    }

    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => {
        resetEditorForm();
      });
    }

    [addLinkTitle, addLinkUrl, addLinkDesc, addLinkSeal].forEach(inputEl => {
      if (inputEl) {
        inputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (addLinkBtn) addLinkBtn.click();
          } else if (e.key === 'Escape') {
            resetEditorForm();
          }
        });
      }
    });

    // Live seal/icon preview: update whenever the URL or seal field changes
    if (addLinkUrl) {
      addLinkUrl.addEventListener('input', () => {
        updateSealPreview(addLinkUrl.value, addLinkSeal ? addLinkSeal.value : '');
      });
    }
    if (addLinkSeal) {
      addLinkSeal.addEventListener('input', () => {
        updateSealPreview(addLinkUrl ? addLinkUrl.value : '', addLinkSeal.value);
      });
    }

    if (editorExportBtn) {
      editorExportBtn.addEventListener('click', () => {
        const fullProfile = {
          version: 'shinsekai-v2',
          exportedAt: new Date().toISOString(),
          operator: {
            name: currentOperatorName,
            honorific: currentOperatorHonorific
          },
          settings: {
            theme: currentThemeKey,
            customThemeColor: safeStorage.getItem('shinsekai-custom-theme-color') || '#a6e3a1',
            scene: (scenes && scenes[currentSceneIdx]) ? scenes[currentSceneIdx].key : 'crimson',
            wallpaperMode: currentWallpaperMode,
            activeWallpaper: activeWallpaper,
            customWallpaperUrl: safeStorage.getItem('shinsekai-custom-wallpaper-url') || null,
            ultra: safeStorage.getItem('shinsekai-ultra') === 'true',
            tier: currentTier,
            grain: grainActive,
            particles: particlesActive,
            dockPinned: dockPinned
          },
          links: currentLinks
        };
        const blob = new Blob([JSON.stringify(fullProfile, null, 2)], { type: 'application/json' });
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dlUrl;
        a.download = `shinsekai-profile-${(currentOperatorName || 'pilot').toLowerCase()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(dlUrl), 1000);
      });
    }

    if (editorImportBtn && editorImportFile) {
      editorImportBtn.addEventListener('click', () => {
        editorImportFile.click();
      });

      editorImportFile.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const parsed = JSON.parse(evt.target.result);
            const rawLinks = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.links) ? parsed.links : null);
            if (rawLinks && rawLinks.length > 0) {
              const validData = rawLinks
                .filter(sec => sec && typeof sec === 'object' && Array.isArray(sec.items))
                .map((sec, sIdx) => ({
                  id: String(sec.id || `sector-${sIdx}`).trim(),
                  index: String(sec.index || String(sIdx + 1).padStart(2, '0')).trim(),
                  kanji: String(sec.kanji || '印').trim().slice(0, 2),
                  main: String(sec.main || 'カテゴリ').trim(),
                  sub: String(sec.sub || '').trim(),
                  hotkey: String(sec.hotkey || String(sIdx + 1)).trim(),
                  items: (sec.items || [])
                    .filter(item => item && (item.title || item.url))
                    .map(item => ({
                      title: String(item.title || 'Bookmark').trim(),
                      url: sanitizeUrl(item.url),
                      desc: String(item.desc || '').trim(),
                      seal: String(item.seal || (item.title ? item.title.slice(0, 1) : '★')).trim().slice(0, 2)
                    }))
                }));

              if (validData.length > 0) {
                currentLinks = validData;
                saveLinks();

                // Restore operator & station settings if unified profile format was imported
                if (parsed.operator && typeof parsed.operator === 'object') {
                  if (parsed.operator.name) {
                    currentOperatorName = String(parsed.operator.name).trim() || 'MIMOGU';
                    safeStorage.setItem('shinsekai-operator-name', currentOperatorName);
                  }
                  if (parsed.operator.honorific !== undefined && parsed.operator.honorific !== null) {
                    currentOperatorHonorific = String(parsed.operator.honorific).trim();
                    safeStorage.setItem('shinsekai-operator-honorific', currentOperatorHonorific);
                  }
                  updateOperatorPill();
                  refreshThemeBootLore();
                  updateOperatorPreview();
                }

                if (parsed.settings && typeof parsed.settings === 'object') {
                  if (parsed.settings.customThemeColor && /^#[0-9a-fA-F]{6}$/.test(parsed.settings.customThemeColor)) {
                    safeStorage.setItem('shinsekai-custom-theme-color', parsed.settings.customThemeColor);
                  }
                  if (parsed.settings.tier) applyTierPreset(parsed.settings.tier);
                  if (parsed.settings.theme) {
                    if (parsed.settings.theme === 'custom') {
                      applyCustomTheme(parsed.settings.customThemeColor || safeStorage.getItem('shinsekai-custom-theme-color') || '#a6e3a1');
                    } else {
                      applyTheme(parsed.settings.theme);
                    }
                  }
                  if (parsed.settings.activeWallpaper && typeof parsed.settings.activeWallpaper === 'object') {
                    safeStorage.setItem('shinsekai-active-wallpaper', JSON.stringify(parsed.settings.activeWallpaper));
                    initActiveWallpaper();
                  } else {
                    if (parsed.settings.wallpaperMode) setWallpaperMode(parsed.settings.wallpaperMode);
                    if (parsed.settings.customWallpaperUrl) {
                      safeStorage.setItem('shinsekai-custom-wallpaper-url', parsed.settings.customWallpaperUrl);
                      if (parsed.settings.wallpaperMode === 'static') applyStaticWallpaper(parsed.settings.customWallpaperUrl);
                    }
                    if (parsed.settings.scene) applyScene(parsed.settings.scene, parsed.settings.ultra === true);
                  }
                  if (typeof parsed.settings.grain === 'boolean') setGrain(parsed.settings.grain);
                  if (typeof parsed.settings.particles === 'boolean') setParticles(parsed.settings.particles);
                  if (typeof parsed.settings.dockPinned === 'boolean') setDockPinned(parsed.settings.dockPinned);
                }

                resetEditorForm();
                renderEditorModal();
                renderBladeLauncher(currentLinks);
              } else {
                alert('無効な設定ファイル形式です (Invalid format: missing sectors or items)');
              }
            } else {
              alert('無効な設定ファイル形式です (Invalid format: missing sectors or items)');
            }
          } catch (err) {
            alert('JSONの解析に失敗しました (Failed to parse JSON file)');
          }
        };
        reader.readAsText(file);
        editorImportFile.value = '';
      });
    }

    if (editorResetBtn) {
      editorResetBtn.addEventListener('click', () => {
        if (confirm('ピン留めリンクを初期状態に戻しますか？ (Reset links to original preset?)')) {
          safeStorage.removeItem('shinsekai-custom-links');
          if (typeof window !== 'undefined' && window.SHINSEKAI_DEFAULT_LINKS) {
            currentLinks = JSON.parse(JSON.stringify(window.SHINSEKAI_DEFAULT_LINKS));
          }
          saveLinks();
          resetEditorForm();
          renderEditorModal();
          renderBladeLauncher(currentLinks);
        }
      });
    }

    /* ─── 8.5. OPERATOR IDENTITY & NAME SETTINGS MODAL ─── */
    function updateOperatorPreview(tempName, tempHon) {
      const name = tempName !== undefined ? tempName : (operatorNameInput ? operatorNameInput.value : currentOperatorName);
      let honorific = tempHon;
      if (honorific === undefined) {
        const activeChip = document.querySelector('#honorific-chips .honorific-chip.active');
        if (activeChip) {
          const val = activeChip.dataset.honorific;
          if (val === 'custom') {
            honorific = operatorCustomHonorific ? operatorCustomHonorific.value : '';
          } else {
            honorific = val;
          }
        } else {
          honorific = currentOperatorHonorific;
        }
      }

      const formatted = getOperatorFormattedName(name, honorific);
      if (previewLineAuth) previewLineAuth.textContent = `INIT_CORE: ${formatted} AUTHENTICATED`;
      if (previewLineStep) previewLineStep.textContent = `${formatted} AUTHENTICATED // DEPLOYING INTERFACE...`;
      if (previewLineWelcome) previewLineWelcome.textContent = `新世界 起動完了 // WELCOME ${formatted}`;
      if (previewLineMatrix) {
        const activeTheme = (themes && themes[currentThemeIdx]) ? themes[currentThemeIdx].key.toUpperCase() : 'CRIMSON';
        previewLineMatrix.textContent = `SYNCHRONIZING ${activeTheme} FLAME MATRIX // ${formatted}`;
      }
    }

    function openOperatorModal() {
      if (!operatorModal) return;
      if (linkEditorModal && linkEditorModal.classList.contains('open')) {
        closeLinkEditor();
      }
      operatorModal.classList.add('open');
      operatorModal.setAttribute('aria-hidden', 'false');
      pauseAllEngines();

      if (operatorNameInput) {
        operatorNameInput.value = currentOperatorName;
      }

      let matched = false;
      honorificChips.forEach(chip => {
        const h = chip.dataset.honorific;
        if (h === currentOperatorHonorific) {
          chip.classList.add('active');
          matched = true;
        } else {
          chip.classList.remove('active');
        }
      });

      if (!matched && currentOperatorHonorific !== null && currentOperatorHonorific !== undefined) {
        honorificChips.forEach(chip => {
          chip.classList.toggle('active', chip.dataset.honorific === 'custom');
        });
        if (customHonorificWrap) customHonorificWrap.style.display = 'block';
        if (operatorCustomHonorific) operatorCustomHonorific.value = currentOperatorHonorific;
      } else {
        if (customHonorificWrap) customHonorificWrap.style.display = 'none';
      }

      updateOperatorPreview();
      if (operatorSaveStatus) operatorSaveStatus.textContent = '';
      if (operatorNameInput) {
        setTimeout(() => {
          operatorNameInput.focus();
          operatorNameInput.select();
        }, 80);
      }
    }

    function closeOperatorModal() {
      if (!operatorModal) return;
      operatorModal.classList.remove('open');
      operatorModal.setAttribute('aria-hidden', 'true');
      resumeAllEngines();
    }

    function saveOperatorSettings() {
      const newName = (operatorNameInput ? operatorNameInput.value : '').trim() || 'MIMOGU';
      let newHonorific = '-SAMA';
      const activeChip = document.querySelector('#honorific-chips .honorific-chip.active');
      if (activeChip) {
        const val = activeChip.dataset.honorific;
        if (val === 'custom') {
          newHonorific = (operatorCustomHonorific ? operatorCustomHonorific.value : '').trim();
        } else {
          newHonorific = val;
        }
      }

      currentOperatorName = newName;
      currentOperatorHonorific = newHonorific;

      safeStorage.setItem('shinsekai-operator-name', currentOperatorName);
      safeStorage.setItem('shinsekai-operator-honorific', currentOperatorHonorific);

      updateOperatorPill();
      refreshThemeBootLore();
      updateOperatorPreview();

      if (operatorSaveStatus) {
        operatorSaveStatus.textContent = '✓ 構成反映完了 / SAVED & APPLIED!';
        operatorSaveStatus.style.color = 'var(--accent)';
        setTimeout(() => {
          if (operatorSaveStatus) operatorSaveStatus.textContent = '';
        }, 3000);
      }
    }

    function resetOperatorSettings() {
      currentOperatorName = 'MIMOGU';
      currentOperatorHonorific = '-SAMA';
      safeStorage.removeItem('shinsekai-operator-name');
      safeStorage.removeItem('shinsekai-operator-honorific');

      if (operatorNameInput) operatorNameInput.value = 'MIMOGU';
      honorificChips.forEach(chip => {
        chip.classList.toggle('active', chip.dataset.honorific === '-SAMA');
      });
      if (customHonorificWrap) customHonorificWrap.style.display = 'none';
      if (operatorCustomHonorific) operatorCustomHonorific.value = '';

      updateOperatorPill();
      refreshThemeBootLore();
      updateOperatorPreview();

      if (operatorSaveStatus) {
        operatorSaveStatus.textContent = '↺ 初期値に戻しました / RESTORED DEFAULT';
        operatorSaveStatus.style.color = 'var(--text-muted)';
        setTimeout(() => {
          if (operatorSaveStatus) operatorSaveStatus.textContent = '';
        }, 3000);
      }
    }

    if (operatorBtn) {
      operatorBtn.addEventListener('click', openOperatorModal);
    }
    if (operatorCloseBtn) {
      operatorCloseBtn.addEventListener('click', closeOperatorModal);
    }
    if (operatorDoneBtn) {
      operatorDoneBtn.addEventListener('click', closeOperatorModal);
    }
    if (operatorSaveBtn) {
      operatorSaveBtn.addEventListener('click', saveOperatorSettings);
    }
    if (operatorResetBtn) {
      operatorResetBtn.addEventListener('click', resetOperatorSettings);
    }

    if (operatorModal) {
      operatorModal.addEventListener('click', (e) => {
        if (e.target === operatorModal) {
          closeOperatorModal();
        }
      });
    }

    if (operatorNameInput) {
      operatorNameInput.addEventListener('input', () => {
        updateOperatorPreview();
      });
      operatorNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          saveOperatorSettings();
        }
      });
    }

    honorificChips.forEach(chip => {
      chip.addEventListener('click', () => {
        honorificChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const isCustom = chip.dataset.honorific === 'custom';
        if (customHonorificWrap) {
          customHonorificWrap.style.display = isCustom ? 'block' : 'none';
          if (isCustom && operatorCustomHonorific) {
            operatorCustomHonorific.focus();
          }
        }
        updateOperatorPreview();
      });
    });

    if (operatorCustomHonorific) {
      operatorCustomHonorific.addEventListener('input', () => {
        updateOperatorPreview();
      });
      operatorCustomHonorific.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          saveOperatorSettings();
        }
      });
    }

    // Modal navigation cross-links
    if (navToLinksBtn) {
      navToLinksBtn.addEventListener('click', () => {
        closeOperatorModal();
        openLinkEditor();
      });
    }
    if (linkModalNavToOperator) {
      linkModalNavToOperator.addEventListener('click', () => {
        closeLinkEditor();
        openOperatorModal();
      });
    }

    /* ─── SHORTCUTS HELP MODAL CONTROLLER ─── */
    function openShortcutsModal() {
      if (!shortcutsModal) return;
      if (linkEditorModal && linkEditorModal.classList.contains('open')) closeLinkEditor();
      if (operatorModal && operatorModal.classList.contains('open')) closeOperatorModal();
      shortcutsModal.classList.add('open');
      shortcutsModal.setAttribute('aria-hidden', 'false');
      pauseAllEngines();
    }

    function closeShortcutsModal() {
      if (!shortcutsModal) return;
      shortcutsModal.classList.remove('open');
      shortcutsModal.setAttribute('aria-hidden', 'true');
      resumeAllEngines();
    }

    if (shortcutsBtn) shortcutsBtn.addEventListener('click', openShortcutsModal);
    if (shortcutsCloseBtn) shortcutsCloseBtn.addEventListener('click', closeShortcutsModal);
    if (shortcutsDoneBtn) shortcutsDoneBtn.addEventListener('click', closeShortcutsModal);

    if (shortcutsModal) {
      shortcutsModal.addEventListener('click', (e) => {
        if (e.target === shortcutsModal) {
          closeShortcutsModal();
        }
      });
    }

    /* ─── 9. COMMAND SEARCH BAR & BANG LOGIC ─── */
    const searchEngines = {
      google: 'https://www.google.com/search?q=',
      duckduckgo: 'https://duckduckgo.com/?q=',
      youtube: 'https://www.youtube.com/results?search_query=',
      anilist: 'https://anilist.co/search/anime?search=',
      github: 'https://github.com/search?q=',
      reddit: 'https://www.reddit.com/search/?q=',
      wikipedia: 'https://en.wikipedia.org/wiki/Special:Search?search='
    };

    if (commandInput) {
      function checkBangs(val) {
        const trimmed = (val || '').trim();
        const firstToken = trimmed.split(/\s+/)[0].toLowerCase();
        bangChips.forEach(chip => {
          const bang = (chip.dataset.bang || '').toLowerCase();
          chip.classList.toggle('active', Boolean(bang && firstToken === bang));
        });
      }

      commandInput.addEventListener('input', (e) => {
        checkBangs(e.target.value);
      });

      bangChips.forEach(chip => {
        chip.addEventListener('click', () => {
          const prefix = chip.dataset.bang + ' ';
          commandInput.value = prefix;
          checkBangs(prefix);
          commandInput.focus();
        });
      });

      commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          commandInput.blur();
          return;
        }

        if (e.key === 'Enter') {
          const query = commandInput.value.trim();
          if (!query) return;

          const lowerQuery = query.toLowerCase();
          if (lowerQuery === ':user' || lowerQuery === ':settings' || lowerQuery === '!user' || lowerQuery === '!settings' || lowerQuery === '/user' || lowerQuery === '/settings') {
            commandInput.value = '';
            commandInput.blur();
            openOperatorModal();
            return;
          } else if (lowerQuery.startsWith(':user ') || lowerQuery.startsWith(':name ') || lowerQuery.startsWith('/user ') || lowerQuery.startsWith('/name ')) {
            const spaceIdx = query.indexOf(' ');
            const rawName = query.slice(spaceIdx + 1).trim();
            if (rawName) {
              currentOperatorName = rawName;
              safeStorage.setItem('shinsekai-operator-name', currentOperatorName);
              updateOperatorPill();
              refreshThemeBootLore();
              commandInput.value = '';
              commandInput.blur();
              openOperatorModal();
              return;
            }
          }

          if (lowerQuery === '!gh' || lowerQuery.startsWith('!gh ')) {
            const term = query.slice(3).trim();
            window.location.href = term ? searchEngines.github + encodeURIComponent(term) : 'https://github.com';
          } else if (lowerQuery === '!y' || lowerQuery.startsWith('!y ')) {
            const term = query.slice(2).trim();
            window.location.href = term ? searchEngines.youtube + encodeURIComponent(term) : 'https://www.youtube.com';
          } else if (lowerQuery === '!a' || lowerQuery.startsWith('!a ')) {
            const term = query.slice(2).trim();
            window.location.href = term ? searchEngines.anilist + encodeURIComponent(term) : 'https://anilist.co';
          } else if (lowerQuery === '!r' || lowerQuery.startsWith('!r ')) {
            const term = query.slice(2).trim();
            window.location.href = term ? searchEngines.reddit + encodeURIComponent(term) : 'https://www.reddit.com';
          } else if (lowerQuery === '!d' || lowerQuery.startsWith('!d ')) {
            const term = query.slice(2).trim();
            window.location.href = term ? searchEngines.duckduckgo + encodeURIComponent(term) : 'https://duckduckgo.com';
          } else if (lowerQuery === '!g' || lowerQuery.startsWith('!g ')) {
            const term = query.slice(2).trim();
            window.location.href = term ? searchEngines.google + encodeURIComponent(term) : 'https://www.google.com';
          } else if (lowerQuery === '!w' || lowerQuery.startsWith('!w ')) {
            const term = query.slice(2).trim();
            window.location.href = term ? searchEngines.wikipedia + encodeURIComponent(term) : 'https://en.wikipedia.org';
          } else if (/^https?:\/\//i.test(query) || (query.includes('.') && !query.includes(' '))) {
            const dest = query.startsWith('http') ? query : 'https://' + query;
            const safe = sanitizeUrl(dest);
            window.location.href = safe !== '#' ? safe : (searchEngines.google + encodeURIComponent(query));
          } else {
            window.location.href = searchEngines.google + encodeURIComponent(query);
          }
        }
      });
    }

    /* ─── 10. ANIME MECHA SYSTEM BOOT & ANDROID VOICE ─── */
    let hasPlayedWelcome = false;
    let cleanupVoiceListeners = null;

    function playWelcomeVoice() {
      if (!welcomeAudio) return;
      welcomeAudio.currentTime = 0;
      welcomeAudio.volume = 0.95;

      const playPromise = welcomeAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          hasPlayedWelcome = true;
          if (cleanupVoiceListeners) cleanupVoiceListeners();
        }).catch(() => {
          if (hasPlayedWelcome) return;
          const resumeOnInteract = () => {
            if (!hasPlayedWelcome) {
              welcomeAudio.currentTime = 0;
              welcomeAudio.play().then(() => {
                hasPlayedWelcome = true;
                if (cleanupVoiceListeners) cleanupVoiceListeners();
              }).catch(() => {});
            }
          };
          window.addEventListener('pointerdown', resumeOnInteract, { once: true });
          window.addEventListener('keydown', resumeOnInteract, { once: true });
          window.addEventListener('focus', resumeOnInteract, { once: true });
          cleanupVoiceListeners = () => {
            window.removeEventListener('pointerdown', resumeOnInteract);
            window.removeEventListener('keydown', resumeOnInteract);
            window.removeEventListener('focus', resumeOnInteract);
          };
        });
      }
    }

    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        playWelcomeVoice();
      });
    }

    function executeBootSequence(onDone) {
      let overlay = document.getElementById('boot-overlay');
      const activeThemeKey = paramTheme || safeStorage.getItem('shinsekai-theme') || 'crimson';
      currentThemeKey = activeThemeKey;
      document.documentElement.setAttribute('data-theme', activeThemeKey);
      document.body.setAttribute('data-theme', activeThemeKey);

      refreshThemeBootLore();
      const lore = themeBootLore[activeThemeKey] || themeBootLore.crimson;
      const formatted = getOperatorFormattedName();

      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'mecha-boot-overlay';
        overlay.id = 'boot-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML = `
          <div class="boot-matrix-grid"></div>
          <div class="boot-scanner-laser"></div>
          <div class="boot-terminal-card">
            <div class="boot-card-header">
              <span class="boot-pill" id="boot-pill">${escapeHtml(lore.tag)}</span>
              <span class="boot-code">SYS.AUTH.OK</span>
            </div>
            <div class="boot-title-row">
              <span class="boot-kanji" id="boot-kanji">${escapeHtml(lore.kanji)}</span>
              <span class="boot-sub" id="boot-sub">${escapeHtml(lore.sub)}</span>
            </div>
            <div class="boot-progress-deck">
              <div class="boot-bar-track">
                <div class="boot-bar-fill" id="boot-progress-bar"></div>
              </div>
              <div class="boot-meta-row">
                <span class="boot-log-text" id="boot-log">INIT_CORE: ${escapeHtml(formatted)} AUTHENTICATED</span>
                <span class="boot-pct" id="boot-pct">0%</span>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);
      }

      const pBar = overlay.querySelector('#boot-progress-bar');
      const pPct = overlay.querySelector('#boot-pct');
      const pLog = overlay.querySelector('#boot-log');
      const pill = overlay.querySelector('#boot-pill');
      const kanji = overlay.querySelector('#boot-kanji');
      const sub = overlay.querySelector('#boot-sub');

      if (pill) pill.textContent = lore.tag;
      if (kanji) kanji.textContent = lore.kanji;
      if (sub) sub.textContent = lore.sub;

      const skipBoot = urlParams && (urlParams.get('noboot') === '1' || urlParams.get('noboot') === 'true');
      if (skipBoot) {
        overlay.classList.add('boot-completed');
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        document.body.classList.remove('booting');
        document.body.classList.add('boot-ready');
        if (urlParams && urlParams.get('menu') === 'scene' && scenePopover) {
          scenePopover.classList.add('open');
        } else if (urlParams && urlParams.get('menu') === 'theme' && themePopover) {
          themePopover.classList.add('open');
        } else if (urlParams && (urlParams.get('menu') === 'operator' || urlParams.get('menu') === 'user')) {
          openOperatorModal();
        } else if (urlParams && (urlParams.get('menu') === 'links' || urlParams.get('menu') === 'edit')) {
          openLinkEditor();
        } else if (urlParams && (urlParams.get('menu') === 'shortcuts' || urlParams.get('menu') === 'help')) {
          openShortcutsModal();
        }
        playWelcomeVoice();
        if (typeof onDone === 'function') onDone();
        return;
      }

      document.body.classList.remove('boot-ready', 'boot-active');
      document.body.classList.add('booting');

      const bootDuration = 1500; // Exact 1.5 seconds
      let startTime = null;

      const bootSteps = [
        { pct: 25, log: '[BOOT 01/04] INITIALIZING SYSTEM KERNEL & CACHYOS LINUX CORE...' },
        { pct: 55, log: '[BOOT 02/04] COMPILING ANIME MECHA SHADERS & GPU COGNITIVE MATRIX...' },
        { pct: 85, log: lore.step },
        { pct: 99, log: `[BOOT 04/04] ${formatted} AUTHENTICATED // DEPLOYING INTERFACE...` },
        { pct: 100, log: `新世界 起動完了 // WELCOME ${formatted}` }
      ];

      function updateBoot(timestamp) {
        const now = timestamp || performance.now();
        if (startTime === null) {
          startTime = now;
        }

        const elapsed = now - startTime;
        const progress = Math.min(100, Math.floor((elapsed / bootDuration) * 100));

        if (pBar) pBar.style.width = `${progress}%`;
        if (pPct) pPct.textContent = `${progress}%`;

        const step = bootSteps.find(s => progress <= s.pct) || bootSteps[bootSteps.length - 1];
        if (pLog && step) pLog.textContent = step.log;

        if (elapsed < bootDuration) {
          requestAnimationFrame(updateBoot);
        } else {
          // Exactly at 1.5 seconds: loading has finished!
          if (pBar) pBar.style.width = '100%';
          if (pPct) pPct.textContent = '100%';
          if (pLog) pLog.textContent = `新世界 起動完了 // WELCOME ${formatted}`;

          // Play the female android voice the moment loading is finished!
          playWelcomeVoice();

          setTimeout(() => {
            overlay.classList.add('boot-completed');
            document.body.classList.remove('booting');
            document.body.classList.add('boot-active');
            setTimeout(() => {
              document.body.classList.add('boot-ready');
              document.body.classList.remove('boot-active');
              // Free boot DOM tree and internal laser/matrix shaders completely from memory
              if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
              }
              if (typeof onDone === 'function') onDone();
            }, 600);
          }, 350);
        }
      }

      requestAnimationFrame(updateBoot);
    }

    if (testBootBtn) {
      testBootBtn.addEventListener('click', () => {
        saveOperatorSettings();
        closeOperatorModal();
        executeBootSequence();
      });
    }

    // Trigger 1.5-second theme-customized boot sequence on startup
    executeBootSequence();

    /* ─── 11. GLOBAL CLICK & SHORTCUT HANDLERS ─── */
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown-wrapper')) {
        if (themePopover) themePopover.classList.remove('open');
        if (scenePopover) scenePopover.classList.remove('open');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        if (e.key === 'Escape') {
          document.activeElement.blur();
          if (shortcutsModal && shortcutsModal.classList.contains('open')) {
            closeShortcutsModal();
          }
          if (operatorModal && operatorModal.classList.contains('open')) {
            closeOperatorModal();
          }
          if (linkEditorModal && linkEditorModal.classList.contains('open')) {
            closeLinkEditor();
          }
        }
        return;
      }

      // Never intercept browser hotkeys (Ctrl+W, Ctrl+T, Alt+Tab, etc.) or IME composition
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) {
        return;
      }

      const key = e.key.toLowerCase();

      if (e.key === '/') {
        e.preventDefault();
        if (commandInput) {
          commandInput.focus();
          commandInput.select();
        }
      } else if (key === 't') {
        cycleTheme();
      } else if (key === 'w' || key === 's') {
        cycleScene();
      } else if (key === 'q') {
        cycleQuote();
      } else if (key === 'g') {
        setGrain(!grainActive);
      } else if (key === 'b' || key === 'a') {
        setParticles(!particlesActive);
      } else if (key === 'p') {
        setDockPinned(!dockPinned);
      } else if (key === 'v') {
        playWelcomeVoice();
      } else if (key === 'u' || key === 'o') {
        openOperatorModal();
      } else if (key === 'e') {
        openLinkEditor();
      } else if (key === 'c') {
        toggleClockFormat();
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        if (shortcutsModal && shortcutsModal.classList.contains('open')) {
          closeShortcutsModal();
        } else {
          openShortcutsModal();
        }
      } else if (e.key === 'Escape') {
        if (shortcutsModal && shortcutsModal.classList.contains('open')) {
          closeShortcutsModal();
          return;
        }
        if (operatorModal && operatorModal.classList.contains('open')) {
          closeOperatorModal();
          return;
        }
        if (linkEditorModal && linkEditorModal.classList.contains('open')) {
          closeLinkEditor();
          return;
        }
        if (commandInput) commandInput.blur();
        if (themePopover) themePopover.classList.remove('open');
        if (scenePopover) scenePopover.classList.remove('open');
        if (bladeLauncher && !dockPinned) bladeLauncher.classList.remove('open-active');
      } else {
        const matchedSector = currentLinks.find(s => s && s.hotkey === key);
        if (matchedSector) {
          switchSector(matchedSector.id);
        }
      }
    });

    // Offline icon persistence: background sync ONLY when online and system is idle
    setTimeout(syncAllIconsOffline, 2500);
    window.addEventListener('online', syncAllIconsOffline);
    window.addEventListener('beforeunload', revokeCustomObjectUrl);

    /* ─── RUNTIME FPS WATCHDOG (auto-downgrade tier on sustained low FPS) ─── */
    (function fpsWatchdog() {
      let frames = 0, windowStart = performance.now(), badStreak = 0, downgraded = 0;
      function step(now) {
        frames++;
        if (now - windowStart >= 2000) {
          const fps = (frames * 1000) / (now - windowStart);
          frames = 0; windowStart = now;
          if (!document.hidden && !isAppSuspended && fps < 24) {
            badStreak++;
            if (badStreak >= 3 && downgraded === 0) { downgraded = 1; applyTierPreset('mid'); }
            else if (badStreak >= 5 && downgraded === 1) { downgraded = 2; applyScene('eco'); }
          } else { badStreak = 0; }
        }
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShinsekai);
  } else {
    initShinsekai();
  }
})();
