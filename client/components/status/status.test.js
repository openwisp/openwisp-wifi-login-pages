/* eslint-disable prefer-promise-reject-errors */
import axios from "axios";
import {shallow} from "enzyme";
import PropTypes from "prop-types";
import React from "react";
import {Cookies} from "react-cookie";
import ShallowRenderer from "react-test-renderer/shallow";
import {toast} from "react-toastify";
import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import logError from "../../utils/log-error";
import tick from "../../utils/tick";
import Status from "./status";
import validateToken from "../../utils/validate-token";
import {initialState} from "../../reducers/organization";
import Modal from "../../utils/modal";
import {mapStateToProps, mapDispatchToProps} from "./index";

jest.mock("axios");
jest.mock("../../utils/get-config");
jest.mock("../../utils/load-translation");
jest.mock("../../utils/log-error");
jest.mock("../../utils/validate-token");
jest.mock("../../utils/history");
logError.mockImplementation(jest.fn());

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

const getLinkText = (wrapper, selector) => {
  const texts = [];
  wrapper.find(selector).forEach((node) => {
    texts.push(node.text());
  });
  return texts;
};

const createTestProps = (props) => ({
  language: "en",
  orgSlug: "default",
  orgName: "default name",
  statusPage: defaultConfig.components.status_page,
  cookies: new Cookies(),
  settings: {...defaultConfig.settings, payment_requires_internet: true},
  captivePortalLoginForm: defaultConfig.components.captive_portal_login_form,
  captivePortalLogoutForm: defaultConfig.components.captive_portal_logout_form,
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

// mocks response coming from validate token endpoint
const responseData = {
  response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
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
    const wrapper = renderer.render(<Status {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});

describe("<Status /> rendering", () => {
  let props;

  it("should render correctly", () => {
    props = createTestProps();
    props.statusPage.radius_usage_enabled = true;
    const renderer = new ShallowRenderer();
    loadTranslation("en", "default");
    const component = renderer.render(<Status {...props} />);
    expect(component).toMatchSnapshot();
  });

  it("should render without authenticated links when not authenticated", () => {
    const prop = createTestProps();
    prop.statusPage.links = links;
    prop.isAuthenticated = false;
    loadTranslation("en", "default");
    const wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    const linkText = getLinkText(wrapper, ".status-link");
    expect(linkText).toContain("link-1");
    expect(linkText).toContain("link-2");
    expect(linkText).not.toContain("link-3");
  });

  it("should render with authenticated links when authenticated", () => {
    const prop = createTestProps();
    prop.statusPage.links = links;
    prop.isAuthenticated = true;
    loadTranslation("en", "default");
    const wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    const linkText = getLinkText(wrapper, ".status-link");
    expect(linkText).toContain("link-1");
    expect(linkText).not.toContain("link-2");
    expect(linkText).toContain("link-3");
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
  // eslint-disable-next-line
  let props;
  let wrapper;

  beforeEach(() => {
    Status.contextTypes = {
      setLoading: PropTypes.func,
      getLoading: PropTypes.func,
    };
    validateToken.mockClear();
    loadTranslation("en", "default");
  });

  afterEach(() => {
    const cookies = new Cookies();
    cookies.remove("default_mustLogin");
    cookies.remove("default_mustLogout");
    cookies.remove("default_macaddr");
    axios.mockReset();
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.useRealTimers();
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
            },
          ],
          headers: {},
        }),
      );
    props = createTestProps();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    jest.spyOn(wrapper.instance(), "handleLogout");
    wrapper.find(".logout input.button").simulate("click", {});
    await tick();
    expect(wrapper.instance().props.logout).toHaveBeenCalled();
    wrapper.find(".logout input.button").simulate("click", {});
    await tick();
    expect(wrapper.instance().state.activeSessions.length).toBe(1);
    expect(wrapper.instance().props.logout).toHaveBeenCalled();
    expect(wrapper.instance().props.setUserData).toHaveBeenCalledWith(
      initialState.userData,
    );
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
    jest.spyOn(Status.prototype, "getUserActiveRadiusSessions");
    jest.spyOn(Status.prototype, "getUserRadiusUsage");

    props = createTestProps({
      userData: {...responseData, mustLogin: true},
    });
    props.statusPage.radius_usage_enabled = true;
    validateToken.mockReturnValue(true);
    const setLoading = jest.fn();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading},
    });
    await tick();
    expect(wrapper.instance().props.cookies.get("default_macaddr")).toBe(
      "4e:ed:11:2b:17:ae",
    );
    expect(Status.prototype.getUserActiveRadiusSessions).toHaveBeenCalled();
    expect(wrapper.instance().state.activeSessions.length).toBe(1);
    expect(setLoading.mock.calls.length).toBe(1);
    expect(Status.prototype.getUserRadiusUsage).toHaveBeenCalled();
    wrapper.setProps({
      location: {
        search: "",
      },
      cookies: new Cookies(),
    });
    wrapper.instance().componentDidMount();
    await tick();
    expect(wrapper.instance().props.cookies.get("default_macaddr")).toBe(
      undefined,
    );
    expect(setLoading.mock.calls.length).toBe(2);

    const spyToast = jest.spyOn(toast, "error");
    expect(spyToast.mock.calls.length).toBe(0);

    wrapper.setProps({
      location: {
        search: "?macaddr=4e:ed:11:2b:17:ae",
      },
      cookies: new Cookies(),
    });

    const mockRef = {submit: jest.fn()};
    wrapper.instance().loginIframeRef.current = {};
    wrapper.instance().loginFormRef.current = mockRef;
    wrapper.instance().componentDidMount();
    await tick();
    await tick();
    expect(mockRef.submit.mock.calls.length).toBe(1);
    Status.prototype.getUserActiveRadiusSessions.mockRestore();
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
            },
          ],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.reject({
          response: {
            status: 401,
            headers: {},
          },
        }),
      );
    props = createTestProps();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    jest.spyOn(wrapper.instance(), "getUserActiveRadiusSessions");
    wrapper.instance().getUserActiveRadiusSessions();
    await tick();
    expect(wrapper.instance().state.activeSessions.length).toBe(0);
    wrapper.instance().getUserActiveRadiusSessions();
    await tick();
    expect(wrapper.instance().state.activeSessions.length).toBe(1);
    wrapper.instance().getUserActiveRadiusSessions();
    await tick();
    expect(wrapper.instance().props.logout.mock.calls.length).toBe(1);
  });

  it("test user info with mobile verification on and different username", async () => {
    validateToken.mockReturnValue(true);
    props = createTestProps();
    props.settings.mobile_phone_verification = true;
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: false,
    });
    wrapper.setProps({userData: responseData});
    await tick();
    expect(wrapper.contains(<span>tester</span>)).toBe(true);
    expect(wrapper.contains(<span>tester@tester.com</span>)).toBe(true);
    expect(wrapper.contains(<span>+237672279436</span>)).toBe(true);
  });

  it("test user info with mobile verification on and same username", async () => {
    validateToken.mockReturnValue(true);
    props = createTestProps();
    props.settings.mobile_phone_verification = true;
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: false,
    });
    const data = {...responseData, username: responseData.email};
    wrapper.setProps({userData: data});
    await tick();
    expect(wrapper.contains(<span>tester</span>)).toBe(false);
    expect(wrapper.contains(<span>tester@tester.com</span>)).toBe(true);
    expect(wrapper.contains(<span>+237672279436</span>)).toBe(true);
  });

  it("test user info with mobile verification off", async () => {
    validateToken.mockReturnValue(true);
    props = createTestProps();
    props.settings.mobile_phone_verification = false;
    const setLoadingMock = jest.fn();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: setLoadingMock},
      disableLifecycleMethods: true,
    });
    wrapper.setProps({
      userData: {
        ...responseData,
        mustLogin: true,
        is_verified: false,
        method: "",
      },
    });
    const spyFn = jest.fn();
    wrapper.instance().loginIframeRef.current = {};
    wrapper.instance().loginFormRef.current = {submit: spyFn};
    wrapper.instance().componentDidMount();
    await tick();
    expect(wrapper.contains(<span>tester</span>)).toBe(true);
    expect(wrapper.contains(<span>+237672279436</span>)).toBe(false);
    expect(wrapper.contains(<span>tester@tester.com</span>)).toBe(true);
    expect(spyFn.mock.calls.length).toBe(1);
    wrapper.instance().handleLoginIframe();
    const mockedSetLoadingCalls = JSON.stringify(setLoadingMock.mock.calls);
    expect(mockedSetLoadingCalls).toBe("[[true],[false]]");
  });

  it("test handleLoginIframe method", async () => {
    props = createTestProps();
    jest.spyOn(toast, "error");
    jest.spyOn(toast, "dismiss");
    jest.spyOn(props.cookies, "set");
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    expect(wrapper.instance().loginIframeRef).toEqual({current: null});
    let mockRef = {};
    wrapper.instance().loginIframeRef.current = mockRef;
    wrapper.instance().componentDidMount();
    wrapper.instance().handleLoginIframe();
    mockRef = {
      contentWindow: {
        location: {
          search: "?reply=true?macaddr=4e:ed:11:2b:17:ae",
        },
      },
      contentDocument: {
        title: "404",
      },
    };
    wrapper.instance().loginIframeRef.current = mockRef;
    wrapper.instance().componentDidMount();
    wrapper.instance().handleLoginIframe();
    expect(wrapper.instance().props.logout.mock.calls.length).toBe(1);
    expect(wrapper.instance().props.cookies.get("default_macaddr")).toBe(
      "4e:ed:11:2b:17:ae",
    );
    expect(props.cookies.set).toHaveBeenCalledWith(
      "default_macaddr",
      "4e:ed:11:2b:17:ae",
      {path: "/"},
    );
    expect(toast.error).toHaveBeenCalledWith("true?macaddr=4e:ed:11:2b:17:ae", {
      onOpen: expect.any(Function),
    });
    toast.error.mock.calls.pop()[1].onOpen();
    expect(toast.dismiss).toHaveBeenCalledWith("main_toast_id");
  });

  it("test postMessage event listener firing", async () => {
    props = createTestProps();
    const events = {};
    window.addEventListener = jest.fn((event, callback) => {
      events[event] = callback;
    });
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    const handlePostMessageMock = jest.fn();
    wrapper.instance().handlePostMessage = handlePostMessageMock;
    wrapper.instance().componentDidMount();

    events.message({
      origin: "http://localhost",
      data: {message: "RADIUS Error", type: "authError"},
    });
    expect(handlePostMessageMock).toHaveBeenCalledTimes(1);
  });

  it("test handlePostMessage", async () => {
    props = createTestProps();
    const setLoadingMock = jest.fn();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: setLoadingMock},
      disableLifecycleMethods: true,
    });
    jest.spyOn(toast, "error");
    jest.spyOn(toast, "dismiss");
    jest.spyOn(toast, "info");
    const status = wrapper.instance();

    // Test missing message
    status.handlePostMessage({
      data: {type: "authError"},
      origin: "http://localhost",
    });
    expect(toast.error).toHaveBeenCalledTimes(0);
    expect(toast.dismiss).toHaveBeenCalledTimes(0);
    expect(props.logout).toHaveBeenCalledTimes(0);
    expect(setLoadingMock).toHaveBeenCalledTimes(0);

    // Test missing type
    status.handlePostMessage({
      data: {message: "test"},
      origin: "http://localhost",
    });
    expect(toast.error).toHaveBeenCalledTimes(0);
    expect(toast.dismiss).toHaveBeenCalledTimes(0);
    expect(props.logout).toHaveBeenCalledTimes(0);
    expect(setLoadingMock).toHaveBeenCalledTimes(0);

    // Test event.origin is illegal
    status.handlePostMessage({
      data: {message: "RADIUS Error", type: "authError"},
      origin: "https://example.com",
    });
    expect(toast.error).toHaveBeenCalledTimes(0);
    expect(toast.dismiss).toHaveBeenCalledTimes(0);
    expect(props.logout).toHaveBeenCalledTimes(0);
    expect(setLoadingMock).toHaveBeenCalledTimes(0);

    // Test valid authError message
    wrapper.instance().componentDidMount();
    status.handlePostMessage({
      data: {message: "RADIUS Error", type: "authError"},
      origin: "http://localhost",
    });
    expect(toast.dismiss).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(props.logout).toHaveBeenCalledTimes(1);
    expect(setLoadingMock).toHaveBeenCalledTimes(2);
    expect(setLoadingMock).toHaveBeenLastCalledWith(false);

    toast.dismiss.mockReset();
    props.logout.mockReset();
    setLoadingMock.mockReset();
    expect(props.logout).toHaveBeenCalledTimes(0);

    // Test valid authMessage message
    status.handlePostMessage({
      data: {message: "RADIUS Info", type: "authMessage"},
      origin: "http://localhost",
    });
    expect(toast.dismiss).toHaveBeenCalledTimes(1);
    expect(toast.info).toHaveBeenCalledTimes(1);
    expect(props.setPlanExhausted).toHaveBeenCalledTimes(1);
    expect(props.logout).toHaveBeenCalledTimes(0);
    expect(setLoadingMock).toHaveBeenCalledTimes(1);
    expect(setLoadingMock).toHaveBeenLastCalledWith(false);
  });

  it("test handlePostMessage internet-mode", async () => {
    props = createTestProps();
    const setLoadingMock = jest.fn();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: setLoadingMock},
      disableLifecycleMethods: true,
    });
    const status = wrapper.instance();
    status.handlePostMessage({
      data: {type: "internet-mode"},
      origin: "http://localhost",
    });
    expect(props.setInternetMode).toHaveBeenCalledTimes(1);
  });

  it("should not perform captive portal login (submit loginFormRef), if user is already authenticated", async () => {
    validateToken.mockReturnValue(true);
    props = createTestProps();
    props.location.search = "";
    props.userData = responseData;
    jest.spyOn(Status.prototype, "getUserActiveRadiusSessions");
    jest.spyOn(Status.prototype, "getUserPassedRadiusSessions");
    const setLoading = jest.fn();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading},
    });
    const spyFn = jest.fn();
    wrapper.instance().loginFormRef.current = {submit: spyFn};
    await tick();
    expect(spyFn.mock.calls.length).toBe(0);
    expect(setLoading.mock.calls.length).toBe(2);
    // ensure sessions are loaded too
    expect(Status.prototype.getUserActiveRadiusSessions.mock.calls.length).toBe(
      1,
    );
    expect(Status.prototype.getUserPassedRadiusSessions.mock.calls.length).toBe(
      1,
    );
  });

  it("should perform captive portal login (submit loginFormRef), if user is just authenticated", async () => {
    validateToken.mockReturnValue(true);
    props = createTestProps();
    props.location.search = "";
    props.userData = {...responseData, mustLogin: true};
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
    });
    const spyFn = jest.fn();
    const status = wrapper.instance();
    status.loginFormRef.current = {submit: spyFn};
    status.loginIframeRef.current = {submit: jest.fn()};
    const setUserDataMock = status.props.setUserData.mock;
    await tick();

    // userData not set yet
    expect(setUserDataMock.calls.pop()).toEqual(undefined);

    status.handleLoginIframe();
    expect(spyFn.mock.calls.length).toBe(1);
    expect(setUserDataMock.calls.pop()).toEqual([
      {...props.userData, mustLogin: false},
    ]);
  });

  it("should not perform captive portal login (sync auth), if user is already authenticated", async () => {
    validateToken.mockReturnValue(true);
    props = createTestProps({
      captivePortalSyncAuth: true,
      location: {
        search: "",
      },
      userData: responseData,
    });
    jest.spyOn(Status.prototype, "getUserActiveRadiusSessions");
    jest.spyOn(Status.prototype, "getUserPassedRadiusSessions");
    const setLoading = jest.fn();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading},
    });
    wrapper.setProps({
      cookies: new Cookies(),
    });
    const spyFn = jest.fn();
    const status = wrapper.instance();
    status.props.cookies.set("default_mustLogin", false, {
      path: "/",
      maxAge: 60,
    });
    status.loginFormRef.current = {submit: spyFn};
    await tick();

    expect(spyFn.mock.calls.length).toBe(0);
    expect(setLoading.mock.calls.length).toBe(2);
    // ensure sessions are loaded too
    expect(Status.prototype.getUserActiveRadiusSessions.mock.calls.length).toBe(
      1,
    );
    expect(Status.prototype.getUserPassedRadiusSessions.mock.calls.length).toBe(
      1,
    );
  });

  it("should perform captive portal login (sync auth), if user is just authenticated", async () => {
    validateToken.mockReturnValue(true);
    props = createTestProps();
    props.captivePortalSyncAuth = true;
    props.location.search = "";
    props.userData = {...responseData, mustLogin: true};
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
    });
    const loginFormSubmit = jest.fn();
    const status = wrapper.instance();
    status.loginFormRef.current = {submit: loginFormSubmit};
    status.loginIframeRef.current = {submit: jest.fn()};
    const setUserDataMock = status.props.setUserData.mock;
    const handleLoginMock = jest.spyOn(status, "handleLogin");
    await tick();
    expect(handleLoginMock).toHaveBeenCalledTimes(0);
    expect(loginFormSubmit.mock.calls.length).toBe(1);

    // userData not set yet
    expect(setUserDataMock.calls.pop()).toEqual(undefined);
    expect(loginFormSubmit.mock.calls.length).toBe(1);
    expect(status.props.cookies.get("default_mustLogin")).toBe(false);
    expect(localStorage.getItem("default_mustLogin")).toBe("false");

    // Reloading page will call handleLogin
    status.componentDidMount();
    await tick();
    expect(handleLoginMock).toHaveBeenCalledTimes(1);
    expect(setUserDataMock.calls.pop()).toEqual(undefined);

    // localStorage is cleared after redirect loop is prevented
    expect(localStorage.getItem("default_mustLogin")).toBe(null);
  });

  it("should fallback to localStorage if cookies are not available (sync auth)", async () => {
    validateToken.mockReturnValue(true);
    props = createTestProps({
      captivePortalSyncAuth: true,
      location: {
        search: "",
      },
      userData: {...responseData, mustLogin: true},
      cookies: new Cookies({
        get: jest.fn(),
        remove: jest.fn(),
        set: jest.fn(),
      }),
    });
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
    });
    const loginFormSubmit = jest.fn();
    const status = wrapper.instance();
    status.loginFormRef.current = {submit: loginFormSubmit};
    status.loginIframeRef.current = {submit: jest.fn()};
    const setUserDataMock = status.props.setUserData.mock;
    const handleLoginMock = jest.spyOn(status, "handleLogin");
    await tick();
    expect(handleLoginMock).toHaveBeenCalledTimes(0);
    expect(loginFormSubmit.mock.calls.length).toBe(1);

    // userData not set yet
    expect(setUserDataMock.calls.pop()).toEqual(undefined);
    expect(loginFormSubmit.mock.calls.length).toBe(1);
    expect(localStorage.getItem("default_mustLogin")).toBe("false");

    // Reloading page will call handleLogin
    status.componentDidMount();
    await tick();
    expect(handleLoginMock).toHaveBeenCalledTimes(1);
    expect(setUserDataMock.calls.pop()).toEqual(undefined);

    // localStorage is cleared after redirect loop is prevented
    expect(localStorage.getItem("default_mustLogin")).toBe(null);
  });

  it("should perform captive portal logout (sync auth)", async () => {
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
            },
          ],
          headers: {},
        }),
      );
    props = createTestProps({
      captivePortalSyncAuth: true,
    });
    const logoutFormRef = jest.fn();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
    });
    const status = wrapper.instance();
    status.logoutFormRef.current = {submit: logoutFormRef};
    status.logoutIframeRef.current = {submit: jest.fn()};
    jest.spyOn(status, "handleLogout");
    jest.spyOn(status, "handleLogoutIframe");
    wrapper.find(".logout input.button").simulate("click", {});
    expect(status.handleLogout).toHaveBeenCalledTimes(1);
    await tick();
    expect(logoutFormRef.mock.calls.length).toBe(1);
    // mustLogin is set to true in cookie and localStorage to prevent redirect loop
    expect(status.props.cookies.get("default_mustLogout")).toBe(true);
    expect(localStorage.getItem("default_mustLogout")).toBe("true");
    expect(status.props.logout).not.toHaveBeenCalled();
    // Reloading page will clear localStorage
    // (simulate redirecting back from the captive portal)
    status.componentDidMount();
    await tick();
    expect(status.props.logout).toHaveBeenCalled();
    expect(status.props.setUserData).toHaveBeenCalledWith(
      initialState.userData,
    );
    expect(localStorage.getItem("default_mustLogout")).toBe(null);
  });

  it("test active session table", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: [
          {
            session_id: 1,
            start_time: "2020-09-08T00:22:28-04:00",
            stop_time: "2020-09-08T00:22:29-04:00",
          },
        ],
        headers: {},
      }),
    );
    props = createTestProps({userData: responseData});
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
    });
    await tick();
    expect(wrapper.contains(<th>Start time</th>)).toBe(true);
    expect(wrapper.contains(<th>Stop time</th>)).toBe(true);
    expect(wrapper.contains(<th>Duration</th>)).toBe(true);
    expect(wrapper.contains(<th>Device address</th>)).toBe(true);
  });

  it("test passed session table", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: [
          {
            session_id: 1,
            start_time: "2020-09-08T00:22:28-04:00",
            stop_time: "2020-09-08T00:22:29-04:00",
          },
        ],
        headers: {},
      }),
    );
    props = createTestProps({userData: responseData});
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
    });
    await tick();
    expect(wrapper.contains(<th>Start time</th>)).toBe(true);
    expect(wrapper.contains(<th>Stop time</th>)).toBe(true);
    expect(wrapper.contains(<th>Duration</th>)).toBe(true);
    expect(wrapper.contains(<th>Device address</th>)).toBe(true);
  });

  it("test empty session table", async () => {
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
          data: [],
          headers: {},
        }),
      );
    props = createTestProps();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    wrapper.instance().getUserPassedRadiusSessions();
    await tick();
    expect(wrapper.contains(<th>Start time</th>)).toBe(false);
    expect(wrapper.contains(<th>Stop time</th>)).toBe(false);
    expect(wrapper.contains(<th>Duration</th>)).toBe(false);
    expect(wrapper.contains(<th>Device address</th>)).toBe(false);
  });

  it("test interval cleared on componentUnmount", async () => {
    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: responseData,
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
            },
          ],
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
            },
          ],
          headers: {},
        }),
      );
    props = createTestProps();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    jest.spyOn(window, "clearInterval");
    wrapper.instance().componentDidMount();
    const {intervalId} = wrapper.instance();
    wrapper.instance().componentWillUnmount();
    expect(clearInterval).toHaveBeenCalledWith(intervalId);
  });

  it("test loading spinner", async () => {
    const prop = createTestProps();
    prop.statusPage.links = links;
    prop.isAuthenticated = true;
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    // spinner should not load if no sessions are available
    wrapper.instance().updateSpinner();
    expect(wrapper.find(".loading").length).toEqual(0);
  });

  it("should logout if user is not active", async () => {
    validateToken.mockReturnValue(true);
    const data = {...responseData, is_active: false};
    props = createTestProps(data);
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
    });
    wrapper.setProps({userData: data});
    const handleLogout = jest.spyOn(wrapper.instance(), "handleLogout");
    const setUserDataMock = wrapper.instance().props.setUserData.mock;
    await tick();
    expect(setUserDataMock.calls.length).toBe(1);
    expect(handleLogout).toHaveBeenCalledWith(false);
  });

  it("should toggle logout modal", () => {
    const prop = createTestProps();
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    const toggleModal = jest.spyOn(wrapper.instance(), "toggleModal");
    wrapper.setState({rememberMe: true});
    expect(wrapper.instance().state.modalActive).toEqual(false);
    wrapper.find(".logout input.button").simulate("click", {});
    expect(wrapper.instance().state.modalActive).toEqual(true);
    expect(toggleModal).toHaveBeenCalled();
  });

  it("should perform logout for auto-login next time with userAutoLogin true", () => {
    const prop = createTestProps();
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    wrapper.setState({rememberMe: true});
    const handleLogout = jest.spyOn(wrapper.instance(), "handleLogout");
    wrapper.find(".logout input.button").simulate("click", {});
    const modalWrapper = wrapper.find(Modal).first().shallow();
    modalWrapper
      .find(".modal-buttons button:first-child")
      .simulate("click", {});
    expect(handleLogout).toHaveBeenCalledWith(true);
  });

  it("should perform logout for not auto-login with userAutoLogin false", () => {
    const prop = createTestProps();
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    wrapper.setState({rememberMe: true});
    const handleLogout = jest.spyOn(wrapper.instance(), "handleLogout");
    wrapper.find(".logout input.button").simulate("click", {});
    const modalWrapper = wrapper.find(Modal).first().shallow();
    modalWrapper.find(".modal-buttons button:last-child").simulate("click", {});
    expect(handleLogout).toHaveBeenCalledWith(false);
  });

  it("should set hasMoreSessions to false if link is not in response headers", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: [
          {
            session_id: 1,
            start_time: "2020-09-08T00:22:28-04:00",
            stop_time: "2020-09-08T00:22:29-04:00",
          },
        ],
        headers: {},
      }),
    );
    const prop = createTestProps();
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    wrapper.instance().getUserPassedRadiusSessions();
    await tick();
    expect(wrapper.instance().state.hasMoreSessions).toEqual(false);
  });

  it("should not perform captive portal login if user password has expired", async () => {
    validateToken.mockReturnValue(true);
    // mock session fetching
    jest.spyOn(Status.prototype, "getUserActiveRadiusSessions");
    jest.spyOn(Status.prototype, "getUserPassedRadiusSessions");

    props = createTestProps();
    props.userData = {
      ...responseData,
      is_verified: false,
      password_expired: true,
      mustLogin: true,
    };
    const setLoading = jest.fn();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading},
    });

    // mock loginFormRef
    const spyFn = jest.fn();
    wrapper.instance().loginFormRef.current = {submit: spyFn};
    await tick();

    // ensure captive portal login is not performed
    expect(spyFn.mock.calls.length).toBe(0);
    expect(setLoading.mock.calls.length).toBe(1);

    const mockRef = {submit: jest.fn()};
    wrapper.instance().loginIframeRef.current = {};
    wrapper.instance().loginFormRef.current = mockRef;

    // ensure user is redirected to payment URL
    expect(props.navigate).toHaveBeenCalledWith(
      `/${props.orgSlug}/change-password`,
    );
    // ensure sessions are not fetched
    expect(Status.prototype.getUserActiveRadiusSessions).not.toHaveBeenCalled();
    expect(Status.prototype.getUserPassedRadiusSessions).not.toHaveBeenCalled();
    // ensure loading overlay not removed
    expect(setLoading.mock.calls.length).toBe(1);
  });

  it("should initiate bank_card verification", async () => {
    validateToken.mockReturnValue(true);
    // mock session fetching
    jest.spyOn(Status.prototype, "getUserActiveRadiusSessions");
    jest.spyOn(Status.prototype, "getUserPassedRadiusSessions");

    props = createTestProps();
    props.userData = {
      ...responseData,
      is_verified: false,
      method: "bank_card",
      payment_url: "https://account.openwisp.io/payment/123",
      mustLogin: true,
    };
    props.location.search = "";
    props.settings.mobile_phone_verification = true;
    props.settings.subscriptions = true;
    const setLoading = jest.fn();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading},
    });

    // mock loginFormRef
    const spyFn = jest.fn();
    const status = wrapper.instance();
    status.loginFormRef.current = {submit: spyFn};
    status.loginIframeRef.current = {submit: jest.fn()};
    const setUserDataMock = status.props.setUserData.mock;
    await tick();

    // userData not set yet
    expect(setUserDataMock.calls.pop()).toEqual(undefined);

    status.handleLoginIframe();

    // ensure captive portal login is performed
    expect(spyFn.mock.calls.length).toBe(1);
    // ensure setUserData is called as expected
    expect(setUserDataMock.calls.pop()).toEqual([
      {...props.userData, mustLogin: false},
    ]);
    expect(setLoading.mock.calls.length).toBe(1);

    // ensure user is redirected to payment URL
    expect(props.navigate).toHaveBeenCalledWith(
      `/${props.orgSlug}/payment/draft`,
    );
    // ensure sessions are not fetched
    expect(Status.prototype.getUserActiveRadiusSessions).not.toHaveBeenCalled();
    expect(Status.prototype.getUserPassedRadiusSessions).not.toHaveBeenCalled();
    // ensure loading overlay not removed
    expect(setLoading.mock.calls.length).toBe(1);
  });

  it("should not perform captive page login if payment_requires_internet is false", async () => {
    validateToken.mockReturnValue(true);
    // mock session fetching
    jest.spyOn(Status.prototype, "getUserActiveRadiusSessions");
    jest.spyOn(Status.prototype, "getUserPassedRadiusSessions");

    props = createTestProps();
    props.userData = {
      ...responseData,
      is_verified: false,
      method: "bank_card",
      payment_url: "https://account.openwisp.io/payment/123",
      mustLogin: true,
    };
    props.location.search = "";
    props.settings.mobile_phone_verification = true;
    props.settings.subscriptions = true;
    props.settings.payment_requires_internet = false;
    const setLoading = jest.fn();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading},
    });

    // mock loginFormRef
    const spyFn = jest.fn();
    wrapper.instance().loginFormRef.current = {submit: spyFn};
    await tick();

    // ensure captive portal login is not performed
    expect(spyFn.mock.calls.length).toBe(0);
    expect(setLoading.mock.calls.length).toBe(1);

    const mockRef = {submit: jest.fn()};
    wrapper.instance().loginIframeRef.current = {};
    wrapper.instance().loginFormRef.current = mockRef;
    wrapper.instance().handleLoginIframe();

    // ensure user is redirected to payment URL
    expect(props.navigate).toHaveBeenCalledWith(
      `/${props.orgSlug}/payment/draft`,
    );
    // ensure sessions are not fetched
    expect(Status.prototype.getUserActiveRadiusSessions).not.toHaveBeenCalled();
    expect(Status.prototype.getUserPassedRadiusSessions).not.toHaveBeenCalled();
    // ensure loading overlay not removed
    expect(setLoading.mock.calls.length).toBe(1);
  });

  it("should redirect to /payment/process if proceedToPayment is true", async () => {
    validateToken.mockReturnValue(true);
    props = createTestProps();
    props.userData = {
      ...responseData,
      is_verified: false,
      method: "bank_card",
      payment_url: "https://account.openwisp.io/payment/123",
      mustLogin: true,
      proceedToPayment: true,
    };
    props.settings.subscriptions = true;
    props.settings.payment_requires_internet = true;
    const setLoading = jest.fn();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading},
    });

    const mockRef = {submit: jest.fn()};
    wrapper.instance().loginIframeRef.current = {};
    wrapper.instance().loginFormRef.current = mockRef;
    wrapper.instance().handleLoginIframe();

    // ensure user is redirected to payment URL
    expect(props.navigate).toHaveBeenCalledWith(
      `/${props.orgSlug}/payment/process`,
    );
    // ensure proceedToPayment is set to false
    expect(wrapper.instance().props.setUserData).toHaveBeenCalledWith({
      ...props.userData,
      proceedToPayment: false,
    });
  });

  it("should logout if mustLogout is true", async () => {
    validateToken.mockReturnValue(true);
    jest.spyOn(Status.prototype, "getUserActiveRadiusSessions");
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: [
          {
            session_id: 1,
            start_time: "2020-09-08T00:22:28-04:00",
            stop_time: "2020-09-08T00:22:29-04:00",
          },
        ],
        headers: {},
      }),
    );
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({userData: {...responseData, mustLogout: true}});
    const setLoading = jest.fn();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading},
      disableLifecycleMethods: true,
    });
    const status = wrapper.instance();
    const handleLogout = jest.spyOn(status, "handleLogout");
    const mockRef = {submit: jest.fn()};
    const {setUserData} = status.props;
    status.logoutFormRef = {current: mockRef};
    status.logoutIframeRef = {current: {}};
    status.componentDidMount();
    await tick();
    status.handleLogoutIframe();
    expect(status.state.loggedOut).toBe(true);
    expect(mockRef.submit.mock.calls.length).toBe(1);
    expect(status.repeatLogin).toBe(false);
    expect(handleLogout).toHaveBeenCalledWith(false, undefined);
    expect(status.props.logout).toHaveBeenCalled();
    expect(spyToast.mock.calls.length).toBe(1);
    expect(setLoading.mock.calls).toEqual([[true], [true], [false]]);
    expect(setUserData).toHaveBeenCalledWith(initialState.userData);
    expect(Status.prototype.getUserActiveRadiusSessions.mock.calls.length).toBe(
      1,
    );
  });

  it("should repeat login if mustLogout and repeatLogin are true", async () => {
    validateToken.mockReturnValue(true);
    jest.spyOn(Status.prototype, "getUserActiveRadiusSessions");
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: [
          {
            session_id: 1,
            start_time: "2020-09-08T00:22:28-04:00",
            stop_time: "2020-09-08T00:22:29-04:00",
          },
        ],
        headers: {},
      }),
    );
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, mustLogout: true, repeatLogin: true},
    });
    const setLoading = jest.fn();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading},
      disableLifecycleMethods: true,
    });
    const status = wrapper.instance();
    const handleLogout = jest.spyOn(status, "handleLogout");
    const mockRef = {submit: jest.fn()};
    const {setUserData} = status.props;
    status.logoutFormRef = {current: mockRef};
    status.logoutIframeRef = {current: {}};
    status.componentDidMount();
    jest.useFakeTimers({legacyFakeTimers: true});
    const componentDidMount = jest.spyOn(status, "componentDidMount");
    await tick();
    expect(status.repeatLogin).toBe(true);
    await status.handleLogoutIframe();
    jest.runAllTimers();
    expect(status.state.loggedOut).toBe(false);
    expect(status.repeatLogin).toBe(false);
    expect(mockRef.submit.mock.calls.length).toBe(1);
    expect(handleLogout).toHaveBeenCalledWith(false, true);
    expect(status.props.logout).toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [true], [false]]);
    expect(Status.prototype.getUserActiveRadiusSessions.mock.calls.length).toBe(
      1,
    );
    expect(componentDidMount.mock.calls.length).toBe(0);
    expect(setUserData.mock.calls.length).toBe(1);
    expect(setUserData).toHaveBeenCalledWith(initialState.userData);
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should set title", () => {
    props = createTestProps();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: false,
    });
    const setTitleMock = wrapper.instance().props.setTitle.mock;
    expect(setTitleMock.calls.pop()).toEqual(["Status", props.orgName]);
  });

  it("should perform call saml_logout_url if logged in via SAML", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: [
          {
            session_id: 1,
            start_time: "2020-09-08T00:22:28-04:00",
            stop_time: "2020-09-08T00:22:29-04:00",
          },
        ],
        headers: {},
      }),
    );

    props = createTestProps();
    props.statusPage.saml_logout_url = "http://test.com/saml/logout";
    props.radius_user_token = undefined;
    localStorage.setItem("default_logout_method", "saml");
    validateToken.mockReturnValue(true);
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    wrapper.instance().handleSamlLogout = jest.fn();
    const status = wrapper.instance();
    const handleLogout = jest.spyOn(status, "handleLogout");
    const mockRef = {submit: jest.fn()};
    jest.useFakeTimers({legacyFakeTimers: true});
    status.logoutFormRef = {current: mockRef};
    status.logoutIframeRef = {current: {}};
    status.componentDidMount();

    wrapper.find(".logout input.button").simulate("click", {});
    const modalWrapper = wrapper.find(Modal).first().shallow();
    modalWrapper.find(".modal-buttons button:last-child").simulate("click", {});
    expect(handleLogout).toHaveBeenCalledWith(false);
    expect(wrapper.instance().handleSamlLogout.mock.calls.length).toBe(0);
    await tick();
    status.handleLogoutIframe();
    jest.runAllTimers();
    expect(wrapper.instance().handleSamlLogout.mock.calls.length).toBe(1);
    expect(wrapper.instance().handleSamlLogout).toHaveBeenCalledWith(
      props.statusPage.saml_logout_url,
    );
    expect(localStorage.getItem("default_logout_method")).toBe(null);
  });
  it("should render small table row and it should contain logout if logout_by_session is enabled", () => {
    const prop = createTestProps();
    prop.captivePortalLogoutForm.logout_by_session = true;
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: false,
    });
    const handleSessionLogout = jest.spyOn(
      wrapper.instance(),
      "handleSessionLogout",
    );
    const TableRowWrapper = shallow(
      wrapper.instance().getSmallTableRow(
        {
          session_id: 1,
          start_time: new Date(),
          stop_time: null, // needed for logout button
        },
        wrapper.instance().getSessionInfo(),
      ),
    );
    expect(TableRowWrapper.contains(<th>Start time:</th>)).toBe(true);
    expect(TableRowWrapper.contains(<th>Stop time:</th>)).toBe(true);
    expect(TableRowWrapper.contains(<td>session is active</td>)).toBe(true);
    expect(TableRowWrapper.contains(<th>Duration:</th>)).toBe(true);
    expect(TableRowWrapper.contains(<th>Download:</th>)).toBe(true);
    expect(TableRowWrapper.contains(<th>Upload:</th>)).toBe(true);
    expect(TableRowWrapper.contains(<th>Device address:</th>)).toBe(true);
    TableRowWrapper.find(".button").simulate("click");
    expect(handleSessionLogout.mock.calls.length).toBe(1);
  });

  it("should execute getSmallTable correctly", () => {
    const prop = createTestProps();
    const activeSession = {
      session_id: 1,
      start_time: "2021-07-08T00:22:28-04:00",
      stop_time: null,
    };
    const pastSession = {
      session_id: 2,
      start_time: "2021-07-08T00:22:28-04:00",
      stop_time: "2021-07-08T00:22:29-04:00",
    };
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: false,
    });
    wrapper.setState({
      activeSessions: [activeSession],
      pastSessions: [pastSession],
    });
    const getSmallTableRow = jest.spyOn(wrapper.instance(), "getSmallTableRow");
    const getSmallTableWrapper = shallow(
      wrapper.instance().getSmallTable(wrapper.instance().getSessionInfo()),
    );
    expect(getSmallTableRow.mock.calls.length).toBe(2);
    expect(getSmallTableRow.mock.calls.pop()).toEqual([
      pastSession,
      wrapper.instance().getSessionInfo(),
    ]);
    expect(getSmallTableRow.mock.calls.pop()).toEqual([
      activeSession,
      wrapper.instance().getSessionInfo(),
    ]);
    expect(
      getSmallTableWrapper.contains(
        <tr className="active-session" key="1stop_time">
          <th>Stop time:</th>
          <td>session is active</td>
        </tr>,
      ),
    ).toBe(true);
  });
  it("should call finalOperations once after loading userData", async () => {
    validateToken.mockReturnValue(true);
    const prop = createTestProps();
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    wrapper.instance().componentDidMount();
    await tick();
    const spyFn = jest.fn();
    wrapper.instance().loginIframeRef.current = {submit: spyFn};
    const finalOperationsMock = jest.fn();
    wrapper.instance().finalOperations = finalOperationsMock;
    expect(wrapper.find("iframe").length).toBe(1);
    wrapper.find("iframe").first().simulate("load");
    wrapper.setProps({userData: responseData});
    wrapper.instance().componentDidMount();
    await tick();
    expect(wrapper.find("iframe").length).toBe(2);
    wrapper.find("iframe").first().simulate("load");
    expect(finalOperationsMock.mock.calls.length).toEqual(1);
  });
  it("should not get account sessions if user needs verification", async () => {
    validateToken.mockReturnValue(true);
    const prop = createTestProps();
    prop.userData.is_verified = false;
    prop.userData.method = "mobile_phone";
    prop.settings = {mobile_phone_verification: true};
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    const getSessionInfo = jest.spyOn(wrapper.instance(), "getSessionInfo");
    const result = await wrapper.instance().finalOperations();
    expect(result).toEqual();
    expect(getSessionInfo).not.toHaveBeenCalled();
  });
  it("should call logout if getUserRadiusSessions is rejected (unauthorized or forbidden)", async () => {
    axios.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          status: 401,
          data: {
            error: "Unauthorized",
          },
        },
      }),
    );
    axios.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          status: 403,
          data: {
            error: "Forbidden",
          },
        },
      }),
    );
    validateToken.mockReturnValue(true);
    const prop = createTestProps();
    jest.spyOn(toast, "error");
    jest.spyOn(toast, "dismiss");
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    await wrapper.instance().getUserRadiusSessions();
    expect(prop.logout).toHaveBeenCalledWith(expect.any(Cookies), "default");
    expect(toast.error).toHaveBeenCalledWith("Error occurred!", {
      onOpen: expect.any(Function),
    });
    toast.error.mock.calls.pop()[1].onOpen();
    expect(toast.dismiss).toHaveBeenCalledWith("main_toast_id");
    await wrapper.instance().getUserRadiusSessions();
    expect(prop.logout).toHaveBeenCalledWith(expect.any(Object), "default");
    expect(toast.error).toHaveBeenCalledWith("Error occurred!", {
      onOpen: expect.any(Function),
    });
    toast.error.mock.calls.pop()[1].onOpen();
    expect(toast.dismiss).toHaveBeenCalledWith("main_toast_id");
  });
  it("should return if repeatLogin is true in handleLogout", async () => {
    validateToken.mockReturnValue(true);
    const prop = createTestProps();
    jest.spyOn(toast, "success");
    // Clear localStorage before test
    localStorage.clear();
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    const result = await wrapper.instance().handleLogout(true, true);
    expect(localStorage).toEqual({userAutoLogin: "true"});
    expect(prop.setUserData).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(result).toBe();
  });
  it("test handleLogout internetMode", async () => {
    validateToken.mockReturnValue(true);
    const session = {start_time: "2021-07-08T00:22:28-04:00", stop_time: null};
    const mockRef = {submit: jest.fn()};
    // Test user logged in from internet(internetMode)
    const prop = createTestProps({internetMode: true});
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    wrapper.instance().logoutFormRef = {current: mockRef};
    wrapper
      .instance()
      .setState({sessionsToLogout: [session], activeSession: [session]});

    wrapper.instance().handleLogout(true, true);
    await tick();
    expect(mockRef.submit).toHaveBeenCalledTimes(0);

    // Test user logged in from WiFi
    prop.internetMode = false;
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    wrapper.instance().logoutFormRef = {current: mockRef};
    wrapper
      .instance()
      .setState({sessionsToLogout: [session], activeSession: [session]});
    wrapper.instance().handleLogout(true, true);
    await tick();
    expect(mockRef.submit).toHaveBeenCalledTimes(1);
  });
  it("should not display STATUS_CONTENT when logged in internetMode", () => {
    const prop = createTestProps();
    prop.isAuthenticated = true;
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    wrapper.instance().setState({internetMode: true});
    expect(wrapper.find("status-content").length).toEqual(0);
  });
  it("should not display status-content when planExhausted is true", () => {
    const prop = createTestProps();
    prop.isAuthenticated = true;
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    wrapper.instance().setState({planExhausted: true});
    expect(wrapper.find("status-content").length).toEqual(0);
  });
  it("should return if loginIframe is not loaded", async () => {
    validateToken.mockReturnValue(true);
    const prop = createTestProps();
    jest.spyOn(toast, "success");
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    const finalOperationsMock = jest.fn();
    wrapper.instance().finalOperations = finalOperationsMock;
    expect(wrapper.instance().handleLoginIframe()).toEqual();
    expect(finalOperationsMock).not.toHaveBeenCalled();
  });
  it("should update screen width", () => {
    validateToken.mockReturnValue(true);
    const prop = createTestProps();
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    window.innerWidth = 1920;
    wrapper.instance().updateScreenWidth();
    expect(wrapper.instance().state.screenWidth).toEqual(1920);
  });
  it("should execute fetchMoreSessions correctly", async () => {
    validateToken.mockReturnValue(true);
    const prop = createTestProps();
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    const getUserPassedRadiusSessions = jest.spyOn(
      wrapper.instance(),
      "getUserPassedRadiusSessions",
    );
    await wrapper.instance().fetchMoreSessions();
    expect(getUserPassedRadiusSessions).toHaveBeenCalledWith({page: 2});
    wrapper.instance().setState({currentPage: 10});
    await wrapper.instance().fetchMoreSessions();
    expect(getUserPassedRadiusSessions).toHaveBeenCalledWith({page: 11});
  });
  it("should submit logoutForm in iframe on calling handleSessionLogout", async () => {
    validateToken.mockReturnValue(true);
    const prop = createTestProps();
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    const mockRef = {submit: jest.fn()};
    wrapper.instance().logoutFormRef = {current: mockRef};
    wrapper
      .instance()
      .handleSessionLogout({start_time: "2021-07-08T00:22:28-04:00"});
    expect(wrapper.instance().state.sessionsToLogout).toEqual([
      {start_time: "2021-07-08T00:22:28-04:00"},
    ]);
    expect(wrapper.instance().state.pastSessions).toEqual([]);
    expect(wrapper.instance().state.activeSessions).toEqual([]);
    expect(wrapper.instance().state.currentPage).toEqual(0);
    expect(wrapper.instance().state.hasMoreSessions).toEqual(true);
    expect(mockRef.submit).toHaveBeenCalledWith();
  });
  it("should call handleSessionLogout if clicked on session row of large table", async () => {
    validateToken.mockReturnValue(true);
    const prop = createTestProps();
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    const handleSessionLogout = jest.spyOn(
      wrapper.instance(),
      "handleSessionLogout",
    );
    const session = {start_time: "2021-07-08T00:22:28-04:00", stop_time: null};
    const row = wrapper.instance().getLargeTableRow(session, {}, true);
    const inputBtn =
      row.props.children[row.props.children.length - 1].props.children[1];
    expect(inputBtn.props).toEqual({
      type: "button",
      className: "button small session-logout",
      value: "Logout",
      onClick: expect.any(Function),
    });
    inputBtn.props.onClick();
    expect(handleSessionLogout).toHaveBeenCalledWith(session);
  });
  it("should call getSmallTable if screenWidth is less than or equal to 656", () => {
    validateToken.mockReturnValue(true);
    const prop = createTestProps();
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    const session = wrapper.instance().getSessionInfo();
    const getLargeTable = jest.spyOn(wrapper.instance(), "getLargeTable");
    const getSmallTable = jest.spyOn(wrapper.instance(), "getSmallTable");
    wrapper.instance().setState({screenWidth: 656});
    wrapper.instance().getTable(session);
    expect(getSmallTable).toHaveBeenCalledWith(session);
    wrapper.instance().setState({screenWidth: 450});
    wrapper.instance().getTable(session);
    expect(getSmallTable).toHaveBeenCalledWith(session);
    wrapper.instance().setState({screenWidth: 720});
    wrapper.instance().getTable(session);
    expect(getLargeTable).toHaveBeenCalledWith(session);
  });
  it("should render additional fields in captivePortalLogoutForm", async () => {
    validateToken.mockReturnValue(true);
    const prop = createTestProps();
    console.error = jest.fn();
    prop.captivePortalLogoutForm.additional_fields = [
      {name: "mac_address", value: "4e:ed:11:2b:17:ae"},
    ];
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    const additionalField = wrapper.find("input[name='mac_address']");
    expect(additionalField.length).toEqual(1);
    expect(additionalField.props()).toEqual({
      name: "mac_address",
      readOnly: true,
      type: "text",
      value: "4e:ed:11:2b:17:ae",
    });
  });
  it("should clear userData on logout", async () => {
    validateToken.mockReturnValue(true);
    const session = {start_time: "2021-07-08T00:22:28-04:00", stop_time: null};
    const prop = createTestProps();
    prop.userData.username = "sankalp";
    const mockRef = {submit: jest.fn()};
    wrapper = await shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    wrapper.instance().logoutFormRef = {current: mockRef};
    wrapper.instance().logoutIframeRef = {current: {}};
    wrapper.instance().setState({
      sessionsToLogout: [session],
      activeSession: [session],
      loggedOut: true,
    });
    await wrapper.instance().handleLogout(false);
    expect(wrapper.instance().state.loggedOut).toEqual(true);
    expect(mockRef.submit).toHaveBeenCalled(); // calls handleLogoutIframe
    await tick();
    wrapper.instance().handleLogoutIframe();
    expect(prop.setUserData).toHaveBeenCalledWith(initialState.userData);
  });
  it("should not logout user if network error happens while fetching radius sessions", async () => {
    const response = {
      response: {
        status: 408,
        data: {
          error: "Timeout",
        },
      },
    };
    axios.mockImplementationOnce(() => Promise.reject(response));
    validateToken.mockReturnValue(true);
    const prop = createTestProps();
    jest.spyOn(toast, "error");
    jest.spyOn(toast, "dismiss");
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    await wrapper.instance().getUserRadiusSessions();
    expect(prop.logout).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith(response, "Error occurred!");
  });
  it("should not concat same past session again", async () => {
    const data = [
      {
        session_id: 1,
        start_time: "2020-09-08T00:22:28-04:00",
        stop_time: "2020-09-08T00:22:29-04:00",
      },
    ];
    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          statusText: "OK",
          data,
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          statusText: "OK",
          data,
          headers: {},
        }),
      );
    const prop = createTestProps();
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    await wrapper.instance().getUserPassedRadiusSessions();
    expect(wrapper.instance().state.pastSessions).toEqual(data);
    await wrapper.instance().getUserPassedRadiusSessions();
    expect(wrapper.instance().state.pastSessions).toEqual(data);
  });
  it("should set loading to false if user is not validated", async () => {
    validateToken.mockReturnValue(false);
    const setLoading = jest.fn();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading},
      disableLifecycleMethods: true,
    });
    await wrapper.instance().componentDidMount();
    await tick();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });
  it("test getUserRadiusUsage method", async () => {
    jest.spyOn(toast, "error");
    jest.spyOn(toast, "dismiss");
    jest.spyOn(global, "setTimeout");
    props = createTestProps();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    jest.spyOn(wrapper.instance(), "getUserRadiusUsage");

    // Retry when server responds with 500 error
    axios.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          status: 500,
          headers: {},
        },
      }),
    );
    wrapper.instance().getUserRadiusUsage();
    await tick();
    expect(wrapper.instance().state.radiusUsageSpinner).toBe(true);
    // Ensure that the radius usage logic is retried again after
    // 10 seconds if there was a server error
    expect(setTimeout).toHaveBeenCalledWith(
      wrapper.instance().getUserRadiusUsage,
      10000,
    );

    // Only check is present in the response
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: {
          checks: [
            {
              attribute: "Max-Daily-Session",
              op: ":=",
              value: "10800",
              result: 0,
              type: "seconds",
            },
          ],
        },
        headers: {},
      }),
    );
    wrapper.instance().getUserRadiusUsage();
    await tick();
    expect(wrapper.instance().state.userChecks.length).toBe(1);
    expect(wrapper.instance().state.showRadiusUsage).toBe(true);

    // A free plan is present in the response
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: {
          plan: {
            id: "d5bc4d5a-0a8c-4e94-8d52-4c54836bd013",
            name: "Free",
            currency: "EUR",
            is_free: true,
            expire: null,
            active: true,
          },
        },
        headers: {},
      }),
    );
    wrapper.instance().getUserRadiusUsage();
    await tick();
    expect(wrapper.instance().state.userPlan.is_free).toBe(true);
    expect(wrapper.instance().state.showRadiusUsage).toBe(false);

    // User has exhausted plan quota
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: {
          checks: [
            {
              attribute: "Max-Daily-Session",
              op: ":=",
              value: "10800",
              result: 10800,
              type: "seconds",
            },
          ],
          plan: {
            id: "d5bc4d5a-0a8c-4e94-8d52-4c54836bd013",
            name: "Free",
            currency: "EUR",
            is_free: true,
            expire: null,
            active: true,
          },
        },
        headers: {},
      }),
    );
    wrapper.instance().getUserRadiusUsage();
    await tick();
    expect(props.setPlanExhausted).toHaveBeenCalledTimes(1);
    expect(props.setPlanExhausted).toHaveBeenCalledWith(true);

    // Unauthorized request
    axios.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          status: 401,
          headers: {},
        },
      }),
    );
    wrapper.instance().getUserRadiusUsage();
    await tick();
    expect(toast.error.mock.calls.length).toBe(1);
    toast.error.mock.calls.pop()[1].onOpen();
    expect(toast.dismiss).toHaveBeenCalledWith("main_toast_id");
    expect(wrapper.instance().props.logout.mock.calls.length).toBe(1);
  });
  it("test upgradeUserPlan method handle error", async () => {
    jest.spyOn(toast, "error");
    jest.spyOn(toast, "dismiss");
    axios.mockImplementation(() =>
      Promise.reject({
        response: {
          status: 400,
          statusText: "BAD_REQUEST",
          data: {
            plan_pricing: ["This plan requires billing info."],
          },
        },
      }),
    );
    props = createTestProps();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    jest.spyOn(wrapper.instance(), "upgradeUserPlan");
    wrapper.setState({upgradePlans: [{id: "1"}]});
    wrapper.instance().upgradeUserPlan({target: {value: 0}});
    await tick();
    expect(toast.error.mock.calls.length).toBe(1);
  });
  it("should hide limit-info element if getUserRadiusUsage fails", async () => {
    validateToken.mockReturnValue(true);
    axios.mockImplementation(() =>
      Promise.reject({
        response: {
          status: 404,
          statusText: "404_NOT_FOUND",
          data: "404",
        },
      }),
    );
    const prop = createTestProps();
    prop.statusPage.links = links;
    prop.isAuthenticated = true;
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
    });
    await tick();
    expect(wrapper.find(".limit-info").exists()).toBe(false);
  });
  it("should hide limit-info element if user plan has no checks", async () => {
    validateToken.mockReturnValue(true);
    axios
      // Response for getUserRadiusSessions
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
      // Resonse for getUserRadiusUsage
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          statusText: "OK",
          data: {
            checks: [],
          },
          headers: {},
        }),
      );
    const prop = createTestProps();
    prop.statusPage.links = links;
    prop.isAuthenticated = true;
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
    });
    await tick();
    expect(wrapper.find(".limit-info").exists()).toBe(false);
  });
  it("should show user's radius usage", async () => {
    validateToken.mockReturnValue(true);
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
          data: {
            checks: [
              {
                attribute: "Max-Daily-Session",
                op: ":=",
                value: "10800",
                result: 0,
                type: "seconds",
              },
              {
                attribute: "Max-Daily-Session-Traffic",
                op: ":=",
                value: "3000000000",
                result: 0,
                type: "bytes",
              },
            ],
          },
          headers: {},
        }),
      );
    const prop = createTestProps();
    prop.statusPage.links = links;
    prop.statusPage.radius_usage_enabled = true;
    prop.isAuthenticated = true;
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
    });
    await tick();
    expect(wrapper).toMatchSnapshot();
  });
  it("subscriptions: should show upgrade option when user plan is free", async () => {
    validateToken.mockReturnValue(true);
    jest.spyOn(toast, "success");
    jest.spyOn(toast, "dismiss");
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
          data: {
            checks: [
              {
                attribute: "Max-Daily-Session",
                op: ":=",
                value: "10800",
                result: 10700,
                type: "seconds",
              },
              {
                attribute: "Max-Daily-Session-Traffic",
                op: ":=",
                value: "3000000000",
                result: 3000000000,
                type: "bytes",
              },
            ],
            plan: {
              name: "Free",
              currency: "EUR",
              is_free: true,
              expire: null,
              active: true,
            },
          },
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          statusText: "OK",
          data: [
            {
              plan: "Premium",
              pricing: "per month (0 days)",
              plan_description: "Unlimited time and traffic",
              currency: "EUR",
              price: "1.99",
            },
            {
              plan: "Premium",
              pricing: "per year (0 days)",
              plan_description: "Unlimited time and traffic",
              currency: "EUR",
              price: "9.99",
            },
          ],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          response: {
            status: 200,
            statusText: "OK",
          },
          data: {
            payment_url: "https://account.openwisp.io/payment/123",
          },
          headers: {},
        }),
      );
    const prop = createTestProps();
    prop.statusPage.links = links;
    prop.statusPage.radius_usage_enabled = true;
    prop.isAuthenticated = true;
    prop.planExhausted = true;
    prop.settings.subscriptions = true;
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
    });
    wrapper.setState({showRadiusUsage: false});
    await tick();
    expect(wrapper).toMatchSnapshot();
    expect(prop.setPlanExhausted).toHaveBeenCalledTimes(0);
    wrapper.find("#plan-upgrade-btn").simulate("click");
    await tick();
    expect(wrapper).toMatchSnapshot();
    const modalWrapper = wrapper.find(Modal).last().shallow();
    modalWrapper.find("#radio0").simulate("change", {target: {value: "0"}});
    await tick();
    toast.success.mock.calls.pop()[1].onOpen();
    expect(toast.dismiss).toHaveBeenCalledWith("main_toast_id");
    expect(prop.navigate).toHaveBeenCalledWith(
      `/${prop.orgSlug}/payment/process`,
    );
    expect(wrapper.instance().props.setUserData).toHaveBeenCalledWith({
      ...prop.userData,
      payment_url: "https://account.openwisp.io/payment/123",
    });
  });
  it("subscriptions: should show upgrade option when user plan is exhausted", async () => {
    validateToken.mockReturnValue(true);
    jest.spyOn(toast, "success");
    jest.spyOn(toast, "dismiss");
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
          data: {
            checks: [
              {
                attribute: "Max-Daily-Session",
                op: ":=",
                value: "10800",
                result: 10700,
                type: "seconds",
              },
              {
                attribute: "Max-Daily-Session-Traffic",
                op: ":=",
                value: "3000000000",
                result: 3000000000,
                type: "bytes",
              },
            ],
            plan: {
              name: "Premium",
              currency: "EUR",
              is_free: false,
              expire: null,
              active: true,
            },
          },
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          statusText: "OK",
          data: [
            {
              plan: "Premium",
              pricing: "per month (0 days)",
              plan_description: "Unlimited time and traffic",
              currency: "EUR",
              price: "1.99",
            },
            {
              plan: "Premium",
              pricing: "per year (0 days)",
              plan_description: "Unlimited time and traffic",
              currency: "EUR",
              price: "9.99",
            },
          ],
          headers: {},
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          response: {
            status: 200,
            statusText: "OK",
          },
          data: {
            payment_url: "https://account.openwisp.io/payment/123",
          },
          headers: {},
        }),
      );
    const prop = createTestProps();
    prop.statusPage.links = links;
    prop.statusPage.radius_usage_enabled = true;
    prop.isAuthenticated = true;
    prop.planExhausted = true;
    prop.settings.subscriptions = true;
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
    });
    wrapper.setState({showRadiusUsage: false});
    await tick();
    expect(wrapper).toMatchSnapshot();
    expect(prop.setPlanExhausted).toHaveBeenCalledTimes(0);
    wrapper.find("#plan-upgrade-btn").simulate("click");
    await tick();
    expect(wrapper).toMatchSnapshot();
    const modalWrapper = wrapper.find(Modal).last().shallow();
    modalWrapper.find("#radio0").simulate("change", {target: {value: "0"}});
    await tick();
    toast.success.mock.calls.pop()[1].onOpen();
    expect(toast.dismiss).toHaveBeenCalledWith("main_toast_id");
    expect(prop.navigate).toHaveBeenCalledWith(
      `/${prop.orgSlug}/payment/process`,
    );
    expect(wrapper.instance().props.setUserData).toHaveBeenCalledWith({
      ...prop.userData,
      payment_url: "https://account.openwisp.io/payment/123",
    });
  });
});
