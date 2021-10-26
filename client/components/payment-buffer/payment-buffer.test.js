/* eslint-disable prefer-promise-reject-errors */
import {shallow} from "enzyme";
import React from "react";
import PropTypes from "prop-types";
import {loadingContextValue} from "../../utils/loading-context";
import PaymentBuffer from "./payment-buffer";
import tick from "../../utils/tick";
import getPaymentStatus from "../../utils/get-payment-status";
import loadTranslation from "../../utils/load-translation";

jest.mock("axios");
jest.mock("../../utils/get-payment-status");
jest.mock("../../utils/load-translation");

const createTestProps = (props) => ({
  orgSlug: "default",
  settings: {oneTimeTokenName: "status_token"},
  location: {
    search:
      "?status_token=MagicToken&payment_id=af906397-64e3-4343-ae4e-3c6ee416a205",
  },
  ...props,
});

describe("Test <PaymentBuffer /> URL query_param absent", () => {
  let props;
  let wrapper;
  const originalLog = console.log;

  beforeAll(() => {
    delete window.location;
    window.location = {
      search: "",
    };
  });

  beforeEach(() => {
    props = createTestProps();
    PaymentBuffer.contextTypes = {
      setLoading: PropTypes.func,
    };
    console.log = jest.fn();
    console.error = jest.fn();
    loadTranslation("en", "default");
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
    console.log = originalLog;
  });

  it("should redirect unauthenticated user to login", async () => {
    props = createTestProps();
    wrapper = shallow(<PaymentBuffer {...props} />, {
      context: loadingContextValue,
    });
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/login");

    window.location.search = "?status_token=MagicToken";
    wrapper = shallow(<PaymentBuffer {...props} />, {
      context: loadingContextValue,
    });
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/login");

    window.location.search = "?payment_id=af906397-64e3-4343-ae4e-3c6ee416a205";
    wrapper = shallow(<PaymentBuffer {...props} />, {
      context: loadingContextValue,
    });
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/login");
  });

  it("should redirect authenticated user to status", async () => {
    props = createTestProps({
      location: {search: "?status_token=MagicToken"},
      isAuthenticated: true,
    });
    wrapper = shallow(<PaymentBuffer {...props} />, {
      context: loadingContextValue,
    });
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");

    window.location.search = "?status_token=MagicToken";
    wrapper = shallow(<PaymentBuffer {...props} />, {
      context: loadingContextValue,
    });
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");

    window.location.search = "?payment_id=af906397-64e3-4343-ae4e-3c6ee416a205";
    wrapper = shallow(<PaymentBuffer {...props} />, {
      context: loadingContextValue,
    });
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
  });
});

describe("Test <PaymentBuffer /> query_param present", () => {
  let props;
  let wrapper;
  const originalLog = console.log;

  beforeAll(() => {
    delete window.location;
    window.location = {
      search:
        "?status_token=MagicToken&payment_id=af906397-64e3-4343-ae4e-3c6ee416a205",
    };
  });

  beforeEach(() => {
    props = createTestProps();
    PaymentBuffer.contextTypes = {
      setLoading: PropTypes.func,
    };
    getPaymentStatus.mockClear();
    console.log = jest.fn();
    console.error = jest.fn();
    loadTranslation("en", "default");
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
    console.log = originalLog;
  });

  it("should redirect authenticated user payment status", async () => {
    props = createTestProps({isAuthenticated: true});
    getPaymentStatus.mockReturnValue("success");
    wrapper = shallow(<PaymentBuffer {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual(
      "/default/payment/success",
    );

    getPaymentStatus.mockReturnValue("failed");
    wrapper = shallow(<PaymentBuffer {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual(
      "/default/payment/failed",
    );

    getPaymentStatus.mockReturnValue("waiting");
    wrapper = shallow(<PaymentBuffer {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual(
      "/default/payment/draft",
    );
  });

  it("should show payment status to unauthenticated user", async () => {
    props = createTestProps();
    getPaymentStatus.mockReturnValue("success");
    wrapper = shallow(<PaymentBuffer {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper).toMatchSnapshot();

    getPaymentStatus.mockReturnValue("failed");
    wrapper = shallow(<PaymentBuffer {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper).toMatchSnapshot();

    getPaymentStatus.mockReturnValue("waiting");
    wrapper = shallow(<PaymentBuffer {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper).toMatchSnapshot();
  });
});
