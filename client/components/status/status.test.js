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

jest.mock("axios");
jest.mock("../../utils/get-config");
jest.mock("../../utils/log-error");
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
  wrapper.find(selector).forEach( node => {
    texts.push(node.text());
  });
  return texts;
};

const createTestProps = props => {
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
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({
          status: 200,
          statusText: "OK",
          data: [{session_id: 1}],
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
    expect(wrapper.instance().state.sessions.length).toBe(1);
    expect(wrapper.instance().props.logout).toHaveBeenCalled();
  });

  it("test componentDidMount lifecycle method", async () => {
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
          data: [{session_id: 1}],
        });
      })
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
          data: [],
        });
      });
    jest.spyOn(Status.prototype, "getUserRadiusSessions");

    props = createTestProps();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
    });
    await tick();
    expect(wrapper.instance().props.cookies.get("default_macaddr")).toBe(
      "4e:ed:11:2b:17:ae",
    );
    expect(Status.prototype.getUserRadiusSessions).toHaveBeenCalled();
    expect(wrapper.instance().state.sessions.length).toBe(1);

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
    Status.prototype.getUserRadiusSessions.mockRestore();
  });

  it("test getUserRadiusSessions method", async () => {
    axios
      .mockImplementationOnce(() => {
        return Promise.resolve({
          status: 200,
          statusText: "OK",
          data: [],
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({
          status: 200,
          statusText: "OK",
          data: [{session_id: 1}],
        });
      })
      .mockImplementationOnce(() => {
        return Promise.reject({
          response: {
            status: 401,
          },
        });
      });
    props = createTestProps();
    wrapper = shallow(<Status {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    jest.spyOn(wrapper.instance(), "getUserRadiusSessions");
    wrapper.instance().getUserRadiusSessions();
    await tick();
    expect(wrapper.instance().state.sessions.length).toBe(0);
    wrapper.instance().getUserRadiusSessions();
    await tick();
    expect(wrapper.instance().state.sessions.length).toBe(1);
    wrapper.instance().getUserRadiusSessions();
    await tick();
    expect(wrapper.instance().props.logout.mock.calls.length).toBe(1);
  });

  it("test user info with mobile verification on and different username", async () => {
    axios
      .mockImplementationOnce(() => {
        return Promise.resolve({
          status: 200,
          data: {
            response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
            radius_user_token: "o6AQLY0aQjD3yuihRKLknTn8krcQwuy2Av6MCsFB",
            username: "tester",
            email: "tester@tester.com",
            is_active: true,
            phone_number: "+237672279436",
          },
        });
      });
      props = createTestProps();
      props.settings.mobile_phone_verification = true;
      props.statusPage.user_info.phone_number = {"text": {"en": "Phone number"}};
      wrapper = shallow(<Status {...props} />, {
        context: {setLoading: jest.fn()},
        disableLifecycleMethods: true,
      });
      wrapper.instance().validateToken();
      await tick();
      expect(wrapper.contains(<td>tester</td>)).toBe(true);
      expect(wrapper.contains(<td>tester@tester.com</td>)).toBe(true);
      expect(wrapper.contains(<td>+237672279436</td>)).toBe(true);

  });

  it("test user info with mobile verification on and same username", async () => {
    axios
      .mockImplementationOnce(() => {
        return Promise.resolve({
          status: 200,
          data: {
            response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
            radius_user_token: "o6AQLY0aQjD3yuihRKLknTn8krcQwuy2Av6MCsFB",
            username: "tester@tester.com",
            email: "tester@tester.com",
            is_active: true,
            phone_number: "+237672279436",
          },
        });
      });
      props = createTestProps();
      props.settings.mobile_phone_verification = true;
      props.statusPage.user_info.phone_number = {"text": {"en": "Phone number"}};
      wrapper = shallow(<Status {...props} />, {
        context: {setLoading: jest.fn()},
        disableLifecycleMethods: true,
      });
      wrapper.instance().validateToken();
      await tick();
      expect(wrapper.contains(<td>tester</td>)).toBe(false);
      expect(wrapper.contains(<td>tester@tester.com</td>)).toBe(true);
      expect(wrapper.contains(<td>+237672279436</td>)).toBe(true);
  });

  it("test user info with mobile verification off", async () => {
    axios
      .mockImplementationOnce(() => {
        return Promise.resolve({
          status: 200,
          data: {
            response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
            radius_user_token: "o6AQLY0aQjD3yuihRKLknTn8krcQwuy2Av6MCsFB",
            username: "tester",
            email: "tester@tester.com",
            is_active: true,
            phone_number: "+237672279436",
          },
        });
      });
      props = createTestProps();
      props.settings.mobile_phone_verification = false;
      wrapper = shallow(<Status {...props} />, {
        context: {setLoading: jest.fn()},
        disableLifecycleMethods: true,
      });
      wrapper.instance().validateToken();
      await tick();
      expect(wrapper.contains(<td>tester</td>)).toBe(true);
      expect(wrapper.contains(<td>+237672279436</td>)).toBe(false);
      expect(wrapper.contains(<td>tester@tester.com</td>)).toBe(true);
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
});
