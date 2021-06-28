import axios from "axios";
/* eslint-disable camelcase */
import {shallow} from "enzyme";
import PropTypes from "prop-types";
import React from "react";
import ShallowRenderer from "react-test-renderer/shallow";
import {Cookies} from "react-cookie";
import {passwordChangeError, passwordConfirmError} from "../../constants";
import getConfig from "../../utils/get-config";
import logError from "../../utils/log-error";
import tick from "../../utils/tick";
import loadTranslation from "../../utils/load-translation";
import PasswordChange from "./password-change";

jest.mock("axios");
jest.mock("../../utils/log-error");
jest.mock("../../utils/load-translation");
logError.mockImplementation(jest.fn());

const defaultConfig = getConfig("default");

const createTestProps = (props) => {
  return {
    orgSlug: "default",
    orgName: "default name",
    passwordChange: defaultConfig.components.password_change_form,
    cookies: new Cookies(),
    setTitle: jest.fn(),
    ...props,
  };
};

describe("<PasswordChange /> rendering", () => {
  let props;

  it("should render correctly", () => {
    props = createTestProps();
    const renderer = new ShallowRenderer();
    loadTranslation("en", "default");
    const component = renderer.render(<PasswordChange {...props} />);
    expect(component).toMatchSnapshot();
  });
});

describe("<PasswordChange /> interactions", () => {
  let props;
  // eslint-disable-next-line no-unused-vars
  let wrapper;

  beforeEach(() => {
    props = createTestProps();
    PasswordChange.contextTypes = {
      setLoading: PropTypes.func,
      getLoading: PropTypes.func,
    };
    wrapper = shallow(<PasswordChange {...props} />, {
      context: {setLoading: jest.fn(), getLoading: jest.fn()},
    });
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
      .mockImplementationOnce(() => {
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject({
          response: {
            status: 401,
            statusText: "UNAUTHORIZED",
            data: {},
          },
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({
          status: 200,
          statusText: "OK",
          data: {
            detail: "password changed",
          },
        });
      });
    const e = {preventDefault: jest.fn()};
    wrapper.setState({
      newPassword1: "123456",
      newPassword2: "wrong-pass",
      errors: {
        newPassword1: passwordConfirmError,
      },
    });
    wrapper.instance().handleSubmit();
    expect(wrapper.instance().state.errors).toStrictEqual({
      newPassword2: passwordConfirmError,
    });
    wrapper.setState({
      newPassword1: "123456",
      newPassword2: "123456",
    });
    wrapper.instance().handleSubmit(e);
    await tick();
    expect(wrapper.instance().state.errors).toStrictEqual({
      nonField: passwordChangeError,
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
});
