import Logger, {logResponseError} from "./logger";

describe("logResponseError sanitization", () => {
  let errorSpy;
  let infoSpy;

  beforeEach(() => {
    errorSpy = jest.spyOn(Logger, "error").mockImplementation(() => {});
    infoSpy = jest.spyOn(Logger, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("redacts authorization headers for 5xx responses", () => {
    const error = {
      response: {
        status: 500,
        data: {},
        config: {
          url: "https://radius.test/api/v1/test",
          method: "post",
          headers: {
            "content-type": "application/json",
            Authorization: "Bearer secret-token",
            authorization: "Bearer lowercase-token",
            AUTHORIZATION: "Bearer uppercase-token",
          },
        },
      },
    };
    logResponseError(error);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const loggedArg = errorSpy.mock.calls[0][0];
    expect(loggedArg.config.headers).toEqual({
      Authorization: "[REDACTED]",
      authorization: "[REDACTED]",
      AUTHORIZATION: "[REDACTED]",
      "content-type": "application/json",
    });
  });

  it("does not log headers for non-5xx but logs message safely", () => {
    const error = {
      response: {
        status: 400,
        data: {response_code: "BAD_REQUEST"},
        config: {
          url: "https://radius.test/api/v1/test",
          method: "post",
          headers: {
            Authorization: "Bearer secret-token",
          },
        },
      },
    };
    logResponseError(error);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    const message = infoSpy.mock.calls[0][0];
    expect(message).not.toContain("secret-token");
    expect(message).toContain("400");
  });

  it("sanitizes request object (no headers leakage)", () => {
    const error = {
      message: "Network Error",
      request: {
        path: "/api/v1/test",
        method: "post",
        headers: {
          Authorization: "Bearer secret-token",
        },
      },
    };
    logResponseError(error);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const loggedArg = errorSpy.mock.calls[0][0];
    expect(loggedArg.request).toEqual({
      path: "/api/v1/test",
      method: "post",
    });
    expect(JSON.stringify(loggedArg)).not.toContain("secret-token");
  });

  it("logs generic error message safely", () => {
    const error = {
      message: "Something went wrong",
    };
    logResponseError(error);
    expect(errorSpy).toHaveBeenCalledWith("Something went wrong");
  });
});
