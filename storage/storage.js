// storage/storage.js
// Thin promise-based wrapper around chrome.storage.local.
// Exposed as window.RAFStorage

(function () {
  const RESUME_KEY = "resumeData";
  const RESUME_META_KEY = "resumeMeta"; // { fileName, uploadedAt }

  function set(key, value) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve();
      });
    });
  }

  function get(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(result[key]);
      });
    });
  }

  function remove(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([key], () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve();
      });
    });
  }

  async function saveResume(resumeJson, meta) {
    await set(RESUME_KEY, resumeJson);
    if (meta) await set(RESUME_META_KEY, meta);
  }

  async function loadResume() {
    return get(RESUME_KEY);
  }

  async function loadResumeMeta() {
    return get(RESUME_META_KEY);
  }

  async function clearResume() {
    await remove(RESUME_KEY);
    await remove(RESUME_META_KEY);
  }

  window.RAFStorage = {
    RESUME_KEY,
    RESUME_META_KEY,
    saveResume,
    loadResume,
    loadResumeMeta,
    clearResume,
  };
})();
