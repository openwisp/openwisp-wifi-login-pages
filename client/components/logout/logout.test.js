/* eslint-disable prefer-promise-reject-errors */
import {shallow} from "enzyme";
import PropTypes from "prop-types";
import React from "react";
import ShallowRenderer from "react-test-renderer/shallow";
import * as toastify from "react-toastify";
import logError from "../../utils/log-error";
import loadTranslation from "../../utils/load-translation";
import Logout from "./logout";
import {mapStateToProps, mapDispatchToProps} from "./index";

jest.mock("axios");
jest.mock("../../utils/get-config");
jest.mock("../../utils/log-error");
jest.mock("../../utils/load-translation");
logError.mockImplementation(jest.fn());

const userData = {
  username: "tester@tester.com",
  email: "tester@tester.com",
  is_verified: true,
  is_active: true,
  mustLogin: false,
};

const createTestProps = (props) => ({
  orgSlug: "default",
  orgName: "default name",
  authenticate: jest.fn(),
  setTitle: jest.fn(),
  setUserData: jest.fn(),
  userData,
  ...props,
});

describe("<Logout /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const renderer = new ShallowRenderer();
    const wrapper = renderer.render(<Logout {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});

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
    // ensure mustLogin:true is passed
    // otherwise captive portal login won't be done
    expect(wrapper.instance().props.setUserData).toHaveBeenCalledWith({
      ...userData,
      mustLogin: true,
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

  it("should login if user is already authenticated and clicks log in again", () => {
    const spyToast = jest.spyOn(toastify.toast, "success");
    props = createTestProps();
    props.isAuthenticated = true;
    wrapper = shallow(<Logout {...props} />, {
      context: {setLoading: jest.fn()},
    });
    wrapper.instance().loginUser(true);
    expect(spyToast).toHaveBeenCalled();
    expect(spyToast).toBeCalledWith("Login successful", {
      toastId: "main_toast_id",
    });
    expect(props.userData.mustLogin).toBe(false);
  });

  it("should mapStatetoProps and dispatchtoProps correctly", () => {
    const state = {
      organization: {
        configuration: {
          slug: "default",
          name: "default name",
          isAuthenticated: false,
          userData,
        },
      },
    };
    const dispatch = jest.fn();
    let result = mapStateToProps(state);
    expect(result).toEqual({
      orgSlug: "default",
      orgName: "default name",
      isAuthenticated: false,
      userData,
    });
    result = mapDispatchToProps(dispatch);
    expect(result).toEqual({
      authenticate: expect.any(Function),
      setUserData: expect.any(Function),
      setTitle: expect.any(Function),
    });
  });
});
