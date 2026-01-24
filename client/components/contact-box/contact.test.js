import {render, screen} from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";

import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import Contact from "./contact";

// Mock modules BEFORE importing - jest.mock must be before imports
jest.mock("../../utils/get-config", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    components: {
      contact_page: {
        social_links: [],
      },
    },
  })),
}));
jest.mock("../../utils/load-translation");
/* eslint-enable import/first */

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
    const {container} = render(<Contact {...props} />);
    expect(container).toMatchSnapshot();
  });
});

describe("<Contact /> rendering", () => {
  let props;
  beforeEach(() => {
    loadTranslation("en", "default");
  });
  it("should render correctly", () => {
    props = createTestProps();
    const {container} = render(<Contact {...props} />);
    expect(container).toMatchSnapshot();
  });

  it("should render without authenticated links when not authenticated", () => {
    props = createTestProps();
    props.contactPage.social_links = links;
    props.isAuthenticated = false;
    render(<Contact {...props} />);

    // Check for google and facebook links, twitter should not be present
    expect(screen.getByAltText("google")).toBeInTheDocument();
    expect(screen.getByAltText("facebook")).toBeInTheDocument();
    expect(screen.queryByAltText("twitter")).not.toBeInTheDocument();
  });

  it("should render with authenticated links when authenticated", () => {
    props = createTestProps();
    props.contactPage.social_links = links;
    props.isAuthenticated = true;
    render(<Contact {...props} />);

    // Check for google and twitter links, facebook should not be present
    expect(screen.getByAltText("google")).toBeInTheDocument();
    expect(screen.getByAltText("twitter")).toBeInTheDocument();
    expect(screen.queryByAltText("facebook")).not.toBeInTheDocument();
  });
});
