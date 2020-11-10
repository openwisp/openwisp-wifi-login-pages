import React from "react";
import ShallowRenderer from "react-test-renderer/shallow";

import getConfig from "../../utils/get-config";
import DoesNotExist from "./404";

const defaultConfig = getConfig("default");
const createTestProps = props => {
  return {
    language: "en",
    orgSlug: "default",
    page: defaultConfig.components["404_page"],
    ...props,
  };
};

describe("<DoesNotExist /> rendering", () => {
  it("should render correctly default 404 page without props", () => {
    const renderer = new ShallowRenderer();
    const component = renderer.render(<DoesNotExist />);
    expect(component).toMatchSnapshot();
  });

  it("should render correctly custom 404 page with props", () => {
    const props = createTestProps();
    const renderer = new ShallowRenderer();
    const component = renderer.render(<DoesNotExist {...props} />);
    expect(component).toMatchSnapshot();
  });
});
