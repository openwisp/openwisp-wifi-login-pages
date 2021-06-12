import React from "react";
import ShallowRenderer from "react-test-renderer/shallow";
import {shallow} from "enzyme";
import getConfig from "../../utils/get-config";
import DoesNotExist from "./404";

const defaultConfig = getConfig("default");
const createTestProps = (props) => {
  return {
    language: "en",
    orgSlug: "default",
    orgName: "default name",
    page: defaultConfig.components["404_page"],
    setTitle: jest.fn(),
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

  it("should set title with organisation name", () => {
    const props = createTestProps();
    const wrapper = shallow(<DoesNotExist {...props} />);
    const setTitleMock = wrapper.instance().props.setTitle.mock;
    expect(setTitleMock.calls.pop()).toEqual(["404 Not found - default name"]);
  });
});
