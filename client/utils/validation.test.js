import {validateEmail, validatePassword} from "./validation";

describe("Validation utilities", () => {
  describe("validateEmail", () => {
    it("should return isValid: true for correct email formats", () => {
      expect(validateEmail("test@example.com").isValid).toBe(true);
      expect(validateEmail("user.name@domain.co").isValid).toBe(true);
    });

    it("should return isValid: false for incorrect email formats", () => {
      expect(validateEmail("plainaddress").isValid).toBe(false);
      expect(validateEmail("@example.com").isValid).toBe(false);
    });

    it("should return a suggestion for common typos", () => {
      expect(validateEmail("user@gmal.com").suggestion).toBe("user@gmail.com");
    });
  });

  describe("validatePassword", () => {
    it("should return isValid: true for strong passwords", () => {
      expect(validatePassword("StrongPass123!").isValid).toBe(true);
    });

    it("should return isValid: false for weak passwords", () => {
      expect(validatePassword("weak").isValid).toBe(false); // too short
      expect(validatePassword("lowercase123!").isValid).toBe(false); // no uppercase
      expect(validatePassword("UPPERCASE123!").isValid).toBe(false); // no lowercase
      expect(validatePassword("NoDigits!").isValid).toBe(false); // no digits
      expect(validatePassword("NoSymbol123").isValid).toBe(false); // no symbol
    });

    it("should return specific error messages", () => {
      const result = validatePassword("short");
      expect(result.errors).toContain(
        "Password must be at least 8 characters long.",
      );
      expect(result.errors).toContain(
        "Password must contain at least one uppercase letter.",
      );
      expect(result.errors).toContain(
        "Password must contain at least one special character.",
      );
    });
  });
});
