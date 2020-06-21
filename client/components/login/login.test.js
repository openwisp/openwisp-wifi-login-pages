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
const createTestProps = props => {
  return {
    language: "en",
    orgSlug: "default",
    loginForm: defaultConfig.components.login_form,
    privacyPolicy: defaultConfig.privacy_policy,
    termsAndConditions: defaultConfig.terms_and_conditions,
    authenticate: jest.fn(),
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
                en: "Facebook",
              },
              url: "test url",
              icon: null,
            },
            {
              icon: "test.png",
              url:
                "https://control.co.ke/accounts/facebook/login/?next=%2Ffreeradius%2Fsocial-login%2Fstaging%2F%3Fcp%3Dhttp%3A%2F%2Fcontrol.brandfi.co.ke%2Floginpage%2F%26last%3D",
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
    wrapper
      .find("#owisp-login-email")
      .simulate("change", { target: { value: "test email", name: "email" } });
    expect(wrapper.state("email")).toEqual("test email");
    wrapper
      .find("#owisp-login-password")
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
    const event = { preventDefault: () => { } };
    const spyToast = jest.spyOn(toast, 'error');
    return wrapper
      .instance()
      .handleSubmit(event)
      .then(() => {
        expect(wrapper.instance().state.errors).toEqual({
          email: "email error",
          password: "password error",
        });
        expect(wrapper.find(".owisp-login-error")).toHaveLength(2);
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
});
