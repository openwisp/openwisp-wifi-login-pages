/* eslint-disable prefer-promise-reject-errors */
import axios from "axios";
import {render, fireEvent, waitFor, screen} from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import * as dependency from "react-toastify";
import {Provider} from "react-redux";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  MemoryRouter,
} from "react-router-dom";
import {createMemoryHistory} from "history";

// Mock modules BEFORE importing
/* eslint-disable import/first */
const mockConfig = {
  name: "default name",
  slug: "default",
  default_language: "en",
  settings: {
    mobile_phone_verification: false,
    subscriptions: false,
  },
  components: {
    login_form: {
      input_fields: {
        username: {
          type: "text",
          pattern: "^[a-zA-Z0-9@.+\\-_\\s]+$",
        },
        password: {
          type: "password",
          pattern: ".{6,}",
        },
        remember_me: {
          value: false,
        },
      },
      social_login: {
        links: [],
      },
      buttons: {
        register: true,
        forgot_password: true,
      },
    },
    registration_form: {
      input_fields: {
        phone_number: {
          country: "in",
        },
      },
    },
    header: {
      logo: {
        url: "/assets/default/openwisp-logo-black.svg",
        alternate_text: "openwisp",
      },
      links: [],
    },
    footer: {
      links: [],
    },
    contact_page: {},
  },
  privacy_policy: {
    title: {en: "Privacy Policy"},
    content: {en: "Privacy content"},
  },
  terms_and_conditions: {
    title: {en: "Terms and Conditions"},
    content: {en: "Terms content"},
  },
  languages: [{slug: "en", text: "english"}],
};

jest.mock("axios");
jest.mock("../../utils/get-config", () => ({
  __esModule: true,
  default: jest.fn(() => mockConfig),
}));
jest.mock("../../utils/get-parameter-by-name");
jest.mock("../../utils/load-translation");
jest.mock("../../utils/redirect-to-payment");

import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import Login from "./login";
import getParameterByName from "../../utils/get-parameter-by-name";
import {mapStateToProps, mapDispatchToProps} from "./index";
import redirectToPayment from "../../utils/redirect-to-payment";
/* eslint-enable import/first */

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
  settings: {
    mobile_phone_verification: false,
    radius_realms: false,
    passwordless_auth_token_name: "sesame",
  },
  authenticate: jest.fn(),
  setUserData: jest.fn(),
  userData: {},
  setTitle: jest.fn(),
  captivePortalLoginForm: {
    method: "POST",
    action: "https://radius-proxy/login/",
    fields: {
      username: "username",
      password: "password",
    },
    additional_fields: [],
  },
  match: {
    path: "default/login",
  },
  navigate: jest.fn(),
  ...props,
});
const userData = {
  is_active: true,
  is_verified: true,
  method: "mobile_phone",
  email: "tester@test.com",
  phone_number: "+393660011333",
  username: "+393660011333",
  auth_token: "b72dad1cca4807dc21c00b0b2f171d29415ac541",
  radius_user_token: "jwyVSZYOze16ej6cc1AW5cxhRjahesLzh1Tm2y0d",
  first_name: "",
  last_name: "",
  birth_date: null,
  location: "",
};
const responseData = {...userData, key: userData.auth_token};
delete responseData.auth_token;

// Simple helper for rendering tests that need Provider but not full routing
const renderWithProvider = (component) => {
  const state = {
    organization: {
      configuration: {
        ...defaultConfig,
        components: {
          ...defaultConfig.components,
          contact_page: defaultConfig.components.contact_page || {},
        },
      },
    },
    language: "en",
  };

  const mockedStore = {
    subscribe: () => {},
    dispatch: () => {},
    getState: () => state,
  };

  return render(
    <Provider store={mockedStore}>
      <MemoryRouter>{component}</MemoryRouter>
    </Provider>,
  );
};

describe("<Login /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const {container} = renderWithProvider(<Login {...props} />);
    expect(container).toMatchSnapshot();
  });
});

describe("<Login /> rendering", () => {
  let props;

  it("should render correctly without social links", () => {
    props = createTestProps();
    const {container} = renderWithProvider(<Login {...props} />);
    expect(container).toMatchSnapshot();
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
    const {container} = renderWithProvider(<Login {...props} />);
    expect(container).toMatchSnapshot();
  });

  it("should render PhoneInput lazily and handlers should work correctly", async () => {
    props = createTestProps();
    props.settings.mobile_phone_verification = true;
    renderWithProvider(<Login {...props} />);

    // Wait for the lazy-loaded PhoneInput to appear
    const phoneInput = await screen.findByPlaceholderText("PHONE_PHOLD");

    expect(phoneInput).toHaveAttribute("type", "tel");
    expect(phoneInput).toHaveAttribute("placeholder", "PHONE_PHOLD");
    expect(phoneInput).toHaveClass("form-control", "input");

    // Test that user can type in the phone input
    fireEvent.change(phoneInput, {
      target: {value: "+911234567890", name: "username"},
    });

    // Check the value was updated - phone input may format the number
    expect(phoneInput.value.replace(/[\s-]/g, "")).toContain("1234567890");
  });

  it("should show fallback input before PhoneInput loads", async () => {
    props = createTestProps();
    props.settings.mobile_phone_verification = true;
    renderWithProvider(<Login {...props} />);

    // Check that an input exists immediately (the fallback)
    const fallbackInput = screen.getByPlaceholderText("PHONE_PHOLD");
    expect(fallbackInput).toBeInTheDocument();
    expect(fallbackInput).toHaveAttribute("type", "tel");
    // Placeholder is the ttag key since translations are mocked
    expect(fallbackInput).toHaveAttribute("placeholder", "PHONE_PHOLD");
    expect(fallbackInput).toHaveAttribute("id", "username");
    expect(fallbackInput).toHaveClass("form-control", "input");

    // User can type in the fallback input
    fireEvent.change(fallbackInput, {
      target: {value: "+911234567890", name: "username"},
    });

    // Phone input may format the number with spaces/dashes
    expect(fallbackInput.value.replace(/[\s-]/g, "")).toContain("1234567890");

    // Wait for the actual PhoneInput to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText("PHONE_PHOLD")).toBeInTheDocument();
    });
  });

  it("should render radius realms form if radius_realms is true", () => {
    props = createTestProps();
    props.settings.radius_realms = true;
    loadTranslation("en", "default");
    const {container} = renderWithProvider(<Login {...props} />);
    expect(container).toMatchSnapshot();
  });
});

describe("<Login /> interactions", () => {
  let props;
  let originalError;
  let lastConsoleOutuput;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    axios.mockClear();
    axios.mockReset(); // This is the key - fully reset axios mock

    // Clear storage
    sessionStorage.clear();
    localStorage.clear();

    originalError = console.error;
    lastConsoleOutuput = null;
    /* eslint-disable no-console */
    console.error = (data) => {
      lastConsoleOutuput = data;
    };
    /* eslint-enable no-console */
    props = createTestProps();
    props.configuration = getConfig("default", true);
    loadTranslation("en", "default");
  });

  afterEach(() => {
    /* eslint-disable no-console */
    console.error = originalError;
    /* eslint-enable no-console */
    jest.clearAllMocks();
    axios.mockReset(); // Also reset in afterEach for good measure
  });

  const mountComponent = function mountComponent(passedProps) {
    const mockedStore = {
      subscribe: () => {},
      dispatch: () => {},
      getState: () => ({
        organization: {
          configuration: {
            ...passedProps.configuration,
            components: {
              ...passedProps.configuration.components,
              contact_page:
                passedProps.configuration.components.contact_page || {},
            },
          },
        },
        language: passedProps.language,
      }),
    };

    const historyMock = createMemoryHistory();

    return render(
      <Provider store={mockedStore}>
        <Router location={historyMock.location} navigator={historyMock}>
          <Routes>
            <Route path="/*" element={<Login {...passedProps} />} />
          </Routes>
        </Router>
      </Provider>,
    );
  };

  it("should change state values when handleChange function is invoked", () => {
    mountComponent(props);

    const usernameInput = screen.getByRole("textbox", {
      name: /email, phone number or username/i,
    });
    fireEvent.change(usernameInput, {
      target: {value: "test username", name: "username"},
    });
    expect(usernameInput).toHaveValue("test username");

    const passwordInput = document.getElementById("password");
    fireEvent.change(passwordInput, {
      target: {value: "test password", name: "password"},
    });
    expect(passwordInput.value).toBe("test password");
  });

  it("should change checkbox value when user clicks it", () => {
    mountComponent(props);
    const rememberMeCheckbox = screen.getByRole("checkbox", {
      name: /remember me/i,
    });
    fireEvent.change(rememberMeCheckbox, {target: {checked: false}});
    expect(rememberMeCheckbox).not.toBeChecked();
  });

  it("should execute handleSubmit correctly when form is submitted", async () => {
    const {container} = mountComponent(props);

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

    const spyToast = jest.spyOn(dependency.toast, "error");
    const form = container.querySelector("form");

    // First submit - field errors
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText(/username error/i)).toBeInTheDocument();
      expect(props.authenticate).not.toHaveBeenCalled();
      expect(lastConsoleOutuput).not.toBe(null);
      expect(spyToast).toHaveBeenCalledTimes(1);
    });

    // Second submit - 500 error
    fireEvent.submit(form);
    await waitFor(() => {
      expect(props.authenticate).not.toHaveBeenCalled();
      expect(lastConsoleOutuput).not.toBe(null);
      expect(spyToast).toHaveBeenCalledTimes(2);
    });

    // Third submit - 504 error
    fireEvent.submit(form);
    await waitFor(() => {
      expect(props.authenticate).not.toHaveBeenCalled();
      expect(lastConsoleOutuput).not.toBe(null);
      expect(spyToast).toHaveBeenCalledTimes(3);
      lastConsoleOutuput = null;
    });

    // Fourth submit - success
    fireEvent.submit(form);
    await waitFor(() => {
      expect(container.querySelectorAll("div.error")).toHaveLength(0);
      expect(container.querySelectorAll("input.error")).toHaveLength(0);
      expect(props.authenticate).not.toHaveBeenCalled();
      expect(lastConsoleOutuput).toBe(null);
      expect(spyToast).toHaveBeenCalledTimes(4);
    });
  });

  it("should execute setUserData if mobile phone verification needed", async () => {
    props.settings = {mobile_phone_verification: true};
    const {container} = mountComponent(props);

    const testResponseData = {...responseData, is_verified: false};
    const testUserData = {...userData, is_verified: false};

    axios.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          status: 401,
          statusText: "unauthorized",
          data: testResponseData,
        },
      }),
    );

    // Check phone input is present
    expect(container.querySelector("input[type='tel']")).toBeInTheDocument();
    expect(container.querySelector(".row.phone-number")).toBeInTheDocument();
    expect(container.querySelector("#username")).toBeInTheDocument();

    // Fill in the form
    const usernameInput = container.querySelector("#username");
    // Phone input may have default country code from react-phone-input-2
    expect(usernameInput.value).toMatch(/^\+?\d*$/);

    fireEvent.change(usernameInput, {
      target: {value: "+393660011333", name: "username"},
    });
    // Phone input auto-formats with spaces - check for the core digits
    expect(usernameInput.value.replace(/\s/g, "")).toContain("3660011333");

    const passwordInput = container.querySelector("#password");
    fireEvent.change(passwordInput, {
      target: {value: "test password", name: "password"},
    });
    expect(passwordInput.value).toBe("test password");

    // Submit the form
    const form = container.querySelector("form");
    fireEvent.submit(form);

    // Wait for async operations
    await waitFor(() => {
      expect(props.setUserData).toHaveBeenCalledTimes(1);
      expect(props.authenticate).toHaveBeenCalledTimes(1);
    });
    expect(props.authenticate).toHaveBeenCalledWith(true);
    expect(props.setUserData).toHaveBeenCalledWith({
      ...testUserData,
      mustLogin: true,
    });
  });

  it("should authenticate normally with method bank_card", async () => {
    props.settings = {subscriptions: true};
    const {container} = mountComponent(props);

    const data = {
      ...userData,
      username: "tester",
      is_verified: true,
      method: "bank_card",
      payment_url: "https://account.openwisp.io/payment/123",
    };
    const testResponseData = {...data, key: data.auth_token};
    delete testResponseData.auth_token;

    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        data: testResponseData,
      }),
    );

    // Verify phone input is NOT present
    expect(container.querySelector("input[type='tel']")).toBeNull();

    // Fill in the form
    const usernameInput = container.querySelector("#username");
    fireEvent.change(usernameInput, {
      target: {value: "tester", name: "username"},
    });
    expect(usernameInput.value).toBe("tester");

    const passwordInput = container.querySelector("#password");
    fireEvent.change(passwordInput, {
      target: {value: "test password", name: "password"},
    });
    expect(passwordInput.value).toBe("test password");

    // Submit the form
    const form = container.querySelector("form");
    fireEvent.submit(form);

    // Wait for async operations
    await waitFor(() => {
      expect(props.setUserData).toHaveBeenCalledTimes(1);
      expect(props.authenticate).toHaveBeenCalledTimes(1);
    });
    expect(props.authenticate).toHaveBeenCalledWith(true);
    expect(props.setUserData).toHaveBeenCalledWith({
      ...data,
      mustLogin: true,
    });
  });

  it("should redirect to payment status if bank_card and not verified", async () => {
    props.settings = {subscriptions: true};
    const {container} = mountComponent(props);

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

    const usernameInput = container.querySelector("#username");
    fireEvent.change(usernameInput, {
      target: {value: "tester", name: "username"},
    });
    expect(usernameInput.value).toBe("tester");

    const passwordInput = container.querySelector("#password");
    fireEvent.change(passwordInput, {
      target: {value: "test password", name: "password"},
    });
    expect(passwordInput.value).toBe("test password");

    const form = container.querySelector("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(redirectToPayment).toHaveBeenCalledWith("default", props.navigate);
      expect(props.authenticate).toHaveBeenCalledTimes(1);
    });
  });

  it("phone_number field should be present if mobile phone verification is on", async () => {
    props.settings = {mobile_phone_verification: true};
    const {container} = mountComponent(props);
    expect(container).toMatchSnapshot();
    expect(container.querySelector("input[type='tel']")).toBeInTheDocument();
    expect(container.querySelector("#username")).toBeInTheDocument();
    expect(container.querySelector(".row.phone-number")).toBeInTheDocument();
  });

  it("username should be text field if mobile phone verification is off", async () => {
    props.settings = {mobile_phone_verification: false};
    const {container} = mountComponent(props);
    expect(container).toMatchSnapshot();
    expect(container.querySelector("input[type='tel']")).toBeNull();
    expect(container.querySelector("#username")).toBeInTheDocument();
    expect(container.querySelector(".row.phone-number")).toBeNull();
  });

  it("should not show phone_number field if auto_switch_phone_input is false", async () => {
    props.settings = {mobile_phone_verification: true};
    props.loginForm = {...loginForm};
    props.loginForm.input_fields.username.auto_switch_phone_input = false;
    const {container} = mountComponent(props);
    expect(container).toMatchSnapshot();
    expect(container.querySelector("input[type='tel']")).toBeNull();
    expect(container.querySelector("#username")).toBeInTheDocument();
    expect(container.querySelector(".row.phone-number")).toBeNull();
  });

  it("should execute setUserData and must not show any form errors if user is inactive", async () => {
    props.settings = {mobile_phone_verification: true};
    const {container} = mountComponent(props);

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

    const spyToast = jest.spyOn(dependency.toast, "error");

    // Fill in the form
    const usernameInput = container.querySelector("[name='username']");
    fireEvent.change(usernameInput, {
      target: {value: "+393660011333", name: "username"},
    });

    const passwordInput = container.querySelector("#password");
    fireEvent.change(passwordInput, {
      target: {value: "test password", name: "password"},
    });

    // Submit the form
    const form = container.querySelector("form");
    fireEvent.submit(form);

    // Wait for async operations to complete
    await waitFor(() => {
      expect(props.authenticate).not.toHaveBeenCalled();
      expect(props.setUserData).toHaveBeenCalledTimes(1);

      // Check no form errors are shown in the UI
      expect(container.querySelectorAll("div.error")).toHaveLength(0);
      expect(container.querySelectorAll("input.error")).toHaveLength(0);

      expect(spyToast).toHaveBeenCalled();
    });
    expect(props.setUserData).toHaveBeenCalledWith(data);
  });

  it("should store token in sessionStorage when remember me is unchecked and rememberMe in localstorage", async () => {
    // Create fresh data without inheriting auth_token from userData
    const data = {
      is_active: true,
      is_verified: true,
      method: "mobile_phone",
      email: "tester@test.com",
      phone_number: "+393660011333",
      username: "+393660011333",
      key: "test-token", // Use key instead of auth_token for API response
      radius_user_token: "jwyVSZYOze16ej6cc1AW5cxhRjahesLzh1Tm2y0d",
      first_name: "",
      last_name: "",
      birth_date: null,
      location: "",
    };

    // Set up mock BEFORE mounting component
    axios.mockImplementationOnce(() => Promise.resolve({data}));

    const {container} = mountComponent(props);

    // The remember_me checkbox is unchecked by default (value: false in config)
    // We want to keep it unchecked so token goes to sessionStorage
    // Don't click - just verify it's unchecked
    const rememberMeCheckbox = container.querySelector("#remember_me");
    expect(rememberMeCheckbox.checked).toBe(false);

    // Submit the form
    const form = container.querySelector("form");
    fireEvent.submit(form);

    // Wait for async operations
    await waitFor(() => {
      // Check authenticate was called
      expect(props.authenticate).toHaveBeenCalledTimes(1);
    });

    // Check storage after authentication
    expect(sessionStorage.getItem("default_auth_token")).toEqual("test-token");
    expect(localStorage.getItem("rememberMe")).toEqual("false");

    // Check no errors are shown in the UI
    expect(container.querySelectorAll("div.error")).toHaveLength(0);
    expect(container.querySelectorAll("input.error")).toHaveLength(0);
  });

  it("should show error toast when server error", async () => {
    const {container} = mountComponent(props);

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

    const errorMethod = jest.spyOn(dependency.toast, "error");

    // Submit the form
    const form = container.querySelector("form");
    fireEvent.submit(form);

    // Wait for async operations
    await waitFor(() => {
      expect(props.authenticate).not.toHaveBeenCalled();
      expect(lastConsoleOutuput).not.toBe(null);
      expect(errorMethod).toHaveBeenCalled();
    });
    expect(errorMethod).toHaveBeenCalledWith("Internal server error");
  });

  it("should show error toast when connection refused or timeout", async () => {
    const {container} = mountComponent(props);

    axios.mockImplementationOnce(() =>
      Promise.reject({
        status: 504,
        statusText: "Gateway Timeout",
        response: {
          data: "Error occured while trying to proxy to: 0.0.0.0:8080/api/v1/radius/organization/default/account/token",
        },
      }),
    );

    const errorMethod = jest.spyOn(dependency.toast, "error");

    // Submit the form
    const form = container.querySelector("form");
    fireEvent.submit(form);

    // Wait for async operations
    await waitFor(() => {
      expect(props.authenticate).not.toHaveBeenCalled();
      expect(lastConsoleOutuput).not.toBe(null);
      expect(errorMethod).toHaveBeenCalled();
    });
    expect(errorMethod).toHaveBeenCalledWith("Login error occurred.");
  });

  it("should set mustLogin on login success", async () => {
    props.settings = {mobile_phone_verification: true};
    const {container} = mountComponent(props);

    axios.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          status: 401,
          statusText: "unauthorized",
          data: responseData,
        },
      }),
    );

    const usernameInput = container.querySelector("#username");
    fireEvent.change(usernameInput, {
      target: {value: "+393660011333", name: "username"},
    });

    const passwordInput = container.querySelector("#password");
    fireEvent.change(passwordInput, {
      target: {value: "test password", name: "password"},
    });

    const form = container.querySelector("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(props.setUserData).toHaveBeenCalledTimes(1);
    });
    expect(props.setUserData).toHaveBeenCalledWith({
      ...userData,
      mustLogin: true,
    });
  });

  it("should call setTitle to set log in title", () => {
    mountComponent(props);
    expect(props.setTitle).toHaveBeenCalledWith("Log in", props.orgName);
  });

  it("should call handleAuthentication on social login / SAML", () => {
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
      .mockImplementationOnce(() => userData.auth_token)
      .mockImplementationOnce(() => "")
      .mockImplementationOnce(() => "saml");

    const spyToast = jest.spyOn(dependency.toast, "success");
    mountComponent(props);

    expect(localStorage.getItem("rememberMe")).toEqual("false");
    expect(sessionStorage.getItem("default_auth_token")).toEqual(
      userData.auth_token,
    );
    expect(spyToast).toHaveBeenCalledTimes(1);
    expect(props.setUserData).toHaveBeenCalledTimes(1);
    expect(props.setUserData).toHaveBeenCalledWith({
      username: userData.username,
      auth_token: userData.auth_token,
      is_active: true,
      radius_user_token: undefined,
      mustLogin: true,
    });
    expect(props.authenticate).toHaveBeenCalledTimes(1);
    expect(props.authenticate).toHaveBeenCalledWith(true);
    expect(localStorage.getItem("default_logout_method")).toEqual("saml");
  });

  it("should authenticate if sesame link is in url", async () => {
    // Create response data as it comes from API (with key, not auth_token)
    const responseWithKey = {
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

    axios.mockImplementationOnce(() =>
      Promise.resolve({
        data: responseWithKey,
      }),
    );

    getParameterByName
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => "sesame-token");

    props = createTestProps();
    props.configuration = getConfig("default", true);
    mountComponent(props);

    // Verify the component checked for the sesame token
    expect(getParameterByName).toHaveBeenCalledWith("sesame");

    // Wait for the automatic authentication to happen
    await waitFor(() => {
      expect(props.authenticate).toHaveBeenCalled();
      // Component transforms key -> auth_token
      expect(props.setUserData).toHaveBeenCalledWith({
        ...userData,
        mustLogin: true,
      });
    });
  });

  it("should show custom HTML", () => {
    const {container} = mountComponent(props);
    expect(container.querySelector(".intro")).toBeNull();
    expect(container.querySelector(".pre-html")).toBeNull();
    expect(container.querySelector(".help-container")).toBeNull();
    expect(container.querySelector(".after-html")).toBeNull();

    const htmlProps = {...props};
    htmlProps.loginForm = {
      ...htmlProps.loginForm,
      intro_html: {en: "<div class='intro-html'></div>"},
      pre_html: {en: "<div class='pre-html'></div>"},
      help_html: {en: "<div class='help-html'></div>"},
      after_html: {en: "<div class='after-html'></div>"},
    };
    const result = mountComponent(htmlProps);
    expect(result.container.querySelector(".intro")).toBeInTheDocument();
    expect(result.container.querySelector(".pre-html")).toBeInTheDocument();
    expect(
      result.container.querySelector(".help-container"),
    ).toBeInTheDocument();
    expect(result.container.querySelector(".after-html")).toBeInTheDocument();
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

  it("should submit form if radius_realms is true", async () => {
    // First render - no captive portal form
    const result = mountComponent(props);
    expect(result.container.querySelector("[id='cp-login-form']")).toBeNull();
    result.unmount();

    // Re-render with radius_realms enabled
    props.settings.radius_realms = true;
    props.captivePortalLoginForm.additional_fields = [
      {name: "zone", value: "zone_value"},
    ];

    const {container} = mountComponent(props);

    // Check the captive portal form exists
    const cpForm = container.querySelector("[id='cp-login-form']");
    expect(cpForm).toBeInTheDocument();
    expect(cpForm).toHaveAttribute("action", "https://radius-proxy/login/");
    expect(cpForm).toHaveAttribute("method", "POST");
    expect(cpForm).toHaveClass("hidden");

    // Check hidden input fields exist
    const usernameInput = cpForm.querySelector('input[name="username"]');
    expect(usernameInput).toHaveAttribute("type", "hidden");

    const passwordInput = cpForm.querySelector('input[name="password"]');
    expect(passwordInput).toHaveAttribute("type", "hidden");

    const zoneInput = cpForm.querySelector('input[name="zone"]');
    expect(zoneInput).toHaveAttribute("type", "hidden");
    expect(zoneInput).toHaveValue("zone_value");

    // Fill in the visible login form fields
    const visibleUsernameInput = container.querySelector("#username");
    const visiblePasswordInput = container.querySelector("#password");

    fireEvent.change(visibleUsernameInput, {
      target: {value: "realms@", name: "username"},
    });
    fireEvent.change(visiblePasswordInput, {
      target: {value: "testing", name: "password"},
    });

    // Mock form submit
    const submitSpy = jest.fn();
    cpForm.submit = submitSpy;

    // Submit the main form
    const mainForm = container.querySelector('form:not([id="cp-login-form"])');
    fireEvent.submit(mainForm);

    // Wait for captive portal form to be submitted
    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalled();
    });
  });
});
