// background/background.js
// V1 keeps this minimal: lifecycle logging only. The popup talks directly
// to the content script via chrome.tabs.sendMessage, so no message relay
// is needed yet. This file exists so future versions (e.g. the optional
// AI fallback for unknown fields) have a natural place to make network
// calls from, since content scripts have more restricted contexts.

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("[Resume Autofill] installed.");
  } else if (details.reason === "update") {
    console.log(`[Resume Autofill] updated to v${chrome.runtime.getManifest().version}.`);
  }
});
