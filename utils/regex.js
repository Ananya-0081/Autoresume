// utils/regex.js
// Regex patterns used across the extension (resume extraction + field detection).
// Exposed as window.RAFRegex

(function () {
  const RAFRegex = {
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,

    PHONE: /(\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/,

    GITHUB: /(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_-]+\/?/i,

    LINKEDIN: /(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/(in|pub)\/[A-Za-z0-9_-]+\/?/i,

    PORTFOLIO_URL: /(https?:\/\/)[^\s,]+/i,

    // Common CGPA / GPA patterns e.g. "8.9 CGPA", "3.7/4.0 GPA"
    CGPA: /\b(\d{1,2}(\.\d{1,2})?)\s*(\/\s*\d{1,2}(\.\d{1,2})?)?\s*(cgpa|gpa)\b/i,

    // Years e.g. 2019 - 2023, 2019-Present
    YEAR_RANGE: /\b(19|20)\d{2}\b\s*(-|to|–)\s*(\b(19|20)\d{2}\b|present|current)/i,

    YEAR_SINGLE: /\b(19|20)\d{2}\b/,

    // Section headers commonly found in resumes
    SECTION_EDUCATION: /^\s*(education|academic background|academics)\s*$/i,
    SECTION_EXPERIENCE: /^\s*(experience|work experience|employment history|professional experience)\s*$/i,
    SECTION_PROJECTS: /^\s*(projects|personal projects|academic projects)\s*$/i,
    SECTION_SKILLS: /^\s*(skills|technical skills|skillset|core competencies)\s*$/i,

    // Splits a comma / pipe / bullet separated skills line into tokens
    SKILL_SPLIT: /[,•|;\/]+/,

    DEGREE: /\b(b\.?tech|m\.?tech|b\.?e|m\.?e|bachelor|master|b\.?sc|m\.?sc|mba|bca|mca|phd|ph\.?d|diploma)\b/i,
  };

  window.RAFRegex = RAFRegex;
})();
