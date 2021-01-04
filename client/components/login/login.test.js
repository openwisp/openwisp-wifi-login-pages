/* eslint-disable prefer-promise-reject-errors */
import axios from "axios";
import { shallow } from "enzyme";
import React from "react";
import ShallowRenderer from "react-test-renderer/shallow";
import { toast } from 'react-toastify';
import PropTypes from "prop-types";
import { loadingContextValue } from "../../utils/loading-context";

import getConfig from "../../utils/get-config";
import Login from "./login";

jest.mock("axios");

const defaultConfig = getConfig("default");
const loginForm = defaultConfig.components.login_form;
loginForm.input_fields.phone_number = defaultConfig.components.registration_form.input_fields.phone_number;
const createTestProps = props => {
  return {
    language: "en",
    orgSlug: "default",
    loginForm,
    privacyPolicy: defaultConfig.privacy_policy,
    termsAndConditions: defaultConfig.terms_and_conditions,
    settings: {mobile_phone_verification: false},
    authenticate: jest.fn(),
    verifyMobileNumber: jest.fn(),
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
    Login.contextTypes = {
      setLoading: PropTypes.func,
      getLoading: PropTypes.func
    };
    wrapper = shallow(<Login {...props} />, { context: loadingContextValue });
  });

  afterEach(() => {
    console.error = originalError;
  });

  it("should change state values when handleChange function is invoked", () => {
    // phone_number should not be present if mobile_phone_verification is off
    expect(wrapper.find("[name='phone_number']")).toEqual({});
    wrapper
      .find("#email")
      .simulate("change", { target: { value: "test email", name: "email" } });
    expect(wrapper.state("email")).toEqual("test email");
    wrapper
      .find("#password")
      .simulate("change", { target: { value: "test password", name: "password" } });
    expect(wrapper.state("password")).toEqual("test password");
  });

  it("should execute handleSubmit correctly when form is submitted", () => {
    axios
      .mockImplementationOnce(() => {
        return Promise.reject({
          response: {
            data: {
              email: "email error",
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
            }
          }
        });
      })
      .mockImplementationOnce(() => {
        return Promise.reject({
          response: {
            data: {}
          },
          status: 504,
          statusText: "Gateway Timeout"
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve();
      });
    const event = { preventDefault: () => {} };
    const spyToast = jest.spyOn(toast, 'error');
    
    return wrapper
      .instance()
      .handleSubmit(event)
      .then(() => {
        expect(wrapper.instance().state.errors).toEqual({
          email: "email error",
          password: "password error",
          phone_number: "",
        });
        expect(wrapper.find("div.error")).toHaveLength(2);
        expect(wrapper.find("input.error")).toHaveLength(2);
        expect(
          wrapper.instance().props.authenticate.mock.calls.length,
        ).toBe(0);
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
    wrapper = shallow(<Login {...props} />, { context: loadingContextValue });

    axios.mockImplementationOnce(() => {
      return Promise.reject({
        response: {
          status: 401,
          statusText: "unauthorized",
          data: "",
        },
      });
    });

    expect(wrapper.find("#email")).toEqual({});
    expect(wrapper.state("phone_number")).toEqual("");
    wrapper
      .find("[name='phone_number']")
      .simulate("change", {target: {value: "+393660011333", name: "phone_number"}});
    expect(wrapper.state("phone_number")).not.toEqual("");
    wrapper
      .find("#password")
      .simulate("change", { target: { value: "test password", name: "password" } });
    expect(wrapper.state("password")).toEqual("test password");

    const event = {preventDefault: () => {}};
    await wrapper.instance().handleSubmit(event);
    const verifyMock = wrapper.instance().props.verifyMobileNumber.mock;
    expect(verifyMock.calls.length).toBe(1);
    expect(verifyMock.calls.pop()).toEqual([true]);
    const authenticateMock = wrapper.instance().props.authenticate.mock;
    expect(authenticateMock.calls.length).toBe(1);
    expect(authenticateMock.calls.pop()).toEqual([true]);
  });
  it("phone_number field should be present if mobile phone verification is on", async () => {
    props.settings = {mobile_phone_verification: true};
    wrapper = shallow(<Login {...props} />, { context: loadingContextValue });
    
    expect(wrapper.find("#email").length).toEqual(0);
    expect(wrapper.find("[name='phone_number']").length).toEqual(1);
  });
  it("email field should be present if mobile phone verification is off", async () => {
    props.settings = {mobile_phone_verification: false};
    wrapper = shallow(<Login {...props} />, { context: loadingContextValue });
    
    expect(wrapper.find("#email").length).toEqual(1);
    expect(wrapper.find("[name='phone_number']").length).toEqual(0);
  });
});
