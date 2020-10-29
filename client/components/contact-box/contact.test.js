import {shallow} from "enzyme";
import React from "react";
import ShallowRenderer from "react-test-renderer/shallow";

import getConfig from "../../utils/get-config";
import Contact from "./contact";

const defaultConfig = getConfig("default");
const links = [
  {
    alt: {en: "twitter"},
    icon: "twiter.svg",
    url: "https://twitter.com/openwisp",
    authenticated: true,
  },
  {
    alt: {en: "facebook"},
    icon: "facebook.svg",
    url: "https://facebook.com/openwisp",
    authenticated: false,
  },
  {
    alt: {en: "google"},
    icon: "google.svg",
    url: "https://google.com/openwisp",
  },
];
const createTestProps = props => {
  return {
    language: "en",
    orgSlug: "default",
    contactPage: defaultConfig.components.contact_page,
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
    expect(wrapper.find(".owisp-contact-image")).toHaveLength(2);
    expect(wrapper.find(".owisp-contact-google-image")).toHaveLength(1);
    expect(wrapper.find(".owisp-contact-facebook-image")).toHaveLength(1);
    expect(wrapper.find(".owisp-contact-twitter-image")).toHaveLength(0);
  });
  it("should render with authenticated links when authenticated", () => {
    props = createTestProps();
    props.contactPage.social_links = links;
    props.isAuthenticated = true;
    const wrapper = shallow(<Contact {...props} />);
    expect(wrapper.find(".owisp-contact-image")).toHaveLength(2);
    expect(wrapper.find(".owisp-contact-google-image")).toHaveLength(1);
    expect(wrapper.find(".owisp-contact-twitter-image")).toHaveLength(1);
    expect(wrapper.find(".owisp-contact-facebook-image")).toHaveLength(0);
  });
});
