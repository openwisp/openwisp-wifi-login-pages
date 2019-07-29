/* eslint-disable prefer-promise-reject-errors */
import axios from "axios";
import {shallow} from "enzyme";
import React from "react";
import {BrowserRouter as Router} from "react-router-dom";
import renderer from "react-test-renderer";

import PasswordReset from "./password-reset";

jest.mock("axios");

const createTestProps = props => {
  return {
    language: "en",
    orgSlug: "default",
    passwordReset: {
      heading: {
        en: "reset your password",
      },
      additional_text: {
        en:
          "enter your email and we'll send you the instructions to reset your password",
      },
      input_fields: {
        email: {
          type: "email",
          pattern: null,
          pattern_description: {
            en: null,
          },
          placeholder: {
            en: "email address",
          },
          label: {
            en: "email",
          },
        },
      },
      buttons: {
        send: {
          en: "send",
        },
      },
      login_page_link: {
        text: {
          en: "Take me Back to Sign In",
        },
      },
    },
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
    const {email} = props.passwordReset.input_fields;
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
  beforeEach(() => {
    props = createTestProps();
    wrapper = shallow(<PasswordReset {...props} />);
  });
  it("should change state values when handleChange function is invoked", () => {
    wrapper
      .find("#owisp-password-reset-email")
      .simulate("change", {target: {value: "test@test.com", name: "email"}});
    expect(wrapper.state("email")).toEqual("test@test.com");
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
    return wrapper
      .instance()
      .handleSubmit({preventDefault: () => {}})
      .then(() => {
        expect(wrapper.instance().state.errors.email).toEqual("errors");
        expect(wrapper.find(".owisp-password-reset-input.error")).toHaveLength(
          1,
        );
        expect(wrapper.find(".owisp-password-reset-error")).toHaveLength(1);
      })
      .then(() => {
        return wrapper
          .instance()
          .handleSubmit({preventDefault: () => {}})
          .then(() => {
            expect(wrapper.instance().state.errors.email).toEqual(
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
              wrapper.find(".owisp-password-reset-input.error"),
            ).toHaveLength(0);
            expect(wrapper.find(".owisp-password-reset-success")).toHaveLength(
              1,
            );
          });
      });
  });
});
