// background.js — service worker
// Handles messages between content script and popup/sidebar

chrome.runtime.onInstalled.addListener(() => {
  console.log('[ToneTrack] Extension installed.');
});

// Relay messages between content script ↔ iframe sidebar
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_VIDEO_ID') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        const videoId = url.searchParams.get('v');
        sendResponse({ videoId });
      }
    });
    return true; // async
  }
});
