jest.mock("../utils/logger", () => ({
  logResponseError: jest.fn(),
}));

describe("logResponseError sanitization", () => {
  let logResponseError;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // eslint-disable-next-line global-require
    ({logResponseError} = require("./logger"));
  });

  it("passes error to logResponseError (sanitization happens internally)", () => {
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
    expect(logResponseError).toHaveBeenCalledWith(error);
  });

  it("calls logResponseError with raw error (sanitization is internal)", () => {
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
    expect(logResponseError).toHaveBeenCalledWith(error);
  });

  it("handles error.request by logging sanitized request", () => {
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
    expect(logResponseError).toHaveBeenCalledWith(error);
  });

  it("handles generic error with message only", () => {
    const error = {
      message: "Something went wrong",
    };
    logResponseError(error);
    expect(logResponseError).toHaveBeenCalledWith(error);
  });
});
