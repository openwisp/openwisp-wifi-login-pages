/* eslint-disable prefer-promise-reject-errors */
import axios from "axios";
import {shallow, mount} from "enzyme";
import React from "react";
import ShallowRenderer from "react-test-renderer/shallow";
import * as dependency from "react-toastify";
import PropTypes from "prop-types";
import {Provider} from "react-redux";
import {Router, Route} from "react-router-dom";
import {createMemoryHistory} from "history";
import {loadingContextValue} from "../../utils/loading-context";
import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import Login from "./login";
import tick from "../../utils/tick";
import Modal from "../modal";
import getParameterByName from "../../utils/get-parameter-by-name";
import {mapStateToProps, mapDispatchToProps} from "./index";

jest.mock("axios");
jest.mock("../../utils/get-config");
jest.mock("../../utils/get-parameter-by-name");
jest.mock("../../utils/load-translation");

const defaultConfig = getConfig("default", true);
const loginForm = defaultConfig.components.login_form;
loginForm.input_fields.phone_number =
  defaultConfig.components.registration_form.input_fields.phone_number;
const createTestProps = (props) => ({
  language: "en",
  orgSlug: "default",
  orgName: "default name",
  loginForm,
  privacyPolicy: defaultConfig.privacy_policy,
  termsAndConditions: defaultConfig.terms_and_conditions,
  settings: {mobile_phone_verification: false},
  authenticate: jest.fn(),
  setUserData: jest.fn(),
  userData: {},
  setTitle: jest.fn(),
  match: {
    path: "default/login",
  },
  ...props,
});
const userData = {
  is_active: true,
  is_verified: true,
  method: "mobile_phone",
  email: "tester@test.com",
  phone_number: "+393660011333",
  username: "+393660011333",
  key: "b72dad1cca4807dc21c00b0b2f171d29415ac541",
  radius_user_token: "jwyVSZYOze16ej6cc1AW5cxhRjahesLzh1Tm2y0d",
  first_name: "",
  last_name: "",
  birth_date: null,
  location: "",
};

describe("<Login /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const renderer = new ShallowRenderer();
    const wrapper = renderer.render(<Login {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});

describe("<Login /> rendering", () => {
  let props;

  it("should render correctly without social links", () => {
    props = createTestProps();
    const renderer = new ShallowRenderer();
    loadTranslation("en", "default");
    const component = renderer.render(<Login {...props} />);
    expect(component).toMatchSnapshot();
  });

  it("should render correctly with social links", () => {
    props = createTestProps({
      loginForm: {
        ...defaultConfig.components.login_form,
        social_login: {
          ...defaultConfig.components.login_form,
          links: [
            {
              text: {
                en: "Login with Google",
              },
              url: "https://radius.openwisp.io/login/google",
              icon: "google.png",
            },
            {
              text: {
                en: "Login with Facebook",
              },
              url: "https://radius.openwisp.io/login/facebook",
              icon: "facebook.png",
            },
          ],
        },
      },
    });
    const renderer = new ShallowRenderer();
    loadTranslation("en", "default");
    const component = renderer.render(<Login {...props} />);
    expect(component).toMatchSnapshot();
  });

  it("should render PhoneInput lazily and handlers should work correctly", async () => {
    props.settings.mobile_phone_verification = true;
    const wrapper = shallow(<Login {...props} />);
    const handleChange = jest.spyOn(wrapper.instance(), "handleChange");
    const component = wrapper.find("Suspense");
    expect(component).toMatchSnapshot();
    expect(component.find("lazy").length).toBe(1);
    const prop = component.find("lazy").props();
    expect(prop).toEqual({
      country: undefined,
      enableSearch: false,
      excludeCountries: [],
      inputProps: {
        autoComplete: "tel",
        className: "form-control input ",
        id: "username",
        name: "username",
        required: true,
      },
      name: "username",
      onChange: expect.any(Function),
      onlyCountries: [],
      placeholder: "enter mobile phone number",
      preferredCountries: [],
      value: "",
    });
    prop.onChange("+911234567890");
    expect(handleChange).toHaveBeenCalledWith({
      target: {
        name: "username",
        value: "++911234567890",
      },
    });
  });

  it("should load fallback before PhoneInput and handlers should work correctly", async () => {
    props.settings.mobile_phone_verification = true;
    const wrapper = shallow(<Login {...props} />);
    const handleChange = jest.spyOn(wrapper.instance(), "handleChange");
    const component = wrapper.find("Suspense");
    const {fallback} = component.props();
    expect(fallback.type).toEqual("input");
    expect(fallback.props).toEqual({
      name: "username",
      value: "",
      onChange: expect.any(Function),
      placeholder: "enter mobile phone number",
      id: "username",
      type: "tel",
    });
    fallback.props.onChange("+911234567890");
    expect(handleChange).toHaveBeenCalledWith({
      target: {
        name: "username",
        value: "++911234567890",
      },
    });
  });
});

describe("<Login /> interactions", () => {
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
    props.configuration = getConfig("default", true);
    Login.contextTypes = {
      setLoading: PropTypes.func,
      getLoading: PropTypes.func,
    };
    wrapper = shallow(<Login {...props} />, {context: loadingContextValue});
    loadTranslation("en", "default");
  });

  afterEach(() => {
    console.error = originalError;
  });

  const mountComponent = function (passedProps) {
    const mockedStore = {
      subscribe: () => {},
      dispatch: () => {},
      getState: () => ({
        organization: {
          configuration: passedProps.configuration,
        },
        language: passedProps.language,
      }),
    };

    const historyMock = createMemoryHistory();

    return mount(
      <Provider store={mockedStore}>
        <Router history={historyMock}>
          <Login {...passedProps} />
        </Router>
      </Provider>,
      {
        context: {
          store: mockedStore,
          ...loadingContextValue,
        },
        childContextTypes: {
          store: PropTypes.object.isRequired,
          setLoading: PropTypes.func,
          getLoading: PropTypes.func,
        },
      },
    );
  };

  it("should change state values when handleChange function is invoked", () => {
    wrapper = mountComponent(props);
    const login = wrapper.find(Login);

    // phone_number should not be present if mobile_phone_verification is off
    expect(wrapper.find(".row.phone-number").length).toEqual(0);
    expect(wrapper.find("input[type='tel']").length).toBe(0);

    wrapper
      .find("#username")
      .simulate("change", {target: {value: "test username", name: "username"}});
    expect(login.state("username")).toEqual("test username");

    wrapper
      .find("#password")
      .simulate("change", {target: {value: "test password", name: "password"}});
    expect(login.state("password")).toEqual("test password");
  });

  it("should change state value when handleCheckBoxChange function is invoked", () => {
    // phone_number should not be present if mobile_phone_verification is off
    expect(wrapper.find(".row.phone-number").length).toEqual(0);
    wrapper
      .find("#remember_me")
      .simulate("change", {target: {checked: false, name: "remember_me"}});
    expect(wrapper.state("remember_me")).toEqual(false);
  });

  it("should execute handleSubmit correctly when form is submitted", () => {
    axios
      .mockImplementationOnce(() =>
        Promise.reject({
          response: {
            data: {
              username: "username error",
              password: "password error",
              detail: "error details",
              non_field_errors: "non field errors",
            },
          },
        }),
      )
      .mockImplementationOnce(() =>
        Promise.reject({
          status: 500,
          statusText: "Internal server error",
          response: {
            data: {
              detail: "Internal server error",
            },
          },
        }),
      )
      .mockImplementationOnce(() =>
        Promise.reject({
          response: {
            data: {},
          },
          status: 504,
          statusText: "Gateway Timeout",
        }),
      )
      .mockImplementationOnce(() => Promise.resolve());
    const event = {preventDefault: () => {}};
    const spyToast = jest.spyOn(dependency.toast, "error");

    return wrapper
      .instance()
      .handleSubmit(event)
      .then(() => {
        expect(wrapper.instance().state.errors).toEqual({
          username: "username error",
          password: "password error",
        });
        expect(wrapper.find("div.error")).toHaveLength(2);
        expect(wrapper.find("input.error")).toHaveLength(2);
        expect(wrapper.instance().props.authenticate.mock.calls.length).toBe(0);
        expect(lastConsoleOutuput).not.toBe(null);
        expect(spyToast.mock.calls.length).toBe(1);
      })
      .then(() =>
        wrapper
          .instance()
          .handleSubmit(event)
          .then(() => {
            expect(
              wrapper.instance().props.authenticate.mock.calls.length,
            ).toBe(0);
            expect(lastConsoleOutuput).not.toBe(null);
            expect(spyToast.mock.calls.length).toBe(2);
          }),
      )
      .then(() =>
        wrapper
          .instance()
          .handleSubmit(event)
          .then(() => {
            expect(
              wrapper.instance().props.authenticate.mock.calls.length,
            ).toBe(0);
            expect(lastConsoleOutuput).not.toBe(null);
            expect(spyToast.mock.calls.length).toBe(3);
            lastConsoleOutuput = null;
          }),
      )
      .then(() =>
        wrapper
          .instance()
          .handleSubmit(event)
          .then(() => {
            expect(wrapper.instance().state.errors).toEqual({});
            expect(
              wrapper.instance().props.authenticate.mock.calls.length,
            ).toBe(0);
            expect(lastConsoleOutuput).toBe(null);
            expect(spyToast.mock.calls.length).toBe(4);
          }),
      );
  });
  it("should execute setUserData if mobile phone verification needed", async () => {
    props.settings = {mobile_phone_verification: true};
    wrapper = mountComponent(props);
    const login = wrapper.find(Login);
    const handleSubmit = jest.spyOn(login.instance(), "handleSubmit");

    const data = {...userData};
    data.is_verified = false;
    axios.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          status: 401,
          statusText: "unauthorized",
          data,
        },
      }),
    );
    expect(wrapper.find("input[type='tel']").length).toBe(1);

    expect(wrapper.find(".row.phone-number").length).toEqual(1);
    expect(wrapper.find("#username").length).toEqual(1);
    expect(login.state("username")).toEqual("");
    wrapper.find("#username").simulate("change", {
      target: {value: "+393660011333", name: "username"},
    });
    expect(login.state("username")).not.toEqual("");
    wrapper
      .find("#password")
      .simulate("change", {target: {value: "test password", name: "password"}});
    expect(login.state("password")).toEqual("test password");
    const event = {preventDefault: () => {}};
    wrapper.find("form").simulate("submit", event);
    await tick();
    expect(handleSubmit).toHaveBeenCalled();
    const setUserDataMock = login.props().setUserData.mock;
    expect(setUserDataMock.calls.length).toBe(1);
    expect(setUserDataMock.calls.pop()).toEqual([
      {...data, justAuthenticated: true},
    ]);
    const authenticateMock = login.props().authenticate.mock;
    expect(authenticateMock.calls.length).toBe(1);
    expect(authenticateMock.calls.pop()).toEqual([true]);
  });
  it("should authenticate normally with method bank_card", async () => {
    props.settings = {subscriptions: true};
    wrapper = mountComponent(props);
    const login = wrapper.find(Login);
    const handleSubmit = jest.spyOn(login.instance(), "handleSubmit");

    const data = {...userData};
    data.username = "tester";
    data.is_verified = false;
    data.method = "bank_card";
    data.payment_url = "https://account.openwisp.io/payment/123";
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        data,
      }),
    );

    expect(wrapper.find("input[type='tel']").length).toBe(0);
    wrapper.find("#username").simulate("change", {
      target: {value: "tester", name: "username"},
    });
    expect(login.state("username")).toEqual("tester");
    wrapper
      .find("#password")
      .simulate("change", {target: {value: "test password", name: "password"}});
    expect(login.state("password")).toEqual("test password");

    const event = {preventDefault: () => {}};
    wrapper.find("form").simulate("submit", event);
    await tick();
    expect(handleSubmit).toHaveBeenCalled();
    const setUserDataMock = login.props().setUserData.mock;
    expect(setUserDataMock.calls.length).toBe(1);
    expect(setUserDataMock.calls.pop()).toEqual([
      {...data, justAuthenticated: true},
    ]);
    const authenticateMock = login.props().authenticate.mock;
    expect(authenticateMock.calls.length).toBe(1);
    expect(authenticateMock.calls.pop()).toEqual([true]);
  });
  it("phone_number field should be present if mobile phone verification is on", async () => {
    props.settings = {mobile_phone_verification: true};
    wrapper = mountComponent(props);
    expect(wrapper.render()).toMatchSnapshot();
    expect(wrapper.find("input[type='tel']").length).toBe(1);
    expect(wrapper.find("#username").length).toEqual(1);
    expect(wrapper.find(".row.phone-number").length).toEqual(1);
  });
  it("username should be text field if mobile phone verification is off", async () => {
    props.settings = {mobile_phone_verification: false};
    wrapper = mountComponent(props);
    expect(wrapper.render()).toMatchSnapshot();
    expect(wrapper.find("input[type='tel']").length).toBe(0);
    expect(wrapper.find("#username").length).toEqual(1);
    expect(wrapper.find(".row.phone-number").length).toEqual(0);
  });
  it("should not show phone_number field if auto_switch_phone_input is false", async () => {
    props.settings = {mobile_phone_verification: true};
    props.loginForm = {...loginForm};
    props.loginForm.input_fields.username.auto_switch_phone_input = false;
    wrapper = mountComponent(props);
    expect(wrapper.render()).toMatchSnapshot();
    expect(wrapper.find("input[type='tel']").length).toBe(0);
    expect(wrapper.find("#username").length).toEqual(1);
    expect(wrapper.find(".row.phone-number").length).toEqual(0);
  });
  it("should execute setUserData and must not show any form errors if user is inactive", async () => {
    props.settings = {mobile_phone_verification: true};
    wrapper = shallow(<Login {...props} />, {context: loadingContextValue});

    const data = {...userData};
    data.is_active = false;

    axios.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          status: 401,
          statusText: "unauthorized",
          data,
        },
      }),
    );

    wrapper.find("[name='username']").simulate("change", {
      target: {value: "+393660011333", name: "username"},
    });
    wrapper
      .find("#password")
      .simulate("change", {target: {value: "test password", name: "password"}});

    const event = {preventDefault: () => {}};
    await wrapper.instance().handleSubmit(event);
    const spyToast = jest.spyOn(dependency.toast, "error");
    const authenticateMock = wrapper.instance().props.authenticate.mock;
    expect(authenticateMock.calls.length).toBe(0);
    const setUserDataMock = wrapper.instance().props.setUserData.mock;
    expect(setUserDataMock.calls.length).toBe(1);
    expect(setUserDataMock.calls.pop()).toEqual([data]);
    expect(wrapper.instance().state.errors).toEqual({
      username: "",
      password: "",
    });
    expect(spyToast).toHaveBeenCalled();
  });
  it("should store token in sessionStorage when remember me is unchecked and rememberMe in localstorage", () => {
    const data = {...userData};
    data.key = "test-token";

    axios.mockImplementationOnce(() => Promise.resolve({data}));

    wrapper
      .find("#remember_me")
      .simulate("change", {target: {checked: false, name: "remember_me"}});

    return wrapper
      .instance()
      .handleSubmit()
      .then(() => {
        expect(wrapper.instance().state.errors).toEqual({});
        expect(sessionStorage.getItem("default_auth_token")).toEqual(
          "test-token",
        );
        expect(localStorage.getItem("rememberMe")).toEqual("false");
        expect(wrapper.instance().props.authenticate.mock.calls.length).toBe(1);
      });
  });
  it("should show error toast when server error", () => {
    axios.mockImplementationOnce(() =>
      Promise.reject({
        status: 500,
        statusText: "Internal server error",
        response: {
          data: {
            detail: "Internal server error",
          },
        },
      }),
    );
    const event = {preventDefault: () => {}};
    const errorMethod = jest.spyOn(dependency.toast, "error");
    return wrapper
      .instance()
      .handleSubmit(event)
      .then(() => {
        expect(wrapper.instance().props.authenticate.mock.calls.length).toBe(0);
        expect(lastConsoleOutuput).not.toBe(null);
        expect(errorMethod).toHaveBeenCalled();
        expect(errorMethod).toBeCalledWith("Internal server error");
      });
  });
  it("should show error toast when connection refused or timeout", async () => {
    axios.mockImplementationOnce(() =>
      Promise.reject({
        status: 504,
        statusText: "Gateway Timeout",
        response: {
          data: "Error occured while trying to proxy to: 0.0.0.0:8080/api/v1/radius/organization/default/account/token",
        },
      }),
    );
    const event = {preventDefault: () => {}};
    const errorMethod = jest.spyOn(dependency.toast, "error");
    wrapper = shallow(<Login {...props} />, {context: loadingContextValue});
    await wrapper.instance().handleSubmit(event);
    expect(wrapper.instance().props.authenticate.mock.calls.length).toBe(0);
    expect(lastConsoleOutuput).not.toBe(null);
    expect(errorMethod).toHaveBeenCalled();
    expect(errorMethod).toBeCalledWith("Login error occurred.");
  });
  it("should set justAuthenticated on login success", async () => {
    axios.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          status: 401,
          statusText: "unauthorized",
          data: userData,
        },
      }),
    );
    props.settings = {mobile_phone_verification: true};
    wrapper = mountComponent(props);
    const login = wrapper.find(Login);
    const handleSubmit = jest.spyOn(login.instance(), "handleSubmit");
    wrapper.find("#username").simulate("change", {
      target: {value: "+393660011333", name: "username"},
    });
    wrapper
      .find("#password")
      .simulate("change", {target: {value: "test password", name: "password"}});
    const event = {preventDefault: () => {}};
    wrapper.find("form").simulate("submit", event);
    await tick();
    expect(handleSubmit).toHaveBeenCalled();
    const setUserDataMock = login.props().setUserData.mock;
    expect(setUserDataMock.calls.length).toBe(1);
    expect(setUserDataMock.calls.pop()).toEqual([
      {...userData, justAuthenticated: true},
    ]);
  });
  it("should call setTitle to set log in title", () => {
    wrapper = mountComponent(props);
    const login = wrapper.find(Login);
    const setTitleMock = login.props().setTitle.mock;
    expect(setTitleMock.calls.pop()).toEqual(["Log in", props.orgName]);
  });

  it("should call handleAuthentication on social login / SAML", () => {
    // this is needed to spot potential errors
    axios.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          data: {
            username: "username error",
            password: "password error",
            detail: "error details",
            non_field_errors: "non field errors",
          },
        },
      }),
    );
    getParameterByName
      .mockImplementationOnce(() => userData.username)
      .mockImplementationOnce(() => userData.key)
      .mockImplementationOnce(() => "saml");
    const spyToast = jest.spyOn(dependency.toast, "success");
    wrapper = mountComponent(props);
    expect(localStorage.getItem("rememberMe")).toEqual("false");
    expect(sessionStorage.getItem("default_auth_token")).toEqual(userData.key);
    expect(spyToast.mock.calls.length).toBe(1);
    const login = wrapper.find(Login);
    const setUserDataMock = login.props().setUserData.mock;
    expect(setUserDataMock.calls.length).toBe(1);
    expect(setUserDataMock.calls.pop()).toEqual([
      {
        username: userData.username,
        key: userData.key,
        is_active: true,
        radius_user_token: undefined,
        justAuthenticated: true,
      },
    ]);
    const authenticateMock = login.props().authenticate.mock;
    expect(authenticateMock.calls.length).toBe(1);
    expect(authenticateMock.calls.pop()).toEqual([true]);
    expect(localStorage.getItem("default_logout_method")).toEqual("saml");
  });
  it("should render modal", () => {
    props = createTestProps();
    wrapper = shallow(<Login {...props} />);
    let pathMap = {};
    pathMap = wrapper.find(Route).reduce((mapRoute, route) => {
      const map = mapRoute;
      const routeProps = route.props();
      map[routeProps.path] = routeProps.render;
      return map;
    }, {});
    expect(pathMap["default/login/:name"]).toEqual(expect.any(Function));
    const render = pathMap["default/login/:name"];
    const Comp = React.createElement(Modal).type;
    expect(JSON.stringify(render({}))).toStrictEqual(JSON.stringify(<Comp />));
  });

  it("should show custom HTML", () => {
    wrapper = mountComponent(props);
    expect(wrapper.find(".intro").length).toEqual(0);
    expect(wrapper.find(".pre-html").length).toEqual(0);
    expect(wrapper.find(".help-container").length).toEqual(0);
    expect(wrapper.find(".after-html").length).toEqual(0);

    const htmlProps = {...props};
    htmlProps.loginForm = {
      ...htmlProps.loginForm,
      intro_html: {en: "<div class='intro-html'></div>"},
      pre_html: {en: "<div class='pre-html'></div>"},
      help_html: {en: "<div class='help-html'></div>"},
      after_html: {en: "<div class='after-html'></div>"},
    };
    wrapper = mountComponent(htmlProps);
    expect(wrapper.find(".intro").length).toEqual(1);
    expect(wrapper.find(".pre-html").length).toEqual(1);
    expect(wrapper.find(".help-container").length).toEqual(1);
    expect(wrapper.find(".after-html").length).toEqual(1);
  });
  it("should mapStateToProps and mapDispatchToProps on rendering", async () => {
    const state = {
      organization: {
        configuration: {
          slug: "test",
          name: "test",
          settings: {},
          userData: {},
          components: {
            login_form: {
              input_fields: {},
            },
            registration_form: {
              input_fields: {
                phone_number: {},
              },
            },
          },
          privacy_policy: "Privacy policy",
          terms_and_conditions: "Terms and conditions",
        },
        language: "en",
      },
    };
    let result = mapStateToProps(state);
    expect(result).toEqual({
      language: undefined,
      loginForm: {input_fields: {phone_number: {}}},
      orgName: "test",
      orgSlug: "test",
      privacyPolicy: "Privacy policy",
      settings: {},
      termsAndConditions: "Terms and conditions",
      userData: {},
    });
    const dispatch = jest.fn();
    result = mapDispatchToProps(dispatch);
    expect(result).toEqual({
      authenticate: expect.any(Function),
      setUserData: expect.any(Function),
      setTitle: expect.any(Function),
    });
  });
});
