const LEGACY_EMAIL_PATTERNS = new Set([".+@.+\\..+", ".+@.+..+"]);

export const DEFAULT_EMAIL_PATTERN =
  "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";

const COMMON_EMAIL_DOMAIN_TYPOS = {
  "gmal.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmail.con": "gmail.com",
  "yaho.com": "yahoo.com",
  "hotnail.com": "hotmail.com",
  "outlok.com": "outlook.com",
};

export const getSafeEmailPattern = (pattern) => {
  if (!pattern || LEGACY_EMAIL_PATTERNS.has(pattern)) {
    return DEFAULT_EMAIL_PATTERN;
  }
  return pattern;
};

export const getEmailTypoSuggestion = (email = "") => {
  const normalizedEmail = email.trim();
  const atIndex = normalizedEmail.lastIndexOf("@");

  if (atIndex <= 0 || atIndex === normalizedEmail.length - 1) {
    return null;
  }

  const localPart = normalizedEmail.slice(0, atIndex);
  const domain = normalizedEmail.slice(atIndex + 1).toLowerCase();
  const correctedDomain = COMMON_EMAIL_DOMAIN_TYPOS[domain];

  if (!correctedDomain) {
    return null;
  }

  return `${localPart}@${correctedDomain}`;
};
