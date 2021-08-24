/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable camelcase */
import axios from "axios";
import {mount, shallow} from "enzyme";
import React from "react";
import PropTypes from "prop-types";
import {Cookies} from "react-cookie";
import {toast} from "react-toastify";
import {Provider} from "react-redux";
import {Redirect, Router} from "react-router-dom";
import {createMemoryHistory} from "history";
import ShallowRenderer from "react-test-renderer/shallow";
import {loadingContextValue} from "../../utils/loading-context";
import loadTranslation from "../../utils/load-translation";
import getConfig from "../../utils/get-config";
import tick from "../../utils/tick";
import MobilePhoneChangeWrapped from "./mobile-phone-change";
import validateToken from "../../utils/validate-token";
import submitOnEnter from "../../utils/submit-on-enter";

const MobilePhoneChange = MobilePhoneChangeWrapped.WrappedComponent;
jest.mock("../../utils/get-config");
jest.mock("../../utils/validate-token");
jest.mock("../../utils/load-translation");
jest.mock("../../utils/submit-on-enter");
jest.mock("axios");

const createTestProps = function (props, configName = "test-org-2") {
  const conf = getConfig(configName);
  const componentConf = conf.components.phone_number_change_form;
  componentConf.input_fields = {
    phone_number: conf.components.registration_form.input_fields.phone_number,
  };
  return {
    phone_number_change: componentConf,
    settings: conf.settings,
    orgSlug: conf.slug,
    orgName: conf.name,
    cookies: new Cookies(),
    logout: jest.fn(),
    setUserData: jest.fn(),
    userData: {},
    setTitle: jest.fn(),
    language: "en",
    // needed for subcomponents
    configuration: conf,
    ...props,
  };
};

describe("<MobilePhoneChange /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const renderer = new ShallowRenderer();
    const wrapper = renderer.render(<MobilePhoneChange {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});

const historyMock = createMemoryHistory();
historyMock.entries = [];
historyMock.location.key = "";

const mountComponent = function (props) {
  const mockedStore = {
    subscribe: () => {},
    dispatch: () => {},
    // needed to render <Contact/>
    getState: () => ({
      organization: {
        configuration: props.configuration,
      },
    }),
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
    loadTranslation("en", "default");
    wrapper = await mountComponent(props);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists(MobilePhoneChange)).toBe(true);
    expect(wrapper.find("input[name='phone_number']").length).toBe(1);

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
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: null,
      }),
    );

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
    const setUserDataMock = component.instance().props.setUserData.mock;
    expect(setUserDataMock.calls.length).toBe(1);
    expect(setUserDataMock.calls.pop()).toEqual([
      {is_verified: false, phone_number: "+393660011333"},
    ]);
  });
  it("should render PhoneInput lazily and handlers should work correctly", async () => {
    wrapper = shallow(<MobilePhoneChange {...props} />);
    const handleChange = jest.spyOn(wrapper.instance(), "handleChange");
    const component = wrapper.find("Suspense");
    expect(component).toMatchSnapshot();
    expect(component.find("lazy").length).toBe(1);
    const prop = component.find("lazy").props();
    expect(prop).toEqual({
      enableSearch: false,
      excludeCountries: [],
      inputProps: {
        className: "form-control input ",
        id: "phone-number",
        name: "phone_number",
        required: true,
      },
      name: "phone_number",
      onChange: expect.any(Function),
      onKeyDown: expect.any(Function),
      onlyCountries: [],
      placeholder: "enter mobile phone number",
      preferredCountries: [],
      value: "",
    });
    prop.onChange("+911234567890");
    expect(handleChange).toHaveBeenCalledWith({
      target: {
        name: "phone_number",
        value: "++911234567890",
      },
    });
    component.find("lazy").props().onKeyDown({});
    expect(submitOnEnter.mock.calls.length).toEqual(1);
    expect(submitOnEnter.mock.calls.pop()).toEqual([
      {},
      expect.any(Object),
      "mobile-phone-change-form",
    ]);
  });

  it("should load fallback before PhoneInput and handlers should work correctly", async () => {
    wrapper = shallow(<MobilePhoneChange {...props} />);
    const handleChange = jest.spyOn(wrapper.instance(), "handleChange");
    const component = wrapper.find("Suspense");
    const {fallback} = component.props();
    expect(fallback.type).toEqual("input");
    expect(fallback.props).toEqual({
      name: "phone_number",
      value: "",
      onChange: expect.any(Function),
      onKeyDown: expect.any(Function),
      placeholder: "enter mobile phone number",
      id: "phone-number",
    });
    fallback.props.onChange("+911234567890");
    expect(handleChange).toHaveBeenCalledWith({
      target: {
        name: "phone_number",
        value: "++911234567890",
      },
    });
    fallback.props.onKeyDown({});
    expect(submitOnEnter.mock.calls.length).toEqual(1);
    expect(submitOnEnter.mock.calls.pop()).toEqual([
      {},
      expect.any(Object),
      "mobile-phone-change-form",
    ]);
  });

  it("should render field error", async () => {
    jest.spyOn(MobilePhoneChange.prototype, "handleSubmit");
    jest.spyOn(toast, "info");
    jest.spyOn(historyMock, "push");
    axios.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          status: 400,
          statusText: "OK",
          data: {
            phone_number: [
              "The new phone number must be different than the old one.",
            ],
          },
        },
      }),
    );

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
    axios.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          status: 400,
          statusText: "OK",
          data: {
            non_field_errors: ["Maximum daily limit reached."],
          },
        },
      }),
    );

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
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: null,
      }),
    );

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

  it("should set title", async () => {
    wrapper = await mountComponent(props);
    const component = wrapper.find(MobilePhoneChange);
    const setTitleMock = component.props().setTitle.mock;
    expect(setTitleMock.calls.pop()).toEqual([
      "Change mobile number",
      props.orgName,
    ]);
  });
});

describe("Change Phone Number: corner cases", () => {
  let props;
  let wrapper;
  const mockAxios = (responseData = {}) => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
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
      }),
    );
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
    const {setUserData} = component.instance().props;
    expect(setUserData.mock.calls.length).toBe(0);
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
  });

  it("should validate token", async () => {
    wrapper = await mountComponent(props);
    expect(validateToken).toHaveBeenCalledWith(
      props.cookies,
      props.orgSlug,
      props.setUserData,
      props.userData,
      props.logout,
    );
  });
});
