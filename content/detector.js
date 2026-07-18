// content/detector.js
// Scans the DOM for fillable fields and builds Field Objects.
// Exposed as window.RAFDetector

(function () {
  const { normalize, getAssociatedLabelText, getNearbyText, isVisible, safeText } =
    window.RAFHelpers;

  const SKIP_INPUT_TYPES = new Set([
    "hidden",
    "submit",
    "button",
    "reset",
    "file",
    "image",
  ]);

  function getTagInfo(el) {
    const tag = el.tagName; // INPUT | TEXTAREA | SELECT
    let type = "text";

    if (tag === "TEXTAREA") {
      type = "textarea";
    } else if (tag === "SELECT") {
      type = "select";
    } else if (tag === "INPUT") {
      type = (el.getAttribute("type") || "text").toLowerCase();
    }

    return { tag, type };
  }

  function shouldSkip(el, tag, type) {
    if (tag === "INPUT" && SKIP_INPUT_TYPES.has(type)) return true;
    if (el.disabled || el.readOnly) return true;
    if (!isVisible(el)) return true;
    return false;
  }

  /**
   * Build a single Field Object for a raw DOM element.
   */
  function buildFieldObject(el) {
    const { tag, type } = getTagInfo(el);

    const label =
      getAssociatedLabelText(el) || getNearbyText(el) || "";

    return {
      element: el,
      tag,
      type,
      id: el.id || "",
      name: el.getAttribute("name") || "",
      placeholder: el.getAttribute("placeholder") || "",
      ariaLabel: el.getAttribute("aria-label") || "",
      autocomplete: el.getAttribute("autocomplete") || "",
      label: safeText({ innerText: label }) || label.trim(),
      value: el.value || "",
    };
  }

  /**
   * Scan the whole document (including same-origin iframes when accessible)
   * and return an array of Field Objects.
   */
  function detectFields(root = document) {
    const nodeList = root.querySelectorAll("input, textarea, select");
    const fields = [];

    nodeList.forEach((el) => {
      const { tag, type } = getTagInfo(el);
      if (shouldSkip(el, tag, type)) return;
      fields.push(buildFieldObject(el));
    });

    return fields;
  }

  window.RAFDetector = { detectFields, buildFieldObject };
})();
