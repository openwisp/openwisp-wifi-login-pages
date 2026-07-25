import axios from "axios";
import userCancelUpgradePlan from "./user-cancel-upgrade-plan-controller";

jest.mock("axios");
jest.mock("../utils/logger", () => ({
  logResponseError: jest.fn(),
}));
jest.mock("../config.json", () => [
  {
    slug: "default",
    host: "https://radius.test",
    timeout: 10,
  },
]);

const createResponse = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.type = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

describe("user-cancel-upgrade-plan-controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it("proxies the upgrade plan cancellation", async () => {
    axios.mockResolvedValueOnce({
      status: 200,
      data: {response_code: "PLAN_CANCELLED"},
    });
    const res = createResponse();
    await userCancelUpgradePlan(
      {
        params: {organization: "default"},
        headers: {
          authorization: "Bearer test-token",
          "accept-language": "en",
        },
      },
      res,
    );
    expect(axios).toHaveBeenCalledWith({
      method: "post",
      headers: {
        "content-type": "application/json",
        Authorization: "Bearer test-token",
        "accept-language": "en",
      },
      url: "https://radius.test/api/v1/subscriptions/organization/default/account/plan/cancel/",
      timeout: 10000,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.type).toHaveBeenCalledWith("application/json");
    expect(res.send).toHaveBeenCalledWith({response_code: "PLAN_CANCELLED"});
  });

  it("returns 404 for an invalid organization slug", () => {
    const res = createResponse();
    userCancelUpgradePlan(
      {
        params: {organization: "missing-org"},
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

  it("forwards the upstream error status and data", async () => {
    const error = new Error("Bad request");
    error.response = {
      status: 400,
      data: {response_code: "BAD_REQUEST"},
    };
    axios.mockImplementationOnce(() => Promise.reject(error));
    const res = createResponse();
    await userCancelUpgradePlan(
      {
        params: {organization: "default"},
        headers: {
          authorization: "Bearer test-token",
          "accept-language": "en",
        },
      },
      res,
    );
    await Promise.resolve();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.type).toHaveBeenCalledWith("application/json");
    expect(res.send).toHaveBeenCalledWith({response_code: "BAD_REQUEST"});
  });

  it("handles error without error.response.status (internal error)", async () => {
    const error = new Error("Internal server error");
    axios.mockImplementationOnce(() => Promise.reject(error));
    const res = createResponse();
    await userCancelUpgradePlan(
      {
        params: {organization: "default"},
        headers: {
          authorization: "Bearer test-token",
          "accept-language": "en",
        },
      },
      res,
    );
    await Promise.resolve();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.type).toHaveBeenCalledWith("application/json");
    expect(res.send).toHaveBeenCalledWith({
      response_code: "INTERNAL_SERVER_ERROR",
    });
  });
});
