import {shallow} from "enzyme";
/* eslint-disable camelcase */
import React from "react";
import ShallowRenderer from "react-test-renderer/shallow";

import getConfig from "../../utils/get-config";
import Modal from "./modal";

const defaultConfig = getConfig("default");
const createTestProps = props => {
  return {
    language: "en",
    privacyPolicy: defaultConfig.privacy_policy,
    termsAndConditions: defaultConfig.terms_and_conditions,
    match: {
      params: {
        name: "terms-and-conditions",
      },
    },
    prevPath: "/default/login",
    history: {
      push: jest.fn(),
    },
    ...props,
  };
};

describe("<Modal /> rendering", () => {
  let props;
  it("should render terms-and-conditions correctly", () => {
    props = createTestProps();
    const renderer = new ShallowRenderer();
    const component = renderer.render(<Modal {...props} />);
    expect(component).toMatchSnapshot();
  });
  it("should render privacy-policy correctly", () => {
    props = createTestProps({
      match: {
        params: {
          name: "privacy-policy",
        },
      },
    });
    const renderer = new ShallowRenderer();
    const component = renderer.render(<Modal {...props} />);
    expect(component).toMatchSnapshot();
  });
  it("should render nothing on incorrect param name", () => {
    props = createTestProps({
      match: {
        params: {
          name: "test-name",
        },
      },
    });
    const renderer = new ShallowRenderer();
    const component = renderer.render(<Modal {...props} />);
    expect(component).toMatchSnapshot();
  });
});

describe("<Modal /> interactions", () => {
  let props;
  let wrapper;
  beforeEach(() => {
    global.document.addEventListener = jest.fn();
    global.document.removeEventListener = jest.fn();
    props = createTestProps();
    wrapper = shallow(<Modal {...props} />);
  });
  it("should call handleKeyDown function on Esc key press", () => {
    wrapper.instance().handleKeyDown({keyCode: 1});
    expect(props.history.push).toHaveBeenCalledTimes(0);
    wrapper.instance().handleKeyDown({keyCode: 27});
    expect(props.history.push).toHaveBeenCalledTimes(1);
    wrapper.instance().componentDidMount();
    wrapper.instance().componentWillUnmount();
    expect(global.document.addEventListener).toHaveBeenCalled();
    expect(global.document.removeEventListener).toHaveBeenCalled();
  });
});
