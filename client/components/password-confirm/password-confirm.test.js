/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable camelcase */
import axios from "axios";
import {shallow} from "enzyme";
import React from "react";
import {BrowserRouter as Router} from "react-router-dom";
import renderer from "react-test-renderer";
import {toast} from 'react-toastify';

import getConfig from "../../utils/get-config";
import PasswordConfirm from "./password-confirm";

jest.mock("axios");
const defaultConfig = getConfig("default");
const createTestProps = props => {
  return {
    language: "en",
    orgSlug: "default",
    passwordConfirm: defaultConfig.components.confirm_form,
    match: {
      params: {
        uid: "testUid",
        token: "testToken",
      },
    },
    ...props,
  };
};

describe("<PasswordConfirm /> rendering", () => {
  let props;
  let wrapper;
  beforeEach(() => {
    props = createTestProps();
    wrapper = shallow(<PasswordConfirm {...props} />);
  });
  it("should render correctly", () => {
    props = createTestProps();
    const component = renderer
      .create(
        <Router>
          <PasswordConfirm {...props} />
        </Router>,
      )
      .toJSON();
    expect(component).toMatchSnapshot();
  });
  it("should render 2 input fields", () => {
    expect(wrapper.find(".owisp-password-confirm-input")).toHaveLength(2);
  });

  it("should render password field correctly", () => {
    const {password} = props.passwordConfirm.input_fields;
    expect(wrapper.find(".owisp-password-confirm-label-password").text()).toBe(
      password.label.en,
    );
    expect(
      wrapper
        .find(".owisp-password-confirm-input-password")
        .prop("placeholder"),
    ).toBe(password.placeholder.en);
    expect(
      wrapper.find(".owisp-password-confirm-input-password").prop("title"),
    ).toBe(password.pattern_description.en);
    expect(
      wrapper.find(".owisp-password-confirm-input-password").prop("type"),
    ).toBe(password.type);
  });
  it("should render password confirm field correctly", () => {
    const {password_confirm} = props.passwordConfirm.input_fields;
    expect(wrapper.find(".owisp-password-confirm-label-confirm").text()).toBe(
      password_confirm.label.en,
    );
    expect(
      wrapper.find(".owisp-password-confirm-input-confirm").prop("placeholder"),
    ).toBe(password_confirm.placeholder.en);
    expect(
      wrapper.find(".owisp-password-confirm-input-confirm").prop("title"),
    ).toBe(password_confirm.pattern_description.en);
    expect(
      wrapper.find(".owisp-password-confirm-input-confirm").prop("type"),
    ).toBe(password_confirm.type);
  });
});

describe("<PasswordConfirm /> interactions", () => {
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
    afterEach(() => {
      console.error = originalError;
    });
    props = createTestProps();
    wrapper = shallow(<PasswordConfirm {...props} />);
  });
  it("should change state values when handleChange function is invoked", () => {
    wrapper
      .find("#owisp-password-confirm-password")
      .simulate("change", {target: {value: "123456", name: "newPassword1"}});
    expect(wrapper.state("newPassword1")).toEqual("123456");
    wrapper
      .find("#owisp-password-confirm-password-confirm")
      .simulate("change", {target: {value: "123456", name: "newPassword2"}});
    expect(wrapper.state("newPassword2")).toEqual("123456");
  });

  it("should execute handleSubmit correctly when form is submitted", () => {
    axios
      .mockImplementationOnce(() => {
        return Promise.reject({response: {data: {detail: "errors"}}});
      })
      .mockImplementationOnce(() => {
        return Promise.reject({
          response: {data: {non_field_errors: ["non field errors"]}},
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({data: {detail: true}});
      });
    wrapper.setState({
      newPassword1: "wrong password",
      newPassword2: "wrong password1",
    });
    wrapper.instance().handleSubmit({preventDefault: () => {}});
    expect(
      wrapper.update().find(".owisp-password-confirm-error-confirm"),
    ).toHaveLength(1);
    wrapper.setState({
      newPassword1: "password",
      newPassword2: "password",
    });
    const spyToastError = jest.spyOn(toast, "error");
    const spyToastSuccess = jest.spyOn(toast, "success");
    return wrapper
      .instance()
      .handleSubmit({preventDefault: () => {}})
      .then(() => {
        expect(wrapper.instance().state.errors.nonField).toEqual("errors");
        expect(
          wrapper.find(".owisp-password-confirm-error-non-field"),
        ).toHaveLength(1);
        expect(lastConsoleOutuput).not.toBe(null);
        expect(spyToastError.mock.calls.length).toBe(1);
        expect(spyToastSuccess.mock.calls.length).toBe(0);
        lastConsoleOutuput = null;
      })
      .then(() => {
        return wrapper
          .instance()
          .handleSubmit({preventDefault: () => {}})
          .then(() => {
            expect(wrapper.instance().state.errors.nonField).toEqual(
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
          .handleSubmit({preventDefault: () => {}})
          .then(() => {
            expect(wrapper.instance().state.errors).toEqual({});
            expect(wrapper.instance().state.success).toBe(true);
            expect(
              wrapper.find(".owisp-password-confirm-input.error"),
            ).toHaveLength(0);
            expect(
              wrapper.find(".owisp-password-confirm-success"),
            ).toHaveLength(1);
            expect(lastConsoleOutuput).toBe(null);
            expect(spyToastError.mock.calls.length).toBe(2);
            expect(spyToastSuccess.mock.calls.length).toBe(1);
            lastConsoleOutuput = null;
          });
      });
  });
});
