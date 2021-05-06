/* eslint-disable prefer-promise-reject-errors */
import {shallow} from "enzyme";
import PropTypes from "prop-types";
import React from "react";
import ShallowRenderer from "react-test-renderer/shallow";
import getConfig from "../../utils/get-config";
import logError from "../../utils/log-error";
import Logout from "./logout";

jest.mock("axios");
jest.mock("../../utils/get-config");
jest.mock("../../utils/log-error");
logError.mockImplementation(jest.fn());

const defaultConfig = getConfig("default");

const createTestProps = (props) => {
  return {
    language: "en",
    orgSlug: "default",
    logoutPage: defaultConfig.components.logout,
    authenticate: jest.fn(),
    ...props,
  };
};

describe("<Logout /> rendering", () => {
  let props;

  it("should render correctly", () => {
    props = createTestProps();
    const renderer = new ShallowRenderer();
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
  });

  it("should set user authenticated when log in again is clicked", () => {
    props = createTestProps();
    wrapper = shallow(<Logout {...props} />, {
      context: {setLoading: jest.fn()},
    });
    const loginUser = jest.spyOn(wrapper.instance(), "loginUser");
    wrapper.find(".button").simulate("click", {});
    expect(loginUser).toHaveBeenCalled();
  });
});
