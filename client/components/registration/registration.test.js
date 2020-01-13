/* eslint-disable prefer-promise-reject-errors */
import axios from "axios";
/* eslint-disable camelcase */
import {shallow} from "enzyme";
import React from "react";
import ShallowRenderer from "react-test-renderer/shallow";
import {toast} from 'react-toastify';

import getConfig from "../../utils/get-config";
import Registration from "./registration";

jest.mock("axios");

const defaultConfig = getConfig("default");
const createTestProps = props => {
  return {
    language: "en",
    orgSlug: "default",
    registration: defaultConfig.components.registration_form,
    privacyPolicy: defaultConfig.privacy_policy,
    termsAndConditions: defaultConfig.terms_and_conditions,
    authenticate: jest.fn(),
    match: {
      path: "default/registration",
    },
    ...props,
  };
};

describe("<Registration /> rendering", () => {
  let props;
  beforeEach(() => {
    props = createTestProps();
  });
  it("should render correctly", () => {
    props = createTestProps();
    const renderer = new ShallowRenderer();
    const component = renderer.render(<Registration {...props} />);
    expect(component).toMatchSnapshot();
  });
});

describe("<Registration /> interactions", () => {
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
    wrapper = shallow(<Registration {...props} />);
  });
  afterEach(() => {
    console.error = originalError;
  });
  it("should change state values when handleChange function is invoked", () => {
    wrapper
      .find("#owisp-registration-email")
      .simulate("change", {target: {value: "test email", name: "email"}});
    expect(wrapper.state("email")).toEqual("test email");
    wrapper
      .find("#owisp-registration-password")
      .simulate("change", {target: {value: "testpassword", name: "password1"}});
    expect(wrapper.state("password1")).toEqual("testpassword");
    wrapper
      .find("#owisp-registration-password-confirm")
      .simulate("change", {target: {value: "testpassword", name: "password2"}});
    expect(wrapper.state("password2")).toEqual("testpassword");
  });

  it("should execute handleSubmit correctly when form is submitted", () => {
    axios
      .mockImplementationOnce(() => {
        return Promise.reject({
          response: {
            data: {
              email: "email error",
              detail: "nonField error",
              password1: "password1 error",
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
              detail:	"Internal server error",
            },
          },
        });
      })
      .mockImplementationOnce(() => {
        return Promise.reject({
          status: 504,
          statusText: "Gateway Timeout",
          response: {
            data: {}
          },
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve();
      });
    wrapper.setState({
      password1: "wrong password",
      password2: "wrong password1",
    });
    const event = {preventDefault: () => {}};
    const spyToast = jest.spyOn(toast, 'error');
    wrapper.instance().handleSubmit(event);
    expect(
      wrapper.update().find(".owisp-registration-error-confirm"),
    ).toHaveLength(1);
    wrapper.setState({
      password1: "password",
      password2: "password",
    });
    wrapper.setProps({
      registration: {
        ...props.registration,
        input_fields: {
          ...props.registration.input_fields,
          password_confirm: null,
        },
      },
    });
    return wrapper
      .instance()
      .handleSubmit(event)
      .then(() => {
        expect(wrapper.instance().state.errors).toEqual({
          email: "email error",
          password1: "password1 error",
          password2: "",
        });
        expect(wrapper.find(".owisp-registration-error")).toHaveLength(2);
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
            expect(wrapper.instance().state.success).toEqual(true);
            expect(
              wrapper.find(".owisp-registration-form.success"),
            ).toHaveLength(1);
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
