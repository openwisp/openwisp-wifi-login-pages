import {shallow} from "enzyme";
import React from "react";
import ShallowRenderer from "react-test-renderer/shallow";
import {addLocale, useLocale} from "ttag";

import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import Contact from "./contact";

jest.mock("../../utils/load-translation");

loadTranslation("en", "default", addLocale, useLocale);
const defaultConfig = getConfig("default");
const links = [
  {
    alt: "twitter",
    icon: "twiter.svg",
    url: "https://twitter.com/openwisp",
    authenticated: true,
    css: "twitter",
  },
  {
    alt: "facebook",
    icon: "facebook.svg",
    url: "https://facebook.com/openwisp",
    authenticated: false,
    css: "facebook",
  },
  {
    alt: "google",
    icon: "google.svg",
    url: "https://google.com/openwisp",
    css: "google",
  },
];
const createTestProps = (props) => {
  return {
    orgSlug: "default",
    contactPage: defaultConfig.components.contact_page,
    userData: {is_verified: true},
    ...props,
  };
};

describe("<Status /> rendering", () => {
  let props;

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
