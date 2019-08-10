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
});
