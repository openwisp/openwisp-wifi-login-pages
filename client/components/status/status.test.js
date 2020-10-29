/* eslint-disable prefer-promise-reject-errors */
import axios from "axios";
import {shallow} from "enzyme";
import PropTypes from "prop-types";
import React from "react";
import {Cookies} from "react-cookie";
import ShallowRenderer from "react-test-renderer/shallow";
import getConfig from "../../utils/get-config";
import Status from "./status";

jest.mock("axios");

function tick() {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

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
const getLinkText = (wrapper, text) => {
  const texts = [];
  wrapper.find(text).forEach( node => {
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
    logout: jest.fn(),
    captivePortalLoginForm: defaultConfig.components.captive_portal_login_form,
    captivePortalLogoutForm:
      defaultConfig.components.captive_portal_logout_form,
    location: {
      search: "?macaddr=0.0.0.0",
    },
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
    const linkText = getLinkText(wrapper, ".owisp-status-link");
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
    const linkText = getLinkText(wrapper, ".owisp-status-link");
    expect(linkText).toContain("link-1");
    expect(linkText).not.toContain("link-2");
    expect(linkText).toContain("link-3");
  });
});

describe("<Status /> interactions", () => {
  let props;
  let wrapper;
  let originalError;
  // eslint-disable-next-line no-unused-vars
  let lastConsoleOutuput;
  beforeEach(() => {
    originalError = console.error;
    Status.contextTypes = {
      setLoading: PropTypes.func,
      getLoading: PropTypes.func,
    };
    lastConsoleOutuput = null;
    console.error = data => {
      lastConsoleOutuput = data;
    };
  });
  afterEach(() => {
    console.error = originalError;
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
    wrapper.find("#owisp-status-logout-btn").simulate("click", {});
    await tick();
    expect(wrapper.instance().props.logout).toHaveBeenCalled();
    wrapper.find("#owisp-status-logout-btn").simulate("click", {});
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
          },
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({
          status: 200,
          data: {
            response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
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
    expect(wrapper.instance().state.sessions.length).toBe(1);
    expect(wrapper.instance().props.cookies.get("default_macaddr")).toBe(
      "0.0.0.0",
    );
    expect(Status.prototype.getUserRadiusSessions).toHaveBeenCalled();
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
        search: "?macaddr=0.0.0.0",
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
          search: "?reply=true?macaddr=0.0.0.0",
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
      "0.0.0.0",
    );
  });
});
