/* ════════════════════════════════════════════════════════════════════════════
   新世界 · SHINSEKAI // OFFLINE SERVICE WORKER (結界 · BARRIER)
   Only used when the page is served over http(s) — e.g. GitHub Pages or a
   local server. The Chromium extension and file:// installs are offline by
   nature and never register it.

   • App shell, fonts, icons, stills and the voice line are precached, then
     served stale-while-revalidate (instant + offline, updates next load).
   • Wallpaper videos are NOT precached (25+ MB). The first time a video
     plays online, a full copy is cached in the background; after that it is
     served from cache with proper HTTP Range (206) support, so it loops
     offline too. At most MAX_VIDEOS clips are kept.
   Bump VERSION whenever shipped files change.
   ════════════════════════════════════════════════════════════════════════════ */
const VERSION = 'shinsekai-v2.8.0';
const SHELL_CACHE = VERSION + '-shell';
const VIDEO_CACHE = 'shinsekai-videos-v1';
const MAX_VIDEOS = 6;

const PRECACHE = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'links.js',
  'theme-core.js',
  'boot.js',
  'boot-stage.js',
  'app.webmanifest',
  'assets/audio/welcome.mp3',
  'assets/icons/anilist.co.webp',
  'assets/icons/chatgpt.com.webp',
  'assets/icons/claude.ai.webp',
  'assets/icons/crunchyroll.com.webp',
  'assets/icons/discord.com.webp',
  'assets/icons/discuss.cachyos.org.webp',
  'assets/icons/drive.google.com.webp',
  'assets/icons/github.com.webp',
  'assets/icons/howlongtobeat.com.webp',
  'assets/icons/listen.moe.webp',
  'assets/icons/mail.proton.me.webp',
  'assets/icons/mangadex.org.webp',
  'assets/icons/myanimelist.net.webp',
  'assets/icons/protondb.com.webp',
  'assets/icons/reddit.com.webp',
  'assets/icons/steamdb.info.webp',
  'assets/icons/store.steampowered.com.webp',
  'assets/icons/twitch.tv.webp',
  'assets/icons/web.telegram.org.webp',
  'assets/icons/wiki.archlinux.org.webp',
  'assets/icons/x.com.webp',
  'assets/icons/youtube.com.webp',
  'assets/previews/catppuccin.webp',
  'assets/previews/crimson.webp',
  'assets/previews/cyberpunk.webp',
  'assets/previews/sakura.webp',
  'assets/previews/tokyonight.webp',
  'assets/app/apple-touch-icon.png',
  'assets/app/favicon-64.png',
  'assets/app/icon-192.png',
  'assets/app/icon-512.png',
  'assets/app/icon-maskable-512.png',
  'assets/fonts/jetbrains-mono-var.woff2',
  'assets/fonts/plus-jakarta-sans-var.woff2',
  'assets/fonts/zen-kaku-gothic-new-700.woff2',
  'assets/fonts/zen-kaku-gothic-new-900.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k.startsWith('shinsekai-') && k !== SHELL_CACHE && k !== VIDEO_CACHE)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // search engines, web-URL wallpapers: browser default

  if (/\.(mp4|webm)$/i.test(url.pathname)) {
    event.respondWith(serveVideo(req, url));
    return;
  }
  event.respondWith(staleWhileRevalidate(event, req));
});

async function staleWhileRevalidate(event, req) {
  const cache = await caches.open(SHELL_CACHE);
  // ?v=2.7 cache-busting params must not cause misses offline.
  const cached = await cache.match(req, { ignoreSearch: true });
  const network = fetch(req)
    .then((res) => {
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  const res = await network;
  if (res) return res;
  if (req.mode === 'navigate') {
    const shell = await cache.match('index.html');
    if (shell) return shell;
  }
  return new Response('', { status: 504, statusText: 'Offline' });
}

const inFlightVideos = new Set();

async function serveVideo(req, url) {
  const key = url.origin + url.pathname;
  const cache = await caches.open(VIDEO_CACHE);
  const cached = await cache.match(key);
  if (cached) return rangeFrom(cached, req.headers.get('range'));

  // Not cached yet: stream from the network as usual and fetch one full copy
  // in the background (media elements only ever ask for byte ranges, which
  // can't be stored as a whole file).
  if (!inFlightVideos.has(key)) {
    inFlightVideos.add(key);
    fetch(key)
      .then(async (res) => {
        if (!res.ok || res.status !== 200) return;
        await cache.put(key, res);
        const keys = await cache.keys();
        for (let i = 0; i < keys.length - MAX_VIDEOS; i++) await cache.delete(keys[i]);
      })
      .catch(() => {})
      .finally(() => inFlightVideos.delete(key));
  }
  try {
    return await fetch(req);
  } catch (e) {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

async function rangeFrom(response, rangeHeader) {
  const blob = await response.blob();
  const size = blob.size;
  const type = response.headers.get('content-type') || 'video/mp4';
  const m = /bytes=(\d*)-(\d*)/.exec(rangeHeader || '');
  if (!m) {
    return new Response(blob, { status: 200, headers: { 'Content-Type': type, 'Content-Length': String(size), 'Accept-Ranges': 'bytes' } });
  }
  let start = m[1] === '' ? Math.max(0, size - Number(m[2])) : Number(m[1]);
  let end = (m[1] !== '' && m[2] !== '') ? Number(m[2]) : size - 1;
  end = Math.min(end, size - 1);
  if (start >= size || start > end) {
    return new Response('', { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
  }
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': type,
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes'
    }
  });
}
