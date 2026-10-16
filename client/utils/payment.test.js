import axios from "axios";
import {
  getGateways,
  getPaymentRoute,
  requiresInternet,
  clearPaymentReturnContext,
  selectGateway,
  storePaymentReturnContext,
  takePaymentReturnContext,
  usesPaymentIframe,
} from "./payment";
import {sessionStorage} from "./storage";

jest.mock("axios");

describe("payment utilities", () => {
  afterEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it("fetches gateway metadata", async () => {
    const data = {payment_id: "payment-id", gateways: []};
    axios.mockResolvedValueOnce({data});
    await expect(
      getGateways("default", "payment-id", "token", "en"),
    ).resolves.toEqual(data);
    expect(axios).toHaveBeenCalledWith({
      method: "get",
      headers: {
        "content-type": "application/json",
        "accept-language": "en,en-US,en",
        Authorization: "Bearer token",
      },
      url: "/api/v1/default/payment/payment-id/gateway",
    });
  });

  it("selects a gateway", async () => {
    const data = {payment_gateway: "dummy"};
    axios.mockResolvedValueOnce({data});
    await expect(
      selectGateway("default", "payment-id", "dummy", "token", "en"),
    ).resolves.toEqual(data);
    expect(axios).toHaveBeenCalledWith({
      method: "patch",
      headers: {
        "content-type": "application/json",
        "accept-language": "en,en-US,en",
        Authorization: "Bearer token",
      },
      url: "/api/v1/default/payment/payment-id/gateway",
      data: {gateway: "dummy"},
    });
  });

  it("requires internet when the selected gateway requires it", () => {
    expect(requiresInternet({payment_requires_internet: true}, {})).toBe(true);
  });

  it("does not require internet when the selected gateway is offline", () => {
    expect(requiresInternet({payment_requires_internet: false}, {})).toBe(
      false,
    );
  });

  it("returns null when no gateway is selected", () => {
    expect(requiresInternet({payment_requires_internet: null}, {})).toBe(null);
  });

  it("uses the organization setting for a legacy payment", () => {
    expect(requiresInternet({}, {payment_requires_internet: true})).toBe(true);
  });

  it("uses the selected gateway iframe policy over the organization setting", () => {
    expect(
      usesPaymentIframe({payment_iframe: true}, {payment_iframe: false}),
    ).toBe(true);
    expect(
      usesPaymentIframe({payment_iframe: false}, {payment_iframe: true}),
    ).toBe(false);
  });

  it("uses the organization iframe policy for a legacy payment", () => {
    expect(usesPaymentIframe({}, {payment_iframe: true})).toBe(true);
    expect(usesPaymentIframe({}, {payment_iframe: false})).toBe(false);
  });

  it("keeps an unselected payment iframe policy as null", () => {
    expect(usesPaymentIframe({payment_iframe: null}, {})).toBe(null);
  });

  it("restores an external payment return context once", () => {
    const userData = {
      in_upgrade: true,
      payment_requires_internet: false,
    };
    storePaymentReturnContext(userData, {});

    expect(takePaymentReturnContext()).toEqual({
      inUpgrade: true,
      paymentRequiresInternet: false,
    });
    expect(takePaymentReturnContext()).toBe(null);
  });

  it("clears a pending payment return context", () => {
    storePaymentReturnContext(
      {in_upgrade: true, payment_requires_internet: false},
      {},
    );

    clearPaymentReturnContext();

    expect(takePaymentReturnContext()).toBe(null);
  });

  it("rejects malformed payment return contexts", () => {
    sessionStorage.setItem("ow_payment_return_context", "not json");

    expect(takePaymentReturnContext()).toBe(null);
  });

  it("does not store a context before gateway selection", () => {
    storePaymentReturnContext(
      {
        payment_requires_internet: null,
      },
      {},
    );

    expect(takePaymentReturnContext()).toBe(null);
  });

  it("routes an unselected gateway-aware payment to the gateway page", () => {
    const userData = {
      payment_id: "payment-id",
      payment_requires_internet: null,
      payment_iframe: null,
    };
    expect(
      getPaymentRoute("default", userData, {payment_requires_internet: true}),
    ).toBe("/default/payment/gateway");
  });

  it("routes an internet-requiring gateway-aware payment to the draft page", () => {
    const userData = {
      payment_id: "payment-id",
      payment_requires_internet: true,
    };
    expect(
      getPaymentRoute("default", userData, {payment_requires_internet: false}),
    ).toBe("/default/payment/draft");
  });

  it("routes an offline gateway-aware payment to the process page", () => {
    const userData = {
      payment_id: "payment-id",
      payment_requires_internet: false,
    };
    expect(
      getPaymentRoute("default", userData, {payment_requires_internet: true}),
    ).toBe("/default/payment/process");
  });

  it("routes a legacy internet-requiring payment to the draft page", () => {
    const userData = {payment_url: "https://payments.example/pay"};
    expect(
      getPaymentRoute("default", userData, {payment_requires_internet: true}),
    ).toBe("/default/payment/draft");
  });

  it("routes a legacy offline payment to the process page", () => {
    const userData = {payment_url: "https://payments.example/pay"};
    expect(
      getPaymentRoute("default", userData, {payment_requires_internet: false}),
    ).toBe("/default/payment/process");
  });

  it("routes to the status page when there is no pending payment", () => {
    expect(
      getPaymentRoute("default", {}, {payment_requires_internet: true}),
    ).toBe("/default/status");
  });
});
