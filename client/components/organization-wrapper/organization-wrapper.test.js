/* eslint-disable camelcase */
import {shallow, mount} from "enzyme";
import React, {Suspense} from "react";
import {MemoryRouter, Route} from "react-router-dom";
import {Cookies} from "react-cookie";
import {Provider} from "react-redux";

import getConfig from "../../utils/get-config";
import OrganizationWrapper from "./organization-wrapper";

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

const createTestProps = (props) => {
  return {
    match: {params: {organization: "default"}, path: "/default"},
    organization: {
      configuration: {
        title: "Default",
        css_path: null,
        slug: "default",
        favicon: null,
        isAuthenticated: true,
        settings: {
          mobile_phone_verification: true,
          subscriptions: true,
        },
        userData,
      },
      exists: true,
    },
    setOrganization: jest.fn(),
    cookies: new Cookies(),
    ...props,
  };
};

describe("<OrganizationWrapper /> rendering", () => {
  let props;
  let wrapper;

  beforeEach(() => {
    props = createTestProps();
    wrapper = shallow(<OrganizationWrapper {...props} />);
  });

  it("should render correctly when in loading state", () => {
    wrapper.setProps({
      organization: {...props.organization, exists: undefined},
    });
    expect(wrapper.find(".app-container")).toHaveLength(0);
    expect(wrapper.find(".org-wrapper-not-found")).toHaveLength(0);
    expect(wrapper.find(".loader-container")).toHaveLength(1);
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
});

describe("<OrganizationWrapper /> interactions", () => {
  // eslint-disable-next-line
  let props;
  let wrapper;
  let originalError;
  let lastConsoleOutuput;

  beforeEach(() => {
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
});

describe("Test <OrganizationWrapper /> routes", () => {
  let props;
  let wrapper;
  const defaultConfig = getConfig("default");
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
    getState: () => {
      return {
        organization: props.organization,
        language: "en",
        languages: defaultConfig.languages,
      };
    },
  };

  const mountComponent = (passedProps, initialEntries) => {
    return mount(
      <MemoryRouter initialEntries={initialEntries}>
        <Provider store={mockedStore}>
          <OrganizationWrapper {...passedProps} />
        </Provider>
      </MemoryRouter>,
    );
  };

  beforeEach(() => {
    props = createTestProps();
    props.organization.configuration = {
      ...props.organization.configuration,
      components,
      languages,
      privacy_policy,
      terms_and_conditions,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should display status if authenticated", () => {
    wrapper = mountComponent(props, ["/default/status"]);
    expect(mapRoutes(wrapper)["/default/status"]).toBe(Suspense);
    expect(wrapper.find("Router").prop("history").location.pathname).toBe(
      "/default/status",
    );
  });

  it("should redirect to login if not authenticated", () => {
    props.organization.configuration.isAuthenticated = false;
    wrapper = mountComponent(props, ["/default/status"]);
    expect(wrapper.find("Router").prop("history").location.pathname).toBe(
      "/default/login",
    );
  });
});
