import {shallow} from "enzyme";
import React from "react";
import renderer from "react-test-renderer";

import getConfig from "../../utils/get-config";
import Header from "./header";

const defaultConfig = getConfig("default");
const createTestProps = props => {
  return {
    setLanguage: jest.fn(),
    orgSlug: "default",
    language: "en",
    languages: [{slug: "en", text: "english"}, {slug: "it", text: "italian"}],
    header: defaultConfig.components.header,
    ...props,
  };
};

describe("<Header /> rendering", () => {
  let props;
  let wrapper;
  beforeEach(() => {
    props = createTestProps();
    wrapper = shallow(<Header {...props} />);
  });
  it("should render without links", () => {
    const links = {
      header: {
        ...props.header,
        links: [],
      },
    };
    props = createTestProps(links);
    const component = renderer.create(<Header {...props} />).toJSON();
    expect(component).toMatchSnapshot();
  });
  it("should render with links", () => {
    const component = renderer.create(<Header {...props} />).toJSON();
    expect(component).toMatchSnapshot();
  });
  it("should render 2 links", () => {
    expect(wrapper.find(".owisp-header-link")).toHaveLength(2);
  });
  it("should render 2 languages", () => {
    expect(wrapper.find(".owisp-header-language-btn")).toHaveLength(2);
  });
  it("should render english as default language", () => {
    expect(wrapper.find(".owisp-header-language-btn-en.active")).toHaveLength(
      1,
    );
    expect(wrapper.find(".owisp-header-language-btn-it.active")).toHaveLength(
      0,
    );
  });
  it("should not render logo", () => {
    expect(wrapper.find(".owisp-header-logo-image")).toHaveLength(0);
  });
  it("should render logo", () => {
    const logo = {
      header: {
        ...props.header,
        logo: {alternate_text: "test_alternate_text", url: "/test-logo.jpg"},
      },
    };
    props = createTestProps(logo);
    wrapper = shallow(<Header {...props} />);
    expect(wrapper.find(".owisp-header-logo-image")).toHaveLength(1);
  });
});

describe("<Header /> interactions", () => {
  let props;
  let wrapper;
  beforeEach(() => {
    props = createTestProps();
    wrapper = shallow(<Header {...props} />);
  });
  it("should call setLanguage function when 'language button' is clicked", () => {
    wrapper.find(".owisp-header-language-btn-it").simulate("click");
    expect(props.setLanguage).toHaveBeenCalledTimes(1);
  });
});
