/* eslint-disable camelcase */
import {shallow} from "enzyme";
import React from "react";
import renderer from "react-test-renderer";

import Registration from "./registration";

const createTestProps = props => {
  return {
    language: "en",
    orgSlug: "default",
    registration: {
      header: {
        en: " sign up",
      },
      input_fields: {
        username: {
          type: "text",
          pattern: "[a-zA-Z@.+\\-_]{1,150}",
          pattern_description: {
            en: "only letters, numbers, and @/./+/-/_ characters",
          },
          placeholder: {
            en: "enter phone number or username",
          },
          label: {
            en: "phone number or username",
          },
        },
        email: {
          type: "email",
          pattern: undefined,
          pattern_description: {
            en: undefined,
          },
          placeholder: {
            en: "email address",
          },
          label: {
            en: "email",
          },
        },
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
          pattern: undefined,
          pattern_description: {
            en: undefined,
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
        register: {
          en: "sign up",
        },
      },
    },
    ...props,
  };
};

describe("<Registration /> rendering", () => {
  let props;
  let wrapper;
  beforeEach(() => {
    props = createTestProps();
    wrapper = shallow(<Registration {...props} />);
  });
  it("should render correctly", () => {
    props = createTestProps();
    const component = renderer.create(<Registration {...props} />).toJSON();
    expect(component).toMatchSnapshot();
  });
  it("should render 4 input fields", () => {
    expect(wrapper.find(".owisp-registration-input")).toHaveLength(4);
  });
  it("should render username field correctly", () => {
    const {username} = props.registration.input_fields;
    expect(wrapper.find(".owisp-registration-label-username").text()).toBe(
      username.label.en,
    );
    expect(
      wrapper.find(".owisp-registration-input-username").prop("placeholder"),
    ).toBe(username.placeholder.en);
    expect(
      wrapper.find(".owisp-registration-input-username").prop("pattern"),
    ).toBe(username.pattern);
    expect(
      wrapper.find(".owisp-registration-input-username").prop("title"),
    ).toBe(username.pattern_description.en);
    expect(
      wrapper.find(".owisp-registration-input-username").prop("type"),
    ).toBe(username.type);
  });

  it("should render email field correctly", () => {
    const {email} = props.registration.input_fields;
    expect(wrapper.find(".owisp-registration-label-email").text()).toBe(
      email.label.en,
    );
    expect(
      wrapper.find(".owisp-registration-input-email").prop("placeholder"),
    ).toBe(email.placeholder.en);
    expect(
      wrapper.find(".owisp-registration-input-email").prop("pattern"),
    ).toBe(email.pattern);
    expect(wrapper.find(".owisp-registration-input-email").prop("title")).toBe(
      email.pattern_description.en,
    );
    expect(wrapper.find(".owisp-registration-input-email").prop("type")).toBe(
      email.type,
    );
  });

  it("should render password field correctly", () => {
    const {password} = props.registration.input_fields;
    expect(wrapper.find(".owisp-registration-label-password").text()).toBe(
      password.label.en,
    );
    expect(
      wrapper.find(".owisp-registration-input-password").prop("placeholder"),
    ).toBe(password.placeholder.en);
    expect(
      wrapper.find(".owisp-registration-input-password").prop("pattern"),
    ).toBe(password.pattern);
    expect(
      wrapper.find(".owisp-registration-input-password").prop("title"),
    ).toBe(password.pattern_description.en);
    expect(
      wrapper.find(".owisp-registration-input-password").prop("type"),
    ).toBe(password.type);
  });

  it("should render confirm password field correctly", () => {
    const {password_confirm} = props.registration.input_fields;
    expect(wrapper.find(".owisp-registration-label-confirm").text()).toBe(
      password_confirm.label.en,
    );
    expect(
      wrapper.find(".owisp-registration-input-confirm").prop("placeholder"),
    ).toBe(password_confirm.placeholder.en);
    expect(
      wrapper.find(".owisp-registration-input-confirm").prop("pattern"),
    ).toBe(password_confirm.pattern);
    expect(
      wrapper.find(".owisp-registration-input-confirm").prop("title"),
    ).toBe(password_confirm.pattern_description.en);
    expect(wrapper.find(".owisp-registration-input-confirm").prop("type")).toBe(
      password_confirm.type,
    );
  });
});

describe("<Registration /> interactions", () => {
  let props;
  let wrapper;
  beforeEach(() => {
    props = createTestProps();
    wrapper = shallow(<Registration {...props} />);
  });
  it("should change state values when handleChange function is invoked", () => {
    wrapper
      .find("#owisp-registration-username")
      .simulate("change", {target: {value: "test username", name: "username"}});
    expect(wrapper.state("username")).toEqual("test username");
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

  it("should call handleSubmit when form is submitted", () => {
    const mockedHandleSubmit = jest
      .fn()
      .mockImplementationOnce(() => {
        wrapper.setState({
          errors: {},
          username: "",
          email: "",
          password1: "",
          password2: "",
          success: true,
        });
      })
      .mockImplementationOnce(() => {
        wrapper.setState({
          errors: {
            username: "invalid username",
            email: "invalid email",
          },
        });
      });
    wrapper.instance().handleSubmit = mockedHandleSubmit;
    wrapper.instance().forceUpdate();
    wrapper.find(".owisp-registration-form").simulate("submit");
    expect(mockedHandleSubmit).toHaveBeenCalledTimes(1);
    expect(wrapper.find(".owisp-registration-form.success")).toHaveLength(1);
    wrapper.find(".owisp-registration-form").simulate("submit");
    expect(mockedHandleSubmit).toHaveBeenCalledTimes(2);
    expect(wrapper.find(".owisp-registration-input.error")).toHaveLength(2);
    expect(wrapper.find(".owisp-registration-error")).toHaveLength(2);
  });
});
