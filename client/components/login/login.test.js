/* eslint-disable prefer-promise-reject-errors */
import axios from "axios";
import {shallow} from "enzyme";
import React from "react";
import {BrowserRouter as Router} from "react-router-dom";
import renderer from "react-test-renderer";

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
    ...props,
  };
};
describe("<Login /> rendering", () => {
  let props;
  it("should render correctly without social links", () => {
    props = createTestProps();
    const component = renderer
      .create(
        <Router>
          <Login {...props} />
        </Router>,
      )
      .toJSON();
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
    const component = renderer
      .create(
        <Router>
          <Login {...props} />
        </Router>,
      )
      .toJSON();
    expect(component).toMatchSnapshot();
  });
});

describe("<Login /> interactions", () => {
  let props;
  let wrapper;
  beforeEach(() => {
    props = createTestProps();
    wrapper = shallow(<Login {...props} />);
  });
  it("should change state values when handleChange function is invoked", () => {
    wrapper
      .find("#owisp-login-username")
      .simulate("change", {target: {value: "test username", name: "username"}});
    expect(wrapper.state("username")).toEqual("test username");
    wrapper
      .find("#owisp-login-password")
      .simulate("change", {target: {value: "test password", name: "password"}});
    expect(wrapper.state("password")).toEqual("test password");
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
        return Promise.resolve();
      });
    const event = {preventDefault: () => {}};
    return wrapper
      .instance()
      .handleSubmit(event)
      .then(() => {
        expect(wrapper.instance().state.errors).toEqual({
          username: "username error",
          nonField: "error details",
          password: "password error",
        });
        expect(wrapper.find(".owisp-login-error")).toHaveLength(3);
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
          });
      });
  });
});
