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

import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import Login from "./login";
import getParameterByName from "../../utils/get-parameter-by-name";
import {mapStateToProps, mapDispatchToProps} from "./index";
import redirectToPayment from "../../utils/redirect-to-payment";

// Mock modules BEFORE importing
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
      links: {
        forget_password: true,
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
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        {component}
      </MemoryRouter>
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
  let lastConsoleOutput;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    axios.mockClear();
    axios.mockReset(); // This is the key - fully reset axios mock

    // Clear storage
    sessionStorage.clear();
    localStorage.clear();

    originalError = console.error;
    lastConsoleOutput = null;
    console.error = (data) => {
      lastConsoleOutput = data;
    };
    /* eslint-enable no-console */
    props = createTestProps();
    props.configuration = getConfig("default", true);
    loadTranslation("en", "default");
  });

  afterEach(() => {
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
        <Router
          location={historyMock.location}
          navigator={historyMock}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
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

    const passwordInput = screen.getByLabelText(/^password$/i);
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
    mountComponent(props);

    const error1 = new Error("Request failed");
    error1.response = {
      data: {
        username: "username error",
        password: "password error",
        detail: "error details",
        non_field_errors: "non field errors",
      },
    };

    const error2 = new Error("Internal server error");
    error2.status = 500;
    error2.statusText = "Internal server error";
    error2.response = {
      data: {
        detail: "Internal server error",
      },
    };

    const error3 = new Error("Gateway Timeout");
    error3.response = {
      data: {},
    };
    error3.status = 504;
    error3.statusText = "Gateway Timeout";

    axios
      .mockImplementationOnce(() => Promise.reject(error1))
      .mockImplementationOnce(() => Promise.reject(error2))
      .mockImplementationOnce(() => Promise.reject(error3))
      .mockImplementationOnce(() => Promise.resolve());

    const spyToast = jest.spyOn(dependency.toast, "error");
    const form = screen.getByRole("form", {name: /login form/i});

    // First submit - field errors
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText(/username error/i)).toBeInTheDocument();
      expect(props.authenticate).not.toHaveBeenCalled();
      expect(lastConsoleOutput).not.toBe(null);
      expect(spyToast).toHaveBeenCalledTimes(1);
    });

    // Second submit - 500 error
    fireEvent.submit(form);
    await waitFor(() => {
      expect(props.authenticate).not.toHaveBeenCalled();
      expect(lastConsoleOutput).not.toBe(null);
      expect(spyToast).toHaveBeenCalledTimes(2);
    });

    // Third submit - 504 error
    fireEvent.submit(form);
    await waitFor(() => {
      expect(props.authenticate).not.toHaveBeenCalled();
      expect(lastConsoleOutput).not.toBe(null);
      expect(spyToast).toHaveBeenCalledTimes(3);
      lastConsoleOutput = null;
    });

    // Fourth submit - success
    fireEvent.submit(form);
    await waitFor(() => {
      expect(
        screen
          .queryAllByText(/error/i)
          .filter((el) => el.classList.contains("error")),
      ).toHaveLength(0);
      expect(props.authenticate).not.toHaveBeenCalled();
      expect(lastConsoleOutput).toBe(null);
      expect(spyToast).toHaveBeenCalledTimes(4);
    });
  });

  it("should execute setUserData if mobile phone verification needed", async () => {
    props.settings = {mobile_phone_verification: true};
    mountComponent(props);

    const testResponseData = {...responseData, is_verified: false};
    const testUserData = {...userData, is_verified: false};
    const error = new Error("Unauthorized");
    error.response = {
      status: 401,
      statusText: "unauthorized",
      data: testResponseData,
    };

    axios.mockImplementationOnce(() => Promise.reject(error));

    // Check phone input is present
    const phoneInput = screen.getByRole("textbox", {
      name: /mobile phone number/i,
    });
    expect(phoneInput).toHaveAttribute("type", "tel");
    expect(phoneInput).toHaveAttribute("id", "username");

    // Phone input may have default country code from react-phone-input-2
    expect(phoneInput.value).toMatch(/^\+?\d*$/);

    fireEvent.change(phoneInput, {
      target: {value: "+393660011333", name: "username"},
    });
    // Phone input auto-formats with spaces - check for the core digits
    expect(phoneInput.value.replace(/\s/g, "")).toContain("3660011333");

    const passwordInput = screen.getByLabelText(/^password$/i);
    fireEvent.change(passwordInput, {
      target: {value: "test password", name: "password"},
    });
    expect(passwordInput.value).toBe("test password");

    // Submit the form
    const form = screen.getByRole("form", {name: /login form/i});
    fireEvent.submit(form);

    // Wait for async operations
    await waitFor(() => {
      expect(props.setUserData).toHaveBeenCalledTimes(1);
      expect(props.authenticate).toHaveBeenCalledTimes(1);
    });
    expect(props.authenticate).toHaveBeenCalledWith(true);
    expect(props.setUserData).toHaveBeenCalledWith({
      ...testUserData,
      key: testUserData.auth_token,
      mustLogin: true,
    });
  });

  it("should authenticate normally with method bank_card", async () => {
    props.settings = {subscriptions: true};
    mountComponent(props);

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

    // Verify phone input is NOT present - username should be text type
    const usernameInput = screen.getByRole("textbox", {
      name: /email, phone number or username/i,
    });
    expect(usernameInput).toHaveAttribute("type", "text");

    // Fill in the form
    fireEvent.change(usernameInput, {
      target: {value: "tester", name: "username"},
    });
    expect(usernameInput).toHaveValue("tester");

    const passwordInput = screen.getByLabelText(/^password$/i);
    fireEvent.change(passwordInput, {
      target: {value: "test password", name: "password"},
    });
    expect(passwordInput.value).toBe("test password");

    // Submit the form
    const form = screen.getByRole("form", {name: /login form/i});
    fireEvent.submit(form);

    // Wait for async operations
    await waitFor(() => {
      expect(props.setUserData).toHaveBeenCalledTimes(1);
      expect(props.authenticate).toHaveBeenCalledTimes(1);
    });
    expect(props.authenticate).toHaveBeenCalledWith(true);
    expect(props.setUserData).toHaveBeenCalledWith({
      ...data,
      key: data.auth_token,
      mustLogin: true,
    });
  });

  it("should redirect to payment status if bank_card and not verified", async () => {
    props.settings = {subscriptions: true};
    mountComponent(props);

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

    const usernameInput = screen.getByRole("textbox", {
      name: /email, phone number or username/i,
    });
    fireEvent.change(usernameInput, {
      target: {value: "tester", name: "username"},
    });
    expect(usernameInput).toHaveValue("tester");

    const passwordInput = screen.getByLabelText(/^password$/i);
    fireEvent.change(passwordInput, {
      target: {value: "test password", name: "password"},
    });
    expect(passwordInput.value).toBe("test password");

    const form = screen.getByRole("form", {name: /login form/i});
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
    const phoneInput = screen.getByRole("textbox", {
      name: /mobile phone number/i,
    });
    expect(phoneInput).toHaveAttribute("type", "tel");
    expect(phoneInput).toHaveAttribute("id", "username");
  });

  it("username should be text field if mobile phone verification is off", async () => {
    props.settings = {mobile_phone_verification: false};
    const {container} = mountComponent(props);
    expect(container).toMatchSnapshot();
    const usernameInput = screen.getByRole("textbox", {
      name: /email, phone number or username/i,
    });
    expect(usernameInput).toHaveAttribute("type", "text");
    expect(usernameInput).toHaveAttribute("id", "username");
  });

  it("should not show phone_number field if auto_switch_phone_input is false", async () => {
    props.settings = {mobile_phone_verification: true};
    props.loginForm = {...loginForm};
    props.loginForm.input_fields.username.auto_switch_phone_input = false;
    const {container} = mountComponent(props);
    expect(container).toMatchSnapshot();
    const usernameInput = screen.getByRole("textbox", {
      name: /email, phone number or username/i,
    });
    expect(usernameInput).toHaveAttribute("type", "text");
    expect(usernameInput).toHaveAttribute("id", "username");
  });

  it("should execute setUserData and must not show any form errors if user is inactive", async () => {
    props.settings = {mobile_phone_verification: true};
    mountComponent(props);

    const data = {...userData};
    data.is_active = false;

    const error = new Error("Unauthorized");
    error.response = {
      status: 401,
      statusText: "unauthorized",
      data,
    };

    axios.mockImplementationOnce(() => Promise.reject(error));

    const spyToast = jest.spyOn(dependency.toast, "error");

    // Fill in the form
    const usernameInput = screen.getByRole("textbox", {
      name: /email, phone number or username/i,
    });
    fireEvent.change(usernameInput, {
      target: {value: "+393660011333", name: "username"},
    });

    const passwordInput = screen.getByLabelText(/^password$/i);
    fireEvent.change(passwordInput, {
      target: {value: "test password", name: "password"},
    });

    // Submit the form
    const form = screen.getByRole("form", {name: /login form/i});
    fireEvent.submit(form);

    // Wait for async operations to complete
    await waitFor(() => {
      expect(props.authenticate).not.toHaveBeenCalled();
      expect(props.setUserData).toHaveBeenCalledTimes(1);

      // Check no form errors are shown in the UI
      expect(
        screen
          .queryAllByText(/error/i)
          .filter((el) => el.classList?.contains("error")),
      ).toHaveLength(0);

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

    mountComponent(props);

    // The rememberMe checkbox is unchecked by default (value: false in config)
    // We want to keep it unchecked so token goes to sessionStorage
    // Don't click - just verify it's unchecked
    const rememberMeCheckbox = screen.getByRole("checkbox", {
      name: /remember me/i,
    });
    expect(rememberMeCheckbox).not.toBeChecked();

    // Submit the form
    const form = screen.getByRole("form", {name: /login form/i});
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
    expect(
      screen
        .queryAllByText(/error/i)
        .filter((el) => el.classList?.contains("error")),
    ).toHaveLength(0);
  });

  it("should show error toast when server error", async () => {
    mountComponent(props);

    const error = new Error("Internal server error");
    error.status = 500;
    error.statusText = "Internal server error";
    error.response = {
      data: {
        detail: "Internal server error",
      },
    };

    axios.mockImplementationOnce(() => Promise.reject(error));

    const errorMethod = jest.spyOn(dependency.toast, "error");

    // Submit the form
    const form = screen.getByRole("form", {name: /login form/i});
    fireEvent.submit(form);

    // Wait for async operations
    await waitFor(() => {
      expect(props.authenticate).not.toHaveBeenCalled();
      expect(lastConsoleOutput).not.toBe(null);
      expect(errorMethod).toHaveBeenCalled();
    });
    expect(errorMethod).toHaveBeenCalledWith("Internal server error");
  });

  it("should show error toast when connection refused or timeout", async () => {
    mountComponent(props);

    const error = new Error("Gateway Timeout");
    error.status = 504;
    error.statusText = "Gateway Timeout";
    error.response = {
      data: "Error occured while trying to proxy to: 0.0.0.0:8080/api/v1/radius/organization/default/account/token",
    };

    axios.mockImplementationOnce(() => Promise.reject(error));

    const errorMethod = jest.spyOn(dependency.toast, "error");

    // Submit the form
    const form = screen.getByRole("form", {name: /login form/i});
    fireEvent.submit(form);

    // Wait for async operations
    await waitFor(() => {
      expect(props.authenticate).not.toHaveBeenCalled();
      expect(lastConsoleOutput).not.toBe(null);
      expect(errorMethod).toHaveBeenCalled();
    });
    expect(errorMethod).toHaveBeenCalledWith("Login error occurred.");
  });

  it("should set mustLogin on login success", async () => {
    props.settings = {mobile_phone_verification: true};
    mountComponent(props);

    const error = new Error("Unauthorized");
    error.response = {
      status: 401,
      statusText: "unauthorized",
      data: responseData,
    };

    axios.mockImplementationOnce(() => Promise.reject(error));

    const usernameInput = screen.getByRole("textbox", {
      name: /email, phone number or username/i,
    });
    fireEvent.change(usernameInput, {
      target: {value: "+393660011333", name: "username"},
    });

    const passwordInput = screen.getByLabelText(/^password$/i);
    fireEvent.change(passwordInput, {
      target: {value: "test password", name: "password"},
    });

    const form = screen.getByRole("form", {name: /login form/i});
    fireEvent.submit(form);

    await waitFor(() => {
      expect(props.setUserData).toHaveBeenCalledTimes(1);
    });
    expect(props.setUserData).toHaveBeenCalledWith({
      ...userData,
      key: userData.auth_token,
      mustLogin: true,
    });
  });

  it("should call setTitle to set log in title", () => {
    mountComponent(props);
    expect(props.setTitle).toHaveBeenCalledWith("Log in", props.orgName);
  });

  it("should call handleAuthentication on social login / SAML", () => {
    const error = new Error("Request failed");
    error.response = {
      data: {
        username: "username error",
        password: "password error",
        detail: "error details",
        non_field_errors: "non field errors",
      },
    };

    axios.mockImplementationOnce(() => Promise.reject(error));

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
      key: userData.auth_token,
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
        key: userData.auth_token,
        mustLogin: true,
      });
    });
  });

  it("should show custom HTML", () => {
    mountComponent(props);
    expect(screen.queryByTestId("intro")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pre-html")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-container")).not.toBeInTheDocument();
    expect(screen.queryByTestId("after-html")).not.toBeInTheDocument();

    const htmlProps = {...props};
    htmlProps.loginForm = {
      ...htmlProps.loginForm,
      pre_html: {en: "<div class='pre-html'></div>"},
      help_html: {en: "<div class='help-html'></div>"},
      after_html: {en: "<div class='after-html'></div>"},
    };
    mountComponent(htmlProps);
    // Custom HTML is rendered with data-testid matching the className
    expect(screen.getByTestId("pre-html")).toBeInTheDocument();
    expect(screen.getByTestId("help-container")).toBeInTheDocument();
    expect(screen.getByTestId("after-html")).toBeInTheDocument();
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
    const view = mountComponent(props);
    expect(screen.queryByTestId("cp-login-form")).not.toBeInTheDocument();
    view.unmount();

    // Re-render with radius_realms enabled
    props.settings.radius_realms = true;
    props.captivePortalLoginForm.additional_fields = [
      {name: "zone", value: "zone_value"},
    ];

    mountComponent(props);

    // Check the captive portal form exists using testid
    const cpForm = screen.getByTestId("cp-login-form");
    expect(cpForm).toBeInTheDocument();
    expect(cpForm).toHaveAttribute("action", "https://radius-proxy/login/");
    expect(cpForm).toHaveAttribute("method", "POST");
    expect(cpForm).toHaveClass("hidden");

    // Check hidden input fields exist by checking form has correct inputs
    // Hidden inputs don't have accessible roles, so we verify the form's HTML content
    // Verify the form contains inputs with the expected names and values
    expect(cpForm).toContainHTML('type="hidden"');
    expect(cpForm).toContainHTML('name="username"');
    expect(cpForm).toContainHTML('name="password"');
    expect(cpForm).toContainHTML('name="zone"');
    expect(cpForm).toContainHTML('value="zone_value"');

    // Fill in the visible login form fields
    const visibleUsernameInput = screen.getByRole("textbox", {
      name: /email, phone number or username/i,
    });
    const visiblePasswordInput = screen.getByLabelText(/^password$/i);

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
    const mainForm = screen.getByRole("form", {name: /^login form$/i});
    fireEvent.submit(mainForm);

    // Wait for captive portal form to be submitted
    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalled();
    });
  });
});
