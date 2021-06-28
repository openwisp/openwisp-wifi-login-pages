/* eslint-disable prefer-promise-reject-errors */
import {shallow} from "enzyme";
import PropTypes from "prop-types";
import React from "react";
import ShallowRenderer from "react-test-renderer/shallow";
import getConfig from "../../utils/get-config";
import logError from "../../utils/log-error";
import loadTranslation from "../../utils/load-translation";
import Logout from "./logout";

jest.mock("axios");
jest.mock("../../utils/get-config");
jest.mock("../../utils/log-error");
jest.mock("../../utils/load-translation");
logError.mockImplementation(jest.fn());

const defaultConfig = getConfig("default");
const userData = {
  username: "tester@tester.com",
  email: "tester@tester.com",
  is_verified: true,
  is_active: true,
};

const createTestProps = (props) => {
  return {
    orgSlug: "default",
    orgName: "default name",
    logoutPage: defaultConfig.components.logout,
    authenticate: jest.fn(),
    setTitle: jest.fn(),
    setUserData: jest.fn(),
    userData,
    ...props,
  };
};

describe("<Logout /> rendering", () => {
  let props;

  it("should render correctly", () => {
    props = createTestProps();
    const renderer = new ShallowRenderer();
    loadTranslation("en", "default");
    const component = renderer.render(<Logout {...props} />);
    expect(component).toMatchSnapshot();
  });
});

describe("<Logout /> interactions", () => {
  let props;
  let wrapper;

  beforeEach(() => {
    Logout.contextTypes = {
      setLoading: PropTypes.func,
      getLoading: PropTypes.func,
    };
    loadTranslation("en", "default");
  });

  it("should set user authenticated when log in again is clicked", () => {
    props = createTestProps();
    wrapper = shallow(<Logout {...props} />, {
      context: {setLoading: jest.fn()},
    });
    const loginUser = jest.spyOn(wrapper.instance(), "loginUser");
    wrapper.find(".button").simulate("click", {});
    expect(loginUser).toHaveBeenCalled();
    // ensure justAuthenticated:true is passed
    // otherwise captive portal login won't be done
    expect(wrapper.instance().props.setUserData).toHaveBeenCalledWith({
      ...userData,
      justAuthenticated: true,
    });
  });

  it("should call setTitle to set the title", () => {
    props = createTestProps();
    wrapper = shallow(<Logout {...props} />, {
      context: {setLoading: jest.fn()},
    });
    const setTitleMock = wrapper.instance().props.setTitle.mock;
    expect(setTitleMock.calls.pop()).toEqual(["Logout", props.orgName]);
  });
});
