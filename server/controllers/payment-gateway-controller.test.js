import axios from "axios";
import paymentGateway from "./payment-gateway-controller";

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

const paymentId = "123e4567-e89b-12d3-a456-426614174000";
const request = (method, body) => ({
  method,
  params: {organization: "default", paymentId},
  headers: {
    authorization: "Bearer test-token",
    "accept-language": "en",
  },
  body,
});

describe("payment-gateway-controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it("proxies gateway metadata requests", async () => {
    const data = {payment_id: paymentId, gateways: []};
    axios.mockResolvedValueOnce({status: 200, data});
    const res = createResponse();
    await paymentGateway(request("GET"), res);
    expect(axios).toHaveBeenCalledWith({
      method: "get",
      headers: {
        "content-type": "application/json",
        Authorization: "Bearer test-token",
        "accept-language": "en",
      },
      url: `https://radius.test/api/v1/subscriptions/organization/default/payment/${paymentId}/gateway/`,
      timeout: 10000,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.type).toHaveBeenCalledWith("application/json");
    expect(res.send).toHaveBeenCalledWith(data);
  });

  it("proxies gateway selections", async () => {
    const data = {payment_gateway: "dummy"};
    axios.mockResolvedValueOnce({status: 200, data});
    const res = createResponse();
    await paymentGateway(request("PATCH", {gateway: "dummy"}), res);
    expect(axios).toHaveBeenCalledWith({
      method: "patch",
      headers: {
        "content-type": "application/json",
        Authorization: "Bearer test-token",
        "accept-language": "en",
      },
      url: `https://radius.test/api/v1/subscriptions/organization/default/payment/${paymentId}/gateway/`,
      timeout: 10000,
      data: {gateway: "dummy"},
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(data);
  });

  it("returns 404 for an invalid organization slug", () => {
    const res = createResponse();
    const invalidRequest = {
      ...request("GET"),
      params: {organization: "missing-org", paymentId},
    };
    paymentGateway(invalidRequest, res);
    expect(axios).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.type).toHaveBeenCalledWith("application/json");
    expect(res.send).toHaveBeenCalledWith({response_code: "NOT_FOUND"});
  });

  it.each([
    "payment-id",
    "../../some/path?",
    "123e4567-e89b-12d3-a456-42661417400",
  ])("returns 400 for invalid payment id %s", (invalidId) => {
    const res = createResponse();
    const invalidRequest = {
      ...request("GET"),
      params: {organization: "default", paymentId: invalidId},
    };
    paymentGateway(invalidRequest, res);
    expect(axios).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.type).toHaveBeenCalledWith("application/json");
    expect(res.send).toHaveBeenCalledWith({
      response_code: "INVALID_PAYMENT_ID",
    });
  });

  it("forwards upstream errors", async () => {
    const error = new Error("Bad request");
    error.response = {status: 400, data: {gateway: ["Invalid gateway."]}};
    axios.mockRejectedValueOnce(error);
    const res = createResponse();
    await paymentGateway(request("PATCH", {gateway: "unknown"}), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.type).toHaveBeenCalledWith("application/json");
    expect(res.send).toHaveBeenCalledWith({gateway: ["Invalid gateway."]});
  });

  it("returns 500 for network errors", async () => {
    axios.mockRejectedValueOnce(new Error("Network unavailable"));
    const res = createResponse();
    await paymentGateway(request("GET"), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.type).toHaveBeenCalledWith("application/json");
    expect(res.send).toHaveBeenCalledWith({
      response_code: "INTERNAL_SERVER_ERROR",
    });
  });
});
