// content/autofill.js
// Fills resolved values into DOM elements and dispatches the events
// needed for React/Vue-controlled inputs to register the change.
// Also acts as the message listener for popup <-> content script comms.

(function () {
  const { setNativeValue, fireInputEvents, normalize } = window.RAFHelpers;

  function fillTextLike(el, value) {
    setNativeValue(el, value);
    fireInputEvents(el);
  }

  function fillSelect(el, value) {
    const target = normalize(value);
    const options = Array.from(el.options || []);

    // 1. exact match on value or text
    let match = options.find(
      (o) => normalize(o.value) === target || normalize(o.text) === target
    );

    // 2. partial/contains match
    if (!match) {
      match = options.find(
        (o) =>
          normalize(o.text).includes(target) || target.includes(normalize(o.text))
      );
    }

    if (match) {
      el.value = match.value;
      fireInputEvents(el);
      return true;
    }
    return false;
  }

  /**
   * Fill a single { field, type, value } match. Returns true if filled.
   */
  function fillOne(match) {
    const { field, value } = match;
    const el = field.element;
    if (!el || !document.contains(el)) return false;

    try {
      if (field.tag === "SELECT") {
        return fillSelect(el, value);
      }
      // INPUT (text-like) and TEXTAREA
      fillTextLike(el, value);
      return true;
    } catch (err) {
      console.warn("[Resume Autofill] failed to fill field", field, err);
      return false;
    }
  }

  /**
   * Full pipeline: detect -> match -> fill. Returns a summary.
   */
  function runAutofill(resume) {
    const fields = window.RAFDetector.detectFields();
    const matches = window.RAFMatcher.matchFields(fields, resume);

    let filledCount = 0;
    matches.forEach((m) => {
      if (fillOne(m)) filledCount += 1;
    });

    return {
      detected: fields.length,
      matched: matches.length,
      filled: filledCount,
    };
  }

  function runDetectOnly() {
    const fields = window.RAFDetector.detectFields();
    return {
      detected: fields.length,
      fields: fields.map((f) => ({
        tag: f.tag,
        type: f.type,
        id: f.id,
        name: f.name,
        placeholder: f.placeholder,
        ariaLabel: f.ariaLabel,
        label: f.label,
      })),
    };
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.action) return;

    if (message.action === "DETECT_FIELDS") {
      const result = runDetectOnly();
      sendResponse({ ok: true, ...result });
      return true;
    }

    if (message.action === "AUTOFILL") {
      const result = runAutofill(message.resume);
      sendResponse({ ok: true, ...result });
      return true;
    }
  });

  window.RAFAutofill = { runAutofill, runDetectOnly };
})();
