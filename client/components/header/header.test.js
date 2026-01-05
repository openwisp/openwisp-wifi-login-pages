import {render, fireEvent, screen, within} from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import {MemoryRouter} from "react-router-dom";

import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import isInternalLink from "../../utils/check-internal-links";
import Header from "./header";
import {mapDispatchToProps} from "./index";

// Mock modules BEFORE importing - jest.mock must be before imports
jest.mock("../../utils/get-config", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    components: {
      header: {
        logo: {
          url: "/assets/default/openwisp-logo-black.svg",
          alternate_text: "openwisp",
        },
        links: [],
      },
    },
  })),
}));
jest.mock("../../utils/load-translation");
jest.mock("../../utils/check-internal-links");
/* eslint-enable import/first */

const defaultConfig = getConfig("default", true);
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
  {
    text: {en: "link-4"},
    url: "link-4/",
    authenticated: true,
    verified: true,
  },
];

const createTestProps = (props) => ({
  setLanguage: jest.fn(),
  orgSlug: "default",
  language: "en",
  languages: [
    {slug: "en", text: "english"},
    {slug: "it", text: "italian"},
  ],
  header: defaultConfig.components.header,
  location: {
    pathname: "/default/login",
  },
  userData: {isVerified: true},
  ...props,
});

describe("<Header /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const {container} = render(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );
    expect(container).toMatchSnapshot();
  });
});

describe("<Header /> rendering", () => {
  let props;

  beforeEach(() => {
    jest.resetAllMocks();
    props = createTestProps();
    loadTranslation("en", "default");
  });

  it("should render without links", () => {
    const links = {
      header: {
        ...props.header,
        links: [],
      },
    };
    props = createTestProps(links);
    const {container} = render(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );
    expect(container).toMatchSnapshot();
  });

  it("should call isInternalLink and render if the link is internal", () => {
    isInternalLink.mockReturnValue(true);
    props = createTestProps();
    props.isAuthenticated = true;
    props.header.links = [
      {
        text: {en: "Status"},
        url: "/default/login",
        authenticated: true,
      },
    ];
    render(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );
    expect(isInternalLink).toHaveBeenCalledTimes(2);
    expect(isInternalLink).toHaveBeenCalledWith("/default/login");
  });

  it("should render without authenticated links when not authenticated", () => {
    props = createTestProps();
    props.isAuthenticated = false;
    props.header.links = headerLinks;
    render(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );
    const link1Elements = screen.getAllByText("link-1");
    const link2Elements = screen.getAllByText("link-2");
    expect(link1Elements.length).toBeGreaterThan(0);
    expect(link2Elements.length).toBeGreaterThan(0);
    expect(screen.queryByText("link-3")).not.toBeInTheDocument();
  });

  it("should render with authenticated links when authenticated", () => {
    props = createTestProps();
    props.isAuthenticated = true;
    props.header.links = headerLinks;
    render(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );
    const link1Elements = screen.getAllByText("link-1");
    const link3Elements = screen.getAllByText("link-3");
    expect(link1Elements.length).toBeGreaterThan(0);
    expect(screen.queryByText("link-2")).not.toBeInTheDocument();
    expect(link3Elements.length).toBeGreaterThan(0);
  });

  it("should render with links", () => {
    const {container} = render(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );
    expect(container).toMatchSnapshot();
  });

  it("should not render with verified links if not verified", () => {
    props = createTestProps();
    props.isAuthenticated = true;
    props.userData.isVerified = false;
    props.header.links = headerLinks;
    render(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );
    const link1Elements = screen.getAllByText("link-1");
    const link3Elements = screen.getAllByText("link-3");
    expect(link1Elements.length).toBeGreaterThan(0);
    expect(screen.queryByText("link-2")).not.toBeInTheDocument();
    expect(link3Elements.length).toBeGreaterThan(0);
    expect(screen.queryByText("link-4")).not.toBeInTheDocument();
  });

  it("should render 2 links", () => {
    render(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );
    const desktopNav = screen.getByTestId("desktop-navigation");
    const desktopLinks = within(desktopNav).getAllByRole("link");
    expect(desktopLinks).toHaveLength(2);
  });

  it("should render 2 languages", () => {
    render(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );
    const languageSelector = screen.getByTestId("desktop-language-selector");
    const desktopLanguageButtons = within(languageSelector).getAllByRole("button");
    expect(desktopLanguageButtons).toHaveLength(2);
  });

  it("should render english as default language", () => {
    render(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );
    const languageSelector = screen.getByTestId("desktop-language-selector");
    const englishBtn = within(languageSelector).getByRole("button", {
      name: /english/i,
    });
    const italianBtn = within(languageSelector).getByRole("button", {
      name: /italian/i,
    });
    expect(englishBtn).toHaveClass("active");
    expect(italianBtn).not.toHaveClass("active");
  });

  it("should render logo", () => {
    render(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );
    const desktopLogo = screen.getAllByAltText("openwisp")[0];
    expect(desktopLogo).toBeInTheDocument();
    expect(desktopLogo).toHaveClass("header-desktop-logo-image");
  });

  it("should not render logo", () => {
    const logo = {
      header: {
        ...props.header,
        logo: null,
      },
    };
    props = createTestProps(logo);
    render(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );
    const desktopLogo = screen.queryByAltText("openwisp");
    expect(desktopLogo).not.toBeInTheDocument();
  });

  it("should render sticky msg and close it on clicking close-btn", () => {
    props = createTestProps({
      header: {
        ...props.header,
        sticky_html: {
          en: "<p>announcement</p>",
        },
      },
    });
    const {container} = render(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );
    expect(screen.getByText("announcement")).toBeInTheDocument();
    expect(container).toMatchSnapshot();

    const closeButton = screen.getByRole("button", {name: "✖"});
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);

    expect(screen.queryByText("announcement")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", {name: "✖"})).not.toBeInTheDocument();
  });

  it("should not show change password if login method is SAML / Social Login", () => {
    props = createTestProps();
    props.header.links = [
      {
        text: {en: "Change Password"},
        url: "/{orgSlug}/change-password",
        authenticated: true,
        methods_excluded: ["saml", "socialLogin"],
      },
    ];
    props.isAuthenticated = true;
    props.userData.method = "saml";
    const {rerender} = render(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );
    let changePasswordLinks = screen.queryAllByText("Change Password");
    expect(changePasswordLinks).toHaveLength(0);

    props.userData.method = "socialLogin";
    rerender(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );
    changePasswordLinks = screen.queryAllByText("Change Password");
    expect(changePasswordLinks).toHaveLength(0);

    props.userData.method = "mobile_phone";
    rerender(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );
    changePasswordLinks = screen.getAllByText("Change Password");
    expect(changePasswordLinks.length).toBeGreaterThan(0);
  });
});

describe("<Header /> interactions", () => {
  let props;

  beforeEach(() => {
    props = createTestProps();
  });

  it("should call setLanguage function when 'language button' is clicked", () => {
    render(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );

    const italianButtons = screen.getAllByRole("button", {name: /italian/i});
    // Click desktop button (first one)
    fireEvent.click(italianButtons[0]);
    expect(props.setLanguage).toHaveBeenCalledTimes(1);

    // Click mobile button (second one)
    fireEvent.click(italianButtons[1]);
    expect(props.setLanguage).toHaveBeenCalledTimes(2);
  });

  it("should call handleHamburger function when 'hamburger button' is clicked", () => {
    render(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );

    const hamburger = screen.getByRole("button", {name: /menu/i});

    // Before click, mobile menu should have display-none class
    const mobileMenu = screen.getByTestId("mobile-menu");
    expect(mobileMenu).toHaveClass("display-none");

    fireEvent.click(hamburger);

    // After click, mobile menu should have display-flex class
    expect(mobileMenu).toHaveClass("display-flex");
  });

  it("should call handleHamburger function on Enter key press", () => {
    render(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>,
    );

    const hamburger = screen.getByRole("button", {name: /menu/i});
    const mobileMenu = screen.getByTestId("mobile-menu");

    fireEvent.keyUp(hamburger, {keyCode: 1});
    expect(mobileMenu).toHaveClass("display-none");

    fireEvent.keyUp(hamburger, {keyCode: 13});
    expect(mobileMenu).toHaveClass("display-flex");
  });

  it("should dispatch to props correctly", () => {
    const dispatch = jest.fn();
    const dispatchProps = mapDispatchToProps(dispatch);
    expect(dispatchProps).toEqual({
      setLanguage: expect.any(Function),
    });
    dispatchProps.setLanguage("en");
    expect(dispatch).toHaveBeenCalledWith({
      payload: "en",
      type: "SET_LANGUAGE",
    });
  });
});
