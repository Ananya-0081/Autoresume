// parser/extractor.js
// Turns raw resume text (from pdfParser.js) into the structured resume
// JSON described in the project spec. Pure regex/heuristics, no AI.
// Exposed as window.RAFExtractor

(function () {
  const R = window.RAFRegex;

  function splitLines(text) {
    return text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }

  // ---------- Top-level single-value fields ----------

  function extractEmail(text) {
    const m = text.match(R.EMAIL);
    return m ? m[0] : "";
  }

  function extractPhone(text) {
    const m = text.match(R.PHONE);
    return m ? m[0].trim() : "";
  }

  function extractGithub(text) {
    const m = text.match(R.GITHUB);
    return m ? (m[0].startsWith("http") ? m[0] : `https://${m[0]}`) : "";
  }

  function extractLinkedin(text) {
    const m = text.match(R.LINKEDIN);
    return m ? (m[0].startsWith("http") ? m[0] : `https://${m[0]}`) : "";
  }

  function extractPortfolio(text, github, linkedin) {
    const urls = text.match(new RegExp(R.PORTFOLIO_URL, "gi")) || [];
    const other = urls.find(
      (u) => !u.includes("github.com") && !u.includes("linkedin.com")
    );
    return other || "";
  }

  /**
   * Best-effort name guess: usually the very first non-empty line of the
   * resume, provided it doesn't look like a section header, an email, or
   * contain lots of digits/punctuation.
   */
  function extractName(lines) {
    for (const line of lines.slice(0, 5)) {
      if (R.EMAIL.test(line)) continue;
      if (R.PHONE.test(line) && line.replace(/\D/g, "").length >= 7) continue;
      if (/^https?:\/\//i.test(line)) continue;
      const words = line.split(/\s+/);
      if (words.length >= 1 && words.length <= 4 && /^[A-Za-z.\s'-]+$/.test(line)) {
        return line;
      }
    }
    return "";
  }

  // ---------- Section splitting ----------

  const SECTION_MATCHERS = [
    ["education", R.SECTION_EDUCATION],
    ["experience", R.SECTION_EXPERIENCE],
    ["projects", R.SECTION_PROJECTS],
    ["skills", R.SECTION_SKILLS],
  ];

  /**
   * Walk the lines once, bucketing them under whichever section header
   * was last seen. Lines before the first header go into "header".
   */
  function splitIntoSections(lines) {
    const sections = { header: [] };
    let current = "header";

    lines.forEach((line) => {
      const found = SECTION_MATCHERS.find(([, re]) => re.test(line));
      if (found) {
        current = found[0];
        sections[current] = sections[current] || [];
        return; // header line itself isn't content
      }
      sections[current] = sections[current] || [];
      sections[current].push(line);
    });

    return sections;
  }

  // ---------- Education ----------

  function extractEducation(lines = []) {
    const entries = [];
    let current = null;

    lines.forEach((line) => {
      const degreeMatch = line.match(R.DEGREE);
      const yearMatch = line.match(R.YEAR_RANGE) || line.match(R.YEAR_SINGLE);
      const cgpaMatch = line.match(R.CGPA);

      const looksLikeNewEntry = degreeMatch || /college|university|institute/i.test(line);

      if (looksLikeNewEntry) {
        if (current) entries.push(current);
        current = { college: "", degree: "", cgpa: "", year: "" };
      }
      if (!current) current = { college: "", degree: "", cgpa: "", year: "" };

      if (/college|university|institute/i.test(line) && !current.college) {
        current.college = line;
      }
      if (degreeMatch && !current.degree) {
        current.degree = line;
      }
      if (cgpaMatch && !current.cgpa) {
        current.cgpa = cgpaMatch[1];
      }
      if (yearMatch && !current.year) {
        current.year = yearMatch[0];
      }
    });

    if (current && (current.college || current.degree)) entries.push(current);
    return entries;
  }

  // ---------- Experience ----------

  function extractExperience(lines = []) {
    const entries = [];
    let current = null;

    lines.forEach((line) => {
      const yearMatch = line.match(R.YEAR_RANGE);
      const startsNewEntry = /\b(inc|ltd|llc|technologies|systems|solutions|pvt)\b/i.test(
        line
      ) || (yearMatch && !current);

      if (startsNewEntry) {
        if (current) entries.push(current);
        current = { company: "", role: "", duration: "" };
      }
      if (!current) current = { company: "", role: "", duration: "" };

      if (yearMatch && !current.duration) current.duration = yearMatch[0];
      if (!current.company && /\b(inc|ltd|llc|technologies|systems|solutions|pvt)\b/i.test(line)) {
        current.company = line;
      } else if (!current.role && !yearMatch) {
        current.role = line;
      }
    });

    if (current && (current.company || current.role)) entries.push(current);
    return entries;
  }

  // ---------- Projects ----------

  function extractProjects(lines = []) {
    const projects = [];
    let current = null;

    lines.forEach((line) => {
      // Short lines with no verbs / punctuation are likely titles
      const isLikelyTitle = line.length < 70 && !/[.]{1}\s/.test(line) && (current === null || line === line.trim());

      if (!current || (isLikelyTitle && current.description)) {
        if (current) projects.push(current);
        current = { title: line, description: "", tech: [] };
        return;
      }

      current.description += (current.description ? " " : "") + line;
    });

    if (current) projects.push(current);

    // Pull a tech list out of each description, if present
    projects.forEach((proj) => {
      const techLine = proj.description.match(/tech(nologies)?\s*:\s*(.+)/i);
      if (techLine) {
        proj.tech = techLine[2].split(R.SKILL_SPLIT).map((t) => t.trim()).filter(Boolean);
      }
    });

    return projects;
  }

  // ---------- Skills ----------

  function extractSkills(lines = []) {
    const raw = lines.join(", ");
    return raw
      .split(R.SKILL_SPLIT)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 40);
  }

  // ---------- Top-level orchestrator ----------

  function extractResume(text) {
    const lines = splitLines(text);
    const sections = splitIntoSections(lines);

    const email = extractEmail(text);
    const phone = extractPhone(text);
    const github = extractGithub(text);
    const linkedin = extractLinkedin(text);
    const portfolio = extractPortfolio(text, github, linkedin);
    const fullName = extractName(lines);
    const [firstName, ...rest] = fullName ? fullName.split(/\s+/) : [""];

    return {
      personal: {
        firstName: firstName || "",
        lastName: rest.join(" ") || "",
        fullName: fullName || "",
        email,
        phone,
        dob: "",
        location: "",
      },
      education: extractEducation(sections.education),
      experience: extractExperience(sections.experience),
      projects: extractProjects(sections.projects),
      skills: extractSkills(sections.skills),
      links: { github, linkedin, portfolio },
    };
  }

  window.RAFExtractor = { extractResume, splitIntoSections };
})();
