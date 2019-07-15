import React from "react";
import renderer from "react-test-renderer";

import DoesNotExist from "./404";

describe("<DoesNotExist /> rendering", () => {
  it("should render correctly", () => {
    const component = renderer.create(<DoesNotExist />).toJSON();
    expect(component).toMatchSnapshot();
  });
});
