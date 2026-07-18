// parser/pdfParser.js
// Extracts raw text from a PDF File using PDF.js.
// Loaded in the popup (not a content script) via a <script> tag,
// after pdf.min.js has been loaded on the page.
// Exposed as window.RAFPdfParser

(function () {
  // pdf.min.js exposes the global `pdfjsLib`
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL(
      "parser/pdf.worker.min.js"
    );
  }

  /**
   * Read a File object into an ArrayBuffer.
   */
  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extract plain text from a PDF File, page by page, preserving
   * rough line breaks (best effort — PDF.js gives positioned text items,
   * not semantic lines, so we group items by their y-coordinate).
   */
  async function extractTextFromPdf(file) {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      // Group text items into lines using their vertical position.
      const lines = [];
      let currentLine = [];
      let lastY = null;

      content.items.forEach((item) => {
        const y = item.transform[5];
        if (lastY !== null && Math.abs(y - lastY) > 2) {
          lines.push(currentLine.join(" "));
          currentLine = [];
        }
        currentLine.push(item.str);
        lastY = y;
      });
      if (currentLine.length) lines.push(currentLine.join(" "));

      fullText += lines.join("\n") + "\n";
    }

    return fullText;
  }

  window.RAFPdfParser = { extractTextFromPdf };
})();
