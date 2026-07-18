// popup/popup.js
// Wires up the popup UI to storage, the PDF parser/extractor, and the
// content script running in the active tab.

(function () {
  const fileInput = document.getElementById("resumeFile");
  const uploadBtn = document.getElementById("uploadBtn");
  const extractBtn = document.getElementById("extractBtn");
  const detectBtn = document.getElementById("detectBtn");
  const autofillBtn = document.getElementById("autofillBtn");
  const clearBtn = document.getElementById("clearBtn");
  const fileNameEl = document.getElementById("fileName");
  const loadedRow = document.getElementById("loadedRow");
  const statusLog = document.getElementById("statusLog");

  let selectedFile = null;
  let resumeJson = null;

  // ---------- UI helpers ----------

  function log(message, kind = "") {
    const entry = document.createElement("div");
    entry.className = `entry ${kind}`.trim();
    entry.textContent = message;
    statusLog.appendChild(entry);
    statusLog.scrollTop = statusLog.scrollHeight;
  }

  function setFileName(name) {
    fileNameEl.textContent = name || "No resume uploaded";
  }

  function setLoadedBadge(isLoaded) {
    loadedRow.hidden = !isLoaded;
  }

  function refreshButtonStates() {
    extractBtn.disabled = !selectedFile;
    autofillBtn.disabled = !resumeJson;
  }

  // ---------- Init: restore previous state ----------

  async function init() {
    try {
      const [resume, meta] = await Promise.all([
        window.RAFStorage.loadResume(),
        window.RAFStorage.loadResumeMeta(),
      ]);
      if (resume) {
        resumeJson = resume;
        setLoadedBadge(true);
        log("Loaded previously stored resume.", "ok");
      }
      if (meta && meta.fileName) {
        setFileName(meta.fileName);
      }
    } catch (err) {
      log(`Could not load stored resume: ${err.message}`, "error");
    }
    refreshButtonStates();
  }

  // ---------- Upload ----------

  uploadBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      log("Only PDF resumes are supported in V1.", "error");
      return;
    }

    selectedFile = file;
    setFileName(file.name);
    setLoadedBadge(false);
    log(`Selected ${file.name}`);
    refreshButtonStates();
  });

  // ---------- Extract ----------

  extractBtn.addEventListener("click", async () => {
    if (!selectedFile) return;
    extractBtn.disabled = true;
    log("Extracting text from PDF...");

    try {
      const text = await window.RAFPdfParser.extractTextFromPdf(selectedFile);
      const parsed = window.RAFExtractor.extractResume(text);
      resumeJson = parsed;

      await window.RAFStorage.saveResume(parsed, {
        fileName: selectedFile.name,
        uploadedAt: new Date().toISOString(),
      });

      setLoadedBadge(true);
      log(
        `Extracted: ${parsed.personal.fullName || "(name not found)"}, ` +
          `${parsed.education.length} education entr${parsed.education.length === 1 ? "y" : "ies"}, ` +
          `${parsed.skills.length} skills.`,
        "ok"
      );
    } catch (err) {
      log(`Extraction failed: ${err.message}`, "error");
    } finally {
      refreshButtonStates();
    }
  });

  // ---------- Detect (debug tool) ----------

  detectBtn.addEventListener("click", async () => {
    log("Detecting fields on this page...");
    try {
      const response = await sendToActiveTab({ action: "DETECT_FIELDS" });
      if (response && response.ok) {
        log(`Detected ${response.detected} field(s).`, "ok");
      } else {
        log("No response from page (try reloading the tab).", "error");
      }
    } catch (err) {
      log(`Detection failed: ${err.message}`, "error");
    }
  });

  // ---------- Autofill ----------

  autofillBtn.addEventListener("click", async () => {
    if (!resumeJson) return;
    log("Autofilling this page...");

    try {
      const response = await sendToActiveTab({
        action: "AUTOFILL",
        resume: resumeJson,
      });
      if (response && response.ok) {
        log(
          `Detected ${response.detected}, matched ${response.matched}, filled ${response.filled}.`,
          "ok"
        );
      } else {
        log("No response from page (try reloading the tab).", "error");
      }
    } catch (err) {
      log(`Autofill failed: ${err.message}`, "error");
    }
  });

  // ---------- Clear ----------

  clearBtn.addEventListener("click", async () => {
    await window.RAFStorage.clearResume();
    resumeJson = null;
    selectedFile = null;
    setFileName(null);
    setLoadedBadge(false);
    log("Cleared stored resume.");
    refreshButtonStates();
  });

  // ---------- Messaging helper ----------

  function sendToActiveTab(message) {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab) {
          reject(new Error("No active tab found."));
          return;
        }
        chrome.tabs.sendMessage(tab.id, message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      });
    });
  }

  init();
})();
