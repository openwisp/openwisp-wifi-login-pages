/* eslint-disable prefer-promise-reject-errors */
import axios from "axios";
import {shallow, mount} from "enzyme";
import React from "react";
import ShallowRenderer from "react-test-renderer/shallow";
import * as dependency from "react-toastify";
import PropTypes from "prop-types";
import {Provider} from "react-redux";
import {Router} from "react-router-dom";
import {createMemoryHistory} from "history";
import PhoneInput from "react-phone-input-2";
import {loadingContextValue} from "../../utils/loading-context";
import getConfig from "../../utils/get-config";
import Login from "./login";
import tick from "../../utils/tick";

jest.mock("axios");

const defaultConfig = getConfig("default");
const loginForm = defaultConfig.components.login_form;
loginForm.input_fields.phone_number =
  defaultConfig.components.registration_form.input_fields.phone_number;
const createTestProps = (props) => {
  return {
    language: "en",
    orgSlug: "default",
    loginForm,
    privacyPolicy: defaultConfig.privacy_policy,
    termsAndConditions: defaultConfig.terms_and_conditions,
    settings: {mobile_phone_verification: false},
    authenticate: jest.fn(),
    verifyMobileNumber: jest.fn(),
    setIsActive: jest.fn(),
    match: {
      path: "default/login",
    },
    ...props,
  };
};

describe("<Login /> rendering", () => {
  let props;

  it("should render correctly without social links", () => {
    props = createTestProps();
    const renderer = new ShallowRenderer();
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
                en: "Google",
              },
              url: "https://radius.openwisp.io/login/google",
              icon: "google.png",
            },
            {
              text: {
                en: "Facebook",
              },
              url: "https://radius.openwisp.io/login/facebook",
              icon: "facebook.png",
            },
          ],
        },
      },
    });
    const renderer = new ShallowRenderer();
    const component = renderer.render(<Login {...props} />);
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
    props.configuration = getConfig("default");
    Login.contextTypes = {
      setLoading: PropTypes.func,
      getLoading: PropTypes.func,
    };
    wrapper = shallow(<Login {...props} />, {context: loadingContextValue});
  });

  afterEach(() => {
    console.error = originalError;
  });

  const mountComponent = function (passedProps) {
    const mockedStore = {
      subscribe: () => {},
      dispatch: () => {},
      getState: () => {
        return {
          organization: {
            configuration: passedProps.configuration,
          },
          language: passedProps.language,
        };
      },
    };

    const historyMock = createMemoryHistory();

    return mount(
      <Provider store={mockedStore}>
        <Router history={historyMock}>
          <Login {...passedProps} />
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
    expect(wrapper.exists(PhoneInput)).toBe(false);

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
      .mockImplementationOnce(() => {
        return Promise.reject({
          response: {
            data: {
              username: "username error",
              password: "password error",
              detail: "error details",
              non_field_errors: "non field errors",
            },
          },
        });
      })
      .mockImplementationOnce(() => {
        return Promise.reject({
          status: 500,
          statusText: "Internal server error",
          response: {
            data: {
              detail: "Internal server error",
            },
          },
        });
      })
      .mockImplementationOnce(() => {
        return Promise.reject({
          response: {
            data: {},
          },
          status: 504,
          statusText: "Gateway Timeout",
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve();
      });
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
        lastConsoleOutuput = null;
      })
      .then(() => {
        return wrapper
          .instance()
          .handleSubmit(event)
          .then(() => {
            expect(
              wrapper.instance().props.authenticate.mock.calls.length,
            ).toBe(0);
            expect(lastConsoleOutuput).not.toBe(null);
            expect(spyToast.mock.calls.length).toBe(2);
            lastConsoleOutuput = null;
          });
      })
      .then(() => {
        return wrapper
          .instance()
          .handleSubmit(event)
          .then(() => {
            expect(
              wrapper.instance().props.authenticate.mock.calls.length,
            ).toBe(0);
            expect(lastConsoleOutuput).not.toBe(null);
            expect(spyToast.mock.calls.length).toBe(3);
            lastConsoleOutuput = null;
          });
      })
      .then(() => {
        return wrapper
          .instance()
          .handleSubmit(event)
          .then(() => {
            expect(wrapper.instance().state.errors).toEqual({});
            expect(
              wrapper.instance().props.authenticate.mock.calls.length,
            ).toBe(1);
            expect(lastConsoleOutuput).toBe(null);
            expect(spyToast.mock.calls.length).toBe(3);
            lastConsoleOutuput = null;
          });
      });
  });

  it("should execute verifyMobileNumber if mobile phone verification needed", async () => {
    props.settings = {mobile_phone_verification: true};
    wrapper = mountComponent(props);
    const login = wrapper.find(Login);
    const handleSubmit = jest.spyOn(login.instance(), "handleSubmit");

    axios.mockImplementationOnce(() => {
      return Promise.reject({
        response: {
          status: 401,
          statusText: "unauthorized",
          data: {
            is_active: true,
          },
        },
      });
    });

    expect(wrapper.exists(PhoneInput)).toBe(true);
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
    const verifyMock = login.props().verifyMobileNumber.mock;
    expect(verifyMock.calls.length).toBe(1);
    expect(verifyMock.calls.pop()).toEqual([true]);
    const authenticateMock = login.props().authenticate.mock;
    expect(authenticateMock.calls.length).toBe(1);
    expect(authenticateMock.calls.pop()).toEqual([true]);
  });
  it("phone_number field should be present if mobile phone verification is on", async () => {
    props.settings = {mobile_phone_verification: true};
    wrapper = mountComponent(props);
    expect(wrapper.render()).toMatchSnapshot();
    expect(wrapper.exists(PhoneInput)).toBe(true);
    expect(wrapper.find("#username").length).toEqual(1);
    expect(wrapper.find(".row.phone-number").length).toEqual(1);
  });
  it("username should be text field if mobile phone verification is off", async () => {
    props.settings = {mobile_phone_verification: false};
    wrapper = mountComponent(props);
    expect(wrapper.render()).toMatchSnapshot();
    expect(wrapper.exists(PhoneInput)).toBe(false);
    expect(wrapper.find("#username").length).toEqual(1);
    expect(wrapper.find(".row.phone-number").length).toEqual(0);
  });
  it("should not show phone_number field if auto_switch_phone_input is false", async () => {
    props.settings = {mobile_phone_verification: true};
    props.loginForm = {...loginForm};
    props.loginForm.input_fields.username.auto_switch_phone_input = false;
    wrapper = mountComponent(props);
    expect(wrapper.render()).toMatchSnapshot();
    expect(wrapper.exists(PhoneInput)).toBe(false);
    expect(wrapper.find("#username").length).toEqual(1);
    expect(wrapper.find(".row.phone-number").length).toEqual(0);
  });
  it("should store token in sessionStorage when remember me is unchecked and rememberMe in localstorage", () => {
    const data = {
      data: {
        key: "test-token",
      },
    };

    axios.mockImplementationOnce(() => {
      return Promise.resolve(data);
    });

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
  it("should not execute verifyMobileNumber if user is inactive and must execute setIsActive", async () => {
    props.settings = {mobile_phone_verification: true};
    wrapper = shallow(<Login {...props} />, {context: loadingContextValue});

    axios.mockImplementationOnce(() => {
      return Promise.reject({
        response: {
          status: 401,
          statusText: "unauthorized",
          data: {
            is_active: false,
          },
        },
      });
    });

    wrapper.find("[name='username']").simulate("change", {
      target: {value: "+393660011333", name: "username"},
    });
    wrapper
      .find("#password")
      .simulate("change", {target: {value: "test password", name: "password"}});

    const event = {preventDefault: () => {}};
    await wrapper.instance().handleSubmit(event);
    const verifyMock = wrapper.instance().props.verifyMobileNumber.mock;
    expect(verifyMock.calls.length).toBe(0);
    const authenticateMock = wrapper.instance().props.authenticate.mock;
    expect(authenticateMock.calls.length).toBe(0);
    const setIsActiveMock = wrapper.instance().props.setIsActive.mock;
    expect(setIsActiveMock.calls.length).toBe(1);
  });
  it("should show error toast when server error", () => {
    axios.mockImplementationOnce(() => {
      return Promise.reject({
        status: 500,
        statusText: "Internal server error",
        response: {
          data: {
            detail: "Internal server error",
          },
        },
      });
    });
    const event = {preventDefault: () => {}};
    const errorMethod = jest.fn();
    dependency.toast = {
      error: errorMethod,
    };
    return wrapper
      .instance()
      .handleSubmit(event)
      .then(() => {
        expect(wrapper.instance().props.authenticate.mock.calls.length).toBe(0);
        expect(lastConsoleOutuput).not.toBe(null);
        expect(errorMethod).toHaveBeenCalled();
        expect(errorMethod).toBeCalledWith("Internal server error");
        lastConsoleOutuput = null;
      });
  });
  it("should show error toast when connection refused or timeout", async () => {
    axios.mockImplementationOnce(() => {
      return Promise.reject({
        status: 504,
        statusText: "Gateway Timeout",
        response: {
          data:
            "Error occured while trying to proxy to: 0.0.0.0:8080/api/v1/default/account/token",
        },
      });
    });
    const event = {preventDefault: () => {}};
    const errorMethod = jest.fn();
    dependency.toast = {
      error: errorMethod,
    };
    wrapper = shallow(<Login {...props} />, {context: loadingContextValue});
    await wrapper.instance().handleSubmit(event);
    expect(wrapper.instance().props.authenticate.mock.calls.length).toBe(0);
    expect(lastConsoleOutuput).not.toBe(null);
    expect(errorMethod).toHaveBeenCalled();
    expect(errorMethod).toBeCalledWith("Login error occurred.");
    lastConsoleOutuput = null;
  });
});
