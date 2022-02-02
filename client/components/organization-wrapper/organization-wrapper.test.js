/* eslint-disable camelcase */
import {shallow, mount} from "enzyme";
import React, {Suspense} from "react";
import {MemoryRouter, Navigate, Route} from "react-router-dom";
import {Cookies} from "react-cookie";
import {Provider} from "react-redux";
import {Helmet} from "react-helmet";
import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import OrganizationWrapper from "./organization-wrapper";
import Footer from "../footer";
import Header from "../header";
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
  params: {organization: "default"},
  location: {pathname: ""},
  navigate: jest.fn(),
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
      params: {organization: "new-org"},
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
      params: {organization: undefined},
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
      if (routeProps.path === "*")
        map["*"] = [...(map["*"] || []), routeProps.element];
      else map[routeProps.path] = routeProps.element;
      return map;
    }, {});
    expect(wrapper).toMatchSnapshot();
    let element = pathMap[""];
    expect(element).toEqual(<Navigate to="/default/login" />);
    element = pathMap["registration/*"];
    expect(element).toEqual(<Navigate to="/default/status" />);
    element = pathMap["mobile-phone-verification"];
    expect(element).toEqual(<Navigate to="/default/status" />);
    element = pathMap["password/reset/confirm/:uid/:token"];
    expect(element).toEqual(<Navigate to="/default/status" />);
    element = pathMap["password/reset"];
    expect(element).toEqual(<Navigate to="/default/status" />);
    element = pathMap["login/*"];
    expect(element).toEqual(<Navigate to="/default/status" />);
    element = pathMap.status;
    const cookies = new Cookies();
    expect(JSON.stringify(element)).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <Status cookies={cookies} location={props.location} />
        </Suspense>,
      ),
    );
    element = pathMap.logout;
    expect(element).toEqual(<Navigate to="/default/status" />);
    element = pathMap["change-password"];
    expect(JSON.stringify(element)).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PasswordChange cookies={cookies} />
        </Suspense>,
      ),
    );
    element = pathMap["change-phone-number"];
    expect(JSON.stringify(element)).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <MobilePhoneChange cookies={cookies} />
        </Suspense>,
      ),
    );
    element = pathMap["payment/:status"];
    expect(JSON.stringify(element)).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PaymentStatus cookies={cookies} />
        </Suspense>,
      ),
    );
    element = pathMap["payment/process/"];
    expect(JSON.stringify(element)).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PaymentProcess cookies={cookies} />
        </Suspense>,
      ),
    );
    const elements = pathMap["*"];
    expect(JSON.stringify(elements[0])).toEqual(
      JSON.stringify(
        <Header location={props.location} params={props.params} />,
      ),
    );
    expect(JSON.stringify(elements[1])).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <ConnectedDoesNotExist />
        </Suspense>,
      ),
    );
    expect(JSON.stringify(elements[2])).toEqual(JSON.stringify(<Footer />));
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
      if (routeProps.path === "*")
        map["*"] = [...(map["*"] || []), routeProps.element];
      else map[routeProps.path] = routeProps.element;
      return map;
    }, {});
    const cookies = new Cookies();
    let element = pathMap[""];
    expect(element).toEqual(<Navigate to="/default/login" />);
    element = pathMap["registration/*"];
    expect(JSON.stringify(element)).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <Registration loading={false} />
        </Suspense>,
      ),
    );
    element = pathMap["mobile-phone-verification"];
    expect(element).toEqual(<Navigate to="/default/login" />);
    element = pathMap["password/reset/confirm/:uid/:token"];
    expect(JSON.stringify(element)).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PasswordConfirm />
        </Suspense>,
      ),
    );
    element = pathMap["password/reset"];
    expect(JSON.stringify(element)).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PasswordReset />
        </Suspense>,
      ),
    );
    element = pathMap["login/*"];
    expect(JSON.stringify(element)).toEqual(JSON.stringify(<Login />));
    element = pathMap.status;
    // userAutoLogin is true
    expect(element).toEqual(<Navigate to="/default/logout" />);
    element = pathMap.logout;
    expect(JSON.stringify(element)).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <Logout />
        </Suspense>,
      ),
    );
    element = pathMap["change-password"];
    expect(element).toEqual(<Navigate to="/default/login" />);
    element = pathMap["change-phone-number"];
    expect(element).toEqual(<Navigate to="/default/login" />);
    element = pathMap["payment/:status"];
    expect(JSON.stringify(element)).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PaymentStatus cookies={cookies} />
        </Suspense>,
      ),
    );
    element = pathMap["payment/process/"];
    expect(JSON.stringify(element)).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PaymentProcess cookies={cookies} />
        </Suspense>,
      ),
    );
    const elements = pathMap["*"];
    expect(JSON.stringify(elements[0])).toEqual(
      JSON.stringify(
        <Header location={props.location} params={props.params} />,
      ),
    );
    expect(JSON.stringify(elements[1])).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <ConnectedDoesNotExist />
        </Suspense>,
      ),
    );
    expect(JSON.stringify(elements[2])).toEqual(JSON.stringify(<Footer />));
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
      if (routeProps.path === "*")
        map["*"] = [...(map["*"] || []), routeProps.element];
      else map[routeProps.path] = routeProps.element;
      return map;
    }, {});
    expect(wrapper).toMatchSnapshot();
    let element = pathMap[""];
    expect(element).toEqual(<Navigate to="/default/login" />);
    element = pathMap["registration/*"];
    expect(element).toEqual(
      <Navigate to="/default/mobile-phone-verification" />,
    );
    element = pathMap["mobile-phone-verification"];
    const cookies = new Cookies();
    expect(JSON.stringify(element)).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <MobilePhoneVerification cookies={cookies} />
        </Suspense>,
      ),
    );
    element = pathMap["password/reset/confirm/:uid/:token"];
    expect(element).toEqual(<Navigate to="/default/status" />);
    element = pathMap["password/reset"];
    expect(element).toEqual(<Navigate to="/default/status" />);
    element = pathMap["login/*"];
    expect(element).toEqual(<Navigate to="/default/status" />);
    element = pathMap.status;
    expect(element).toEqual(
      <Navigate to="/default/mobile-phone-verification" />,
    );
    element = pathMap.logout;
    expect(element).toEqual(<Navigate to="/default/status" />);
    element = pathMap["change-password"];
    expect(JSON.stringify(element)).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PasswordChange cookies={cookies} />
        </Suspense>,
      ),
    );
    element = pathMap["change-phone-number"];
    expect(JSON.stringify(element)).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <MobilePhoneChange cookies={cookies} />
        </Suspense>,
      ),
    );
    element = pathMap["payment/:status"];
    expect(JSON.stringify(element)).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PaymentStatus cookies={cookies} />
        </Suspense>,
      ),
    );
    element = pathMap["payment/process/"];
    expect(JSON.stringify(element)).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <PaymentProcess cookies={cookies} />
        </Suspense>,
      ),
    );
    const elements = pathMap["*"];
    expect(JSON.stringify(elements[0])).toEqual(
      JSON.stringify(
        <Header location={props.location} params={props.params} />,
      ),
    );
    expect(JSON.stringify(elements[1])).toEqual(
      JSON.stringify(
        <Suspense fallback={<Loader />}>
          <ConnectedDoesNotExist />
        </Suspense>,
      ),
    );
    expect(JSON.stringify(elements[2])).toEqual(JSON.stringify(<Footer />));
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
    // console.log = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should display status if authenticated", async () => {
    wrapper = await mountComponent(props, ["/default/status"]);
    expect(mapRoutes(wrapper)["/default/status"]).toBe(undefined);
    expect(wrapper.find("Router").prop("location").pathname).toBe(
      "/default/status",
    );
  });

  it("should redirect to login if not authenticated", async () => {
    props.organization.configuration.isAuthenticated = false;
    wrapper = await mountComponent(props, ["/default/status"]);
    expect(wrapper.find("Router").prop("location").pathname).toBe(
      "/default/status",
    );
  });
});
