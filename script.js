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

    /* ─── 0. DOM ELEMENTS ─── */
    const bgVideo = document.getElementById('bg-video');
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
    const themeItems = document.querySelectorAll('#theme-popover .pop-item');

    const sceneBtn = document.getElementById('scene-btn');
    const sceneLabel = document.getElementById('scene-label');
    const scenePopover = document.getElementById('scene-popover');
    const sceneItems = document.querySelectorAll('#scene-popover .pop-item');

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

    let startCanvasAnim = () => {};
    let stopCanvasAnim = () => {};
    let refreshParticleColors = () => {};

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
        spawnParticles();
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
        }
      }

      function spawnParticles() {
        particles = [];
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        // Adaptive particle density based on device capability & screen size
        const isMobile = window.innerWidth < 768;
        const isLowEnd = typeof navigator !== 'undefined' && (
          (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
          (navigator.deviceMemory && navigator.deviceMemory <= 4)
        );
        const count = isMobile || isLowEnd ? 16 : 30;

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

      startAnimation();
    }

    initCanvas();

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

    /* ─── 4. VIDEO SCENE CONTROLLER ─── */
    const scenes = [
      { key: 'crimson',    label: '映像: 紅蓮',   labelEn: 'Crimson',    video: 'assets/animated/crimson.mp4' },
      { key: 'tokyonight', label: '映像: 東京夜', labelEn: 'TokyoNight', video: 'assets/animated/tokyonight.mp4' },
      { key: 'sakura',     label: '映像: 桜吹雪', labelEn: 'Sakura',     video: 'assets/animated/sakura.mp4' },
      { key: 'catppuccin', label: '映像: 終末谷', labelEn: 'Catppuccin', video: 'assets/animated/catppuccin.mp4' },
      { key: 'cyberpunk',  label: '映像: 電脳都市', labelEn: 'Cyberpunk',  video: 'assets/animated/cyberpunk.mp4' },
      { key: 'eco',        label: '省電力: 静止画', labelEn: 'Eco (Low RAM)', video: '' }
    ];

    const urlParams = (typeof window !== 'undefined' && window.location) ? new URLSearchParams(window.location.search) : null;
    const paramScene = urlParams ? urlParams.get('scene') : null;
    const paramTheme = urlParams ? urlParams.get('theme') : null;
    const paramPinned = urlParams ? urlParams.get('pinned') : null;

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

    function applyScene(sceneKey) {
      const resolvedKey = sceneAliasMap[sceneKey] || sceneKey;
      const s = scenes.find(item => item.key === resolvedKey) || scenes[0];
      currentSceneIdx = scenes.indexOf(s);
      safeStorage.setItem('shinsekai-scene', s.key);
      document.body.setAttribute('data-scene', s.key);

      if (sceneLabel) sceneLabel.textContent = s.label;
      const sceneLabelSub = document.getElementById('scene-label-sub');
      if (sceneLabelSub) sceneLabelSub.textContent = s.labelEn || s.key.toUpperCase();

      if (bgVideo) {
        if (!s.video) {
          // Eco Mode: Halt video decoding entirely to free GPU & system RAM
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
          if (!activeSrc || !activeSrc.includes(s.video)) {
            bgVideo.style.opacity = '0.2';
            bgVideo.src = s.video;
            if (videoSource) videoSource.src = s.video;
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

      sceneItems.forEach(item => {
        item.classList.toggle('active', item.dataset.scene === s.key);
      });
    }

    /* ─── 4.1. BULLETPROOF VIDEO AUTO-RESUME & FREEZE-RECOVERY ─── */
    function ensureVideoPlayback() {
      if (!bgVideo || document.body.getAttribute('data-scene') === 'eco') return;
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
      // Never resume if document is hidden or link editor is open
      if (document.hidden) return;
      if (linkEditorModal && linkEditorModal.classList.contains('open')) return;
      isAppSuspended = false;
      lastClockMainStr = '';
      lastDateDay = -1;
      lastLoreHour = -1;
      updateEpisodeClock();
      startCanvasAnim();
      ensureVideoPlayback();
      startQuoteTimer();
    }

    // Suspend execution when tab is hidden or minimized
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pauseAllEngines();
      } else {
        resumeAllEngines();
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
        if (!document.hidden && !isAppSuspended) {
          setTimeout(() => {
            if (!document.hidden && !isAppSuspended && bgVideo.paused) {
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
        if (!document.hidden && !isAppSuspended) ensureVideoPlayback();
      });
      bgVideo.addEventListener('waiting', () => {
        if (!document.hidden && !isAppSuspended) ensureVideoPlayback();
      });
      bgVideo.addEventListener('error', () => {
        try {
          bgVideo.load();
          ensureVideoPlayback();
        } catch (e) {}
      });

      // Watchdog: checks every 4s to unfreeze video if frame gets stuck (dormant when paused/hidden/eco)
      let lastVideoTime = -1;
      let freezeCount = 0;
      setInterval(() => {
        if (document.hidden || isAppSuspended || !bgVideo || document.body.getAttribute('data-scene') === 'eco') return;
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
      currentSceneIdx = (currentSceneIdx + 1) % scenes.length;
      applyScene(scenes[currentSceneIdx].key);
    }

    if (sceneBtn && scenePopover) {
      sceneBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (themePopover) themePopover.classList.remove('open');
        scenePopover.classList.toggle('open');
      });

      sceneItems.forEach(item => {
        item.addEventListener('click', () => {
          applyScene(item.dataset.scene);
          scenePopover.classList.remove('open');
        });
      });
    }

    applyScene(scenes[currentSceneIdx].key);

    /* ─── 5. THEME FACTION CONTROLLER ─── */
    const themes = [
      { key: 'crimson',    label: '紅蓮',   labelEn: 'Crimson',    color: '#f7768e', defaultScene: 'crimson' },
      { key: 'tokyonight', label: '東京夜', labelEn: 'TokyoNight', color: '#7aa2f7', defaultScene: 'tokyonight' },
      { key: 'sakura',     label: '桜吹雪', labelEn: 'Sakura',     color: '#f4b8e4', defaultScene: 'sakura' },
      { key: 'catppuccin', label: '終末谷', labelEn: 'Catppuccin', color: '#cba6f7', defaultScene: 'catppuccin' },
      { key: 'cyberpunk',  label: '電脳都市', labelEn: 'Cyberpunk',  color: '#00f0ff', defaultScene: 'cyberpunk' }
    ];

    const themeBootLore = {
      crimson: {
        tag: 'SHINSEKAI // 紅蓮 FLAME CORE',
        kanji: '紅蓮 · 炎獄始動',
        sub: 'SYNCHRONIZING CRIMSON FLAME MATRIX // MIMOGU-SAMA',
        step: '[BOOT 03/04] 紅蓮 FLAME COGNITION ONLINE // SYNC RATE: 99.8%'
      },
      tokyonight: {
        tag: 'SHINSEKAI // 東京夜 CURSED CORE',
        kanji: '東京夜 · 無量空処',
        sub: 'SYNCHRONIZING INFINITE VOID MATRIX // MIMOGU-SAMA',
        step: '[BOOT 03/04] 東京夜 VOID COGNITION ONLINE // SYNC RATE: 99.8%'
      },
      sakura: {
        tag: 'SHINSEKAI // 桜吹雪 RONIN CORE',
        kanji: '桜吹雪 · 侍刀一閃',
        sub: 'SYNCHRONIZING SAKURA BLOSSOM MATRIX // MIMOGU-SAMA',
        step: '[BOOT 03/04] 桜吹雪 BLOSSOM COGNITION ONLINE // SYNC RATE: 99.8%'
      },
      catppuccin: {
        tag: 'SHINSEKAI // 終末谷 SPIRAL CORE',
        kanji: '終末谷 · 宿命螺旋',
        sub: 'SYNCHRONIZING CATPPUCCIN SPIRAL MATRIX // MIMOGU-SAMA',
        step: '[BOOT 03/04] 終末谷 SPIRAL COGNITION ONLINE // SYNC RATE: 99.8%'
      },
      cyberpunk: {
        tag: 'SHINSEKAI // 電脳都市 NEON CORE',
        kanji: '電脳都市 · 超限界',
        sub: 'SYNCHRONIZING CYBERPUNK NEON MATRIX // MIMOGU-SAMA',
        step: '[BOOT 03/04] 電脳都市 NEON COGNITION ONLINE // SYNC RATE: 99.8%'
      }
    };

    let currentThemeIdx = 0;
    const savedTheme = paramTheme || safeStorage.getItem('shinsekai-theme') || 'crimson';
    const foundTheme = themes.findIndex(t => t.key === savedTheme);
    if (foundTheme !== -1) currentThemeIdx = foundTheme;

    function applyTheme(themeKey, syncScene = false) {
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

      refreshParticleColors();

      if (syncScene && t.defaultScene) {
        applyScene(t.defaultScene);
      }
    }

    function cycleTheme() {
      currentThemeIdx = (currentThemeIdx + 1) % themes.length;
      applyTheme(themes[currentThemeIdx].key, true);
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
    }

    applyTheme(themes[currentThemeIdx].key, false);

    /* ─── 6. CRT SCANLINES & FILM GRAIN TOGGLE ─── */
    let grainActive = safeStorage.getItem('shinsekai-grain') !== 'off';

    function setGrain(active) {
      grainActive = active;
      safeStorage.setItem('shinsekai-grain', active ? 'on' : 'off');
      document.body.setAttribute('data-grain', active ? 'on' : 'off');
      if (grainStatusText) grainStatusText.textContent = active ? 'CRT: ON' : 'CRT: OFF';
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
      if (!/^https?:\/\/|^\/|^#/i.test(trimmed)) {
        return 'https://' + trimmed;
      }
      return trimmed;
    }

    /* ─── 8.0. FAVICON & PERSISTENT OFFLINE ICON CACHE ─── */
    const ICON_CACHE_PREFIX = 'shinsekai-icon-';

    function getHostname(href) {
      if (!href || href === '#') return '';
      try {
        const clean = sanitizeUrl(href);
        if (!clean || clean === '#' || clean.startsWith('javascript:')) return '';
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
     * ONLY runs when online.
     */
    function syncAllIconsOffline() {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      currentLinks.forEach(sec => {
        (sec.items || []).forEach(item => {
          if (item.url) {
            cacheIconForOffline(item.url);
          }
        });
      });
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
        const blob = new Blob([JSON.stringify(currentLinks, null, 2)], { type: 'application/json' });
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dlUrl;
        a.download = 'shinsekai-links.json';
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
            if (Array.isArray(parsed) && parsed.length > 0) {
              const validData = parsed
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
            window.location.href = query.startsWith('http') ? query : 'https://' + query;
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

    function runBootSequence() {
      // Resolve initial theme immediately from storage or URL
      const activeThemeKey = paramTheme || safeStorage.getItem('shinsekai-theme') || 'crimson';
      currentThemeKey = activeThemeKey;
      document.documentElement.setAttribute('data-theme', activeThemeKey);
      document.body.setAttribute('data-theme', activeThemeKey);

      const lore = themeBootLore[activeThemeKey] || themeBootLore.crimson;
      if (bootPill) bootPill.textContent = lore.tag;
      if (bootKanji) bootKanji.textContent = lore.kanji;
      if (bootSub) bootSub.textContent = lore.sub;

      const skipBoot = urlParams && (urlParams.get('noboot') === '1' || urlParams.get('noboot') === 'true');
      if (!bootOverlay || skipBoot) {
        if (bootOverlay) {
          bootOverlay.classList.add('boot-completed');
          if (bootOverlay.parentNode) {
            bootOverlay.parentNode.removeChild(bootOverlay);
          }
        }
        document.body.classList.remove('booting');
        document.body.classList.add('boot-ready');
        if (urlParams && urlParams.get('menu') === 'scene' && scenePopover) {
          scenePopover.classList.add('open');
        } else if (urlParams && urlParams.get('menu') === 'theme' && themePopover) {
          themePopover.classList.add('open');
        }
        playWelcomeVoice();
        return;
      }

      const bootDuration = 1500; // Exact 1.5 seconds
      let startTime = null;

      const bootSteps = [
        { pct: 25, log: '[BOOT 01/04] INITIALIZING SYSTEM KERNEL & CACHYOS LINUX CORE...' },
        { pct: 55, log: '[BOOT 02/04] COMPILING ANIME MECHA SHADERS & GPU COGNITIVE MATRIX...' },
        { pct: 85, log: lore.step },
        { pct: 99, log: '[BOOT 04/04] MIMOGU-SAMA AUTHENTICATED // DEPLOYING INTERFACE...' },
        { pct: 100, log: '新世界 起動完了 // WELCOME MIMOGU-SAMA' }
      ];

      function updateBoot(timestamp) {
        const now = timestamp || performance.now();
        if (startTime === null) {
          startTime = now;
        }

        const elapsed = now - startTime;
        const progress = Math.min(100, Math.floor((elapsed / bootDuration) * 100));

        if (bootProgressBar) bootProgressBar.style.width = `${progress}%`;
        if (bootPct) bootPct.textContent = `${progress}%`;

        const step = bootSteps.find(s => progress <= s.pct) || bootSteps[bootSteps.length - 1];
        if (bootLog && step) bootLog.textContent = step.log;

        if (elapsed < bootDuration) {
          requestAnimationFrame(updateBoot);
        } else {
          // Exactly at 1.5 seconds: loading has finished!
          if (bootProgressBar) bootProgressBar.style.width = '100%';
          if (bootPct) bootPct.textContent = '100%';
          if (bootLog) bootLog.textContent = '新世界 起動完了 // WELCOME MIMOGU-SAMA';

          // Play the female android voice the moment loading is finished!
          playWelcomeVoice();

          setTimeout(() => {
            bootOverlay.classList.add('boot-completed');
            document.body.classList.remove('booting');
            document.body.classList.add('boot-active');
            setTimeout(() => {
              document.body.classList.add('boot-ready');
              document.body.classList.remove('boot-active');
              // Free boot DOM tree and internal laser/matrix shaders completely from memory
              if (bootOverlay && bootOverlay.parentNode) {
                bootOverlay.parentNode.removeChild(bootOverlay);
              }
            }, 600);
          }, 350);
        }
      }

      requestAnimationFrame(updateBoot);
    }

    // Trigger 1.5-second theme-customized boot sequence on startup
    runBootSequence();

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
      } else if (key === 'p') {
        setDockPinned(!dockPinned);
      } else if (key === 'v') {
        playWelcomeVoice();
      } else if (key === 'e') {
        openLinkEditor();
      } else if (key === 'c') {
        toggleClockFormat();
      } else if (e.key === 'Escape') {
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShinsekai);
  } else {
    initShinsekai();
  }
})();
