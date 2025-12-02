import authenticate from "./authenticate";
import {sessionStorage} from "./storage";

describe("authenticate", () => {
  let cookies;
  beforeEach(() => {
    cookies = {
      get: jest.fn(),
      remove: jest.fn(),
    };
    sessionStorage.getItem = jest.fn();
  });

  test("returns true when sessionStorage has the auth token and does not remove cookies", () => {
    sessionStorage.getItem.mockReturnValue("some-session-key");
    cookies.get.mockReturnValue(undefined);

    const result = authenticate(cookies, "org");
    expect(result).toBe(true);
    expect(cookies.remove).not.toHaveBeenCalled();
  });

  test("returns true when cookie token is present", () => {
    sessionStorage.getItem.mockReturnValue(undefined);
    cookies.get.mockReturnValue("cookie-token");

    const result = authenticate(cookies, "org");
    expect(result).toBe(true);
    expect(cookies.remove).not.toHaveBeenCalled();
  });

  test("returns false when no sessionKey and no cookie token", () => {
    sessionStorage.getItem.mockReturnValue(undefined);
    cookies.get.mockReturnValue(undefined);

    const result = authenticate(cookies, "org");
    expect(result).toBe(false);
    expect(cookies.remove).not.toHaveBeenCalled();
  });
});
