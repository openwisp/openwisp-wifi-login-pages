import React from "react";
import ShallowRenderer from "react-test-renderer/shallow";
import {shallow} from "enzyme";
import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import DoesNotExist from "./404";

jest.mock("../../utils/get-config");
jest.mock("../../utils/load-translation");

const defaultConfig = getConfig("default", true);
const createTestProps = (props) => ({
  orgSlug: "default",
  orgName: "default name",
  page: defaultConfig.components["404_page"],
  setTitle: jest.fn(),
  ...props,
});

describe("<DoesNotExist /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const renderer = new ShallowRenderer();
    const wrapper = renderer.render(<DoesNotExist {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});

describe("<DoesNotExist /> rendering", () => {
  beforeEach(() => {
    loadTranslation("en", "default");
  });

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
    expect(setTitleMock.calls.pop()).toEqual(["404 Not found", props.orgName]);
  });

  it("should not call setTitle if organization is undefined", () => {
    const props = createTestProps();
    props.page = undefined;
    props.orgName = undefined;
    const wrapper = shallow(<DoesNotExist {...props} />);
    const setTitleMock = wrapper.instance().props.setTitle.mock;
    expect(setTitleMock.calls.length).toBe(0);
  });
});
