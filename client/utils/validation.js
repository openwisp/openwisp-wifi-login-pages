const COMMON_TYPOS = {
  "gmal.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gnail.com": "gmail.com",
  "hotmal.com": "hotmail.com",
  "yaho.com": "yahoo.com",
};

/**
 * Validates email format and checks for common typos.
 * @param {string} email
 * @returns {Object} { isValid: boolean, suggestion: string | null }
 */
export const validateEmail = (email) => {
  const regex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  const isValid = regex.test(email);

  let suggestion = null;
  if (isValid) {
    const domain = email.split("@")[1].toLowerCase();
    if (COMMON_TYPOS[domain]) {
      suggestion = email.replace(domain, COMMON_TYPOS[domain]);
    }
  }

  return {isValid, suggestion};
};

/**
 * Validates password strength.
 * Requires: At least 8 characters, one uppercase, one lowercase, one number, and one symbol.
 * @param {string} password
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number.");
  }
  if (!/[!@#$%^&*()_+={}[\]:;"'<>,.?/\\|~`]/.test(password)) {
    errors.push("Password must contain at least one special character.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default {validateEmail, validatePassword};
