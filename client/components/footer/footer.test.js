/* eslint-disable camelcase */
import {shallow} from "enzyme";
import React from "react";
import renderer from "react-test-renderer";

import getConfig from "../../utils/get-config";
import Footer from "./footer";

const defaultConfig = getConfig("default");
const footerLinks = [
  {
    text: {en: "status"},
    url: "/status",
    authenticated: true,
  },
  {
    text: {en: "signUp"},
    url: "/signUp",
    authenticated: false,
  },
  {
    text: {en: "about"},
    url: "/about",
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
    language: "en",
    footer: defaultConfig.components.footer,
    ...props,
  };
};

describe("<Footer /> rendering", () => {
  let props;
  let wrapper;
  beforeEach(() => {
    props = createTestProps();
    wrapper = shallow(<Footer {...props} />);
  });
  it("should render correctly", () => {
    props = createTestProps();
    const component = renderer.create(<Footer {...props} />).toJSON();
    expect(component).toMatchSnapshot();
  });
  it("should render without links", () => {
    const links = {
      footer: {...props.footer, links: []},
    };
    props = createTestProps(links);
    wrapper = shallow(<Footer {...props} />);
    expect(wrapper.find(".footer-link")).toHaveLength(0);
  });
  it("should render secondary text", () => {
    wrapper.setProps({
      footer: {...props.footer, secondary_text: {en: "secondary text"}},
    });
    expect(
      wrapper
        .update()
        .find(".footer-row-2-inner")
        .text(),
    ).toBe("secondary text");
  });
  it("should render without authenticated links when not authenticated", () => {
    props = createTestProps();
    props.footer.links = footerLinks;
    props.isAuthenticated = false;
    wrapper = shallow(<Footer {...props} />);
    const linkText = getLinkText(wrapper, ".footer-link");
    expect(linkText).toContain("about");
    expect(linkText).toContain("signUp");
    expect(linkText).not.toContain("status");
  });
  it("should render with authenticated links when authenticated", () => {
    props = createTestProps();
    props.footer.links = footerLinks;
    props.isAuthenticated = true;
    wrapper = shallow(<Footer {...props} />);
    const linkText = getLinkText(wrapper, ".footer-link");
    expect(linkText).not.toContain("signUp");
    expect(linkText).toContain("about");
    expect(linkText).toContain("status");
  });
});
