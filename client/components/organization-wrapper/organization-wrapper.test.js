/* eslint-disable camelcase */
import {shallow, mount} from "enzyme";
import React, {Suspense} from "react";
import {MemoryRouter, Redirect, Route} from "react-router-dom";
import {Cookies} from "react-cookie";
import {Provider} from "react-redux";
import {Helmet} from "react-helmet";
import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import OrganizationWrapper from "./organization-wrapper";
import Footer from "../footer";
import Loader from "../../utils/loader";
import needsVerify from "../../utils/needs-verify";
import Login from "../login";
import {
  Registration,
  Status,
  PasswordChange,
  MobilePhoneChange,
  PasswordReset,
  PasswordConfirm,
  MobilePhoneVerification,
  PaymentStatus,
  PaymentProcess,
  ConnectedDoesNotExist,
  Logout,
} from "./lazy-import";

jest.mock("../../utils/get-config");
jest.mock("../../utils/load-translation");
jest.mock("../../utils/needs-verify");

const userData = {
  is_active: true,
  is_verified: true,
  method: "mobile_phone",
  email: "tester@test.com",
  phone_number: "+393664050800",
  username: "+393664050800",
  key: "b72dad1cca4807dc21c00b0b2f171d29415ac541",
  radius_user_token: "jwyVSZYOze16ej6cc1AW5cxhRjahesLzh1Tm2y0d",
  first_name: "",
  last_name: "",
  birth_date: null,
  location: "",
};

const createTestProps = (props) => ({
  match: {params: {organization: "default"}, path: "/default"},
  organization: {
    configuration: {
      pageTitle: undefined,
      css_path: null,
      slug: "default",
      name: "default name",
      favicon: null,
      isAuthenticated: true,
      settings: {
        mobile_phone_verification: true,
        subscriptions: true,
        passwordless_auth_token_name: "sesame",
      },
      default_language: "en",
      userData,
    },
    exists: true,
  },
  setOrganization: jest.fn(),
  setLanguage: jest.fn(),
  cookies: new Cookies(),
  language: "en",
  ...props,
});

describe("<OrganizationWrapper /> rendering", () => {
  let props;
  let wrapper;

  beforeEach(() => {
    props = createTestProps();
    loadTranslation("en", "default");
    wrapper = shallow(<OrganizationWrapper {...props} />);
  });

  it("should render correctly when in loading state", () => {
    wrapper.setProps({
      organization: {...props.organization, exists: undefined},
    });
    expect(wrapper.find(".app-container")).toHaveLength(0);
    expect(wrapper.find(".org-wrapper-not-found")).toHaveLength(0);
    expect(wrapper.find(Loader)).toHaveLength(1);
  });

  it("should render correctly when organization doesn't exist", () => {
    wrapper.setProps({
      organization: {...props.organization, exists: false},
    });
    expect(wrapper.find(".app-container")).toHaveLength(0);
    expect(wrapper.find(".org-wrapper-not-found")).toHaveLength(1);
    expect(wrapper.find(".loader-container")).toHaveLength(0);
  });

  it("should render correctly when organization exists", () => {
    wrapper.setProps({
      organization: {...props.organization, exists: true},
    });
    expect(wrapper.find(".app-container")).toHaveLength(1);
    expect(wrapper.find(".org-wrapper-not-found")).toHaveLength(0);
    expect(wrapper.find(".loader-container")).toHaveLength(0);
  });

  it("should load multiple CSS files", () => {
    wrapper.setProps({
      organization: {
        ...props.organization.configuration,
        configuration: {
          ...props.organization.configuration,
          css: ["index.css", "custom.css"],
        },
        exists: true,
      },
    });
    const helmetWrapper = wrapper.find(Helmet).at(1);
    expect(
      helmetWrapper.contains(
        <link rel="stylesheet" href="/assets/default/index.css" />,
      ),
    ).toBe(true);
    expect(
      helmetWrapper.contains(
        <link rel="stylesheet" href="/assets/default/custom.css" />,
      ),
    ).toBe(true);
  });

  it("should load organization specific js files", () => {
    wrapper.setProps({
      organization: {
        ...props.organization.configuration,
        configuration: {
          ...props.organization.configuration,
          js: ["index.js", "custom.js"],
        },
        exists: true,
      },
    });
    const helmetWrapper = wrapper.find(Helmet).at(1);
    expect(
      helmetWrapper.contains(<script src="/assets/default/index.js" />),
    ).toBe(true);
    expect(
      helmetWrapper.contains(<script src="/assets/default/custom.js" />),
    ).toBe(true);
  });
});

describe("<OrganizationWrapper /> interactions", () => {
  let props;
  let wrapper;
  let originalError;
  let lastConsoleOutuput;

  beforeEach(() => {
    needsVerify.mockReturnValue(false);
    originalError = console.error;
    lastConsoleOutuput = null;
    console.error = (data) => {
      lastConsoleOutuput = data;
    };
    props = createTestProps();
    wrapper = shallow(<OrganizationWrapper {...props} />);
  });

  afterEach(() => {
    console.error = originalError;
  });

  it("should call setOrganization once", () => {
    expect(props.setOrganization).toHaveBeenCalledTimes(1);
  });

  it("test componentDidUpdate lifecycle method", () => {
    wrapper.setProps({
      match: {params: {organization: "new-org"}},
      organization: {
        configuration: {
          title: undefined,
          css_path: "index.css",
          slug: "default",
          favicon: "favicon.png",
          default_language: "en",
          userData: {is_active: true, is_verified: true},
        },
        exists: true,
      },
    });
    expect(props.setOrganization).toHaveBeenCalledTimes(2);

    jest.spyOn(console, "error");
    wrapper.setProps({
      match: {params: {organization: undefined}},
    });
    expect(lastConsoleOutuput).not.toBe(null);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it("test setLoading method", () => {
    wrapper.instance().setLoading(true);
    expect(wrapper.instance().state.loading).toBe(true);
  });
  it("should render main title if pageTitle is undefined", () => {
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.props().pageTitle).toBe(undefined);
  });
  it("should render pageTitle if it is not undefined", () => {
    props.organization.configuration.pageTitle = "Organization Wrapper";
    wrapper = shallow(<OrganizationWrapper {...props} />, {
      disableLifecycleMethods: true,
    });
    wrapper.instance().setState({configLoaded: true});
    expect(wrapper).toMatchSnapshot();
  });
  it("should not use BrowserLang if userLangChoice is present", async () => {
    localStorage.setItem(
      `${props.organization.configuration.slug}-userLangChoice`,
      "en",
    );
    const loadLanguage = jest.spyOn(wrapper.instance(), "loadLanguage");
    wrapper.instance().setState({translationLoaded: false});
    await wrapper.instance().componentDidUpdate(props);
    expect(loadLanguage).toHaveBeenCalledWith("en", "default", false);
    localStorage.removeItem(
      `${props.organization.configuration.slug}-userLangChoice`,
    );
  });
  it("should change language if different language is selected", async () => {
    props.language = "it";
    wrapper = shallow(<OrganizationWrapper {...props} />);
    wrapper.instance().setState({translationLoaded: true});
    const loadLanguage = jest.spyOn(wrapper.instance(), "loadLanguage");
    props.language = "en";
    await wrapper.instance().componentDidUpdate(props);
    expect(localStorage).toEqual({"default-userLangChoice": "it"});
    expect(loadLanguage).toHaveBeenCalledWith("it", "default", false);
    localStorage.removeItem(
      `${props.organization.configuration.slug}-userLangChoice`,
    );
  });
  it("should load browser language choice if userLangChoice is null", async () => {
    wrapper = shallow(<OrganizationWrapper {...props} />);
    wrapper.instance().setState({translationLoaded: true, configLoaded: true});
    const loadLanguageMock = jest.spyOn(wrapper.instance(), "loadLanguage");
    props.language = ""; // initial render
    await wrapper.instance().componentDidUpdate(props);
    expect(loadLanguageMock).toHaveBeenCalledWith(
      "en",
      props.organization.configuration.slug,
      true,
    );
  });
  it("should show route for authenticated users", async () => {
    let pathMap = {};
    pathMap = wrapper.find(Route).reduce((mapRoute, route) => {
      const map = mapRoute;
      const routeProps = route.props();
      if (routeProps.path === undefined) map.notFound = routeProps.render;
      else map[routeProps.path] = routeProps.render;
      return map;
    }, {});
    Object.keys(pathMap).forEach((path) => {
      expect(pathMap[path]).toEqual(expect.any(Function));
    });
    expect(wrapper).toMatchSnapshot();
    let render = pathMap["/default"];
    const Component = React.createElement(Footer).type;
    expect(JSON.stringify(render())).toEqual(JSON.stringify(<Component />));
    render = pathMap["/default/registration"];
    expect(render()).toEqual(<Redirect to="/default/status" />);
    render = pathMap["/default/mobile-phone-verification"];
    expect(render()).toEqual(<Redirect to="/default/status" />);
    render = pathMap["/default/password/reset/confirm/:uid/:token"];
    expect(render()).toEqual(<Redirect to="/default/status" />);
    render = pathMap["/default/password/reset"];
    expect(render()).toEqual(<Redirect to="/default/status" />);
    render = pathMap["/default/login"];
    expect(render()).toEqual(<Redirect to="/default/status" />);
    render = pathMap["/default/status"];
    const cookies = new Cookies();
    expect(JSON.stringify(render())).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <Status cookies={cookies} />
        </Suspense>,
      ),
    );
    render = pathMap["/default/logout"];
    expect(render()).toEqual(<Redirect to="/default/status" />);
    render = pathMap["/default/change-password"];
    expect(JSON.stringify(render())).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PasswordChange cookies={cookies} />
        </Suspense>,
      ),
    );
    render = pathMap["/default/change-phone-number"];
    expect(JSON.stringify(render())).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <MobilePhoneChange cookies={cookies} />
        </Suspense>,
      ),
    );
    render = pathMap["/default/payment/:status"];
    expect(JSON.stringify(render(createTestProps()))).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PaymentStatus cookies={cookies} />
        </Suspense>,
      ),
    );
    render = pathMap["/default/payment/process/"];
    expect(JSON.stringify(render(createTestProps()))).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PaymentProcess cookies={cookies} />
        </Suspense>,
      ),
    );
    render = pathMap.notFound;
    expect(JSON.stringify(render())).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <ConnectedDoesNotExist />
        </Suspense>,
      ),
    );
  });
});

describe("Test Organization Wrapper for unauthenticated users", () => {
  let props;
  let wrapper;
  let originalError;

  beforeEach(() => {
    originalError = console.error;
    console.error = () => {};
    props = createTestProps();
    props.organization.configuration.isAuthenticated = false;
    localStorage.setItem("userAutoLogin", true);
    wrapper = shallow(<OrganizationWrapper {...props} />);
  });

  afterEach(() => {
    console.error = originalError;
    localStorage.removeItem("userAutoLogin");
  });

  it("should show route for unauthenticated users", async () => {
    expect(wrapper).toMatchSnapshot();
    let pathMap = {};
    pathMap = wrapper.find(Route).reduce((mapRoute, route) => {
      const map = mapRoute;
      const routeProps = route.props();
      if (routeProps.path === undefined) map.notFound = routeProps.render;
      else map[routeProps.path] = routeProps.render;
      return map;
    }, {});
    Object.keys(pathMap).forEach((path) => {
      expect(pathMap[path]).toEqual(expect.any(Function));
    });
    const cookies = new Cookies();
    let render = pathMap["/default"];
    const Component = React.createElement(Footer).type;
    expect(JSON.stringify(render())).toEqual(JSON.stringify(<Component />));
    render = pathMap["/default/registration"];
    expect(JSON.stringify(render())).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <Registration loading={false} />
        </Suspense>,
      ),
    );
    render = pathMap["/default/mobile-phone-verification"];
    expect(render()).toEqual(<Redirect to="/default/login" />);
    render = pathMap["/default/password/reset/confirm/:uid/:token"];
    expect(JSON.stringify(render())).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PasswordConfirm />
        </Suspense>,
      ),
    );
    render = pathMap["/default/password/reset"];
    expect(JSON.stringify(render())).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PasswordReset />
        </Suspense>,
      ),
    );
    render = pathMap["/default/login"];
    expect(JSON.stringify(render())).toEqual(JSON.stringify(<Login />));
    render = pathMap["/default/status"];
    // userAutoLogin is true
    expect(render()).toEqual(<Redirect to="/default/logout" />);
    render = pathMap["/default/logout"];
    expect(JSON.stringify(render())).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <Logout />
        </Suspense>,
      ),
    );
    render = pathMap["/default/change-password"];
    expect(render()).toEqual(<Redirect to="/default/login" />);
    render = pathMap["/default/change-phone-number"];
    expect(render()).toEqual(<Redirect to="/default/login" />);
    render = pathMap["/default/payment/:status"];
    expect(JSON.stringify(render(createTestProps()))).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PaymentStatus cookies={cookies} />
        </Suspense>,
      ),
    );
    render = pathMap["/default/payment/process/"];
    expect(JSON.stringify(render(createTestProps()))).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PaymentProcess cookies={cookies} />
        </Suspense>,
      ),
    );
    render = pathMap.notFound;
    expect(JSON.stringify(render())).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <ConnectedDoesNotExist />
        </Suspense>,
      ),
    );
    localStorage.removeItem("userAutoLogin");
  });
});

describe("Test Organization Wrapper for authenticated and unverified users", () => {
  let props;
  let wrapper;
  let originalError;

  beforeEach(() => {
    originalError = console.error;
    console.error = () => {};
    props = createTestProps();
    needsVerify.mockReturnValue(true);
    wrapper = shallow(<OrganizationWrapper {...props} />);
  });

  afterEach(() => {
    console.error = originalError;
  });

  it("should show route for unverified users", async () => {
    let pathMap = {};
    pathMap = wrapper.find(Route).reduce((mapRoute, route) => {
      const map = mapRoute;
      const routeProps = route.props();
      if (routeProps.path === undefined) map.notFound = routeProps.render;
      else map[routeProps.path] = routeProps.render;
      return map;
    }, {});
    Object.keys(pathMap).forEach((path) => {
      expect(pathMap[path]).toEqual(expect.any(Function));
    });
    expect(wrapper).toMatchSnapshot();
    let render = pathMap["/default"];
    const Component = React.createElement(Footer).type;
    expect(JSON.stringify(render())).toEqual(JSON.stringify(<Component />));
    render = pathMap["/default/registration"];
    expect(render()).toEqual(
      <Redirect to="/default/mobile-phone-verification" />,
    );
    render = pathMap["/default/mobile-phone-verification"];
    const cookies = new Cookies();
    expect(JSON.stringify(render())).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <MobilePhoneVerification cookies={cookies} />
        </Suspense>,
      ),
    );
    render = pathMap["/default/password/reset/confirm/:uid/:token"];
    expect(render()).toEqual(<Redirect to="/default/status" />);
    render = pathMap["/default/password/reset"];
    expect(render()).toEqual(<Redirect to="/default/status" />);
    render = pathMap["/default/login"];
    expect(render()).toEqual(<Redirect to="/default/status" />);
    render = pathMap["/default/status"];
    expect(render()).toEqual(
      <Redirect to="/default/mobile-phone-verification" />,
    );
    render = pathMap["/default/logout"];
    expect(render()).toEqual(<Redirect to="/default/status" />);
    render = pathMap["/default/change-password"];
    expect(JSON.stringify(render())).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PasswordChange cookies={cookies} />
        </Suspense>,
      ),
    );
    render = pathMap["/default/change-phone-number"];
    expect(JSON.stringify(render())).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <MobilePhoneChange cookies={cookies} />
        </Suspense>,
      ),
    );
    render = pathMap["/default/payment/:status"];
    expect(JSON.stringify(render(createTestProps()))).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PaymentStatus cookies={cookies} />
        </Suspense>,
      ),
    );
    render = pathMap["/default/payment/process/"];
    expect(JSON.stringify(render(createTestProps()))).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PaymentProcess cookies={cookies} />
        </Suspense>,
      ),
    );
    render = pathMap.notFound;
    expect(JSON.stringify(render())).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <ConnectedDoesNotExist />
        </Suspense>,
      ),
    );
  });
});

describe("Test <OrganizationWrapper /> routes", () => {
  let props;
  let wrapper;
  const defaultConfig = getConfig("default", true);
  const {components, languages, privacy_policy, terms_and_conditions} =
    defaultConfig;

  const mapRoutes = (component) => {
    const pathMap = {};
    return component.find(Route).reduce((path, route) => {
      const routeProps = route.props();
      pathMap[routeProps.path] = routeProps.render({}).type;
      return pathMap;
    }, {});
  };

  const mockedStore = {
    subscribe: () => {},
    dispatch: () => {},
    getState: () => ({
      organization: props.organization,
      language: "en",
      languages: defaultConfig.languages,
    }),
  };

  const mountComponent = async (passedProps, initialEntries) => {
    const component = await mount(
      <MemoryRouter initialEntries={initialEntries}>
        <Provider store={mockedStore}>
          <OrganizationWrapper {...passedProps} />
        </Provider>
      </MemoryRouter>,
    );
    return component;
  };

  beforeEach(() => {
    needsVerify.mockReturnValue(false);
    props = createTestProps();
    props.organization.configuration = {
      ...props.organization.configuration,
      components,
      languages,
      privacy_policy,
      terms_and_conditions,
    };
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should display status if authenticated", async () => {
    wrapper = await mountComponent(props, ["/default/status"]);
    expect(mapRoutes(wrapper)["/default/status"]).toBe(undefined);
    expect(wrapper.find("Router").prop("history").location.pathname).toBe(
      "/default/status",
    );
  });

  it("should redirect to login if not authenticated", async () => {
    props.organization.configuration.isAuthenticated = false;
    wrapper = await mountComponent(props, ["/default/status"]);
    expect(wrapper.find("Router").prop("history").location.pathname).toBe(
      "/default/login",
    );
  });
});
