import {shallow} from "enzyme";
import React from "react";
import ShallowRenderer from "react-test-renderer/shallow";

import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import Contact from "./contact";

jest.mock("../../utils/get-config");
jest.mock("../../utils/load-translation");

const defaultConfig = getConfig("default", true);
const links = [
  {
    alt: {en: "twitter"},
    icon: "twiter.svg",
    url: "https://twitter.com/openwisp",
    authenticated: true,
    css: "twitter",
  },
  {
    alt: {en: "facebook"},
    icon: "facebook.svg",
    url: "https://facebook.com/openwisp",
    authenticated: false,
    css: "facebook",
  },
  {
    alt: {en: "google"},
    icon: "google.svg",
    url: "https://google.com/openwisp",
    css: "google",
  },
];
const createTestProps = (props) => ({
  language: "en",
  orgSlug: "default",
  contactPage: defaultConfig.components.contact_page,
  userData: {is_verified: true},
  ...props,
});

describe("<Contact /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const renderer = new ShallowRenderer();
    const wrapper = renderer.render(<Contact {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});

describe("<Status /> rendering", () => {
  let props;
  beforeEach(() => {
    loadTranslation("en", "default");
  });
  it("should render correctly", () => {
    props = createTestProps();
    const renderer = new ShallowRenderer();
    const component = renderer.render(<Contact {...props} />);
    expect(component).toMatchSnapshot();
  });

  it("should render without authenticated links when not authenticated", () => {
    props = createTestProps();
    props.contactPage.social_links = links;
    props.isAuthenticated = false;
    const wrapper = shallow(<Contact {...props} />);
    expect(wrapper.find(".contact-image")).toHaveLength(2);
    expect(wrapper.find(".link.google")).toHaveLength(1);
    expect(wrapper.find(".link.facebook")).toHaveLength(1);
    expect(wrapper.find(".link.twitter")).toHaveLength(0);
  });

  it("should render with authenticated links when authenticated", () => {
    props = createTestProps();
    props.contactPage.social_links = links;
    props.isAuthenticated = true;
    const wrapper = shallow(<Contact {...props} />);
    expect(wrapper.find(".contact-image")).toHaveLength(2);
    expect(wrapper.find(".link.google")).toHaveLength(1);
    expect(wrapper.find(".link.twitter")).toHaveLength(1);
    expect(wrapper.find(".link.facebook")).toHaveLength(0);
  });
});
