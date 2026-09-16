<div align="center">

# 新世界 · SHINSEKAI - Startup Page
### // ANIME CINEMATIC OS

<p align="center">
  <b>A high-performance, standalone anime cinematic startpage with hardware-accelerated live wallpapers, atmospheric particle dynamics, faction themes, and anime HUD telemetry.</b>
</p>

[![Status](https://img.shields.io/badge/Status-100%25_Offline_Standalone-success?style=for-the-badge&logo=shield&color=10b981)](https://github.com/)
[![Dependencies](https://img.shields.io/badge/Dependencies-Zero_Dependencies-blue?style=for-the-badge&logo=box&color=3b82f6)](https://github.com/)
[![Tech](https://img.shields.io/badge/Tech-Vanilla_HTML5_%2F_CSS3_%2F_ES6-orange?style=for-the-badge&logo=html5&color=f97316)](https://github.com/)
[![Performance](https://img.shields.io/badge/Performance-60_FPS_Canvas_%2B_Hardware_Accelerated-purple?style=for-the-badge&logo=speedtest&color=8b5cf6)](https://github.com/)
[![Platform](https://img.shields.io/badge/Platform-Linux_%7C_Windows_%7C_macOS-lightgrey?style=for-the-badge&logo=linux&color=64748b)](https://github.com/)

<br />

</div>

---

## ⚡ Highlights & Features

- **🎬 5 High-Definition Looping Video Wallpapers**: Smooth, hardware-accelerated anime backgrounds with intelligent playback recovery across tab and app switches.
- **🌸 60 FPS Atmospheric Canvas Particles**: Dynamic cherry blossom petals, fire embers, electric sparks, and ambient dust tailored to each theme faction.
- **🎙️ Mecha Android Voice Greeting**: Japanese AI voice welcome (*「ようこそ、ミモグ様」*) triggered upon system boot completion, with custom voice support.
- **⚔️ Dynamic Anime Blade Launcher**: Zero-delay category hovering and instant holographic link drawer for quick navigation.
- **⚙️ In-Browser Visual Bookmark Editor**: Add, edit, delete, export, and import your pinned links with live persistence — no coding required.
- **🎨 5 Anime Aesthetic Color Themes**: Instant hotkey theme cycling between *Crimson Flame*, *TokyoNight Void*, *Sakura Ronin*, *Catppuccin Spiral*, and *Cyberpunk Neon*.
- **🔍 Slash Command Search Bar**: Quick search modal (`/`) supporting custom search bangs (`!g`, `!y`, `!a`, `!gh`, `!r`, `!d`, `!w`) and direct URL navigation.
- **📺 Retro CRT Filter & Film Grain**: Toggleable vintage anime monitor scanlines and subtle cinematic grain (`g`).
- **🛡️ 100% Offline & Private**: Zero tracking, zero external telemetry, zero npm dependencies, and no web server required.

---

## 🚀 Quick Start (Any OS)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-username/anime-startpage.git
   ```
2. Double-click **`index.html`** or drag it into any browser:
   - **Google Chrome** / **Chromium**
   - **Mozilla Firefox**
   - **Brave Browser**
   - **Microsoft Edge**
   - **Opera / Opera GX**

---

## 📑 Browser Setup Guides

### 1. Chromium Browsers (Chrome, Brave, Edge) — *Native New Tab Override*
This repository contains a native `manifest.json`, allowing Chromium-based browsers to use Shinsekai directly as your default new tab page without third-party extensions:

1. Open `chrome://extensions` (or `brave://extensions`, `edge://extensions`).
2. Toggle **Developer mode** **ON** (top-right corner).
3. Click **Load unpacked** (top-left corner).
4. Select your `anime-startpage` folder.
5. **Done!** Every new tab (`Ctrl + T`) will open Shinsekai immediately with zero lag.

---

### 2. Firefox Setup

#### Option A: Dedicated New Tab (Recommended)
1. Install the [New Tab Override](https://addons.mozilla.org/firefox/addon/new-tab-override/) extension.
2. In the extension settings, set the option to **Local File** and select `index.html`, or host it via GitHub Pages / Netlify and paste the URL.

#### Option B: Homepage / Startup Page (Zero Extensions Needed)
1. Open Firefox **Settings** (`Ctrl + ,`) → **Home**.
2. Under **Homepage and new windows**, choose **Custom URLs...**.
3. Paste the path to your local `index.html`:
   - **Linux**: `file:///home/username/Documents/anime-startpage/index.html`
   - **Windows**: `file:///C:/Users/username/Documents/anime-startpage/index.html`
4. Press `Alt + Home` anytime to return to Shinsekai.

---

## 🎨 Customizing Media & Bookmarks

You can personalize the startpage with your own video wallpapers, voice lines, and links.

### 1. Pinned Links & Bookmarks (Two Options)

#### 🔹 Option A: In-Browser Visual Editor (Easiest)
1. Click the **`⚙️ リンク編集`** button in the header toolbar (or press **`e`**).
2. Browse categories (**01 アニメ・配信**, **02 電子遊戯**, **03 開発中枢**, **04 媒体通信**).
3. Click **`✏️ 編集 / EDIT`** to edit any link, **`🗑️ 削除 / DEL`** to remove one, or use the bottom form to add new bookmarks.
4. Changes save automatically to your browser storage.
5. Use **`⭳ 設定保存 (Export)`** to backup your links or **`⭱ 設定読込 (Import)`** to restore them anytime.

#### 🔹 Option B: Direct Configuration (`links.js`)
Edit [`links.js`](links.js) directly in any code editor to adjust the default presets:
```javascript
window.SHINSEKAI_DEFAULT_LINKS = [
  {
    id: "anime",
    index: "01",
    kanji: "映",
    main: "アニメ・配信",
    sub: "STREAM & MANGA",
    hotkey: "1",
    items: [
      { title: "HiAnime", url: "https://hianime.to", desc: "HD Anime Streaming", seal: "観" },
      ...
    ]
  }
];
```

---

### 2. Replacing Theme Video Wallpapers
All video backgrounds reside in:
📁 **`assets/animated/`**

Each video is mapped directly to its theme name:

| Theme Name | Japanese Name | Wallpaper File Path |
|:---|:---|:---|
| **Crimson** | 紅蓮 | `assets/animated/crimson.mp4` |
| **TokyoNight** | 東京夜 | `assets/animated/tokyonight.mp4` |
| **Sakura** | 桜吹雪 | `assets/animated/sakura.mp4` |
| **Catppuccin** | 終末谷 | `assets/animated/catppuccin.mp4` |
| **Cyberpunk** | 電脳都市 | `assets/animated/cyberpunk.mp4` |

**How to change a wallpaper:**
1. Grab any looping `.mp4` video (1080p, 1440p, or 4K).
2. Rename the video to the corresponding theme (e.g. `crimson.mp4` or `cyberpunk.mp4`).
3. Replace the file inside `assets/animated/` and reload your browser.

---

### 3. Replacing the Startup Mecha Voice
The boot voice file resides in:
📁 **`assets/audio/welcome.mp3`**

**How to change the voice:**
1. Take any `.mp3` audio clip (dialogue, sound effect, or anime greeting).
2. Rename it to **`welcome.mp3`**.
3. Replace the file at `assets/audio/welcome.mp3` and refresh the page.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Description |
|:---:|:---|:---|
| <kbd>/</kbd> | **Focus Search** | Instantly jump to the command console |
| <kbd>t</kbd> | **Cycle Theme** | Switch between Crimson, TokyoNight, Sakura, Catppuccin, Cyberpunk |
| <kbd>s</kbd> / <kbd>w</kbd> | **Cycle Scene** | Switch live animated background videos |
| <kbd>e</kbd> | **Edit Links** | Open the visual link configuration hub |
| <kbd>g</kbd> | **CRT Scanlines** | Toggle vintage monitor scanlines and film grain |
| <kbd>p</kbd> | **Pin Drawer** | Lock the bookmark drawer open |
| <kbd>v</kbd> | **Replay Voice** | Replay the mecha voice greeting |
| <kbd>q</kbd> | **Cycle Quote** | Cycle Japanese anime quotes & English subtitles |
| <kbd>1</kbd> - <kbd>4</kbd> | **Switch Sector** | Jump directly to category (Anime, Gaming, Dev, Media) |
| <kbd>Esc</kbd> | **Close / Dismiss** | Unfocus search, close popovers or editor modal |

---

## 🔍 Quick Search Bangs

Type any of the following prefixes into the command bar followed by your query:

| Bang | Destination | Example |
|:---:|:---|:---|
| `!g` | Google Search | `!g jujutsu kaisen season 3` |
| `!y` | YouTube | `!y lofi anime beats` |
| `!a` | AniList Anime DB | `!a chainsaw man` |
| `!gh` | GitHub Search | `!gh cachyos linux` |
| `!r` | Reddit | `!r unixporn` |
| `!d` | DuckDuckGo | `!d privacy tools` |
| `!w` | Wikipedia | `!w cyberpunk 2077` |

*Tip: Entering any direct URL or domain (e.g., `github.com` or `https://archlinux.org`) will navigate directly.*

---

## 📁 Repository Structure

```
anime-startpage/
├── assets/
│   ├── animated/           # Looping HD/4K MP4 theme wallpapers
│   │   ├── catppuccin.mp4
│   │   ├── crimson.mp4
│   │   ├── cyberpunk.mp4
│   │   ├── sakura.mp4
│   │   └── tokyonight.mp4
│   └── audio/              # Mecha female voice welcome asset
│       └── welcome.mp3
├── index.html              # Clean, semantic cinematic DOM viewport
├── links.js                # Default pinned links configuration
├── manifest.json           # Native Chromium Web Extension manifest
├── README.md               # Documentation & setup guide
├── script.js               # Engine controller, particle dynamics, watchdog
└── style.css               # Glassmorphism, animations, responsive design
```

---

## 📜 License

Created with ❤️ by **Mimogu**. Free to use, modify, and distribute for personal startpage customization.
