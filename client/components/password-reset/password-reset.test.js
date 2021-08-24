/* eslint-disable prefer-promise-reject-errors */
import axios from "axios";
import {shallow} from "enzyme";
import React from "react";
import {toast} from "react-toastify";
import PropTypes from "prop-types";
import getConfig from "../../utils/get-config";
import {loadingContextValue} from "../../utils/loading-context";
import loadTranslation from "../../utils/load-translation";
import PasswordReset from "./password-reset";
import translation from "../../test-translation.json";

jest.mock("axios");
jest.mock("../../utils/get-config");
jest.mock("../../utils/load-translation");

const defaultConfig = getConfig("default", true);
const createTestProps = (props) => ({
  orgSlug: "default",
  orgName: "default name",
  setTitle: jest.fn(),
  passwordReset: defaultConfig.components.password_reset_form,
  language: "en",
  ...props,
});

const getTranslationString = (msgid) => {
  try {
    return translation.translations[""][msgid].msgstr[0];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err, msgid);
    return msgid;
  }
};

describe("<PasswordReset /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const wrapper = shallow(<PasswordReset {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});

describe("<PasswordReset /> rendering", () => {
  let props;
  let wrapper;

  beforeEach(() => {
    props = createTestProps();
    loadTranslation("en", "default");
    wrapper = shallow(<PasswordReset {...props} />);
  });

  it("should render correctly", () => {
    expect(wrapper).toMatchSnapshot();
  });

  it("should render 2 inputs", () => {
    expect(wrapper.find("input")).toHaveLength(2);
    expect(wrapper.find("input[type='email']")).toHaveLength(1);
    expect(wrapper.find("input[type='submit']")).toHaveLength(1);
  });

  it("should render email field correctly", () => {
    const emailInput = wrapper.find("input[type='email']");
    expect(wrapper.find(".row.email label").text()).toBe(
      getTranslationString("EMAIL"),
    );
    expect(emailInput.prop("placeholder")).toBe(
      getTranslationString("EMAIL_PHOLD"),
    );
    expect(emailInput.prop("title")).toBe(
      getTranslationString("EMAIL_PTRN_DESC"),
    );
    expect(emailInput.prop("type")).toBe("email");
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
      getLoading: PropTypes.func,
    };
    wrapper = shallow(<PasswordReset {...props} />, {
      context: loadingContextValue,
    });
  });

  afterEach(() => {
    console.error = originalError;
  });

  it("should change state values when handleChange function is invoked", () => {
    wrapper
      .find("input[type='email']")
      .simulate("change", {target: {value: "test@test.com", name: "email"}});
    expect(wrapper.state("email")).toEqual("test@test.com");
  });

  it("should execute handleSubmit correctly when form is submitted", () => {
    axios
      .mockImplementationOnce(() =>
        Promise.reject({response: {data: {detail: "errors"}}}),
      )
      .mockImplementationOnce(() =>
        Promise.reject({
          response: {data: {non_field_errors: ["non field errors"]}},
        }),
      )
      .mockImplementationOnce(() => Promise.resolve({data: {detail: true}}));
    const spyToastError = jest.spyOn(toast, "error");
    const spyToastSuccess = jest.spyOn(toast, "success");
    return wrapper
      .instance()
      .handleSubmit({preventDefault: () => {}})
      .then(() => {
        expect(wrapper.instance().state.errors.email).toEqual("errors");
        expect(wrapper.find("div.error")).toHaveLength(1);
        expect(wrapper.find("input.error")).toHaveLength(1);
        expect(lastConsoleOutuput).not.toBe(null);
        expect(spyToastError.mock.calls.length).toBe(1);
        expect(spyToastSuccess.mock.calls.length).toBe(0);
        lastConsoleOutuput = null;
      })
      .then(() =>
        wrapper
          .instance()
          .handleSubmit({preventDefault: () => {}})
          .then(() => {
            expect(wrapper.instance().state.errors.email).toEqual(
              "non field errors",
            );
            expect(lastConsoleOutuput).not.toBe(null);
            expect(spyToastError.mock.calls.length).toBe(2);
            expect(spyToastSuccess.mock.calls.length).toBe(0);
            lastConsoleOutuput = null;
          }),
      )
      .then(() =>
        wrapper
          .instance()
          .handleSubmit({preventDefault: () => {}})
          .then(() => {
            expect(wrapper.instance().state.errors).toEqual({});
            expect(wrapper.instance().state.success).toBe(true);
            expect(wrapper.find(".error")).toHaveLength(0);
            expect(wrapper.find(".success")).toHaveLength(1);
            expect(lastConsoleOutuput).toBe(null);
            expect(spyToastError.mock.calls.length).toBe(2);
            expect(spyToastSuccess.mock.calls.length).toBe(1);
            lastConsoleOutuput = null;
          }),
      );
  });
  it("should set title", () => {
    const setTitleMock = wrapper.instance().props.setTitle.mock;
    expect(setTitleMock.calls.pop()).toEqual(["Reset Password", props.orgName]);
  });
});
