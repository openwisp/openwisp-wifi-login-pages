// Utility to detect common email domain typos without blocking valid domains

const TYPO_MAP = {
  "gmal.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmail.co": "gmail.com",

  "yaho.com": "yahoo.com",
  "yhoo.com": "yahoo.com",

  "hotnail.com": "hotmail.com",
  "hotmai.com": "hotmail.com",

  "outlok.com": "outlook.com",
  "outllok.com": "outlook.com",

  "iclod.com": "icloud.com",
  "icloud.co": "icloud.com",
};

export function checkDomainTypo(email) {
  if (!email || !email.includes("@")) return null;

  const parts = email.split("@");
  if (parts.length !== 2) return null;

  const name = parts[0];
  const domain = parts[1].toLowerCase();

  if (TYPO_MAP[domain]) {
    return `${name}@${TYPO_MAP[domain]}`;
  }

  return null;
}