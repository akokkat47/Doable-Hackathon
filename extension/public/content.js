// content.js — injected into youtube.com/watch pages
// Responsibilities:
//   1. Extract video ID from URL
//   2. Inject sidebar iframe
//   3. Sync video currentTime → sidebar via postMessage
//   4. Listen for URL changes (SPA navigation)

const BACKEND_URL = 'http://localhost:8000';
const SIDEBAR_ID = 'yt-tonetrack-sidebar';
const IFRAME_SRC = chrome.runtime.getURL('index.html');

let syncInterval = null;
let lastVideoId = null;

/* ── Helpers ──────────────────────────────────────────── */
function getVideoId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('v');
}

function getPlayer() {
  return document.querySelector('video.html5-main-video') || document.querySelector('video');
}

/* ── Sidebar DOM ──────────────────────────────────────── */
function createSidebar(videoId) {
  if (document.getElementById(SIDEBAR_ID)) return;

  // Push YouTube layout to make room
  const ytdApp = document.querySelector('ytd-app');
  if (ytdApp) ytdApp.style.marginRight = '380px';

  const sidebar = document.createElement('div');
  sidebar.id = SIDEBAR_ID;
  sidebar.style.cssText = `
    position: fixed;
    top: 56px;
    right: 0;
    width: 375px;
    height: calc(100vh - 56px);
    z-index: 9999;
    box-shadow: -4px 0 24px rgba(0,0,0,0.4);
    border-left: 1px solid rgba(255,255,255,0.08);
    overflow: hidden;
    transition: transform 0.3s cubic-bezier(.4,0,.2,1);
  `;

  const iframe = document.createElement('iframe');
  iframe.src = `${IFRAME_SRC}?videoId=${encodeURIComponent(videoId)}`;
  iframe.style.cssText = 'width:100%;height:100%;border:none;background:#0a0a0f;';
  iframe.allow = 'clipboard-write';

  // Toggle button
  const toggle = document.createElement('button');
  toggle.id = 'yt-tonetrack-toggle';
  toggle.innerHTML = '⟨';
  toggle.style.cssText = `
    position: fixed;
    top: 50%;
    right: 375px;
    transform: translateY(-50%);
    z-index: 10000;
    width: 22px;
    height: 56px;
    background: #1a1a2e;
    border: 1px solid rgba(255,255,255,0.15);
    border-right: none;
    border-radius: 6px 0 0 6px;
    color: #a78bfa;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  `;

  let collapsed = false;
  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    sidebar.style.transform = collapsed ? 'translateX(375px)' : 'translateX(0)';
    toggle.style.right = collapsed ? '0' : '375px';
    toggle.innerHTML = collapsed ? '⟩' : '⟨';
    if (ytdApp) ytdApp.style.marginRight = collapsed ? '0' : '380px';
  });

  sidebar.appendChild(iframe);
  document.body.appendChild(sidebar);
  document.body.appendChild(toggle);

  return iframe;
}

function removeSidebar() {
  const el = document.getElementById(SIDEBAR_ID);
  const tog = document.getElementById('yt-tonetrack-toggle');
  if (el) el.remove();
  if (tog) tog.remove();
  const ytdApp = document.querySelector('ytd-app');
  if (ytdApp) ytdApp.style.marginRight = '';
  if (syncInterval) { clearInterval(syncInterval); syncInterval = null; }
}

/* ── Time sync ────────────────────────────────────────── */
function startTimeSync(iframe) {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(() => {
    const player = getPlayer();
    if (!player || !iframe) return;
    iframe.contentWindow?.postMessage(
      { type: 'YT_TIME_UPDATE', currentTime: player.currentTime, paused: player.paused },
      '*'
    );
  }, 300);
}

/* ── Init ─────────────────────────────────────────────── */
function init() {
  const videoId = getVideoId();
  if (!videoId || videoId === lastVideoId) return;
  lastVideoId = videoId;

  removeSidebar();

  // Wait for player to exist
  const wait = setInterval(() => {
    if (document.querySelector('video')) {
      clearInterval(wait);
      const iframe = createSidebar(videoId);
      if (iframe) startTimeSync(iframe);
    }
  }, 500);
}

// SPA navigation watcher
let lastHref = location.href;
const navObserver = new MutationObserver(() => {
  if (location.href !== lastHref) {
    lastHref = location.href;
    setTimeout(init, 800); // slight delay for YouTube's SPA to settle
  }
});
navObserver.observe(document.body, { childList: true, subtree: true });

init();
