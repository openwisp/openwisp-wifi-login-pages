import axios from "axios";
/* eslint-disable camelcase */
import {shallow} from "enzyme";
import React from "react";
import {Cookies} from "react-cookie";
import ShallowRenderer from "react-test-renderer/shallow";

import getConfig from "../../utils/get-config";
import Status from "./status";

jest.mock("axios");

const defaultConfig = getConfig("default");
const createTestProps = props => {
  return {
    language: "en",
    orgSlug: "default",
    statusPage: defaultConfig.components.status_page,
    cookies: new Cookies(),
    logout: jest.fn(),
    ...props,
  };
};

describe("<Status /> rendering", () => {
  let props;
  it("should render correctly", () => {
    props = createTestProps();
    const renderer = new ShallowRenderer();
    const component = renderer.render(<Status {...props} />);
    expect(component).toMatchSnapshot();
  });
});

describe("<Status /> interactions", () => {
  let props;
  let wrapper;
  it("should call logout function when logout button is clicked", () => {
    axios.mockImplementationOnce(() => {
      return Promise.resolve({});
    });
    props = createTestProps();
    wrapper = shallow(<Status {...props} />);
    wrapper.find("#owisp-status-logout-btn").simulate("click", {});
    expect(wrapper.instance().props.logout.mock.calls.length).toBe(1);
  });
});
