import axios from "axios";
import updateRegistrationMethod from "./registration-method-controller";

jest.mock("axios");
jest.mock("../utils/logger", () => ({
  logResponseError: jest.fn(),
}));
jest.mock("../config.json", () => [
  {slug: "default", host: "https://radius.test", timeout: 10},
]);

const createResponse = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.type = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

describe("registration-method-controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it("proxies the registration method update", async () => {
    axios.mockResolvedValueOnce({
      status: 200,
      data: {method: "mobile_phone"},
    });
    const res = createResponse();
    updateRegistrationMethod(
      {
        params: {organization: "default"},
        body: {method: "mobile_phone"},
        headers: {
          authorization: "Bearer test-token",
          "accept-language": "en",
        },
      },
      res,
    );
    await Promise.resolve();
    expect(axios).toHaveBeenCalledWith({
      method: "post",
      headers: {
        "content-type": "application/json",
        Authorization: "Bearer test-token",
        "accept-language": "en",
      },
      url: "https://radius.test/api/v1/radius/organization/default/account/registration-method/",
      timeout: 10000,
      data: {method: "mobile_phone"},
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.type).toHaveBeenCalledWith("application/json");
    expect(res.send).toHaveBeenCalledWith({method: "mobile_phone"});
  });

  it("returns 404 for an invalid organization slug", () => {
    const res = createResponse();
    updateRegistrationMethod(
      {
        params: {organization: "missing-org"},
        body: {method: "mobile_phone"},
        headers: {},
      },
      res,
    );
    expect(axios).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.type).toHaveBeenCalledWith("application/json");
    expect(res.send).toHaveBeenCalledWith({
      response_code: "NOT_FOUND",
    });
  });

  it("handles error response with error.response.status", async () => {
    const error = new Error("Bad request");
    error.response = {
      status: 400,
      data: {response_code: "BAD_REQUEST"},
    };
    axios.mockImplementationOnce(() => Promise.reject(error));
    const res = createResponse();
    updateRegistrationMethod(
      {
        params: {organization: "default"},
        body: {method: "invalid"},
        headers: {
          authorization: "Bearer test-token",
          "accept-language": "en",
        },
      },
      res,
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.type).toHaveBeenCalledWith("application/json");
    expect(res.send).toHaveBeenCalledWith({response_code: "BAD_REQUEST"});
  });

  it("handles error without error.response.status (internal error)", async () => {
    const error = new Error("Internal server error");
    error.response = {
      status: 500,
      data: {response_code: "INTERNAL_SERVER_ERROR"},
    };
    axios.mockImplementationOnce(() => Promise.reject(error));
    const res = createResponse();
    updateRegistrationMethod(
      {
        params: {organization: "default"},
        body: {method: "mobile_phone"},
        headers: {
          authorization: "Bearer test-token",
          "accept-language": "en",
        },
      },
      res,
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.type).toHaveBeenCalledWith("application/json");
    expect(res.send).toHaveBeenCalledWith({
      response_code: "INTERNAL_SERVER_ERROR",
    });
  });

  it("handles request with missing headers", async () => {
    axios.mockResolvedValueOnce({
      status: 200,
      data: {method: "mobile_phone"},
    });
    const res = createResponse();
    updateRegistrationMethod(
      {
        params: {organization: "default"},
        body: {method: "mobile_phone"},
        headers: {},
      },
      res,
    );
    await Promise.resolve();
    expect(axios).toHaveBeenCalledWith({
      method: "post",
      headers: {
        "content-type": "application/json",
        Authorization: undefined,
        "accept-language": undefined,
      },
      url: "https://radius.test/api/v1/radius/organization/default/account/registration-method/",
      timeout: 10000,
      data: {method: "mobile_phone"},
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.type).toHaveBeenCalledWith("application/json");
    expect(res.send).toHaveBeenCalledWith({method: "mobile_phone"});
  });

  it("handles request with undefined headers (uses default empty object)", async () => {
    axios.mockResolvedValueOnce({
      status: 200,
      data: {method: "mobile_phone"},
    });
    const res = createResponse();
    updateRegistrationMethod(
      {
        params: {organization: "default"},
        body: {method: "mobile_phone"},
        // headers is undefined
      },
      res,
    );
    await Promise.resolve();
    expect(axios).toHaveBeenCalledWith({
      method: "post",
      headers: {
        "content-type": "application/json",
        Authorization: undefined,
        "accept-language": undefined,
      },
      url: "https://radius.test/api/v1/radius/organization/default/account/registration-method/",
      timeout: 10000,
      data: {method: "mobile_phone"},
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.type).toHaveBeenCalledWith("application/json");
    expect(res.send).toHaveBeenCalledWith({method: "mobile_phone"});
  });
});
