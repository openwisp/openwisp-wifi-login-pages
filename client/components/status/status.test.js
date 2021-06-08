/* eslint-disable prefer-promise-reject-errors */
import axios from "axios";
import {shallow} from "enzyme";
import PropTypes from "prop-types";
import React from "react";
import {Cookies} from "react-cookie";
import ShallowRenderer from "react-test-renderer/shallow";
import getConfig from "../../utils/get-config";
import logError from "../../utils/log-error";
import tick from "../../utils/tick";
import Status from "./status";
import validateToken from "../../utils/validateToken";

jest.mock("axios");
jest.mock("../../utils/get-config");
jest.mock("../../utils/log-error");
jest.mock("../../utils/validateToken");
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
    verifyMobileNumber: jest.fn(),
    setIsActive: jest.fn(),
    setUserData: jest.fn(),
    userData: {},
    ...props,
  };
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
    jest.spyOn(Status.prototype, "getUserActiveRadiusSessions");

    props = createTestProps();
    validateToken.mockReturnValue(true);
    const userData = {
      response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
      radius_user_token: "o6AQLY0aQjD3yuihRKLknTn8krcQwuy2Av6MCsFB",
      username: "tester@tester.com",
      is_active: true,
      phone_number: "",
    };
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
    });
    wrapper.setProps({userData});
    await tick();
    expect(wrapper.instance().props.cookies.get("default_macaddr")).toBe(
      "4e:ed:11:2b:17:ae",
    );
    expect(Status.prototype.getUserActiveRadiusSessions).toHaveBeenCalled();
    expect(wrapper.instance().state.activeSessions.length).toBe(1);

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

    wrapper.setProps({
      location: {
        search: "?macaddr=4e:ed:11:2b:17:ae",
      },
      cookies: new Cookies(),
    });
    const submintFn = jest.fn();
    const mockRef = {
      submit: submintFn,
    };
    wrapper.instance().loginFormRef.current = mockRef;
    wrapper.instance().componentDidMount();
    await tick();
    expect(submintFn.mock.calls.length).toBe(1);
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
    const userData = {
      response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
      radius_user_token: "o6AQLY0aQjD3yuihRKLknTn8krcQwuy2Av6MCsFB",
      username: "tester",
      email: "tester@tester.com",
      is_active: true,
      phone_number: "+237672279436",
    };
    validateToken.mockReturnValue(true);
    props = createTestProps();
    props.settings.mobile_phone_verification = true;
    props.statusPage.user_info.phone_number = {text: {en: "Phone number"}};
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: false,
    });
    wrapper.setProps({userData});
    await tick();
    expect(wrapper.contains(<span>tester</span>)).toBe(true);
    expect(wrapper.contains(<span>tester@tester.com</span>)).toBe(true);
    expect(wrapper.contains(<span>+237672279436</span>)).toBe(true);
  });

  it("test user info with mobile verification on and same username", async () => {
    const userData = {
      response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
      radius_user_token: "o6AQLY0aQjD3yuihRKLknTn8krcQwuy2Av6MCsFB",
      username: "tester@tester.com",
      email: "tester@tester.com",
      is_active: true,
      phone_number: "+237672279436",
    };
    validateToken.mockReturnValue(true);
    props = createTestProps();
    props.settings.mobile_phone_verification = true;
    props.statusPage.user_info.phone_number = {text: {en: "Phone number"}};
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: false,
    });
    wrapper.setProps({userData});
    await tick();
    expect(wrapper.contains(<span>tester</span>)).toBe(false);
    expect(wrapper.contains(<span>tester@tester.com</span>)).toBe(true);
    expect(wrapper.contains(<span>+237672279436</span>)).toBe(true);
  });

  it("test user info with mobile verification off", async () => {
    const userData = {
      response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
      radius_user_token: "o6AQLY0aQjD3yuihRKLknTn8krcQwuy2Av6MCsFB",
      username: "tester",
      email: "tester@tester.com",
      is_active: true,
      phone_number: "+237672279436",
    };
    validateToken.mockReturnValue(true);
    props = createTestProps();
    props.settings.mobile_phone_verification = false;
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: false,
    });
    wrapper.setProps({userData});
    await tick();
    expect(wrapper.contains(<span>tester</span>)).toBe(true);
    expect(wrapper.contains(<span>+237672279436</span>)).toBe(false);
    expect(wrapper.contains(<span>tester@tester.com</span>)).toBe(true);
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
    props = createTestProps();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    wrapper.instance().getUserActiveRadiusSessions();
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
    props = createTestProps();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    wrapper.instance().getUserPassedRadiusSessions();
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
          data: {
            response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
            radius_user_token: "o6AQLY0aQjD3yuihRKLknTn8krcQwuy2Av6MCsFB",
            username: "tester@tester.com",
            is_active: true,
            phone_number: "",
          },
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
    props = createTestProps();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
    });
    const userData = {
      response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
      radius_user_token: "o6AQLY0aQjD3yuihRKLknTn8krcQwuy2Av6MCsFB",
      username: "tester@tester.com",
      is_active: false,
      phone_number: "",
    };
    wrapper.setProps({userData});
    const handleLogout = jest.spyOn(wrapper.instance(), "handleLogout");
    const setIsActiveMock = wrapper.instance().props.setIsActive.mock;
    await tick();
    expect(setIsActiveMock.calls.length).toBe(1);
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
});
