import handleCaptivePortalLogin from "./captive-portal-handler";

describe("handleCaptivePortalLogin", () => {
  const originalLocation = window.location;
  beforeEach(() => {
    delete window.location;
    window.location = {...originalLocation};
  });
  afterAll(() => {
    window.location = originalLocation;
  });

  it("should set captivePortalError when res is failed and reply exists", () => {
    window.location.search =
      "?res=failed&reply=Maximum%20usage%20time%20reached";
    const mockSetCaptivePortalError = jest.fn();
    handleCaptivePortalLogin(
      {method: "POST", action: "https://example.com/login"},
      mockSetCaptivePortalError,
    );
    expect(mockSetCaptivePortalError).toHaveBeenCalledWith({
      type: "authError",
      message: "Maximum usage time reached",
    });
  });

  it("should set captivePortalError to null when res is not failed", () => {
    window.location.search = "?res=success";
    const mockSetCaptivePortalError = jest.fn();
    handleCaptivePortalLogin(
      {method: "POST", action: "https://example.com/login"},
      mockSetCaptivePortalError,
    );
    expect(mockSetCaptivePortalError).toHaveBeenCalledWith(null);
  });

  it("should set captivePortalError to null when no res parameter exists", () => {
    window.location.search = "?someOtherParam=value";
    const mockSetCaptivePortalError = jest.fn();
    handleCaptivePortalLogin(
      {method: "POST", action: "https://example.com/login"},
      mockSetCaptivePortalError,
    );
    expect(mockSetCaptivePortalError).toHaveBeenCalledWith(null);
  });

  it("should set captivePortalError to null when res is failed but no reply exists", () => {
    window.location.search = "?res=failed";
    const mockSetCaptivePortalError = jest.fn();
    handleCaptivePortalLogin(
      {method: "POST", action: "https://example.com/login"},
      mockSetCaptivePortalError,
    );
    expect(mockSetCaptivePortalError).toHaveBeenCalledWith(null);
  });

  it("should handle URL-encoded reply parameter correctly", () => {
    window.location.search =
      "?res=failed&reply=Maximum%20usage%20time%20reached";
    const mockSetCaptivePortalError = jest.fn();
    handleCaptivePortalLogin(
      {method: "POST", action: "https://example.com/login"},
      mockSetCaptivePortalError,
    );
    expect(mockSetCaptivePortalError).toHaveBeenCalledWith({
      type: "authError",
      message: "Maximum usage time reached",
    });
  });
});
