import {shallow} from "enzyme";
import React from "react";
import {BrowserRouter as Router} from "react-router-dom";
import renderer from "react-test-renderer";

import getConfig from "../../utils/get-config";
import Header from "./header";

const defaultConfig = getConfig("default");
const headerLinks = [
  {
    text: {en: "link-1"},
    url: "link-1/",
  },
  {
    text: {en: "link-2"},
    url: "link-2/",
    authenticated: false,
  },
  {
    text: {en: "link-3"},
    url: "link-3/",
    authenticated: true,
  },
];
const getLinkText = (wrapper, text) => {
  const texts = [];
  wrapper.find(text).forEach( node => {
    texts.push(node.text());
  });
  return texts;
};
const createTestProps = props => {
  return {
    setLanguage: jest.fn(),
    orgSlug: "default",
    language: "en",
    languages: [{slug: "en", text: "english"}, {slug: "it", text: "italian"}],
    header: defaultConfig.components.header,
    location: {
      pathname: "/default/login",
    },
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
    const component = renderer
      .create(
        <Router>
          <Header {...props} />
        </Router>,
      )
      .toJSON();
    expect(component).toMatchSnapshot();
  });
  it("should render without authenticated links when not authenticated", () => {
    props = createTestProps();
    props.isAuthenticated = false;
    props.header.links = headerLinks;
    wrapper = shallow(<Header {...props} />);
    const linkText = getLinkText(wrapper, ".owisp-header-link");
    expect(linkText).toContain("link-1");
    expect(linkText).toContain("link-2");
    expect(linkText).not.toContain("link-3");
  });
  it("should render with authenticated links when authenticated", () => {
    props = createTestProps();
    props.isAuthenticated = true;
    props.header.links = headerLinks;
    wrapper = shallow(<Header {...props} />);
    const linkText = getLinkText(wrapper, ".owisp-header-link");
    expect(linkText).toContain("link-1");
    expect(linkText).not.toContain("link-2");
    expect(linkText).toContain("link-3");
  });
  it("should render with links", () => {
    const component = renderer
      .create(
        <Router>
          <Header {...props} />
        </Router>,
      )
      .toJSON();
    expect(component).toMatchSnapshot();
  });
  it("should render 2 links", () => {
    expect(wrapper.find(".owisp-header-desktop-link")).toHaveLength(2);
  });
  it("should render 2 languages", () => {
    expect(wrapper.find(".owisp-header-desktop-language-btn")).toHaveLength(2);
  });
  it("should render english as default language", () => {
    expect(
      wrapper.find(
        ".owisp-header-desktop-language-btn.owisp-header-language-btn-en.active",
      ),
    ).toHaveLength(1);
    expect(
      wrapper.find(
        ".owisp-header-desktop-language-btn.owisp-header-language-btn-it.active",
      ),
    ).toHaveLength(0);
  });
  it("should render logo", () => {
    expect(
      wrapper.find(".owisp-header-logo-image.owisp-header-desktop-logo-image"),
    ).toHaveLength(1);
  });
  it("should not render logo", () => {
    const logo = {
      header: {
        ...props.header,
        logo: null,
      },
    };
    props = createTestProps(logo);
    wrapper = shallow(<Header {...props} />);
    expect(
      wrapper.find(".owisp-header-logo-image.owisp-header-desktop-logo-image"),
    ).toHaveLength(0);
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
    wrapper
      .find(".owisp-header-language-btn-it.owisp-header-desktop-language-btn")
      .simulate("click");
    expect(props.setLanguage).toHaveBeenCalledTimes(1);
    wrapper
      .find(".owisp-header-language-btn-it.owisp-header-mobile-language-btn")
      .simulate("click");
    expect(props.setLanguage).toHaveBeenCalledTimes(2);
  });
  it("should call handleHamburger function when 'hamburger button' is clicked", () => {
    wrapper.find(".owisp-header-hamburger").simulate("click");
    expect(wrapper.state().menu).toBe(true);
  });
  it("should call handleHamburger function on Enter key press", () => {
    wrapper.find(".owisp-header-hamburger").simulate("keyup", {keyCode: 1});
    expect(wrapper.state().menu).toBe(false);
    wrapper.find(".owisp-header-hamburger").simulate("keyup", {keyCode: 13});
    expect(wrapper.state().menu).toBe(true);
  });
});
