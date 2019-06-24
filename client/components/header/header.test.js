import {mount} from "enzyme";
import React from "react";

import Header from "./header";

describe("App Header", () => {
  it("should render without crashing", () => {
    const component = mount(<Header />);
    expect(component).toMatchSnapshot();
  });
});
