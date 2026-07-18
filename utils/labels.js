// utils/labels.js
// Dictionary mapping canonical field types -> list of keyword phrases
// that commonly appear in labels/placeholders/names/ids for that field.
// Exposed as window.RAFLabels

(function () {
  // Order matters: more specific types are checked before generic ones
  // (see matcher.js classify()) to avoid e.g. "first name" matching FULL_NAME.
  const DICTIONARY = {
    EMAIL: [
      "email", "email address", "e mail", "official email",
      "work email", "personal email", "mail id", "mail address",
    ],

    PHONE: [
      "phone", "phone number", "mobile", "mobile number", "contact number",
      "contact", "telephone", "cell", "cell phone", "cell number",
      "whatsapp number",
    ],

    FIRST_NAME: [
      "first name", "firstname", "given name", "fname", "forename",
    ],

    LAST_NAME: [
      "last name", "lastname", "surname", "family name", "lname",
    ],

    FULL_NAME: [
      "full name", "fullname", "your name", "candidate name", "applicant name",
      "name", // deliberately last / most generic
    ],

    LOCATION: [
      "location", "current location", "city", "current city", "address",
      "residence", "based in", "state", "country",
    ],

    DOB: [
      "date of birth", "dob", "birth date", "birthday",
    ],

    LINKEDIN: [
      "linkedin", "linkedin url", "linkedin profile", "linkedin link",
    ],

    GITHUB: [
      "github", "github url", "github profile", "github link",
    ],

    PORTFOLIO: [
      "portfolio", "portfolio url", "personal website", "website", "personal site",
    ],

    COLLEGE: [
      "college", "university", "institute", "institution", "school name",
      "college name", "university name",
    ],

    DEGREE: [
      "degree", "qualification", "education level", "degree name",
    ],

    CGPA: [
      "cgpa", "gpa", "grade", "percentage", "score",
    ],

    GRAD_YEAR: [
      "graduation year", "passing year", "year of graduation", "grad year",
      "year of passing",
    ],

    COMPANY: [
      "company", "company name", "employer", "organization", "current company",
    ],

    ROLE: [
      "job title", "role", "designation", "position", "current role",
      "current title",
    ],

    EXPERIENCE_YEARS: [
      "years of experience", "total experience", "work experience", "experience",
    ],

    SKILLS: [
      "skills", "technical skills", "key skills", "skillset",
    ],

    COVER_LETTER: [
      "cover letter", "why do you want to join", "additional information",
    ],

    RESUME_UPLOAD: [
      "resume", "cv", "upload resume", "attach resume", "upload cv",
    ],
  };

  window.RAFLabels = { DICTIONARY };
})();
