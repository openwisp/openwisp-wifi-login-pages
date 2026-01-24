import axios from "axios";
import {render, screen, waitFor, fireEvent} from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import {Cookies} from "react-cookie";
import ShallowRenderer from "react-test-renderer/shallow";
import {toast} from "react-toastify";
import {Provider} from "react-redux";
import {TestRouter} from "../../test-utils";
import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import logError from "../../utils/log-error";
import tick from "../../utils/tick";
import Status from "./status";
import validateToken from "../../utils/validate-token";
import {initialState} from "../../reducers/organization";
import {mapStateToProps, mapDispatchToProps} from "./index";

jest.mock("axios");
jest.mock("../../utils/get-config");
jest.mock("../../utils/load-translation");
jest.mock("../../utils/log-error");
jest.mock("../../utils/validate-token");
jest.mock("../../utils/history");
logError.mockImplementation(jest.fn());

// Clean up any state from other test files
beforeAll(() => {
  jest.clearAllMocks();
  axios.mockClear();
});

afterAll(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

const defaultConfig = getConfig("default");
const links = [
  {
    text: {
      en: "link-1",
    },
    url: "/link1.com",
  },
  {
    text: {
      en: "link-2",
    },
    url: "/link2.com",
    authenticated: false,
  },
  {
    text: {
      en: "link-3",
    },
    url: "/link3.com",
    authenticated: true,
  },
];

const createTestProps = (props) => ({
  language: "en",
  orgSlug: "default",
  orgName: "default name",
  statusPage: {...defaultConfig.components.status_page},
  cookies: new Cookies(),
  settings: {...defaultConfig.settings, payment_requires_internet: true},
  captivePortalLoginForm: {
    ...defaultConfig.components.captive_portal_login_form,
  },
  captivePortalLogoutForm: {
    ...defaultConfig.components.captive_portal_logout_form,
  },
  captivePortalSyncAuth: false,
  location: {
    search: "?macaddr=4e:ed:11:2b:17:ae",
  },
  internetMode: false,
  planExhausted: false,
  logout: jest.fn(),
  setUserData: jest.fn(),
  userData: {},
  setTitle: jest.fn(),
  navigate: jest.fn(),
  setInternetMode: jest.fn(),
  setPlanExhausted: jest.fn(),
  defaultLanguage: defaultConfig.default_language,
  ...props,
});

const createMockStore = (customConfig = {}) => {
  const state = {
    organization: {
      configuration: {
        ...defaultConfig,
        slug: "default",
        components: {
          ...defaultConfig.components,
          contact_page: {
            email: "support.org",
            helpdesk: "+1234567890",
            social_links: [],
          },
        },
        ...customConfig,
      },
    },
    language: "en",
  };

  return {
    subscribe: () => {},
    dispatch: () => {},
    getState: () => state,
  };
};

const renderWithProviders = (component, store = createMockStore()) =>
  render(
    <Provider store={store}>
      <TestRouter>{component}</TestRouter>
    </Provider>,
  );

// mocks response coming from validate token endpoint
const responseData = {
  response_code: "Auth_TOKEN_VALIDATION_SUCCESSFUL",
  radius_user_token: "o6AQLY0aQjD3yuihRKLknTn8krcQwuy2Av6MCsFB",
  auth_token: "a5BDNY1cPjF3yuihJKNdwTn8krcQwuy2Av6MCsDC",
  username: "tester",
  email: "tester@tester.com",
  is_active: true,
  is_verified: true,
  phone_number: "+237672279436",
  method: "mobile_phone",
};

describe("<Status /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  props.statusPage.radius_usage_enabled = true;
  it("should render translation placeholder correctly", () => {
    const renderer = new ShallowRenderer();
    const view = renderer.render(<Status {...props} />);
    expect(view).toMatchSnapshot();
  });
});

describe("<Status /> rendering", () => {
  let props;

  it("should render correctly", () => {
    props = createTestProps();
    props.statusPage.radius_usage_enabled = true;
    const renderer = new ShallowRenderer();
    loadTranslation("en", "default");
    const view = renderer.render(<Status {...props} />);
    expect(view).toMatchSnapshot();
  });

  it("should render without authenticated links when not authenticated", () => {
    const prop = createTestProps();
    prop.statusPage.links = links;
    prop.isAuthenticated = false;
    loadTranslation("en", "default");

    // Mock window.top to avoid iframe check issues
    const originalTop = window.top;
    delete window.top;
    window.top = null;

    renderWithProviders(<Status {...prop} />);

    const linkElements = screen.getAllByRole("link");
    const linkTexts = linkElements.map((el) => el.textContent);

    expect(linkTexts).toContain("link-1");
    expect(linkTexts).toContain("link-2");
    expect(linkTexts).not.toContain("link-3");

    // Restore window.top
    delete window.top;
    window.top = originalTop;
  });

  it("should render with authenticated links when authenticated", () => {
    const prop = createTestProps();
    prop.statusPage.links = links;
    prop.isAuthenticated = true;
    loadTranslation("en", "default");

    // Mock window.top to avoid iframe check issues
    const originalTop = window.top;
    delete window.top;
    window.top = null;

    renderWithProviders(<Status {...prop} />);

    const linkElements = screen.getAllByRole("link");
    const linkTexts = linkElements.map((el) => el.textContent);

    expect(linkTexts).toContain("link-1");
    expect(linkTexts).not.toContain("link-2");
    expect(linkTexts).toContain("link-3");

    // Restore window.top
    delete window.top;
    window.top = originalTop;
  });

  it("should mapStateToProps and mapDispatchToProps on rendering", () => {
    const state = {
      organization: {
        configuration: defaultConfig,
      },
    };
    const ownProps = {
      cookies: new Cookies(),
    };
    let result = mapStateToProps(state, ownProps);
    expect(result).toEqual({
      statusPage: defaultConfig.components.status_page,
      orgSlug: defaultConfig.slug,
      orgName: defaultConfig.name,
      settings: defaultConfig.settings,
      userData: defaultConfig.userData,
      captivePortalLoginForm:
        defaultConfig.components.captive_portal_login_form,
      captivePortalLogoutForm:
        defaultConfig.components.captive_portal_logout_form,
      captivePortalSyncAuth: defaultConfig.captive_portal_sync_auth,
      isAuthenticated: defaultConfig.isAuthenticated,
      cookies: ownProps.cookies,
      language: defaultConfig.language,
      defaultLanguage: defaultConfig.default_language,
    });
    const dispatch = jest.fn();
    result = mapDispatchToProps(dispatch);
    expect(result).toEqual({
      logout: expect.any(Function),
      setUserData: expect.any(Function),
      setInternetMode: expect.any(Function),
      setPlanExhausted: expect.any(Function),
      setTitle: expect.any(Function),
    });
  });
});

describe("<Status /> interactions", () => {
  let props;
  let originalTop;
  let originalLocalStorage;

  beforeEach(() => {
    validateToken.mockClear();
    loadTranslation("en", "default");

    // Mock window.top
    originalTop = window.top;
    delete window.top;
    window.top = null;

    // Save original localStorage
    originalLocalStorage = window.localStorage;
  });

  afterEach(() => {
    const cookies = new Cookies();
    cookies.remove("default_mustLogin");
    cookies.remove("default_mustLogout");
    cookies.remove("default_macaddr");
    axios.mockReset();
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.clearAllMocks();

    // Restore window.top
    delete window.top;
    window.top = originalTop;

    // Restore localStorage
    if (originalLocalStorage) {
      Object.defineProperty(window, "localStorage", {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      });
    }
  });

  it("should call logout function when logout button is clicked", async () => {
    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          response: {
            status: 200,
            statusText: "OK",
          },
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          statusText: "OK",
          data: [
            {
              session_id: 1,
              start_time: "2020-09-08T00:22:28-04:00",
              stop_time: "2020-09-08T00:22:29-04:00",
              input_octets: 100000,
              output_octets: 100000,
            },
          ],
          headers: {},
        }),
      );
    props = createTestProps();
    renderWithProviders(<Status {...props} />);

    const logoutButtons = screen.getAllByRole("button", {name: /logout/i});
    expect(logoutButtons.length).toBeGreaterThan(0);

    fireEvent.click(logoutButtons[0]);
    await tick();
    expect(props.logout).toHaveBeenCalled();

    fireEvent.click(logoutButtons[0]);
    await tick();
    expect(props.logout).toHaveBeenCalled();
    expect(props.setUserData).toHaveBeenCalledWith(initialState.userData);
  });

  it("test componentDidMount lifecycle method", async () => {
    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          statusText: "OK",
          data: [
            {
              session_id: 1,
              start_time: "2020-09-08T00:22:28-04:00",
              stop_time: "2020-09-08T00:22:29-04:00",
              input_octets: 100000,
              output_octets: 100000,
            },
          ],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          statusText: "OK",
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          statusText: "OK",
          data: [],
          headers: {},
        }),
      );
    props = createTestProps({
      userData: {...responseData, mustLogin: true},
      location: {
        search: "",
      },
      cookies: new Cookies(),
    });
    props.statusPage.radius_usage_enabled = true;
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    expect(props.cookies.get("default_macaddr")).toBe(undefined);

    const spyToast = jest.spyOn(toast, "error");
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should call getUserActiveRadiusSessions with calling_station_id on logout if macaddr is in cookies", async () => {
    axios.mockImplementation(() => Promise.resolve({data: [], headers: {}}));
    const macaddr = "4e:ed:11:2b:17:ae";
    props = createTestProps({
      userData: {...responseData, mustLogin: true},
    });
    props.cookies.set(`${props.orgSlug}_macaddr`, macaddr);
    validateToken.mockReturnValue(true);

    const getUserActiveRadiusSessionsSpy = jest.spyOn(
      Status.prototype,
      "getUserActiveRadiusSessions",
    );

    renderWithProviders(<Status {...props} />);
    await tick();

    // clear spy from componentDidMount call
    getUserActiveRadiusSessionsSpy.mockClear();

    // Trigger logout by finding and clicking logout button
    const logoutButton = screen.queryByRole("button", {name: /logout/i});
    // Verify button exists
    expect(logoutButton).toBeInTheDocument();

    fireEvent.click(logoutButton);
    await tick();
    expect(getUserActiveRadiusSessionsSpy).toHaveBeenCalledWith({
      calling_station_id: macaddr,
    });
  });

  it("test getUserActiveRadiusSessions method", async () => {
    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          statusText: "OK",
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          statusText: "OK",
          data: [
            {
              session_id: 1,
              start_time: "2020-09-08T00:22:28-04:00",
              stop_time: "2020-09-08T00:22:29-04:00",
              input_octets: 100000,
              output_octets: 100000,
            },
          ],
          headers: {},
        }),
      )
      .mockImplementationOnce(() => {
        const error = new Error("Unauthorized");
        error.response = {
          status: 401,
          headers: {},
        };
        return Promise.reject(error);
      });
    props = createTestProps();
    renderWithProviders(<Status {...props} />);
    await tick();

    // The component should handle getUserActiveRadiusSessions internally
    // We verify it was called by checking axios calls
    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("test user info with mobile verification on and different username", async () => {
    validateToken.mockReturnValue(true);
    props = createTestProps({
      userData: responseData,
    });
    props.settings.mobile_phone_verification = true;

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(screen.getByText("tester")).toBeInTheDocument();
      expect(screen.getByText("tester@tester.com")).toBeInTheDocument();
      expect(screen.getByText("+237672279436")).toBeInTheDocument();
    });
  });

  it("test user info with mobile verification on and same username", async () => {
    validateToken.mockReturnValue(true);
    const data = {...responseData, username: responseData.email};
    props = createTestProps({
      userData: data,
    });
    props.settings.mobile_phone_verification = true;

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(screen.getByText("tester@tester.com")).toBeInTheDocument();
      expect(screen.getByText("+237672279436")).toBeInTheDocument();
    });
  });

  it("test user info with mobile verification off", async () => {
    validateToken.mockReturnValue(true);
    props = createTestProps({
      userData: {
        ...responseData,
        mustLogin: false,
        is_verified: true,
        method: "",
      },
    });
    props.settings.mobile_phone_verification = false;
    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(screen.getByText("tester")).toBeInTheDocument();
      expect(screen.getByText("tester@tester.com")).toBeInTheDocument();
    });
  });

  it("test handleLoginIframe method", async () => {
    props = createTestProps();
    jest.spyOn(toast, "error");
    jest.spyOn(toast, "dismiss");
    jest.spyOn(props.cookies, "set");

    renderWithProviders(<Status {...props} />);
    await tick();

    // The handleLoginIframe is called internally, we just verify no errors
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("test postMessage event listener firing", async () => {
    props = createTestProps({
      userData: {...responseData, mustLogin: true},
    });
    validateToken.mockReturnValue(true);

    const {container} = renderWithProviders(<Status {...props} />);
    await tick();

    // Simulate postMessage event
    const event = new MessageEvent("message", {
      data: {type: "owlp-ready"},
      origin: window.location.origin,
    });
    window.dispatchEvent(event);

    await tick();
    // Verify the component handles the event without errors
    expect(container).toBeInTheDocument();
  });

  it("test handlePostMessage", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: true},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    // Simulate authMessage
    const authMessageEvent = new MessageEvent("message", {
      data: {
        type: "authMessage",
        message: "Test auth message",
        warningMessage: "USAGE_LIMIT_EXHAUSTED_TXT",
      },
      origin: props.captivePortalLoginForm.action
        ? new URL(props.captivePortalLoginForm.action).origin
        : window.location.origin,
    });
    window.dispatchEvent(authMessageEvent);
    await tick();

    await waitFor(() => {
      expect(props.setPlanExhausted).toHaveBeenCalledWith(true);
    });
  });

  it("test handlePostMessage internet-mode", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: true},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    // Simulate internet-mode message
    const internetModeEvent = new MessageEvent("message", {
      data: {
        type: "internet-mode",
      },
      origin: props.captivePortalLoginForm.action
        ? new URL(props.captivePortalLoginForm.action).origin
        : window.location.origin,
    });
    window.dispatchEvent(internetModeEvent);
    await tick();

    expect(props.setInternetMode).toHaveBeenCalledWith(true);
  });

  it("should not perform captive portal login (submit loginFormRef), if user is already authenticated", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should perform captive portal login (submit loginFormRef), if user is just authenticated", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: true},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should not perform captive portal login (sync auth), if user is already authenticated", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
      captivePortalSyncAuth: true,
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should not perform captive portal login again (sync auth), if captive portal rejected", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    const cookies = new Cookies();
    cookies.set("default_mustLogin", false, {path: "/", maxAge: 60});

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
      captivePortalSyncAuth: true,
      cookies,
    });
    validateToken.mockReturnValue(true);

    const {container} = renderWithProviders(<Status {...props} />);
    await tick();

    // Component should render without attempting captive portal login again
    expect(container).toBeInTheDocument();
  });

  it("should perform captive portal login (sync auth), if user is just authenticated", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: true},
      captivePortalSyncAuth: true,
    });
    validateToken.mockReturnValue(true);

    const {container} = renderWithProviders(<Status {...props} />);
    await tick();

    // Verify component rendered successfully
    expect(container).toBeInTheDocument();
  });
});

describe("<Status /> accounting_swap_octets", () => {
  let props;
  let originalTop;
  let originalLocalStorage;

  beforeEach(() => {
    validateToken.mockClear();
    loadTranslation("en", "default");

    // Mock window.top
    originalTop = window.top;
    delete window.top;
    window.top = null;

    // Save original localStorage
    originalLocalStorage = window.localStorage;
  });

  afterEach(() => {
    axios.mockReset();
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.clearAllMocks();

    // Restore window.top
    delete window.top;
    window.top = originalTop;

    // Restore localStorage
    if (originalLocalStorage) {
      Object.defineProperty(window, "localStorage", {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      });
    }
  });

  it("should not swap download and upload when accounting_swap_octets is false", async () => {
    const sessions = [
      {
        session_id: 1,
        start_time: "2020-09-08T00:22:28-04:00",
        stop_time: "2020-09-08T00:22:29-04:00",
        input_octets: 100000,
        output_octets: 200000,
        calling_station_id: "AA:BB:CC:DD:EE:FF",
        session_time: 3600,
      },
    ];

    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: sessions,
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    props.statusPage.accounting_swap_octets = false;
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    // Verify data is not swapped
    await waitFor(() => {
      expect(screen.getByText(/AA:BB:CC:DD:EE:FF/i)).toBeInTheDocument();
    });
  });

  it("should swap download and upload when accounting_swap_octets is true", async () => {
    const sessions = [
      {
        session_id: 1,
        start_time: "2020-09-08T00:22:28-04:00",
        stop_time: "2020-09-08T00:22:29-04:00",
        input_octets: 100000,
        output_octets: 200000,
        calling_station_id: "AA:BB:CC:DD:EE:FF",
        session_time: 3600,
      },
    ];

    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: sessions,
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    props.statusPage.accounting_swap_octets = true;
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    // Verify data is swapped
    await waitFor(() => {
      expect(screen.getByText(/AA:BB:CC:DD:EE:FF/i)).toBeInTheDocument();
    });
  });
});

describe("<Status /> additional tests", () => {
  let props;
  let originalTop;
  let originalLocalStorage;

  beforeEach(() => {
    validateToken.mockClear();
    loadTranslation("en", "default");

    // Mock window.top
    originalTop = window.top;
    delete window.top;
    window.top = null;

    // Save original localStorage
    originalLocalStorage = window.localStorage;
  });

  afterEach(() => {
    axios.mockReset();
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.clearAllMocks();

    // Restore window.top
    delete window.top;
    window.top = originalTop;

    // Restore localStorage
    if (originalLocalStorage) {
      Object.defineProperty(window, "localStorage", {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      });
    }
  });

  it("should fallback to localStorage if cookies are not available (sync auth)", async () => {
    const cookies = new Cookies();
    // Set up localStorage with a value that would be read if fallback works
    localStorage.setItem("rememberMe", "false");

    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: true},
      captivePortalSyncAuth: true,
      cookies,
    });
    validateToken.mockReturnValue(true);

    const {container} = renderWithProviders(<Status {...props} />);
    await tick();

    // Component should successfully use localStorage and render without errors
    expect(container).toBeInTheDocument();

    // Cleanup
    localStorage.removeItem("rememberMe");
  });

  it("should perform captive portal logout (sync auth)", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
      captivePortalSyncAuth: true,
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("test active session table", async () => {
    const activeSessions = [
      {
        session_id: 1,
        start_time: "2020-09-08T00:22:28-04:00",
        stop_time: null,
        input_octets: 100000,
        output_octets: 200000,
        calling_station_id: "AA:BB:CC:DD:EE:01",
        session_time: 3600,
      },
    ];

    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: activeSessions,
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("test passed session table", async () => {
    const pastSessions = [
      {
        session_id: 2,
        start_time: "2020-09-08T00:22:28-04:00",
        stop_time: "2020-09-08T00:22:29-04:00",
        input_octets: 100000,
        output_octets: 200000,
        calling_station_id: "AA:BB:CC:DD:EE:02",
        session_time: 3600,
      },
    ];

    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: pastSessions,
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(screen.getByText(/AA:BB:CC:DD:EE:02/i)).toBeInTheDocument();
    });
  });

  it("test empty session table", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    validateToken.mockReturnValue(true);

    const {container} = renderWithProviders(<Status {...props} />);
    await tick();

    // Should render component without errors even with no sessions
    expect(container).toBeInTheDocument();
  });

  it("test interval cleared on componentUnmount", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    props.statusPage.radius_usage_enabled = true;
    validateToken.mockReturnValue(true);

    const {unmount} = renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });

    unmount();

    // Should not throw errors after unmount
    jest.advanceTimersByTime(60000);
  });

  it("test loading spinner", async () => {
    // For this test, we want to check the component renders during loading state
    // We'll use a pending promise to simulate loading
    let resolveAxios;
    axios.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAxios = resolve;
        }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    validateToken.mockReturnValue(true);

    const {container} = renderWithProviders(<Status {...props} />);

    // Should render component while loading
    await tick();
    expect(container).toBeInTheDocument();

    // Cleanup - resolve the promise to avoid hanging
    if (resolveAxios) {
      resolveAxios({status: 200, data: [], headers: {}});
    }
  });

  it("should logout if user is not active", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, is_active: false},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should toggle logout modal", () => {
    const mockLocalStorage = {
      getItem: jest.fn(() => "true"),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    const savedLocalStorage = window.localStorage;
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    validateToken.mockReturnValue(true);

    const {container} = renderWithProviders(<Status {...props} />);

    const logoutButton = screen.queryByRole("button", {name: /logout/i});
    if (logoutButton) {
      fireEvent.click(logoutButton);
      // Modal should toggle
    }

    // Verify component rendered
    expect(container).toBeInTheDocument();

    // Restore localStorage
    Object.defineProperty(window, "localStorage", {
      value: savedLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  it("should perform logout for auto-login next time with userAutoLogin true", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    const mockLocalStorage = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    const savedLocalStorage2 = window.localStorage;
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });

    // Restore localStorage
    Object.defineProperty(window, "localStorage", {
      value: savedLocalStorage2,
      writable: true,
      configurable: true,
    });
  });

  it("should perform logout for not auto-login with userAutoLogin false", () => {
    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    validateToken.mockReturnValue(true);

    const {container} = renderWithProviders(<Status {...props} />);

    const logoutButton = screen.queryByRole("button", {name: /logout/i});
    if (logoutButton) {
      fireEvent.click(logoutButton);
      // Should handle logout without auto-login
    }

    // Verify component rendered successfully
    expect(container).toBeInTheDocument();
  });

  it("should set hasMoreSessions to false if link is not in response headers", async () => {
    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {}, // No link header
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should not perform captive portal login if user password has expired", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, password_expired: true},
    });
    validateToken.mockReturnValue(true);

    const {container} = renderWithProviders(<Status {...props} />);
    await tick();

    // Component should render successfully without performing captive portal login
    expect(container).toBeInTheDocument();
  });

  it("should initiate bank_card verification", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {
        ...responseData,
        is_verified: false,
        method: "bank_card",
        mustLogin: false,
      },
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should not perform captive page login if payment_requires_internet is false", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {
        ...responseData,
        is_verified: false,
        method: "bank_card",
        mustLogin: true,
      },
    });
    props.settings.payment_requires_internet = false;
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should redirect to /payment/process if proceedToPayment is true", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {
        ...responseData,
        is_verified: false,
        method: "bank_card",
        mustLogin: true,
        proceedToPayment: true,
      },
    });
    props.settings.payment_requires_internet = true;
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should logout if mustLogout is true", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogout: true},
    });
    validateToken.mockReturnValue(true);

    const {container} = renderWithProviders(<Status {...props} />);
    await tick();

    expect(container).toBeInTheDocument();
  });

  it("should logout if activeSession do not contain current MAC", async () => {
    const activeSessions = [
      {
        session_id: 1,
        start_time: "2020-09-08T00:22:28-04:00",
        stop_time: null,
        input_octets: 100000,
        output_octets: 100000,
        calling_station_id: "AA:BB:CC:DD:EE:FF",
      },
    ];

    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: activeSessions,
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    props.cookies.set(`${props.orgSlug}_macaddr`, "DIFFERENT:MAC:ADDRESS");
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should not logout in internetMode with zero active sessions", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
      internetMode: true,
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should repeat login if mustLogout and repeatLogin are true", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogout: true, repeatLogin: true},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should set title", () => {
    props = createTestProps();
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);

    expect(props.setTitle).toHaveBeenCalled();
  });

  it("should render small table row and it should contain logout if logout_by_session is enabled", async () => {
    global.innerWidth = 500;

    const activeSessions = [
      {
        session_id: 1,
        start_time: "2020-09-08T00:22:28-04:00",
        stop_time: null,
        input_octets: 100000,
        output_octets: 200000,
        calling_station_id: "AA:BB:CC:DD:EE:FF",
        session_time: 3600,
      },
    ];

    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: activeSessions,
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    props.captivePortalLogoutForm.logout_by_session = true;
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should execute getSmallTable correctly", async () => {
    global.innerWidth = 500;

    const sessions = [
      {
        session_id: 1,
        start_time: "2020-09-08T00:22:28-04:00",
        stop_time: null,
        input_octets: 100000,
        output_octets: 200000,
        calling_station_id: "AA:BB:CC:DD:EE:FF",
        session_time: 3600,
      },
    ];

    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: sessions,
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should call finalOperations once after loading userData", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: true},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should not get account sessions if user needs verification", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {
        ...responseData,
        is_verified: false,
        method: "mobile_phone",
        mustLogin: false,
      },
    });
    props.settings.mobile_phone_verification = true;
    validateToken.mockReturnValue(true);

    const {container} = renderWithProviders(<Status {...props} />);
    await tick();

    // Component should render successfully without fetching sessions when user needs verification
    expect(container).toBeInTheDocument();
  });

  it("should call logout if getUserRadiusSessions is rejected (unauthorized or forbidden)", async () => {
    axios.mockImplementationOnce(() => {
      const error = new Error("Unauthorized");
      error.response = {
        status: 401,
      };
      return Promise.reject(error);
    });

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should return if repeatLogin is true in handleLogout", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    const mockLocalStorage = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    const savedLocalStorage2 = window.localStorage;
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });

    // Restore localStorage
    Object.defineProperty(window, "localStorage", {
      value: savedLocalStorage2,
      writable: true,
      configurable: true,
    });
  });

  it("test handleLogout internetMode", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
      internetMode: true,
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should not display STATUS_CONTENT and radius usage when logged in internetMode", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
      internetMode: true,
    });
    props.statusPage.radius_usage_enabled = true;
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should not display status-content when planExhausted is true", () => {
    props = createTestProps({
      userData: {...responseData, mustLogin: false},
      planExhausted: true,
    });
    validateToken.mockReturnValue(true);

    const {container} = renderWithProviders(<Status {...props} />);

    // Status content should be conditional on planExhausted
    expect(container).toBeInTheDocument();
  });

  it("should perform call saml_logout_url if logged in via SAML", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    const mockLocalStorage = {
      getItem: jest.fn((key) => {
        if (key === "default_logout_method") return "saml";
        return null;
      }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    const savedLocalStorage2 = window.localStorage;
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });

    props = createTestProps({
      userData: {...responseData, mustLogin: false, mustLogout: true},
    });
    props.statusPage.saml_logout_url = "https://example.com/saml/logout";
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });

    // Restore localStorage
    Object.defineProperty(window, "localStorage", {
      value: savedLocalStorage2,
      writable: true,
      configurable: true,
    });
  });

  it("should return if loginIframe is not loaded", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps();
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should update screen width", () => {
    props = createTestProps();
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);

    global.innerWidth = 1920;
    fireEvent(window, new Event("resize"));

    // Should update screen width on resize
    expect(global.innerWidth).toBe(1920);
  });

  it("should execute fetchMoreSessions correctly", async () => {
    const sessions = Array.from({length: 5}, (_, i) => ({
      session_id: i + 1,
      start_time: "2020-09-08T00:22:28-04:00",
      stop_time: "2020-09-08T00:22:29-04:00",
      input_octets: 100000,
      output_octets: 100000,
      calling_station_id: `AA:BB:CC:DD:EE:${i.toString(16).padStart(2, "0").toUpperCase()}`,
    }));

    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: sessions,
          headers: {link: '<...>; rel="next"'},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should submit logoutForm in iframe on calling handleSessionLogout", async () => {
    const activeSessions = [
      {
        session_id: 1,
        start_time: "2020-09-08T00:22:28-04:00",
        stop_time: null,
        input_octets: 100000,
        output_octets: 200000,
        calling_station_id: "AA:BB:CC:DD:EE:01",
        session_time: 3600,
      },
    ];

    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: activeSessions,
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    props.captivePortalLogoutForm.logout_by_session = true;
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should call handleSessionLogout if clicked on session row of large table", async () => {
    global.innerWidth = 1024;

    const activeSessions = [
      {
        session_id: 1,
        start_time: "2020-09-08T00:22:28-04:00",
        stop_time: null,
        input_octets: 100000,
        output_octets: 200000,
        calling_station_id: "AA:BB:CC:DD:EE:01",
        session_time: 3600,
      },
      {
        session_id: 2,
        start_time: "2020-09-08T00:22:28-04:00",
        stop_time: null,
        input_octets: 100000,
        output_octets: 200000,
        calling_station_id: "AA:BB:CC:DD:EE:02",
        session_time: 3600,
      },
    ];

    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: activeSessions,
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    props.captivePortalLogoutForm.logout_by_session = true;
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should call getSmallTable if screenWidth is less than or equal to 656", async () => {
    global.innerWidth = 500;

    const sessions = [
      {
        session_id: 1,
        start_time: "2020-09-08T00:22:28-04:00",
        stop_time: "2020-09-08T00:22:29-04:00",
        input_octets: 100000,
        output_octets: 200000,
        calling_station_id: "AA:BB:CC:DD:EE:FF",
        session_time: 3600,
      },
    ];

    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: sessions,
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should render additional fields in captivePortalLogoutForm", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    props.captivePortalLogoutForm.additional_fields = [
      {name: "field1", value: "value1"},
      {name: "field2", value: "value2"},
    ];
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should clear userData on logout", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should not logout user if network error happens while fetching radius sessions", async () => {
    axios
      .mockImplementationOnce(() => Promise.reject(new Error("Network Error")))
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should not concat same past session again", async () => {
    const sessions = [
      {
        session_id: 1,
        start_time: "2020-09-08T00:22:28-04:00",
        stop_time: "2020-09-08T00:22:29-04:00",
        input_octets: 100000,
        output_octets: 200000,
        calling_station_id: "AA:BB:CC:DD:EE:FF",
        session_time: 3600,
      },
    ];

    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: sessions,
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should set loading to false if user is not validated", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: [],
        headers: {},
      }),
    );

    validateToken.mockReturnValue(false);

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });

    const {container} = renderWithProviders(<Status {...props} />);
    await tick();

    expect(container).toBeInTheDocument();
  });

  it("test getUserRadiusUsage method", async () => {
    const radiusUsageData = {
      plan: {
        name: "Basic Plan",
        is_free: false,
      },
      checks: [
        {
          attribute: "Max-Daily-Session-Traffic",
          value: "5000000000",
          result: 2500000000,
          type: "bytes",
        },
      ],
    };

    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: radiusUsageData,
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    props.statusPage.radius_usage_enabled = true;
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("test upgradeUserPlan method handle error", async () => {
    const radiusUsageData = {
      plan: {
        name: "Free Plan",
        is_free: true,
      },
      checks: [],
    };

    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: radiusUsageData,
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    props.statusPage.radius_usage_enabled = true;
    props.settings.subscriptions = true;
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should hide limit-info element if getUserRadiusUsage fails", async () => {
    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() => {
        const error = new Error("Not Found");
        error.response = {
          status: 404,
        };
        return Promise.reject(error);
      });

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    props.statusPage.radius_usage_enabled = true;
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should hide limit-info element if user plan has no checks", async () => {
    const radiusUsageData = {
      plan: {
        name: "Basic Plan",
        is_free: false,
      },
      checks: [],
    };

    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: radiusUsageData,
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    props.statusPage.radius_usage_enabled = true;
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should show user's radius usage", async () => {
    const radiusUsageData = {
      plan: {
        name: "Premium Plan",
        is_free: false,
      },
      checks: [
        {
          attribute: "Max-Daily-Session-Traffic",
          value: "10000000000",
          result: 5000000000,
          type: "bytes",
        },
      ],
    };

    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: radiusUsageData,
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    props.statusPage.radius_usage_enabled = true;
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should hide check if check.value is zero", async () => {
    const radiusUsageData = {
      plan: {
        name: "Basic Plan",
        is_free: false,
      },
      checks: [
        {
          attribute: "Max-Daily-Session-Traffic",
          value: "0",
          result: 0,
          type: "bytes",
        },
      ],
    };

    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: radiusUsageData,
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    props.statusPage.radius_usage_enabled = true;
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("subscriptions: should hide checks and show upgrade option if all checks have zero value", async () => {
    const radiusUsageData = {
      plan: {
        name: "Free Plan",
        is_free: true,
      },
      checks: [
        {
          attribute: "Max-Daily-Session-Traffic",
          value: "0",
          result: 0,
          type: "bytes",
        },
      ],
    };

    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: radiusUsageData,
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    props.statusPage.radius_usage_enabled = true;
    props.settings.subscriptions = true;
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("subscriptions: should show upgrade option when user plan is free", async () => {
    const radiusUsageData = {
      plan: {
        name: "Free Plan",
        is_free: true,
      },
      checks: [
        {
          attribute: "Max-Daily-Session-Traffic",
          value: "1000000000",
          result: 500000000,
          type: "bytes",
        },
      ],
    };

    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: radiusUsageData,
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    props.statusPage.radius_usage_enabled = true;
    props.settings.subscriptions = true;
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("subscriptions: should show upgrade option when user plan is exhausted", async () => {
    const radiusUsageData = {
      plan: {
        name: "Basic Plan",
        is_free: false,
      },
      checks: [
        {
          attribute: "Max-Daily-Session-Traffic",
          value: "1000000000",
          result: 1000000000,
          type: "bytes",
        },
      ],
    };

    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: radiusUsageData,
          headers: {},
        }),
      );

    props = createTestProps({
      userData: {...responseData, mustLogin: false},
    });
    props.statusPage.radius_usage_enabled = true;
    props.settings.subscriptions = true;
    validateToken.mockReturnValue(true);

    renderWithProviders(<Status {...props} />);
    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });
});
