/* eslint-disable prefer-promise-reject-errors */
import axios from "axios";
import { shallow } from "enzyme";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import renderer from "react-test-renderer";
import { toast } from 'react-toastify';
import PropTypes from "prop-types";
import getConfig from "../../utils/get-config";
import { loadingContextValue } from "../../utils/loading-context";
import PasswordReset from "./password-reset";

jest.mock("axios");

const defaultConfig = getConfig("default");
const createTestProps = props => {
  return {
    language: "en",
    orgSlug: "default",
    passwordReset: defaultConfig.components.reset_form,
    ...props,
  };
};

describe("<PasswordReset /> rendering", () => {
  let props;
  let wrapper;
  beforeEach(() => {
    props = createTestProps();
    wrapper = shallow(<PasswordReset {...props} />);
  });
  it("should render correctly", () => {
    props = createTestProps();
    const component = renderer
      .create(
        <Router>
          <PasswordReset {...props} />
        </Router>,
      )
      .toJSON();
    expect(component).toMatchSnapshot();
  });
  it("should render 1 input field", () => {
    expect(wrapper.find(".owisp-password-reset-input")).toHaveLength(1);
  });

  it("should render email field correctly", () => {
    const { email } = props.passwordReset.input_fields;
    expect(wrapper.find(".owisp-password-reset-label-email").text()).toBe(
      email.label.en,
    );
    expect(
      wrapper.find(".owisp-password-reset-input-email").prop("placeholder"),
    ).toBe(email.placeholder.en);
    expect(
      wrapper.find(".owisp-password-reset-input-email").prop("title"),
    ).toBe(email.pattern_description.en);
    expect(wrapper.find(".owisp-password-reset-input-email").prop("type")).toBe(
      email.type,
    );
  });
});

describe("<PasswordReset /> interactions", () => {
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
    PasswordReset.contextTypes = {
      setLoading: PropTypes.func,
      getLoading: PropTypes.func
    };
    wrapper = shallow(<PasswordReset {...props} />, { context: loadingContextValue });
  });
  afterEach(() => {
    console.error = originalError;
  });
  it("should change state values when handleChange function is invoked", () => {
    wrapper
      .find("#owisp-password-reset-email")
      .simulate("change", { target: { value: "test@test.com", name: "email" } });
    expect(wrapper.state("email")).toEqual("test@test.com");
  });

  it("should execute handleSubmit correctly when form is submitted", () => {
    axios
      .mockImplementationOnce(() => {
        return Promise.reject({ response: { data: { detail: "errors" } } });
      })
      .mockImplementationOnce(() => {
        return Promise.reject({
          response: { data: { non_field_errors: ["non field errors"] } },
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({ data: { detail: true } });
      });
    const spyToastError = jest.spyOn(toast, "error");
    const spyToastSuccess = jest.spyOn(toast, "success");
    return wrapper
      .instance()
      .handleSubmit({ preventDefault: () => { } })
      .then(() => {
        expect(wrapper.instance().state.errors.email).toEqual("errors");
        expect(wrapper.find(".owisp-password-reset-input.error")).toHaveLength(
          1,
        );
        expect(wrapper.find(".owisp-password-reset-error")).toHaveLength(1);
        expect(lastConsoleOutuput).not.toBe(null);
        expect(spyToastError.mock.calls.length).toBe(1);
        expect(spyToastSuccess.mock.calls.length).toBe(0);
        lastConsoleOutuput = null;
      })
      .then(() => {
        return wrapper
          .instance()
          .handleSubmit({ preventDefault: () => { } })
          .then(() => {
            expect(wrapper.instance().state.errors.email).toEqual(
              "non field errors",
            );
            expect(lastConsoleOutuput).not.toBe(null);
            expect(spyToastError.mock.calls.length).toBe(2);
            expect(spyToastSuccess.mock.calls.length).toBe(0);
            lastConsoleOutuput = null;
          });
      })
      .then(() => {
        return wrapper
          .instance()
          .handleSubmit({ preventDefault: () => { } })
          .then(() => {
            expect(wrapper.instance().state.errors).toEqual({});
            expect(wrapper.instance().state.success).toBe(true);
            expect(
              wrapper.find(".owisp-password-reset-input.error"),
            ).toHaveLength(0);
            expect(wrapper.find(".owisp-password-reset-success")).toHaveLength(
              1,
            );
            expect(lastConsoleOutuput).toBe(null);
            expect(spyToastError.mock.calls.length).toBe(2);
            expect(spyToastSuccess.mock.calls.length).toBe(1);
            lastConsoleOutuput = null;
          });
      });
  });
});
