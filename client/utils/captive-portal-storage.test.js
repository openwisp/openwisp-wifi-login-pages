import {resolveStoredValue} from "./captive-portal-storage";
import {localStorage} from "./storage";

// Mock the internal storage dependency
jest.mock("./storage", () => ({
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe("captive-portal-storage utility", () => {
  let mockCookies;

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();

    mockCookies = {
      get: jest.fn(),
      set: jest.fn(),
    };
  });

  describe("resolveStoredValue", () => {
    const key = "testKey";
    const fallback = "fallbackValue";

    it("returns fallback when captivePortalSyncAuth is false", () => {
      const result = resolveStoredValue(false, key, fallback, mockCookies);
      expect(result).toBe(fallback);
      expect(mockCookies.get).not.toHaveBeenCalled();
    });

    it("returns true and removes localStorage when cookie exists", () => {
      mockCookies.get.mockReturnValue("true"); // Cookie exists

      const result = resolveStoredValue(true, key, fallback, mockCookies);

      expect(result).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith(key);
    });

    it("returns true and removes localStorage when cookie is undefined but localStorage exists", () => {
      mockCookies.get.mockReturnValue(undefined); // No cookie
      localStorage.getItem.mockReturnValue("true"); // Has localStorage

      const result = resolveStoredValue(true, key, fallback, mockCookies);

      expect(result).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith(key);
    });

    it("returns fallback when neither cookie nor localStorage is present", () => {
      mockCookies.get.mockReturnValue(undefined);
      localStorage.getItem.mockReturnValue(null);

      const result = resolveStoredValue(true, key, fallback, mockCookies);

      expect(result).toBe(fallback);
    });
  });
});
