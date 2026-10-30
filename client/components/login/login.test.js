/* eslint-disable prefer-promise-reject-errors */
import axios from "axios";
import {shallow, mount} from "enzyme";
import React from "react";
import ShallowRenderer from "react-test-renderer/shallow";
import * as dependency from "react-toastify";
import PropTypes from "prop-types";
import {Provider} from "react-redux";
import {Cookies} from "react-cookie";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import {createMemoryHistory} from "history";
import {loadingContextValue} from "../../utils/loading-context";
import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import Login from "./login";
import tick from "../../utils/tick";
import Modal from "../modal";
import getParameterByName from "../../utils/get-parameter-by-name";
import {mapStateToProps, mapDispatchToProps} from "./index";
import redirectToPayment from "../../utils/redirect-to-payment";
import {beginContinuation, readContinuation} from "../../utils/continuation";
import {sessionStorage, localStorage} from "../../utils/storage";

jest.mock("axios");
jest.mock("../../utils/get-config");
jest.mock("../../utils/get-parameter-by-name");
jest.mock("../../utils/load-translation");
jest.mock("../../utils/redirect-to-payment");

const defaultConfig = getConfig("default", true);
const loginForm = defaultConfig.components.login_form;
loginForm.input_fields.phone_number =
  defaultConfig.components.registration_form.input_fields.phone_number;
const createTestProps = (props) => ({
  language: "en",
  orgSlug: "default",
  orgName: "default name",
  loginForm,
  privacyPolicy: defaultConfig.privacy_policy,
  termsAndConditions: defaultConfig.terms_and_conditions,
  settings: {
    mobile_phone_verification: false,
    subscriptions: false,
    radius_realms: false,
    passwordless_auth_token_name: "sesame",
  },
  authenticate: jest.fn(),
  setUserData: jest.fn(),
  userData: {},
  setTitle: jest.fn(),
  captivePortalLoginForm: {
    method: "POST",
    action: "https://radius-proxy/login/",
    fields: {
      username: "username",
      password: "password",
    },
    additional_fields: [],
  },
  match: {
    path: "default/login",
  },
  navigate: jest.fn(),
  ...props,
});
const userData = {
  is_active: true,
  is_verified: true,
  method: "mobile_phone",
  email: "tester@test.com",
  phone_number: "+393660011333",
  username: "+393660011333",
  auth_token: "b72dad1cca4807dc21c00b0b2f171d29415ac541",
  radius_user_token: "jwyVSZYOze16ej6cc1AW5cxhRjahesLzh1Tm2y0d",
  first_name: "",
  last_name: "",
  birth_date: null,
  location: "",
};
const responseData = {...userData, key: userData.auth_token};
delete responseData.auth_token;

describe("<Login /> next continuation", () => {
  const mountLogin = (url, props = createTestProps()) => {
    window.history.replaceState({}, "", url);
    const wrapper = shallow(<Login {...props} />, {
      context: loadingContextValue,
      disableLifecycleMethods: true,
    });
    return {props, wrapper};
  };
  beforeEach(() => {
    Login.contextTypes = {setLoading: PropTypes.func};
    getParameterByName.mockImplementation((name) =>
      new URLSearchParams(window.location.search).get(name),
    );
  });
  afterEach(() => {
    window.history.replaceState({}, "", "/");
    sessionStorage.clear();
    getParameterByName.mockReset();
    jest.clearAllMocks();
  });

  it("removes next and the SESAME token from the URL after SESAME login", async () => {
    axios.mockResolvedValueOnce({data: responseData});
    const {props, wrapper} = mountLogin(
      "/default/login?sesame=login-secret&next=/default/payment/failed&username=alice&macaddr=aa:bb",
    );
    wrapper.instance().componentDidMount();
    await tick();
    expect(props.navigate.mock.calls[0]).toEqual([
      "/default/login?username=alice&macaddr=aa%3Abb",
      {replace: true},
    ]);
    expect(axios.mock.calls[0][0].headers.Authorization).toBe(
      "sesame login-secret",
    );
    expect(props.authenticate).toHaveBeenCalledWith(true);
    expect(props.navigate).toHaveBeenCalledTimes(1);
    expect(readContinuation("default")).toMatchObject({
      destination: "/default/payment/failed",
      username: userData.username,
    });
  });

  it.each(["", "?username=alice", "?macaddr=aa:bb&username=alice"])(
    "does not rewrite login URLs without continuation or token parameters: %s",
    (search) => {
      const {props, wrapper} = mountLogin(`/default/login${search}`);
      wrapper.instance().componentDidMount();
      expect(props.navigate).not.toHaveBeenCalled();
    },
  );

  it("logs in with the short sid and n=pay params and cleans the URL", async () => {
    axios.mockResolvedValueOnce({data: responseData});
    const {props, wrapper} = mountLogin(
      "/default/login?n=pay&sid=short-secret&username=alice",
    );
    wrapper.instance().componentDidMount();
    await tick();
    expect(props.navigate.mock.calls[0]).toEqual([
      "/default/login?username=alice",
      {replace: true},
    ]);
    expect(axios.mock.calls[0][0].headers.Authorization).toBe(
      "sesame short-secret",
    );
    expect(props.navigate).toHaveBeenLastCalledWith("/default/payment/process");
    expect(readContinuation("default")).toBeNull();
  });

  it("uses the configured token param name for sid", async () => {
    axios.mockResolvedValueOnce({data: responseData});
    const props = createTestProps({
      settings: {
        ...createTestProps().settings,
        passwordless_auth_token_name: "sesame_id",
      },
    });
    const {wrapper} = mountLogin("/default/login?sid=short-secret", props);
    wrapper.instance().componentDidMount();
    await tick();
    expect(axios.mock.calls[0][0].headers.Authorization).toBe(
      "sesame_id short-secret",
    );
  });

  it.each([
    ["the configured param wins over sid", "sesame=long&sid=short", "long"],
    ["the configured param wins when first", "sid=short&sesame=long", "long"],
  ])("%s", async (label, query, expected) => {
    axios.mockResolvedValueOnce({data: responseData});
    const {wrapper} = mountLogin(`/default/login?${query}`);
    wrapper.instance().componentDidMount();
    await tick();
    expect(axios.mock.calls[0][0].headers.Authorization).toBe(
      `sesame ${expected}`,
    );
  });

  it.each(["sid=a&sid=b", "sid=", "sesame=&sid=short"])(
    "does not log in with %s",
    (query) => {
      const {wrapper} = mountLogin(`/default/login?${query}`);
      wrapper.instance().componentDidMount();
      expect(axios).not.toHaveBeenCalled();
    },
  );

  it("leaves every other destination to the status page", () => {
    const {props, wrapper} = mountLogin(
      "/default/login?next=/default/change-password",
    );
    wrapper.instance().componentDidMount();
    wrapper.instance().handleAuthentication(responseData);
    expect(props.navigate).not.toHaveBeenCalledWith(
      "/default/change-password",
      expect.anything(),
    );
    expect(readContinuation("default")).toMatchObject({
      destination: "/default/change-password",
      username: userData.username,
    });
  });

  it("goes to complete-signup first when verification is pending", () => {
    const {props, wrapper} = mountLogin(
      "/default/login?next=/default/payment/failed",
    );
    wrapper.instance().componentDidMount();
    props.navigate.mockClear();
    wrapper.instance().handleAuthentication({
      ...responseData,
      method: "pending_verification",
      is_verified: false,
    });
    expect(props.navigate.mock.calls).toEqual([["/default/complete-signup"]]);
    expect(props.authenticate).toHaveBeenCalledWith(true);
    // the continuation is kept, bound to the user, for after the signup
    expect(readContinuation("default")).toEqual(
      expect.objectContaining({
        destination: "/default/payment/failed",
        username: responseData.username,
      }),
    );
  });

  describe("next=payment/process skips the draft payment page", () => {
    const authenticatePaymentProcess = (settings, payment = {}) => {
      const props = createTestProps({
        cookies: new Cookies(),
        captivePortalSyncAuth: true,
        settings: {...createTestProps().settings, ...settings},
      });
      const {wrapper} = mountLogin(
        "/default/login?next=/default/payment/process/",
        props,
      );
      wrapper.instance().componentDidMount();
      wrapper.instance().handleAuthentication({...responseData, ...payment});
      return props;
    };
    afterEach(() => localStorage.clear());

    it("logs in to the captive portal first if internet is required", () => {
      const props = authenticatePaymentProcess({
        payment_requires_internet: true,
      });
      expect(props.setUserData).toHaveBeenLastCalledWith(
        expect.objectContaining({proceedToPayment: true, mustLogin: true}),
      );
      expect(localStorage.getItem("default_proceedToPayment")).toBe("true");
      expect(localStorage.getItem("default_mustLogin")).toBe("true");
      expect(props.navigate).not.toHaveBeenCalledWith(
        "/default/payment/process",
      );
      expect(readContinuation("default")).toMatchObject({
        destination: "/default/payment/process/",
        username: responseData.username,
      });
    });

    it("opens the payment page directly if internet is not required", () => {
      const props = authenticatePaymentProcess({
        payment_requires_internet: false,
      });
      expect(props.authenticate).toHaveBeenCalledWith(true);
      expect(props.navigate).toHaveBeenLastCalledWith(
        "/default/payment/process",
      );
      expect(readContinuation("default")).toBeNull();
    });

    it.each([
      [false, "/default/payment/process"],
      [null, "/default/payment/gateway"],
    ])(
      "follows payment_requires_internet=%s over the organization setting",
      (requirement, route) => {
        const props = authenticatePaymentProcess(
          {payment_requires_internet: true},
          {payment_requires_internet: requirement},
        );
        expect(props.setUserData).not.toHaveBeenCalledWith(
          expect.objectContaining({proceedToPayment: true}),
        );
        expect(localStorage.getItem("default_proceedToPayment")).toBeNull();
        expect(localStorage.getItem("default_mustLogin")).toBeNull();
        expect(props.authenticate).toHaveBeenCalledWith(true);
        expect(props.navigate).toHaveBeenLastCalledWith(route);
        expect(readContinuation("default")).toBeNull();
      },
    );
  });

  it("drops next when the password is expired", () => {
    const {props, wrapper} = mountLogin(
      "/default/login?next=%2Fdefault%2Fstatus",
    );
    wrapper.instance().componentDidMount();
    wrapper
      .instance()
      .handleAuthentication({...responseData, password_expired: true});
    expect(readContinuation("default")).toBeNull();
    expect(props.authenticate).toHaveBeenCalledWith(true);
  });

  it("follows the normal flow when next is rejected", () => {
    const {props, wrapper} = mountLogin(
      "/default/login?next=https://example.com",
    );
    wrapper.instance().componentDidMount();
    wrapper.instance().handleAuthentication(responseData);
    expect(readContinuation("default")).toBeNull();
    expect(props.authenticate).toHaveBeenCalledWith(true);
    expect(props.navigate).toHaveBeenCalledTimes(1);
    expect(props.navigate).toHaveBeenCalledWith("/default/login", {
      replace: true,
    });
  });
});

describe("<Login /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const renderer = new ShallowRenderer();
    const wrapper = renderer.render(<Login {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});

describe("<Login /> rendering", () => {
  let props;

  it("should render correctly without social links", () => {
    props = createTestProps();
    const renderer = new ShallowRenderer();
    loadTranslation("en", "default");
    const component = renderer.render(<Login {...props} />);
    expect(component).toMatchSnapshot();
  });

  it("should render correctly with social links", () => {
    props = createTestProps({
      loginForm: {
        ...defaultConfig.components.login_form,
        social_login: {
          ...defaultConfig.components.login_form,
          links: [
            {
              text: {
                en: "Login with Google",
              },
              url: "https://radius.openwisp.io/login/google",
              icon: "google.png",
            },
            {
              text: {
                en: "Login with Facebook",
              },
              url: "https://radius.openwisp.io/login/facebook",
              icon: "facebook.png",
            },
          ],
        },
      },
    });
    const renderer = new ShallowRenderer();
    loadTranslation("en", "default");
    const component = renderer.render(<Login {...props} />);
    expect(component).toMatchSnapshot();
  });

  it("should render PhoneInput lazily and handlers should work correctly", async () => {
    props.settings.mobile_phone_verification = true;
    const wrapper = shallow(<Login {...props} />);
    const handleChange = jest.spyOn(wrapper.instance(), "handleChange");
    const component = wrapper.find("Suspense");
    expect(component).toMatchSnapshot();
    expect(component.find("lazy").length).toBe(1);
    const prop = component.find("lazy").props();
    expect(prop).toEqual({
      country: undefined,
      enableSearch: false,
      excludeCountries: [],
      inputProps: {
        autoComplete: "tel",
        className: "form-control input ",
        id: "username",
        name: "username",
        required: true,
      },
      name: "username",
      onChange: expect.any(Function),
      onlyCountries: [],
      placeholder: "enter mobile phone number",
      preferredCountries: [],
      value: "",
    });
    prop.onChange("+911234567890");
    expect(handleChange).toHaveBeenCalledWith({
      target: {
        name: "username",
        value: "++911234567890",
      },
    });
  });

  it("should load fallback before PhoneInput and handlers should work correctly", async () => {
    props.settings.mobile_phone_verification = true;
    const wrapper = shallow(<Login {...props} />);
    const handleChange = jest.spyOn(wrapper.instance(), "handleChange");
    const component = wrapper.find("Suspense");
    const {fallback} = component.props();
    expect(fallback.type).toEqual("input");
    expect(fallback.props).toEqual({
      name: "username",
      className: "form-control input",
      value: "",
      onChange: expect.any(Function),
      placeholder: "enter mobile phone number",
      id: "username",
      type: "tel",
    });
    fallback.props.onChange("+911234567890");
    expect(handleChange).toHaveBeenCalledWith({
      target: {
        name: "username",
        value: "++911234567890",
      },
    });
  });

  it("should render radius realms form if radius_realms is true", () => {
    props = createTestProps();
    props.settings.radius_realms = true;
    loadTranslation("en", "default");
    const component = shallow(<Login {...props} />).find(
      "[id='cp-login-form']",
    );
    expect(component).toMatchSnapshot();
  });
});

describe("<Login /> interactions", () => {
  let props;
  let wrapper;
  let originalError;
  let lastConsoleOutuput;

  beforeEach(() => {
    originalError = console.error;
    lastConsoleOutuput = null;
    console.error = (data) => {
      lastConsoleOutuput = data;
    };
    props = createTestProps();
    props.configuration = getConfig("default", true);
    Login.contextTypes = {
      setLoading: PropTypes.func,
      getLoading: PropTypes.func,
    };
    wrapper = shallow(<Login {...props} />, {context: loadingContextValue});
    loadTranslation("en", "default");
  });

  afterEach(() => {
    console.error = originalError;
  });

  const mountComponent = function (passedProps) {
    const mockedStore = {
      subscribe: () => {},
      dispatch: () => {},
      getState: () => ({
        organization: {
          configuration: passedProps.configuration,
        },
        language: passedProps.language,
      }),
    };

    const historyMock = createMemoryHistory();

    return mount(
      <Provider store={mockedStore}>
        <Router
          history={historyMock}
          future={{v7_startTransition: true, v7_relativeSplatPath: true}}
        >
          <Routes>
            <Route path="/*" element={<Login {...passedProps} />} />
          </Routes>
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

  it("should change state values when handleChange function is invoked", () => {
    wrapper = mountComponent(props);
    const login = wrapper.find(Login);

    // phone_number should not be present if mobile_phone_verification is off
    expect(wrapper.find(".row.phone-number").length).toEqual(0);
    expect(wrapper.find("input[type='tel']").length).toBe(0);

    wrapper
      .find("#username")
      .simulate("change", {target: {value: "test username", name: "username"}});
    expect(login.state("username")).toEqual("test username");

    wrapper
      .find("#password")
      .simulate("change", {target: {value: "test password", name: "password"}});
    expect(login.state("password")).toEqual("test password");
  });

  it("should change state value when handleCheckBoxChange function is invoked", () => {
    // phone_number should not be present if mobile_phone_verification is off
    expect(wrapper.find(".row.phone-number").length).toEqual(0);
    wrapper
      .find("#remember_me")
      .simulate("change", {target: {checked: false, name: "remember_me"}});
    expect(wrapper.state("remember_me")).toEqual(false);
  });

  it("should execute handleSubmit correctly when form is submitted", () => {
    axios
      .mockImplementationOnce(() =>
        Promise.reject({
          response: {
            data: {
              username: "username error",
              password: "password error",
              detail: "error details",
              non_field_errors: "non field errors",
            },
          },
        }),
      )
      .mockImplementationOnce(() =>
        Promise.reject({
          status: 500,
          statusText: "Internal server error",
          response: {
            data: {
              detail: "Internal server error",
            },
          },
        }),
      )
      .mockImplementationOnce(() =>
        Promise.reject({
          response: {
            data: {},
          },
          status: 504,
          statusText: "Gateway Timeout",
        }),
      )
      .mockImplementationOnce(() => Promise.resolve());
    const event = {preventDefault: () => {}};
    const spyToast = jest.spyOn(dependency.toast, "error");

    return wrapper
      .instance()
      .handleSubmit(event)
      .then(() => {
        expect(wrapper.instance().state.errors).toEqual({
          username: "username error",
          password: "password error",
        });
        expect(wrapper.find("div.error")).toHaveLength(2);
        expect(wrapper.find("input.error")).toHaveLength(2);
        expect(wrapper.instance().props.authenticate.mock.calls.length).toBe(0);
        expect(lastConsoleOutuput).not.toBe(null);
        expect(spyToast.mock.calls.length).toBe(1);
      })
      .then(() =>
        wrapper
          .instance()
          .handleSubmit(event)
          .then(() => {
            expect(
              wrapper.instance().props.authenticate.mock.calls.length,
            ).toBe(0);
            expect(lastConsoleOutuput).not.toBe(null);
            expect(spyToast.mock.calls.length).toBe(2);
          }),
      )
      .then(() =>
        wrapper
          .instance()
          .handleSubmit(event)
          .then(() => {
            expect(
              wrapper.instance().props.authenticate.mock.calls.length,
            ).toBe(0);
            expect(lastConsoleOutuput).not.toBe(null);
            expect(spyToast.mock.calls.length).toBe(3);
            lastConsoleOutuput = null;
          }),
      )
      .then(() =>
        wrapper
          .instance()
          .handleSubmit(event)
          .then(() => {
            expect(wrapper.instance().state.errors).toEqual({});
            expect(
              wrapper.instance().props.authenticate.mock.calls.length,
            ).toBe(0);
            expect(lastConsoleOutuput).toBe(null);
            expect(spyToast.mock.calls.length).toBe(4);
          }),
      );
  });
  it("should execute setUserData if mobile phone verification needed", async () => {
    props.settings = {mobile_phone_verification: true};
    wrapper = mountComponent(props);
    const login = wrapper.find(Login);
    const handleSubmit = jest.spyOn(login.instance(), "handleSubmit");

    const testResponseData = {...responseData, is_verified: false};
    const testUserData = {...userData, is_verified: false};

    axios.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          status: 401,
          statusText: "unauthorized",
          data: testResponseData,
        },
      }),
    );
    expect(wrapper.find("input[type='tel']").length).toBe(1);

    expect(wrapper.find(".row.phone-number").length).toEqual(1);
    expect(wrapper.find("#username").length).toEqual(1);
    expect(login.state("username")).toEqual("");
    wrapper.find("#username").simulate("change", {
      target: {value: "+393660011333", name: "username"},
    });
    expect(login.state("username")).not.toEqual("");
    wrapper
      .find("#password")
      .simulate("change", {target: {value: "test password", name: "password"}});
    expect(login.state("password")).toEqual("test password");
    const event = {preventDefault: () => {}};
    wrapper.find("form").simulate("submit", event);
    await tick();
    expect(handleSubmit).toHaveBeenCalled();
    const setUserDataMock = login.props().setUserData.mock;
    expect(setUserDataMock.calls.length).toBe(1);
    expect(setUserDataMock.calls.pop()).toEqual([
      {...testUserData, mustLogin: true},
    ]);
    const authenticateMock = login.props().authenticate.mock;
    expect(authenticateMock.calls.length).toBe(1);
    expect(authenticateMock.calls.pop()).toEqual([true]);
  });
  it("should authenticate normally with method bank_card", async () => {
    props.settings = {subscriptions: true};
    wrapper = mountComponent(props);
    const login = wrapper.find(Login);
    const handleSubmit = jest.spyOn(login.instance(), "handleSubmit");

    const data = {
      ...userData,
      username: "tester",
      is_verified: true,
      method: "bank_card",
      payment_url: "https://account.openwisp.io/payment/123",
    };
    const testResponseData = {...data, key: data.auth_token};
    delete testResponseData.auth_token;
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        data: testResponseData,
      }),
    );

    expect(wrapper.find("input[type='tel']").length).toBe(0);
    wrapper.find("#username").simulate("change", {
      target: {value: "tester", name: "username"},
    });
    expect(login.state("username")).toEqual("tester");
    wrapper
      .find("#password")
      .simulate("change", {target: {value: "test password", name: "password"}});
    expect(login.state("password")).toEqual("test password");

    const event = {preventDefault: () => {}};
    wrapper.find("form").simulate("submit", event);
    await tick();
    expect(handleSubmit).toHaveBeenCalled();
    const setUserDataMock = login.props().setUserData.mock;
    expect(setUserDataMock.calls.length).toBe(1);
    expect(setUserDataMock.calls.pop()).toEqual([{...data, mustLogin: true}]);
    const authenticateMock = login.props().authenticate.mock;
    expect(authenticateMock.calls.length).toBe(1);
    expect(authenticateMock.calls.pop()).toEqual([true]);
  });
  it("should redirect to payment status if bank_card and not verified", async () => {
    props.settings = {subscriptions: true};
    wrapper = mountComponent(props);
    const login = wrapper.find(Login);
    const handleSubmit = jest.spyOn(login.instance(), "handleSubmit");

    const data = {...userData};
    data.username = "tester";
    data.is_verified = false;
    data.method = "bank_card";
    data.payment_id = "payment-id";
    data.payment_gateway = null;
    data.payment_requires_internet = null;
    data.payment_url = "https://account.openwisp.io/payment/123";
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        data,
      }),
    );

    wrapper.find("#username").simulate("change", {
      target: {value: "tester", name: "username"},
    });
    expect(login.state("username")).toEqual("tester");
    wrapper
      .find("#password")
      .simulate("change", {target: {value: "test password", name: "password"}});
    expect(login.state("password")).toEqual("test password");

    const event = {preventDefault: () => {}};
    wrapper.find("form").simulate("submit", event);
    await tick();
    expect(handleSubmit).toHaveBeenCalled();
    const authenticateMock = login.props().authenticate.mock;
    expect(redirectToPayment).toHaveBeenCalledWith(
      "default",
      props.navigate,
      expect.objectContaining({
        payment_id: "payment-id",
        payment_gateway: null,
        payment_requires_internet: null,
      }),
      props.settings,
    );
    expect(authenticateMock.calls.length).toBe(1);
  });

  it("resumes the current payment of a return link", () => {
    props.settings = {subscriptions: true};
    wrapper = mountComponent(props);
    const login = wrapper.find(Login);
    beginContinuation("?n=pay", "default");
    axios.mockClear();
    login.instance().handleAuthentication({
      ...userData,
      key: "test-token",
      method: "bank_card",
      is_verified: false,
      payment_id: "current-payment-id",
      payment_requires_internet: false,
      payment_url: "https://payments.example/current",
    });
    expect(axios).not.toHaveBeenCalled();
    expect(redirectToPayment).toHaveBeenCalledWith(
      "default",
      props.navigate,
      expect.objectContaining({
        payment_id: "current-payment-id",
        payment_requires_internet: false,
        payment_url: "https://payments.example/current",
      }),
      props.settings,
    );
  });
  it("should redirect when pending verification has only phone enabled", async () => {
    props.settings = {
      mobile_phone_verification: true,
      subscriptions: false,
    };
    wrapper = mountComponent(props);
    const login = wrapper.find(Login);
    await login.instance().handleAuthentication({
      ...responseData,
      is_verified: false,
      method: "pending_verification",
    });
    expect(login.instance().props.setUserData).toHaveBeenCalledWith({
      ...userData,
      is_verified: false,
      method: "pending_verification",
      auth_token: responseData.key,
      mustLogin: true,
    });
    expect(props.navigate).toHaveBeenCalledWith("/default/complete-signup");
    expect(login.instance().props.authenticate).toHaveBeenCalledWith(true);
  });
  it("should redirect to complete signup when pending verification has only subscriptions enabled", async () => {
    props.settings = {
      mobile_phone_verification: false,
      subscriptions: true,
    };
    wrapper = mountComponent(props);
    const login = wrapper.find(Login);
    await login.instance().handleAuthentication({
      ...responseData,
      is_verified: false,
      method: "pending_verification",
    });
    expect(login.instance().props.setUserData).toHaveBeenCalledWith({
      ...userData,
      is_verified: false,
      method: "pending_verification",
      auth_token: responseData.key,
      mustLogin: true,
    });
    expect(props.navigate).toHaveBeenCalledWith("/default/complete-signup");
    expect(login.instance().props.authenticate).toHaveBeenCalledWith(true);
  });
  it("should redirect to complete signup when multiple verification methods are enabled", async () => {
    props.settings = {
      mobile_phone_verification: true,
      subscriptions: true,
    };
    wrapper = mountComponent(props);
    const login = wrapper.find(Login);
    await login.instance().handleAuthentication({
      ...responseData,
      is_verified: false,
      method: "pending_verification",
    });
    expect(login.instance().props.setUserData).toHaveBeenCalledWith({
      ...userData,
      is_verified: false,
      method: "pending_verification",
      auth_token: responseData.key,
      mustLogin: true,
    });
    expect(props.navigate).toHaveBeenCalledWith("/default/complete-signup");
    expect(login.instance().props.authenticate).toHaveBeenCalledWith(true);
  });
  it("should NOT redirect to complete signup when method is not pending_verification", async () => {
    props.settings = {
      mobile_phone_verification: true,
      subscriptions: true,
    };
    wrapper = mountComponent(props);
    const login = wrapper.find(Login);
    await login.instance().handleAuthentication({
      ...responseData,
      is_verified: false,
      method: "mobile_phone",
    });
    expect(props.navigate).not.toHaveBeenCalledWith("/default/complete-signup");
  });
  it("phone_number field should be present if mobile phone verification is on", async () => {
    props.settings = {mobile_phone_verification: true};
    wrapper = mountComponent(props);
    expect(wrapper.render()).toMatchSnapshot();
    expect(wrapper.find("input[type='tel']").length).toBe(1);
    expect(wrapper.find("#username").length).toEqual(1);
    expect(wrapper.find(".row.phone-number").length).toEqual(1);
  });
  it("username should be text field if mobile phone verification is off", async () => {
    props.settings = {mobile_phone_verification: false};
    wrapper = mountComponent(props);
    expect(wrapper.render()).toMatchSnapshot();
    expect(wrapper.find("input[type='tel']").length).toBe(0);
    expect(wrapper.find("#username").length).toEqual(1);
    expect(wrapper.find(".row.phone-number").length).toEqual(0);
  });
  it("should not show phone_number field if auto_switch_phone_input is false", async () => {
    props.settings = {mobile_phone_verification: true};
    props.loginForm = {...loginForm};
    props.loginForm.input_fields.username.auto_switch_phone_input = false;
    wrapper = mountComponent(props);
    expect(wrapper.render()).toMatchSnapshot();
    expect(wrapper.find("input[type='tel']").length).toBe(0);
    expect(wrapper.find("#username").length).toEqual(1);
    expect(wrapper.find(".row.phone-number").length).toEqual(0);
  });
  it("should execute setUserData and must not show any form errors if user is inactive", async () => {
    props.settings = {mobile_phone_verification: true};
    wrapper = shallow(<Login {...props} />, {context: loadingContextValue});

    const data = {...userData};
    data.is_active = false;

    axios.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          status: 401,
          statusText: "unauthorized",
          data,
        },
      }),
    );

    wrapper.find("[name='username']").simulate("change", {
      target: {value: "+393660011333", name: "username"},
    });
    wrapper
      .find("#password")
      .simulate("change", {target: {value: "test password", name: "password"}});

    const event = {preventDefault: () => {}};
    await wrapper.instance().handleSubmit(event);
    const spyToast = jest.spyOn(dependency.toast, "error");
    const authenticateMock = wrapper.instance().props.authenticate.mock;
    expect(authenticateMock.calls.length).toBe(0);
    const setUserDataMock = wrapper.instance().props.setUserData.mock;
    expect(setUserDataMock.calls.length).toBe(1);
    expect(setUserDataMock.calls.pop()).toEqual([data]);
    expect(wrapper.instance().state.errors).toEqual({
      username: "",
      password: "",
    });
    expect(spyToast).toHaveBeenCalled();
  });
  it("should store token in sessionStorage when remember me is unchecked and rememberMe in localstorage", () => {
    const data = {...userData};
    data.key = "test-token";

    axios.mockImplementationOnce(() => Promise.resolve({data}));

    wrapper
      .find("#remember_me")
      .simulate("change", {target: {checked: false, name: "remember_me"}});

    return wrapper
      .instance()
      .handleSubmit()
      .then(() => {
        expect(wrapper.instance().state.errors).toEqual({});
        expect(sessionStorage.getItem("default_auth_token")).toEqual(
          "test-token",
        );
        expect(localStorage.getItem("rememberMe")).toEqual("false");
        expect(wrapper.instance().props.authenticate.mock.calls.length).toBe(1);
      });
  });
  it("should show error toast when server error", () => {
    axios.mockImplementationOnce(() =>
      Promise.reject({
        status: 500,
        statusText: "Internal server error",
        response: {
          data: {
            detail: "Internal server error",
          },
        },
      }),
    );
    const event = {preventDefault: () => {}};
    const errorMethod = jest.spyOn(dependency.toast, "error");
    return wrapper
      .instance()
      .handleSubmit(event)
      .then(() => {
        expect(wrapper.instance().props.authenticate.mock.calls.length).toBe(0);
        expect(lastConsoleOutuput).not.toBe(null);
        expect(errorMethod).toHaveBeenCalled();
        expect(errorMethod).toHaveBeenCalledWith("Internal server error");
      });
  });
  it("should show error toast when connection refused or timeout", async () => {
    axios.mockImplementationOnce(() =>
      Promise.reject({
        status: 504,
        statusText: "Gateway Timeout",
        response: {
          data: "Error occured while trying to proxy to: 0.0.0.0:8080/api/v1/radius/organization/default/account/token",
        },
      }),
    );
    const event = {preventDefault: () => {}};
    const errorMethod = jest.spyOn(dependency.toast, "error");
    wrapper = shallow(<Login {...props} />, {context: loadingContextValue});
    await wrapper.instance().handleSubmit(event);
    expect(wrapper.instance().props.authenticate.mock.calls.length).toBe(0);
    expect(lastConsoleOutuput).not.toBe(null);
    expect(errorMethod).toHaveBeenCalled();
    expect(errorMethod).toHaveBeenCalledWith("Login error occurred.");
  });
  it("should set mustLogin on login success", async () => {
    axios.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          status: 401,
          statusText: "unauthorized",
          data: responseData,
        },
      }),
    );
    props.settings = {mobile_phone_verification: true};
    wrapper = mountComponent(props);
    const login = wrapper.find(Login);
    const handleSubmit = jest.spyOn(login.instance(), "handleSubmit");
    wrapper.find("#username").simulate("change", {
      target: {value: "+393660011333", name: "username"},
    });
    wrapper
      .find("#password")
      .simulate("change", {target: {value: "test password", name: "password"}});
    const event = {preventDefault: () => {}};
    wrapper.find("form").simulate("submit", event);
    await tick();
    expect(handleSubmit).toHaveBeenCalled();
    const setUserDataMock = login.props().setUserData.mock;
    expect(setUserDataMock.calls.length).toBe(1);
    expect(setUserDataMock.calls.pop()).toEqual([
      {...userData, mustLogin: true},
    ]);
  });
  it("should call setTitle to set log in title", () => {
    wrapper = mountComponent(props);
    const login = wrapper.find(Login);
    const setTitleMock = login.props().setTitle.mock;
    expect(setTitleMock.calls.pop()).toEqual(["Log in", props.orgName]);
  });

  it("should call handleAuthentication on social login / SAML", () => {
    // this is needed to spot potential errors
    axios.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          data: {
            username: "username error",
            password: "password error",
            detail: "error details",
            non_field_errors: "non field errors",
          },
        },
      }),
    );
    getParameterByName
      .mockImplementationOnce(() => userData.username)
      .mockImplementationOnce(() => userData.auth_token)
      .mockImplementationOnce(() => "")
      .mockImplementationOnce(() => "saml");
    const spyToast = jest.spyOn(dependency.toast, "success");
    wrapper = mountComponent(props);
    expect(localStorage.getItem("rememberMe")).toEqual("false");
    expect(sessionStorage.getItem("default_auth_token")).toEqual(
      userData.auth_token,
    );
    expect(spyToast.mock.calls.length).toBe(1);
    const login = wrapper.find(Login);
    const setUserDataMock = login.props().setUserData.mock;
    expect(setUserDataMock.calls.length).toBe(1);
    expect(setUserDataMock.calls.pop()).toEqual([
      {
        username: userData.username,
        auth_token: userData.auth_token,
        is_active: true,
        radius_user_token: undefined,
        mustLogin: true,
      },
    ]);
    const authenticateMock = login.props().authenticate.mock;
    expect(authenticateMock.calls.length).toBe(1);
    expect(authenticateMock.calls.pop()).toEqual([true]);
    expect(localStorage.getItem("default_logout_method")).toEqual("saml");
  });

  it("should authenticate if sesame link is in url", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        response: {
          data: userData,
        },
      }),
    );
    getParameterByName
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => "sesame-token");
    props = createTestProps();
    wrapper = shallow(<Login {...props} />, {
      context: loadingContextValue,
      disableLifecycleMethods: true,
    });
    expect(getParameterByName).toHaveBeenCalledWith(
      defaultConfig.settings.passwordless_auth_token_name,
    );
    wrapper.instance().handleSubmit = jest.fn();
    wrapper.instance().componentDidMount();
    expect(wrapper.instance().handleSubmit).toHaveBeenCalledWith(
      null,
      "sesame-token",
    );
  });
  it("should render modal", () => {
    props = createTestProps();
    wrapper = shallow(<Login {...props} />);
    let pathMap = {};
    pathMap = wrapper.find(Route).reduce((mapRoute, route) => {
      const map = mapRoute;
      const routeProps = route.props();
      map[routeProps.path] = routeProps.element;
      return map;
    }, {});
    const element = pathMap[":name"];
    const Comp = React.createElement(Modal).type;
    expect(JSON.stringify(element)).toStrictEqual(
      JSON.stringify(<Comp prevPath={`/${props.orgSlug}/login`} />),
    );
  });

  it("should show custom HTML", () => {
    wrapper = mountComponent(props);
    expect(wrapper.find(".intro").length).toEqual(0);
    expect(wrapper.find(".pre-html").length).toEqual(0);
    expect(wrapper.find(".help-container").length).toEqual(0);
    expect(wrapper.find(".after-html").length).toEqual(0);

    const htmlProps = {...props};
    htmlProps.loginForm = {
      ...htmlProps.loginForm,
      intro_html: {en: "<div class='intro-html'></div>"},
      pre_html: {en: "<div class='pre-html'></div>"},
      help_html: {en: "<div class='help-html'></div>"},
      after_html: {en: "<div class='after-html'></div>"},
    };
    wrapper = mountComponent(htmlProps);
    expect(wrapper.find(".intro").length).toEqual(1);
    expect(wrapper.find(".pre-html").length).toEqual(1);
    expect(wrapper.find(".help-container").length).toEqual(1);
    expect(wrapper.find(".after-html").length).toEqual(1);
  });
  it("should mapStateToProps and mapDispatchToProps on rendering", async () => {
    const state = {
      organization: {
        configuration: {
          slug: "test",
          name: "test",
          settings: {},
          userData: {},
          components: {
            login_form: {
              input_fields: {},
            },
            registration_form: {
              input_fields: {
                phone_number: {},
              },
            },
          },
          privacy_policy: "Privacy policy",
          terms_and_conditions: "Terms and conditions",
        },
        language: "en",
      },
    };
    let result = mapStateToProps(state);
    expect(result).toEqual({
      language: undefined,
      loginForm: {input_fields: {phone_number: {}}},
      orgName: "test",
      orgSlug: "test",
      privacyPolicy: "Privacy policy",
      settings: {},
      termsAndConditions: "Terms and conditions",
      userData: {},
    });
    const dispatch = jest.fn();
    result = mapDispatchToProps(dispatch);
    expect(result).toEqual({
      authenticate: expect.any(Function),
      setUserData: expect.any(Function),
      setTitle: expect.any(Function),
    });
  });
  it("should submit form if radius_realms is true", async () => {
    wrapper = shallow(<Login {...props} />, {context: loadingContextValue});
    expect(wrapper.find("[id='cp-login-form']").length).toEqual(0);
    props.settings.radius_realms = true;
    props.captivePortalLoginForm.additional_fields = [
      {name: "zone", value: "zone_value"},
    ];
    wrapper = shallow(<Login {...props} />, {context: loadingContextValue});
    const form = wrapper.find("[id='cp-login-form']");
    wrapper.instance().setState({username: "realms@", password: "testing"});
    expect(form.length).toEqual(1);
    expect(form.props()).toEqual({
      action: "https://radius-proxy/login/",
      children: expect.any(Array),
      className: "hidden",
      id: "cp-login-form",
      method: "POST",
    });
    expect(form.props().children).toEqual([
      <input name="username" type="hidden" value="" />,
      <input name="password" type="hidden" value="" />,
      [<input name="zone" key="zone" type="hidden" value="zone_value" />],
    ]);
    const mockRef = {submit: jest.fn()};
    wrapper.instance().realmsRadiusLoginForm.current = mockRef;
    wrapper.instance().handleSubmit({preventDefault: () => {}});
    expect(mockRef.submit).toHaveBeenCalled();
  });
});
