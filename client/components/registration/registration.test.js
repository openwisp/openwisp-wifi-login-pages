/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable camelcase */
import axios from "axios";
import {shallow, mount} from "enzyme";
import React from "react";
import {toast} from "react-toastify";
import PropTypes from "prop-types";
import {Provider} from "react-redux";
import {Router} from "react-router-dom";
import {createMemoryHistory} from "history";
import PhoneInput from "react-phone-input-2";
import {loadingContextValue} from "../../utils/loading-context";
import tick from "../../utils/tick";

import getConfig from "../../utils/get-config";
import Registration from "./registration";

jest.mock("../../utils/get-config");
jest.mock("axios");

const createTestProps = function (props, configName = "default") {
  const config = getConfig(configName);
  return {
    language: "en",
    orgSlug: configName,
    settings: config.settings,
    registration: config.components.registration_form,
    privacyPolicy: config.privacy_policy,
    termsAndConditions: config.terms_and_conditions,
    authenticate: jest.fn(),
    userData: {},
    setUserData: jest.fn(),
    match: {
      path: "default/registration",
    },
    ...props,
  };
};

describe("<Registration /> rendering", () => {
  let props;
  let wrapper;
  beforeEach(() => {
    props = createTestProps();
  });
  it("should render correctly", () => {
    props = createTestProps();
    wrapper = shallow(<Registration {...props} />, {
      context: loadingContextValue,
    });
    expect(wrapper).toMatchSnapshot();
  });
});

describe("<Registration /> interactions", () => {
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
    Registration.contextTypes = {
      setLoading: PropTypes.func,
      getLoading: PropTypes.func,
    };
    wrapper = shallow(<Registration {...props} />, {
      context: loadingContextValue,
    });
  });
  afterEach(() => {
    console.error = originalError;
  });
  it("should change state values when handleChange function is invoked", () => {
    wrapper
      .find(".row.email input")
      .simulate("change", {target: {value: "test email", name: "email"}});
    expect(wrapper.state("email")).toEqual("test email");
    wrapper
      .find(".row.password input")
      .simulate("change", {target: {value: "testpassword", name: "password1"}});
    expect(wrapper.state("password1")).toEqual("testpassword");
    wrapper
      .find(".row.password-confirm input")
      .simulate("change", {target: {value: "testpassword", name: "password2"}});
    expect(wrapper.state("password2")).toEqual("testpassword");
  });

  it("should execute handleSubmit correctly when form is submitted", () => {
    axios
      .mockImplementationOnce(() => {
        return Promise.reject({
          response: {
            data: {
              email: "email error",
              detail: "nonField error",
              password1: "password1 error",
            },
          },
        });
      })
      .mockImplementationOnce(() => {
        return Promise.reject({
          status: 500,
          statusText: "Internal server error",
          response: {
            data: {
              detail: "Internal server error",
            },
          },
        });
      })
      .mockImplementationOnce(() => {
        return Promise.reject({
          status: 504,
          statusText: "Gateway Timeout",
          response: {
            data: {},
          },
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve();
      });
    wrapper.setState({
      password1: "wrong password",
      password2: "wrong password1",
    });
    const event = {preventDefault: () => {}};
    const spyToast = jest.spyOn(toast, "error");
    wrapper.instance().handleSubmit(event);
    expect(
      wrapper.update().find(".row.password-confirm div.error"),
    ).toHaveLength(1);
    expect(
      wrapper.update().find(".row.password-confirm input.error"),
    ).toHaveLength(1);
    wrapper.setState({
      password1: "password",
      password2: "password",
    });
    wrapper.setProps({
      registration: {
        ...props.registration,
        input_fields: {
          ...props.registration.input_fields,
        },
      },
    });
    return wrapper
      .instance()
      .handleSubmit(event)
      .then(() => {
        expect(wrapper.instance().state.errors).toEqual({
          email: "email error",
          password1: "password1 error",
          password2: "",
          first_name: "",
          last_name: "",
          location: "",
          birth_date: "",
        });
        expect(wrapper.find("div.error")).toHaveLength(2);
        expect(wrapper.instance().props.authenticate.mock.calls.length).toBe(0);
        expect(lastConsoleOutuput).not.toBe(null);
        expect(spyToast.mock.calls.length).toBe(1);
        lastConsoleOutuput = null;
      })
      .then(() => {
        return wrapper
          .instance()
          .handleSubmit(event)
          .then(() => {
            expect(
              wrapper.instance().props.authenticate.mock.calls.length,
            ).toBe(0);
            expect(lastConsoleOutuput).not.toBe(null);
            expect(spyToast.mock.calls.length).toBe(2);
            lastConsoleOutuput = null;
          });
      })
      .then(() => {
        return wrapper
          .instance()
          .handleSubmit(event)
          .then(() => {
            expect(
              wrapper.instance().props.authenticate.mock.calls.length,
            ).toBe(0);
            expect(lastConsoleOutuput).not.toBe(null);
            expect(spyToast.mock.calls.length).toBe(3);
            lastConsoleOutuput = null;
          });
      })
      .then(() => {
        return wrapper
          .instance()
          .handleSubmit(event)
          .then(() => {
            expect(wrapper.instance().state.errors).toEqual({});
            expect(wrapper.instance().state.success).toEqual(true);
            expect(wrapper.find(".success")).toHaveLength(1);
            expect(
              wrapper.instance().props.authenticate.mock.calls.length,
            ).toBe(1);
            expect(wrapper.instance().props.setUserData.mock.calls.length).toBe(
              1,
            );
            expect(lastConsoleOutuput).toBe(null);
            expect(spyToast.mock.calls.length).toBe(3);
            lastConsoleOutuput = null;
          });
      });
  });
  it("test optional fields disabled", async () => {
    wrapper = shallow(<Registration {...props} />, {
      context: loadingContextValue,
      disableLifecycleMethods: true,
    });
    expect(wrapper.find(".first_name").length).toEqual(0);
    expect(wrapper.find(".last_name").length).toEqual(0);
    expect(wrapper.find(".birth_date").length).toEqual(0);
    expect(wrapper.find(".location").length).toEqual(0);
  });
  it("test optional fields allowed", async () => {
    props.registration.input_fields.first_name.setting = "allowed";
    props.registration.input_fields.location.setting = "allowed";
    wrapper = shallow(<Registration {...props} />, {
      context: loadingContextValue,
      disableLifecycleMethods: true,
    });
    expect(wrapper.find("[htmlFor='first_name']").text()).toEqual(
      "first name (optional)",
    );
    expect(wrapper.find("[htmlFor='location']").text()).toEqual(
      "location (optional)",
    );
    expect(wrapper.find(".last_name").length).toEqual(0);
    expect(wrapper.find(".birth_date").length).toEqual(0);
  });
  it("test optional fields mandatory", async () => {
    props.registration.input_fields.birth_date.setting = "mandatory";
    props.registration.input_fields.first_name.setting = "mandatory";
    props.registration.input_fields.last_name.setting = "allowed";
    props.registration.input_fields.location.setting = "allowed";
    wrapper = shallow(<Registration {...props} />, {
      context: loadingContextValue,
      disableLifecycleMethods: true,
    });
    expect(wrapper.find("[htmlFor='first_name']").text()).toEqual("first name");
    expect(wrapper.find("[htmlFor='birth_date']").text()).toEqual("birth date");
    expect(wrapper.find("[htmlFor='last_name']").text()).toEqual(
      "last name (optional)",
    );
    expect(wrapper.find("[htmlFor='location']").text()).toEqual(
      "location (optional)",
    );
  });
  it("should execute setUserData", async () => {
    axios.mockImplementationOnce(() => {
      return Promise.resolve();
    });
    wrapper = shallow(<Registration {...props} />, {
      context: loadingContextValue,
      disableLifecycleMethods: true,
    });
    const event = {preventDefault: () => {}};
    const errorSpyToast = jest.spyOn(toast, "error");
    const setUserDataMock = wrapper.instance().props.setUserData.mock;
    wrapper.setState({
      password1: "password",
      password2: "password",
    });
    wrapper.instance().handleSubmit(event);
    await tick();
    expect(wrapper.instance().state.errors).toEqual({});
    expect(wrapper.instance().state.success).toEqual(true);
    expect(wrapper.find(".success")).toHaveLength(1);
    expect(wrapper.instance().props.authenticate.mock.calls.length).toBe(1);
    expect(wrapper.instance().props.setUserData.mock.calls.length).toBe(1);
    expect(lastConsoleOutuput).toBe(null);
    expect(errorSpyToast.mock.calls.length).toBe(3);
    lastConsoleOutuput = null;
    expect(setUserDataMock.calls.length).toBe(1);
    expect(setUserDataMock.calls.pop()).toEqual([{is_active: true}]);
  });
  it("should execute setUserData with is_verified when mobile phone verification is needed", async () => {
    axios.mockImplementationOnce(() => {
      return Promise.resolve();
    });
    props.settings = {mobile_phone_verification: true};
    wrapper = shallow(<Registration {...props} />, {
      context: loadingContextValue,
      disableLifecycleMethods: true,
    });
    const event = {preventDefault: () => {}};
    const errorSpyToast = jest.spyOn(toast, "error");
    const setUserDataMock = wrapper.instance().props.setUserData.mock;
    wrapper.setState({
      password1: "password",
      password2: "password",
    });
    wrapper.instance().handleSubmit(event);
    await tick();
    expect(wrapper.instance().state.errors).toEqual({});
    expect(wrapper.instance().state.success).toEqual(true);
    expect(wrapper.find(".success")).toHaveLength(1);
    expect(wrapper.instance().props.authenticate.mock.calls.length).toBe(1);
    expect(wrapper.instance().props.setUserData.mock.calls.length).toBe(1);
    expect(errorSpyToast.mock.calls.length).toBe(3);
    expect(setUserDataMock.calls.length).toBe(1);
    expect(setUserDataMock.calls.pop()).toEqual([
      {is_active: true, is_verified: false},
    ]);
  });
});

describe("Registration and Mobile Phone Verification interactions", () => {
  let props;
  let wrapper;
  const historyMock = createMemoryHistory();
  const event = {preventDefault: jest.fn()};

  const mountComponent = function (passedProps) {
    Registration.contextTypes = undefined;
    const mockedStore = {
      subscribe: () => {},
      dispatch: () => {},
      // needed to render <Contact/>
      getState: () => {
        return {
          organization: {
            configuration: passedProps.configuration,
          },
          language: passedProps.language,
        };
      },
    };

    return mount(
      <Provider store={mockedStore}>
        <Router history={historyMock}>
          <Registration {...passedProps} />
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

  beforeEach(() => {
    props = createTestProps({}, "test-org-2");
    props.configuration = getConfig("test-org-2");
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it("should show phone number field", async () => {
    wrapper = await mountComponent(props);
    expect(wrapper.exists(PhoneInput)).toBe(true);
  });

  it("should process successfully", async () => {
    wrapper = await mountComponent(props);
    expect(wrapper.exists(PhoneInput)).toBe(true);
    expect(wrapper.find("form")).toHaveLength(1);
    const component = wrapper.find(Registration).instance();
    const handleSubmit = jest.spyOn(component, "handleSubmit");

    // testing if username is equal to phone_number
    const axiosParam = {
      data:
        "email=tester%40openwisp.io&username=%2B393660011333&first_name=&last_name=&birth_date=&location=&password1=tester123&password2=tester123&phone_number=%2B393660011333",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      method: "post",
      url: "/api/v1/test-org-2/account/",
    };

    axios.mockImplementationOnce(() => {
      return Promise.resolve({
        status: 201,
        statusText: "CREATED",
        data: null,
      });
    });

    wrapper.find("input[name='phone_number']").simulate("change", {
      target: {value: "+393660011333", name: "phone_number"},
    });
    wrapper.find("input[name='email']").simulate("change", {
      target: {value: "tester@openwisp.io", name: "email"},
    });
    wrapper
      .find("input[name='password1']")
      .simulate("change", {target: {value: "tester123", name: "password1"}});
    wrapper
      .find("input[name='password2']")
      .simulate("change", {target: {value: "tester123", name: "password2"}});
    wrapper.find("form").simulate("submit", event);
    await tick();
    expect(wrapper.find(Registration).instance().state.errors).toEqual({});
    expect(handleSubmit).toHaveBeenCalled();
    expect(axios).toHaveBeenCalledWith(axiosParam);
    expect(event.preventDefault).toHaveBeenCalled();
    const {setUserData} = component.props;
    expect(setUserData.mock.calls.length).toBe(1);
  });
});
