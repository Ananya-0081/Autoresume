// utils/helpers.js
// Generic DOM + string helpers shared by detector/matcher/autofill.
// Exposed as window.RAFHelpers

(function () {
  /**
   * Normalize a string for comparison: lowercase, trim, collapse whitespace,
   * strip punctuation that isn't meaningful (keeps letters/numbers/spaces).
   */
  function normalize(str) {
    if (!str) return "";
    return str
      .toString()
      .toLowerCase()
      .replace(/[_\-]+/g, " ")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Try to find the <label> text associated with a form element.
   * Checks: <label for="id">, wrapping <label>, aria-labelledby.
   */
  function getAssociatedLabelText(el) {
    if (!el) return "";

    // 1. label[for=id]
    if (el.id) {
      const escapedId = window.CSS && CSS.escape ? CSS.escape(el.id) : el.id;
      try {
        const forLabel = document.querySelector(`label[for="${escapedId}"]`);
        if (forLabel) return forLabel.innerText || forLabel.textContent || "";
      } catch (e) {
        /* invalid selector, ignore */
      }
    }

    // 2. wrapping label
    const parentLabel = el.closest("label");
    if (parentLabel) {
      return parentLabel.innerText || parentLabel.textContent || "";
    }

    // 3. aria-labelledby
    const labelledBy = el.getAttribute && el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const ids = labelledBy.split(/\s+/);
      const texts = ids
        .map((id) => document.getElementById(id))
        .filter(Boolean)
        .map((n) => n.innerText || n.textContent || "");
      if (texts.length) return texts.join(" ");
    }

    return "";
  }

  /**
   * Look at nearby text nodes (previous sibling, parent's previous sibling)
   * as a fallback when no proper <label> exists. Common in React-heavy ATS UIs
   * (Greenhouse, Lever, Ashby) where a <div> or <span> visually acts as a label.
   */
  function getNearbyText(el) {
    if (!el) return "";
    const texts = [];

    // Previous sibling element text
    let sibling = el.previousElementSibling;
    if (sibling && sibling.innerText) {
      texts.push(sibling.innerText);
    }

    // Parent's previous sibling (common pattern: <div><label/><input/></div>)
    const parent = el.parentElement;
    if (parent) {
      const parentPrev = parent.previousElementSibling;
      if (parentPrev && parentPrev.innerText) {
        texts.push(parentPrev.innerText);
      }

      // Look for a sibling within the same parent that looks like a label
      const candidateLabel = Array.from(parent.children).find(
        (child) =>
          child !== el &&
          (child.tagName === "LABEL" ||
            child.className.toString().toLowerCase().includes("label"))
      );
      if (candidateLabel) {
        texts.push(candidateLabel.innerText || candidateLabel.textContent || "");
      }
    }

    // Grandparent container (some ATS wrap label+input two levels up)
    const grandparent = parent ? parent.parentElement : null;
    if (grandparent) {
      const labelNode = grandparent.querySelector(
        '[class*="label" i], legend'
      );
      if (labelNode && !texts.includes(labelNode.innerText)) {
        texts.push(labelNode.innerText || labelNode.textContent || "");
      }
    }

    return texts.filter(Boolean).join(" ").trim().slice(0, 200);
  }

  /**
   * Fire the DOM events needed so React/Vue/Angular controlled inputs
   * pick up a programmatic value change.
   */
  function fireInputEvents(el) {
    const events = ["input", "change", "blur"];
    events.forEach((type) => {
      el.dispatchEvent(new Event(type, { bubbles: true }));
    });
  }

  /**
   * Set a value on a native input/textarea in a way that React's
   * synthetic event system also detects (bypasses the React-tracked
   * value setter so the 'input' event isn't swallowed).
   */
  function setNativeValue(el, value) {
    const proto = Object.getPrototypeOf(el);
    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
    if (descriptor && descriptor.set) {
      descriptor.set.call(el, value);
    } else {
      el.value = value;
    }
  }

  function isVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (el.offsetWidth === 0 && el.offsetHeight === 0) return false;
    return true;
  }

  function safeText(el) {
    return el && (el.innerText || el.textContent) ? (el.innerText || el.textContent).trim() : "";
  }

  window.RAFHelpers = {
    normalize,
    getAssociatedLabelText,
    getNearbyText,
    fireInputEvents,
    setNativeValue,
    isVisible,
    safeText,
  };
})();
