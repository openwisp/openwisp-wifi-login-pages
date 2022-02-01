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
import history from "../../utils/history";

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
  location: {
    search: "?macaddr=4e:ed:11:2b:17:ae",
  },
  logout: jest.fn(),
  setUserData: jest.fn(),
  userData: {},
  setTitle: jest.fn(),
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
      );
    jest.spyOn(Status.prototype, "getUserActiveRadiusSessions");

    props = createTestProps({
      userData: {...responseData, mustLogin: true},
    });
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

  it("test handlePostMessage authError", async () => {
    props = createTestProps();
    const setLoadingMock = jest.fn();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: setLoadingMock},
      disableLifecycleMethods: true,
    });
    jest.spyOn(toast, "error");
    jest.spyOn(toast, "dismiss");
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

    // Test valid message
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
    expect(status.state.internetMode).toEqual(true);
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
    const modalWrapper = wrapper.find(Modal).shallow();
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
    const modalWrapper = wrapper.find(Modal).shallow();
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

  it("should initiate bank_card verification", async () => {
    validateToken.mockReturnValue(true);
    // mock window.location.assign
    const location = new URL("https://wifi.openwisp.io");
    location.assign = jest.fn();
    delete window.location;
    window.location = location;
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
    expect(location.assign.mock.calls.length).toBe(0);
    expect(setLoading.mock.calls.length).toBe(1);

    // ensure user is redirected to payment URL
    expect(history.push).toHaveBeenCalledWith(
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
    // mock window.location.assign
    const location = new URL("https://wifi.openwisp.io");
    location.assign = jest.fn();
    delete window.location;
    window.location = location;
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
    expect(location.assign.mock.calls.length).toBe(0);
    expect(setLoading.mock.calls.length).toBe(1);

    const mockRef = {submit: jest.fn()};
    wrapper.instance().loginIframeRef.current = {};
    wrapper.instance().loginFormRef.current = mockRef;
    wrapper.instance().handleLoginIframe();

    // ensure user is redirected to payment URL
    expect(history.push).toHaveBeenCalledWith(
      `/${props.orgSlug}/payment/draft`,
    );
    // ensure sessions are not fetched
    expect(Status.prototype.getUserActiveRadiusSessions).not.toHaveBeenCalled();
    expect(Status.prototype.getUserPassedRadiusSessions).not.toHaveBeenCalled();
    // ensure loading overlay not removed
    expect(setLoading.mock.calls.length).toBe(1);
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
    jest.useFakeTimers("legacy");
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

    // mock window.location.assign
    const location = new URL("https://wifi.openwisp.io");
    location.assign = jest.fn();
    delete window.location;
    window.location = location;

    props = createTestProps();
    props.statusPage.saml_logout_url = "http://test.com/saml/logout";
    props.radius_user_token = undefined;
    localStorage.setItem("default_logout_method", "saml");
    validateToken.mockReturnValue(true);
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    const status = wrapper.instance();
    const handleLogout = jest.spyOn(status, "handleLogout");
    const mockRef = {submit: jest.fn()};
    jest.useFakeTimers("legacy");
    status.logoutFormRef = {current: mockRef};
    status.logoutIframeRef = {current: {}};
    status.componentDidMount();

    wrapper.find(".logout input.button").simulate("click", {});
    const modalWrapper = wrapper.find(Modal).shallow();
    modalWrapper.find(".modal-buttons button:last-child").simulate("click", {});
    expect(handleLogout).toHaveBeenCalledWith(false);
    expect(location.assign.mock.calls.length).toBe(0);
    await tick();
    status.handleLogoutIframe();
    jest.runAllTimers();
    expect(location.assign.mock.calls.length).toBe(1);
    expect(location.assign).toHaveBeenCalledWith(
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
    expect(prop.logout).toHaveBeenCalledWith(
      {
        HAS_DOCUMENT_COOKIE: true,
        changeListeners: [],
        cookies: {default_macaddr: "4e:ed:11:2b:17:ae"},
      },
      "default",
    );
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
    const prop = createTestProps();
    const session = {start_time: "2021-07-08T00:22:28-04:00", stop_time: null};
    const mockRef = {submit: jest.fn()};
    wrapper = shallow(<Status {...prop} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    wrapper.instance().logoutFormRef = {current: mockRef};
    wrapper
      .instance()
      .setState({sessionsToLogout: [session], activeSession: [session]});

    // Test user logged in from internet(internetMode)
    wrapper.instance().setState({internetMode: true});
    wrapper.instance().handleLogout(true, true);
    await tick();
    expect(mockRef.submit).toHaveBeenCalledTimes(0);

    // Test user logged in from WiFi
    wrapper.instance().setState({internetMode: false});
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
    wrapper.instance().logoutIframeRef = wrapper.instance().logoutFormRef;
    wrapper
      .instance()
      .setState({sessionsToLogout: [session], activeSession: [session]});
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
});
