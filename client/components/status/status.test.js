/* eslint-disable prefer-promise-reject-errors */
import axios from "axios";
import {shallow} from "enzyme";
import PropTypes from "prop-types";
import React from "react";
import {Cookies} from "react-cookie";
import ShallowRenderer from "react-test-renderer/shallow";
import {toast} from "react-toastify";
import getConfig from "../../utils/get-config";
import logError from "../../utils/log-error";
import tick from "../../utils/tick";
import Status from "./status";
import validateToken from "../../utils/validate-token";

jest.mock("axios");
jest.mock("../../utils/get-config");
jest.mock("../../utils/log-error");
jest.mock("../../utils/validate-token");
logError.mockImplementation(jest.fn());

const defaultConfig = getConfig("default");
const links = [
  {
    text: {en: "link-1"},
    url: "/link1.com",
  },
  {
    text: {en: "link-2"},
    url: "/link2.com",
    authenticated: false,
  },
  {
    text: {en: "link-3"},
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

const createTestProps = (props) => {
  return {
    language: "en",
    orgSlug: "default",
    orgName: "default name",
    statusPage: defaultConfig.components.status_page,
    cookies: new Cookies(),
    settings: defaultConfig.settings,
    captivePortalLoginForm: defaultConfig.components.captive_portal_login_form,
    captivePortalLogoutForm:
      defaultConfig.components.captive_portal_logout_form,
    location: {
      search: "?macaddr=4e:ed:11:2b:17:ae",
    },
    logout: jest.fn(),
    setUserData: jest.fn(),
    userData: {},
    setTitle: jest.fn(),
    ...props,
  };
};

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

describe("<Status /> rendering", () => {
  let props;

  it("should render correctly", () => {
    props = createTestProps();
    const renderer = new ShallowRenderer();
    const component = renderer.render(<Status {...props} />);
    expect(component).toMatchSnapshot();
  });

  it("should render without authenticated links when not authenticated", () => {
    const prop = createTestProps();
    prop.statusPage.links = links;
    prop.isAuthenticated = false;
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
  });

  afterEach(() => {
    axios.mockReset();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it("should call logout function when logout button is clicked", async () => {
    axios
      .mockImplementationOnce(() => {
        return Promise.resolve({
          response: {
            status: 200,
            statusText: "OK",
          },
          data: [],
          headers: {},
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({
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
        });
      });
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
    expect(wrapper.instance().props.setUserData).toHaveBeenCalledWith({
      is_active: true,
      is_verified: null,
      justAuthenticated: true,
    });
  });

  it("test componentDidMount lifecycle method", async () => {
    axios
      .mockImplementationOnce(() => {
        return Promise.resolve({
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
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({
          status: 200,
          statusText: "OK",
          data: [],
          headers: {},
        });
      });
    jest.spyOn(Status.prototype, "getUserActiveRadiusSessions");

    props = createTestProps({
      userData: {...responseData, justAuthenticated: true},
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
    wrapper.instance().loginIfameRef.current = {};
    wrapper.instance().loginFormRef.current = mockRef;
    wrapper.instance().componentDidMount();
    await tick();
    expect(mockRef.submit.mock.calls.length).toBe(1);
    Status.prototype.getUserActiveRadiusSessions.mockRestore();
  });

  it("test getUserActiveRadiusSessions method", async () => {
    axios
      .mockImplementationOnce(() => {
        return Promise.resolve({
          status: 200,
          statusText: "OK",
          data: [],
          headers: {},
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({
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
        });
      })
      .mockImplementationOnce(() => {
        return Promise.reject({
          response: {
            status: 401,
            headers: {},
          },
        });
      });
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
    props.statusPage.user_info.phone_number = {text: {en: "Phone number"}};
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
    props.statusPage.user_info.phone_number = {text: {en: "Phone number"}};
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
        justAuthenticated: true,
        is_verified: false,
        method: "",
      },
    });
    const spyFn = jest.fn();
    wrapper.instance().loginIfameRef.current = {};
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
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    expect(wrapper.instance().loginIfameRef).toEqual({current: null});
    let mockRef = {};
    wrapper.instance().loginIfameRef.current = mockRef;
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
    wrapper.instance().loginIfameRef.current = mockRef;
    wrapper.instance().componentDidMount();
    wrapper.instance().handleLoginIframe();
    expect(wrapper.instance().props.logout.mock.calls.length).toBe(1);
    expect(wrapper.instance().props.cookies.get("default_macaddr")).toBe(
      "4e:ed:11:2b:17:ae",
    );
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
    props.userData = {...responseData, justAuthenticated: true};
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
    });
    const spyFn = jest.fn();
    wrapper.instance().loginFormRef.current = {submit: spyFn};
    const setUserDataMock = wrapper.instance().props.setUserData.mock;
    await tick();
    expect(spyFn.mock.calls.length).toBe(1);
    expect(setUserDataMock.calls.pop()).toEqual([
      {...props.userData, justAuthenticated: false},
    ]);
  });

  it("test active session table", async () => {
    axios.mockImplementationOnce(() => {
      return Promise.resolve({
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
      });
    });
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
    axios.mockImplementationOnce(() => {
      return Promise.resolve({
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
      });
    });
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
      .mockImplementationOnce(() => {
        return Promise.resolve({
          status: 200,
          statusText: "OK",
          data: [],
          headers: {},
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({
          status: 200,
          statusText: "OK",
          data: [],
          headers: {},
        });
      });
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
      .mockImplementationOnce(() => {
        return Promise.resolve({
          status: 200,
          data: responseData,
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({
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
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({
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
        });
      });
    props = createTestProps();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    jest.spyOn(window, "clearInterval");
    wrapper.instance().componentDidMount();
    const {intervalId} = wrapper.instance().state;
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
    wrapper.find(".modal-buttons button:first-child").simulate("click", {});
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
    wrapper.find(".modal-buttons button:last-child").simulate("click", {});
    expect(handleLogout).toHaveBeenCalledWith(false);
  });

  it("should set hasMoreSessions to false if link is not in response headers", async () => {
    axios.mockImplementationOnce(() => {
      return Promise.resolve({
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
      });
    });
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
      justAuthenticated: true,
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
    wrapper.instance().loginFormRef.current = {submit: spyFn};
    const setUserDataMock = wrapper.instance().props.setUserData.mock;
    await tick();

    // ensure captive portal login is performed
    expect(spyFn.mock.calls.length).toBe(1);
    // ensure setUserData is called as expected
    expect(setUserDataMock.calls.pop()).toEqual([
      {...props.userData, justAuthenticated: false},
    ]);
    expect(location.assign.mock.calls.length).toBe(0);
    expect(setLoading.mock.calls.length).toBe(1);

    const mockRef = {submit: jest.fn()};
    wrapper.instance().loginIfameRef.current = {};
    wrapper.instance().loginFormRef.current = mockRef;
    wrapper.instance().handleLoginIframe();

    // ensure user is redirected to payment URL
    expect(location.assign.mock.calls.length).toBe(1);
    expect(location.assign.mock.calls[0][0]).toBe(props.userData.payment_url);
    // ensure sessions are not fetched
    expect(Status.prototype.getUserActiveRadiusSessions).not.toHaveBeenCalled();
    expect(Status.prototype.getUserPassedRadiusSessions).not.toHaveBeenCalled();
    // ensure loading overlay not removed
    expect(setLoading.mock.calls.length).toBe(1);
  });

  it("should logout if mustLogout is true", async () => {
    validateToken.mockReturnValue(true);
    jest.spyOn(Status.prototype, "getUserActiveRadiusSessions");
    axios.mockImplementationOnce(() => {
      return Promise.resolve({
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
      });
    });
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
    status.logoutIfameRef = {current: {}};
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
    expect(setUserData).not.toHaveBeenCalled();
    expect(Status.prototype.getUserActiveRadiusSessions.mock.calls.length).toBe(
      1,
    );
  });

  it("should repeat login if mustLogout and repeatLogin are true", async () => {
    validateToken.mockReturnValue(true);
    jest.spyOn(Status.prototype, "getUserActiveRadiusSessions");
    axios.mockImplementationOnce(() => {
      return Promise.resolve({
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
      });
    });
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
    status.logoutIfameRef = {current: {}};
    status.componentDidMount();
    const componentDidMount = jest.spyOn(status, "componentDidMount");
    await tick();
    expect(status.repeatLogin).toBe(true);
    status.handleLogoutIframe();
    expect(status.state.loggedOut).toBe(false);
    expect(status.repeatLogin).toBe(false);
    expect(mockRef.submit.mock.calls.length).toBe(1);
    expect(handleLogout).toHaveBeenCalledWith(false, true);
    expect(status.props.logout).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [true], [true]]);
    expect(Status.prototype.getUserActiveRadiusSessions.mock.calls.length).toBe(
      1,
    );
    expect(componentDidMount.mock.calls.length).toBe(1);
    expect(setUserData.mock.calls.length).toBe(1);
    expect(setUserData).toHaveBeenCalledWith({
      ...responseData,
      justAuthenticated: true,
      mustLogout: false,
      repeatLogin: false,
    });
    expect(status.props.userData).toStrictEqual({
      ...responseData,
      justAuthenticated: true,
      mustLogout: false,
      repeatLogin: false,
    });
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should set title", () => {
    props = createTestProps();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: false,
    });
    const setTitleMock = wrapper.instance().props.setTitle.mock;
    expect(setTitleMock.calls.pop()).toEqual([
      props.statusPage,
      props.language,
      props.orgName,
    ]);
  });
});
