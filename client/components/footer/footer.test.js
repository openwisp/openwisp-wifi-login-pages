import React from "react";
import {render, screen} from "@testing-library/react";
import "@testing-library/jest-dom";

import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import Footer from "./footer";

jest.mock("../../utils/get-config");
jest.mock("../../utils/load-translation");

const defaultConfig = getConfig("default", true);

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

const createTestProps = (props) => ({
  language: "en",
  footer: {
    links: defaultConfig.components.footer.links,
    afterHtml: {
      en: "after html",
    },
  },
  orgSlug: "default",
  userData: {isVerified: true},
  ...props,
});

describe("<Footer /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const {container} = render(<Footer {...props} />);
    expect(container).toMatchSnapshot();
  });
});

describe("<Footer /> rendering", () => {
  let props;

  beforeEach(() => {
    props = createTestProps();
    loadTranslation("en", "default");
  });

  it("should render correctly", () => {
    const {container} = render(<Footer {...props} />);
    expect(container).toMatchSnapshot();
  });

  it("should render without links", () => {
    const links = {
      footer: {...props.footer, links: []},
    };
    props = createTestProps(links);
    render(<Footer {...props} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("should render after html", () => {
    render(<Footer {...props} />);
    expect(screen.getByText("after html")).toBeInTheDocument();
  });

  it("should render without authenticated links when not authenticated", () => {
    props = createTestProps();
    props.footer.links = footerLinks;
    props.isAuthenticated = false;
    render(<Footer {...props} />);

    // Check visible links
    expect(screen.getByRole("link", {name: "about"})).toBeInTheDocument();
    expect(screen.getByText("signUp")).toBeInTheDocument();

    // Check links that shouldn't be visible
    expect(screen.queryByText("status")).not.toBeInTheDocument();
    expect(screen.queryByText("change-password")).not.toBeInTheDocument();
  });

  it("should render with authenticated links when authenticated", () => {
    props = createTestProps();
    props.footer.links = footerLinks;
    props.isAuthenticated = true;
    render(<Footer {...props} />);

    // Check visible links
    expect(screen.getByRole("link", {name: "about"})).toBeInTheDocument();
    expect(screen.getByText("status")).toBeInTheDocument();
    expect(screen.getByText("change-password")).toBeInTheDocument();

    // Check links that shouldn't be visible
    expect(screen.queryByText("signUp")).not.toBeInTheDocument();
  });

  it("should not render with verified links if not verified", () => {
    props = createTestProps();
    props.footer.links = footerLinks;
    props.isAuthenticated = true;
    props.userData.isVerified = false;
    render(<Footer {...props} />);

    // Check visible links
    expect(screen.getByRole("link", {name: "about"})).toBeInTheDocument();
    expect(screen.getByText("status")).toBeInTheDocument();

    // Check links that shouldn't be visible
    expect(screen.queryByText("signUp")).not.toBeInTheDocument();
    expect(screen.queryByText("change-password")).not.toBeInTheDocument();
  });
});
