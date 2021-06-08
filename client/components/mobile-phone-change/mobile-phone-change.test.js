/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable camelcase */
import axios from "axios";
import {mount} from "enzyme";
import React from "react";
import PropTypes from "prop-types";
import {Cookies} from "react-cookie";
import {toast} from "react-toastify";
import {Provider} from "react-redux";
import {Redirect, Router} from "react-router-dom";
import {createMemoryHistory} from "history";
import PhoneInput from "react-phone-input-2";
import {loadingContextValue} from "../../utils/loading-context";
import getConfig from "../../utils/get-config";
import tick from "../../utils/tick";
import MobilePhoneChangeWrapped from "./mobile-phone-change";
import validateToken from "../../utils/validateToken";

const MobilePhoneChange = MobilePhoneChangeWrapped.WrappedComponent;
jest.mock("../../utils/get-config");
jest.mock("../../utils/validateToken");
jest.mock("axios");

const createTestProps = function (props, configName = "test-org-2") {
  const conf = getConfig(configName);
  const componentConf = conf.components.phone_number_change_form;
  componentConf.input_fields = {
    phone_number: conf.components.registration_form.input_fields.phone_number,
  };
  componentConf.text = {
    token_sent: conf.components.mobile_phone_verification_form.text.token_sent,
  };
  return {
    phone_number_change: componentConf,
    settings: conf.settings,
    orgSlug: conf.slug,
    language: "en",
    cookies: new Cookies(),
    logout: jest.fn(),
    verifyMobileNumber: jest.fn(),
    setUserData: jest.fn(),
    userData: {},
    // needed for subcomponents
    configuration: conf,
    ...props,
  };
};

const historyMock = createMemoryHistory();
historyMock.entries = [];
historyMock.location.key = "";

const mountComponent = function (props) {
  const mockedStore = {
    subscribe: () => {},
    dispatch: () => {},
    // needed to render <Contact/>
    getState: () => {
      return {
        organization: {
          configuration: props.configuration,
        },
        language: props.language,
      };
    },
  };

  return mount(
    <Provider store={mockedStore}>
      <Router history={historyMock}>
        <MobilePhoneChangeWrapped {...props} />
      </Router>
    </Provider>,
    {
      context: {
        store: mockedStore,
        ...loadingContextValue,
      },
      childContextTypes: {
        store: PropTypes.object.isRequired,
        setLoading: PropTypes.func,
        getLoading: PropTypes.func,
      },
    },
  );
};

const userData = {
  response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
  radius_user_token: "o6AQLY0aQjD3yuihRKLknTn8krcQwuy2Av6MCsFB",
  username: "tester@tester.com",
  is_active: false,
  phone_number: "+393660011222",
};

describe("Change Phone Number: standard flow", () => {
  let props;
  let wrapper;
  let lastConsoleOutuput;
  let originalError;
  const event = {preventDefault: jest.fn()};

  beforeEach(() => {
    props = createTestProps();
    validateToken.mockClear();
    // console mocking
    originalError = console.error;
    lastConsoleOutuput = null;
    console.error = (data) => {
      lastConsoleOutuput = data;
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
    console.error = originalError;
  });

  it("should render successfully", async () => {
    validateToken.mockReturnValue(true);
    props.userData = userData;
    wrapper = await mountComponent(props);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists(MobilePhoneChange)).toBe(true);
    expect(wrapper.exists(PhoneInput)).toBe(true);

    const component = wrapper.find(MobilePhoneChange);
    expect(component.instance().state.phone_number).toBe("+393660011222");
    expect(component.find("form")).toHaveLength(1);
    expect(component.exists("#phone-number")).toBe(true);
    expect(component.exists("form input[type='submit']")).toBe(true);
    expect(component.exists(".row .button")).toBe(true);
  });

  it("should change phone number successfully", async () => {
    jest.spyOn(MobilePhoneChange.prototype, "handleSubmit");
    validateToken.mockReturnValue(true);
    jest.spyOn(toast, "info");
    jest.spyOn(historyMock, "push");
    axios.mockImplementationOnce(() => {
      return Promise.resolve({
        status: 200,
        statusText: "OK",
        data: null,
      });
    });

    wrapper = await mountComponent(props);
    const component = wrapper.find(MobilePhoneChange);
    component.find("#phone-number").simulate("change", {
      target: {value: "+393660011333", name: "phone_number"},
    });
    expect(component.instance().state.phone_number).toBe("+393660011333");

    wrapper.find("form").simulate("submit", event);
    await tick();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(MobilePhoneChange.prototype.handleSubmit).toHaveBeenCalled();
    expect(toast.info.mock.calls.length).toBe(1);
    expect(historyMock.push).toHaveBeenCalledWith(
      "/test-org-2/mobile-phone-verification",
    );
    expect(lastConsoleOutuput).toBe(null);
    const mockVerify = component.instance().props.verifyMobileNumber;
    expect(mockVerify.mock.calls.length).toBe(1);
    expect(mockVerify.mock.calls.pop()).toEqual([true]);
  });

  it("should render field error", async () => {
    jest.spyOn(MobilePhoneChange.prototype, "handleSubmit");
    jest.spyOn(toast, "info");
    jest.spyOn(historyMock, "push");
    axios.mockImplementationOnce(() => {
      return Promise.reject({
        response: {
          status: 400,
          statusText: "OK",
          data: {
            phone_number: [
              "The new phone number must be different than the old one.",
            ],
          },
        },
      });
    });

    wrapper = await mountComponent(props);
    const component = wrapper.find(MobilePhoneChange);
    wrapper.find("form").simulate("submit", event);
    await tick();
    expect(toast.info).not.toHaveBeenCalled();
    expect(historyMock.push).not.toHaveBeenCalled();
    expect(component.instance().state.errors.phone_number).toEqual([
      "The new phone number must be different than the old one.",
    ]);
    expect(component.instance().state.errors.nonField).toBeFalsy();
  });

  it("should render nonField error", async () => {
    jest.spyOn(MobilePhoneChange.prototype, "handleSubmit");
    jest.spyOn(toast, "info");
    jest.spyOn(historyMock, "push");
    axios.mockImplementationOnce(() => {
      return Promise.reject({
        response: {
          status: 400,
          statusText: "OK",
          data: {
            non_field_errors: ["Maximum daily limit reached."],
          },
        },
      });
    });

    wrapper = await mountComponent(props);
    const component = wrapper.find(MobilePhoneChange);
    wrapper.find("form").simulate("submit", event);
    await tick();
    expect(toast.info).not.toHaveBeenCalled();
    expect(historyMock.push).not.toHaveBeenCalled();
    expect(component.instance().state.errors.nonField).toEqual(
      "Maximum daily limit reached.",
    );
    expect(component.instance().state.errors.phone_number).toBeFalsy();
    expect(lastConsoleOutuput).not.toBe(null);
  });

  it("should cancel successfully", async () => {
    jest.spyOn(MobilePhoneChange.prototype, "handleSubmit");
    jest.spyOn(toast, "info");
    jest.spyOn(historyMock, "push");
    axios.mockImplementationOnce(() => {
      return Promise.resolve({
        status: 200,
        statusText: "OK",
        data: null,
      });
    });

    wrapper = await mountComponent(props);
    const component = wrapper.find(MobilePhoneChange);
    const cancelButton = component.find(".cancel .button");
    cancelButton.simulate("click");
    expect(toast.info).not.toHaveBeenCalled();
    expect(historyMock.push).not.toHaveBeenCalled();
    expect(lastConsoleOutuput).toBe(null);
    const {href} = cancelButton.at(0).props();
    expect(href).toEqual("/test-org-2/mobile-phone-verification");
  });
});

describe("Change Phone Number: corner cases", () => {
  let props;
  let wrapper;
  const mockAxios = (responseData = {}) => {
    axios.mockImplementationOnce(() => {
      return Promise.resolve({
        status: 200,
        statusText: "OK",
        data: {
          response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
          radius_user_token: "o6AQLY0aQjD3yuihRKLknTn8krcQwuy2Av6MCsFB",
          username: "tester@tester.com",
          is_active: false,
          phone_number: "+393660011222",
          ...responseData,
        },
      });
    });
  };

  beforeEach(() => {
    props = createTestProps();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it("should recognize if user is active", async () => {
    validateToken.mockReturnValue(true);
    userData.is_active = true;
    props.userData = userData;
    wrapper = await mountComponent(props);
    const component = wrapper.find(MobilePhoneChange);
    expect(component.instance().state.phone_number).toBe("+393660011222");
    const instanceProps = component.instance().props;
    const mockVerify = instanceProps.verifyMobileNumber;
    const mobile_settings = instanceProps.settings.mobile_phone_verification;
    expect(mockVerify.mock.calls.length).toBe(1);
    expect(mockVerify.mock.calls.pop()).toEqual([mobile_settings]);
  });

  it("should redirect only if mobile_phone_verification is disabled", async () => {
    mockAxios();
    props.settings.mobile_phone_verification = true;
    wrapper = await mountComponent(props);
    expect(wrapper.find(Redirect)).toHaveLength(0);
  });

  it("should redirect if mobile_phone_verification disabled", async () => {
    props.settings.mobile_phone_verification = false;
    wrapper = await mountComponent(props);
    expect(wrapper.find(Redirect)).toHaveLength(1);
  });

  it("shouldn't redirect if user is active and mobile verificaton is true", async () => {
    validateToken.mockReturnValue(true);
    userData.is_active = true;
    props.userData = userData;
    props.settings.mobile_phone_verification = true;
    wrapper = await mountComponent(props);
    expect(wrapper.find(Redirect)).toHaveLength(0);
    const component = wrapper.find(MobilePhoneChange);
    const mockVerify = component.instance().props.verifyMobileNumber;
    expect(mockVerify.mock.calls.length).toBe(1);
    expect(mockVerify.mock.calls.pop()).toEqual([true]);
  });
});
