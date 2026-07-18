// content/matcher.js
// Classifies a Field Object into a canonical type (EMAIL, PHONE, ...)
// and resolves the corresponding value from the stored resume JSON.
// Exposed as window.RAFMatcher

(function () {
  const { normalize } = window.RAFHelpers;
  const { DICTIONARY } = window.RAFLabels;

  // Order in which types are checked. More specific types first so e.g.
  // "first name" is not swallowed by the generic "name" keyword in FULL_NAME.
  const TYPE_PRIORITY = [
    "EMAIL",
    "PHONE",
    "FIRST_NAME",
    "LAST_NAME",
    "DOB",
    "LINKEDIN",
    "GITHUB",
    "PORTFOLIO",
    "COLLEGE",
    "DEGREE",
    "CGPA",
    "GRAD_YEAR",
    "COMPANY",
    "ROLE",
    "EXPERIENCE_YEARS",
    "SKILLS",
    "LOCATION",
    "COVER_LETTER",
    "RESUME_UPLOAD",
    "FULL_NAME",
  ];

  /**
   * Build one normalized haystack string out of all the text signals
   * a Field Object carries, so keyword matching only needs one pass.
   */
  function buildHaystack(field) {
    const parts = [
      field.label,
      field.ariaLabel,
      field.placeholder,
      field.name,
      field.id,
      field.autocomplete,
    ];
    return normalize(parts.filter(Boolean).join(" "));
  }

  /**
   * Classify a Field Object into a canonical type string, or null
   * if no keyword matched (an "unknown" field).
   */
  function classify(field) {
    const haystack = buildHaystack(field);
    if (!haystack) return null;

    for (const type of TYPE_PRIORITY) {
      const keywords = DICTIONARY[type] || [];
      for (const kw of keywords) {
        const normKw = normalize(kw);
        if (!normKw) continue;
        // word-boundary-ish match: keyword appears as a whole phrase
        if (matchesKeyword(haystack, normKw)) {
          return type;
        }
      }
    }
    return null;
  }

  function matchesKeyword(haystack, keyword) {
    // exact word/phrase boundary match to avoid partial false positives
    // e.g. "state" should not match inside "statement"
    const pattern = new RegExp(`(^|\\s)${escapeRegex(keyword)}($|\\s)`);
    return pattern.test(` ${haystack} `.replace(/\s+/g, " "));
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Map a canonical type -> value pulled from resume JSON.
   * Returns undefined if no value is available.
   */
  function resolveValue(type, resume) {
    if (!resume) return undefined;

    const p = resume.personal || {};
    const edu = (resume.education && resume.education[0]) || {};
    const exp = (resume.experience && resume.experience[0]) || {};
    const links = resume.links || {};

    switch (type) {
      case "EMAIL":
        return p.email;
      case "PHONE":
        return p.phone;
      case "FIRST_NAME":
        return p.firstName;
      case "LAST_NAME":
        return p.lastName;
      case "FULL_NAME":
        return p.fullName || [p.firstName, p.lastName].filter(Boolean).join(" ");
      case "DOB":
        return p.dob;
      case "LOCATION":
        return p.location;
      case "LINKEDIN":
        return links.linkedin;
      case "GITHUB":
        return links.github;
      case "PORTFOLIO":
        return links.portfolio;
      case "COLLEGE":
        return edu.college;
      case "DEGREE":
        return edu.degree;
      case "CGPA":
        return edu.cgpa;
      case "GRAD_YEAR":
        return edu.year;
      case "COMPANY":
        return exp.company;
      case "ROLE":
        return exp.role;
      case "EXPERIENCE_YEARS":
        return undefined; // not modeled in V1 resume JSON
      case "SKILLS":
        return (resume.skills || []).join(", ");
      default:
        return undefined;
    }
  }

  /**
   * Given detected fields + resume JSON, return an array of
   * { field, type, value } for every field that could be matched.
   * Fields skipped in V1 (checkbox/radio/file/resume upload/cover letter)
   * are excluded here too.
   */
  const SKIP_TYPES = new Set(["RESUME_UPLOAD", "COVER_LETTER"]);
  const SKIP_INPUT_TYPES = new Set(["checkbox", "radio", "file"]);

  function matchFields(fields, resume) {
    const matches = [];

    fields.forEach((field) => {
      if (SKIP_INPUT_TYPES.has(field.type)) return;

      const type = classify(field);
      if (!type || SKIP_TYPES.has(type)) return;

      const value = resolveValue(type, resume);
      if (value === undefined || value === null || value === "") return;

      matches.push({ field, type, value });
    });

    return matches;
  }

  window.RAFMatcher = { classify, resolveValue, matchFields };
})();
