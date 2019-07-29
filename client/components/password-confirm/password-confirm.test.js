/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable camelcase */
import axios from "axios";
import {shallow} from "enzyme";
import React from "react";
import {BrowserRouter as Router} from "react-router-dom";
import renderer from "react-test-renderer";

import PasswordConfirm from "./password-confirm";

jest.mock("axios");

const createTestProps = props => {
  return {
    language: "en",
    orgSlug: "default",
    passwordConfirm: {
      heading: {
        en: "reset your password",
      },
      additional_text: {
        en: "please enter your new password",
      },
      input_fields: {
        password: {
          type: "password",
          pattern: ".{6,}",
          pattern_description: {
            en: "password must be a minimum of 6 characters",
          },
          placeholder: {
            en: "password",
          },
          label: {
            en: "password",
          },
        },
        password_confirm: {
          type: "password",
          pattern: null,
          pattern_description: {
            en: null,
          },
          placeholder: {
            en: "confirm password",
          },
          label: {
            en: "confirm",
          },
        },
      },
      buttons: {
        submit: {
          en: "change password",
        },
      },
    },
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
  beforeEach(() => {
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
    return wrapper
      .instance()
      .handleSubmit({preventDefault: () => {}})
      .then(() => {
        expect(wrapper.instance().state.errors.nonField).toEqual("errors");
        expect(
          wrapper.find(".owisp-password-confirm-error-non-field"),
        ).toHaveLength(1);
      })
      .then(() => {
        return wrapper
          .instance()
          .handleSubmit({preventDefault: () => {}})
          .then(() => {
            expect(wrapper.instance().state.errors.nonField).toEqual(
              "non field errors",
            );
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
          });
      });
  });
});
