// parser/docxParser.js
// Placeholder for V2 — DOCX resume parsing.
// Not wired into the popup UI yet (V1 only accepts PDF, per project spec).
// When implemented, this should expose extractTextFromDocx(file) -> string,
// mirroring pdfParser.js's extractTextFromPdf(file) so extractor.js can
// stay format-agnostic. A library like mammoth.js is a good fit here since
// it converts .docx -> plain text/HTML without a server round trip.
// Exposed as window.RAFDocxParser

(function () {
  async function extractTextFromDocx(_file) {
    throw new Error(
      "DOCX parsing is not implemented in V1. Please upload a PDF resume."
    );
  }

  window.RAFDocxParser = { extractTextFromDocx };
})();
