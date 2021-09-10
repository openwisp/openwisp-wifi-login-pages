import axios from "axios";
/* eslint-disable camelcase */
import {shallow} from "enzyme";
import PropTypes from "prop-types";
import React from "react";
import {Cookies} from "react-cookie";
import {t} from "ttag";
import getConfig from "../../utils/get-config";
import logError from "../../utils/log-error";
import tick from "../../utils/tick";
import loadTranslation from "../../utils/load-translation";
import PasswordChange from "./password-change";
import PasswordToggleIcon from "../../utils/password-toggle";
import validateToken from "../../utils/validate-token";

jest.mock("axios");
jest.mock("../../utils/get-config");
jest.mock("../../utils/log-error");
jest.mock("../../utils/load-translation");
jest.mock("../../utils/validate-token");
jest.mock("../../utils/handle-logout");
logError.mockImplementation(jest.fn());

const defaultConfig = getConfig("default", true);

const createTestProps = (props) => ({
  orgSlug: "default",
  orgName: "default name",
  passwordChange: defaultConfig.components.password_change_form,
  cookies: new Cookies(),
  setTitle: jest.fn(),
  logout: jest.fn(),
  userData: {},
  setUserData: jest.fn(),
  language: "en",
  ...props,
});

PasswordChange.contextTypes = {
  setLoading: PropTypes.func,
  getLoading: PropTypes.func,
};

const createShallow = (props) =>
  shallow(<PasswordChange {...props} />, {
    context: {setLoading: jest.fn(), getLoading: jest.fn()},
  });

describe("<PasswordChange /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const wrapper = createShallow(props);
    expect(wrapper).toMatchSnapshot();
  });
});

describe("<PasswordChange /> rendering", () => {
  let props;

  it("should render correctly", () => {
    props = createTestProps();
    loadTranslation("en", "default");
    const wrapper = createShallow(props);
    expect(wrapper).toMatchSnapshot();
  });
});

describe("<PasswordChange /> interactions", () => {
  let props;
  // eslint-disable-next-line no-unused-vars
  let wrapper;

  beforeEach(() => {
    props = createTestProps();
    wrapper = createShallow(props);
  });

  it("test handleChange method", () => {
    const e = {
      target: {
        name: "newPassword1",
        value: "123456",
      },
    };
    wrapper.instance().handleChange(e);
    expect(wrapper.instance().state.newPassword1).toBe("123456");
  });

  it("test handleSubmit method", async () => {
    axios
      .mockImplementationOnce(() =>
        // eslint-disable-next-line prefer-promise-reject-errors
        Promise.reject({
          response: {
            status: 401,
            statusText: "UNAUTHORIZED",
            data: {},
          },
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          statusText: "OK",
          data: {
            detail: "password changed",
          },
        }),
      );
    const e = {preventDefault: jest.fn()};
    wrapper.setState({
      newPassword1: "123456",
      newPassword2: "wrong-pass",
      errors: {
        newPassword1: t`PWD_CNF_ERR`,
      },
    });
    wrapper.instance().handleSubmit();
    expect(wrapper.instance().state.errors).toStrictEqual({
      newPassword2: t`PWD_CNF_ERR`,
    });
    wrapper.setState({
      currentPassword: "123456",
      newPassword1: "123456",
      newPassword2: "123456",
    });
    wrapper.instance().handleSubmit(e);
    expect(wrapper.instance().state.errors).toStrictEqual({
      newPassword1: t`PWD_CURR_ERR`,
      newPassword2: t`PWD_CURR_ERR`,
    });
    wrapper.setState({
      currentPassword: "1234567",
      newPassword1: "123456",
      newPassword2: "123456",
    });
    wrapper.instance().handleSubmit(e);
    await tick();
    expect(wrapper.instance().state.errors).toStrictEqual({
      nonField: t`PWD_CHNG_ERR`,
    });
    wrapper.instance().handleSubmit(e);
  });
  it("should set title", () => {
    const setTitleMock = wrapper.instance().props.setTitle.mock;
    expect(setTitleMock.calls.pop()).toEqual([
      "Change your password",
      props.orgName,
    ]);
  });
  it("should execute handleChange if field value is changes", () => {
    expect(wrapper.find("input[name='newPassword1']").length).toEqual(1);
    expect(wrapper.find("input[name='newPassword1']").props()).toEqual({
      autoComplete: "password",
      className: "input",
      id: "new-password",
      name: "newPassword1",
      onChange: expect.any(Function),
      pattern: ".{6,}",
      placeholder: "Your new password",
      required: true,
      title: "password must be a minimum of 6 characters",
      type: "password",
      value: "",
    });
    wrapper.instance().handleChange = jest.fn();
    const e = {
      target: {
        name: "newPassword1",
        value: "123456",
      },
    };
    wrapper.find("input[name='newPassword1']").props().onChange(e);
    expect(wrapper.instance().handleChange).toHaveBeenCalledWith(e);
    expect(wrapper.find("input[name='newPassword2']").length).toEqual(1);
    expect(wrapper.find("input[name='newPassword2']").props()).toEqual({
      autoComplete: "password",
      className: "input",
      id: "password-confirm",
      name: "newPassword2",
      onChange: expect.any(Function),
      pattern: ".{6,}",
      placeholder: "confirm password",
      required: true,
      title: "password must be a minimum of 6 characters",
      type: "password",
      value: "",
    });
    wrapper.instance().handleChange = jest.fn();
    wrapper.find("input[name='newPassword2']").props().onChange(e);
    expect(wrapper.instance().handleChange).toHaveBeenCalledWith(e);
  });
  it("should toggle password icon for both password fields in PasswordToggleIcon", async () => {
    const nodes = wrapper.find(PasswordToggleIcon);
    expect(nodes.length).toEqual(3);
    expect(nodes.at(1).props()).toEqual({
      hidePassword: true,
      inputRef: {current: null},
      isVisible: false,
      parentClassName: "",
      secondInputRef: {current: null},
      toggler: expect.any(Function),
    });
    expect(wrapper.instance().state.hidePassword).toEqual(true);
    nodes.at(1).props().toggler();
    expect(wrapper.instance().state.hidePassword).toEqual(false);
    expect(nodes.at(2).props()).toEqual({
      hidePassword: true,
      inputRef: {current: null},
      isVisible: false,
      parentClassName: "",
      secondInputRef: {current: null},
      toggler: expect.any(Function),
    });
    nodes.at(2).props().toggler();
    expect(wrapper.instance().state.hidePassword).toEqual(false);
  });
  it("should validate token", async () => {
    props = createTestProps();
    PasswordChange.contextTypes = {
      setLoading: PropTypes.func,
      getLoading: PropTypes.func,
    };
    wrapper = await shallow(<PasswordChange {...props} />, {
      context: {setLoading: jest.fn(), getLoading: jest.fn()},
    });
    expect(validateToken).toHaveBeenCalledWith(
      props.cookies,
      props.orgSlug,
      props.setUserData,
      props.userData,
      props.logout,
    );
  });
  it("should redirect to status if login method is SAML / Social Login", async () => {
    props = createTestProps();
    PasswordChange.contextTypes = {
      setLoading: PropTypes.func,
      getLoading: PropTypes.func,
    };
    props.userData.method = "saml";
    wrapper = await shallow(<PasswordChange {...props} />, {
      context: {setLoading: jest.fn(), getLoading: jest.fn()},
    });
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
    await wrapper.setProps({...props.userData, method: "social_login"});
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
  });
});
