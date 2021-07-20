/* eslint-disable camelcase */
import {shallow} from "enzyme";
import React from "react";
import renderer from "react-test-renderer";

import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import Footer from "./footer";

const defaultConfig = getConfig("default");
jest.mock("../../utils/load-translation");

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
  {
    text: {en: "change-password"},
    url: "/change-password",
    authenticated: true,
    verified: true,
  },
];
const getLinkText = (wrapper, text) => {
  const texts = [];
  wrapper.find(text).forEach((node) => {
    texts.push(node.text());
  });
  return texts;
};
const createTestProps = (props) => {
  return {
    language: "en",
    footer: {
      links: defaultConfig.components.footer.links,
      secondary_text: true,
    },
    userData: {is_verified: true},
    ...props,
  };
};

describe("<Footer /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const wrapper = shallow(<Footer {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});

describe("<Footer /> rendering", () => {
  let props;
  let wrapper;
  beforeEach(() => {
    props = createTestProps();
    wrapper = shallow(<Footer {...props} />);
    loadTranslation("en", "default");
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
    loadTranslation("en", "default", {
      FOOTER_SECONDARY_TXT: {
        msgid: "FOOTER_SECONDARY_TXT",
        msgstr: ["secondary text"],
      },
    });
    wrapper.setProps({}); // for force re-render of wrapper
    expect(wrapper.update().find(".footer-row-2-inner").text()).toBe(
      "secondary text",
    );
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
    expect(linkText).not.toContain("change-password");
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
    expect(linkText).toContain("change-password");
  });
  it("should not render with verified links if not verified", () => {
    props = createTestProps();
    props.footer.links = footerLinks;
    props.isAuthenticated = true;
    props.userData.is_verified = false;
    wrapper = shallow(<Footer {...props} />);
    const linkText = getLinkText(wrapper, ".footer-link");
    expect(linkText).not.toContain("signUp");
    expect(linkText).toContain("about");
    expect(linkText).toContain("status");
    expect(linkText).not.toContain("change-password");
  });
});
