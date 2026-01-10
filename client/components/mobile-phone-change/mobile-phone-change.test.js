import axios from "axios";
import {render, screen, waitFor, fireEvent} from "@testing-library/react";
import "@testing-library/jest-dom";
import {Cookies} from "react-cookie";
import {toast} from "react-toastify";
import {Provider} from "react-redux";
import {Routes, Route} from "react-router-dom";
import React from "react";
import {TestRouter} from "../../test-utils";
import loadTranslation from "../../utils/load-translation";
import tick from "../../utils/tick";
import getConfig from "../../utils/get-config";
import MobilePhoneChange from "./mobile-phone-change";
import validateToken from "../../utils/validate-token";
import LoadingContext, {loadingContextValue} from "../../utils/loading-context";

// Mock modules BEFORE importing
const mockConfig = {
  slug: "default",
  name: "default name",
  default_language: "en",
  components: {
    phone_number_change_form: {
      input_fields: {},
      buttons: {
        cancel: true,
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
  settings: {
    mobile_phone_verification: true,
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

jest.mock("../../utils/get-config", () => ({
  __esModule: true,
  default: jest.fn(() => mockConfig),
}));
jest.mock("../../utils/validate-token");
jest.mock("../../utils/load-translation");
jest.mock("../../utils/submit-on-enter");
jest.mock("axios");

function StatusMock() {
  return <div data-testid="status-mock" />;
}

const createTestProps = (props, configName = "test-org-2") => {
  const conf = getConfig(configName);
  const componentConf = conf.components.phone_number_change_form;
  componentConf.input_fields = {
    phone_number: conf.components.registration_form.input_fields.phone_number,
  };
  return {
    phone_number_change: componentConf,
    settings: conf.settings,
    orgSlug: conf.slug,
    orgName: conf.name,
    cookies: new Cookies(),
    logout: jest.fn(),
    setUserData: jest.fn(),
    userData: {},
    setTitle: jest.fn(),
    language: "en",
    navigate: jest.fn(),
    // needed for subcomponents
    configuration: conf,
    ...props,
  };
};

const defaultConfig = getConfig("default", true);

const createMockStore = () => {
  const state = {
    organization: {
      configuration: {
        ...defaultConfig,
        slug: "default",
        components: {
          ...defaultConfig.components,
          contact_page: {
            email: "support.org",
            helpdesk: "+1234567890",
            socialLinks: [],
          },
        },
      },
    },
    language: "en",
  };

  return {
    subscribe: () => {},
    dispatch: () => {},
    getState: () => state,
  };
};

const renderWithProviders = (component, contextValue = loadingContextValue) =>
  render(
    <Provider store={createMockStore()}>
      <LoadingContext.Provider value={contextValue}>
        <TestRouter>
          {component}
        </TestRouter>
      </LoadingContext.Provider>
    </Provider>,
  );

describe("<MobilePhoneChange /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const {container} = renderWithProviders(<MobilePhoneChange {...props} />);
    expect(container).toMatchSnapshot();
  });
});

const mountComponent = (props) => {
  const mockedStore = {
    subscribe: () => {},
    dispatch: () => {},
    getState: () => ({
      organization: {
        configuration: {
          ...props.configuration,
          components: {
            ...props.configuration.components,
            contact_page: props.configuration.components.contact_page || {},
          },
        },
      },
      language: props.language,
    }),
  };

  return render(
    <Provider store={mockedStore}>
      <TestRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/test-org-2/status" element={<StatusMock />} />
          <Route path="*" element={<MobilePhoneChange {...props} />} />
        </Routes>
      </TestRouter>
    </Provider>,
  );
};

const userData = {
  response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
  radius_user_token: "o6AQLY0aQjD3yuihRKLknTn8krcQwuy2Av6MCsFB",
  username: "tester@tester.com",
  is_active: false,
  phone_number: "+393660011222",
};

describe("Change Phone Number: standard flow", () => {
  let props;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    axios.mockReset();
    props = createTestProps();
    validateToken.mockClear();
    // Spy on console.error to track calls
    consoleErrorSpy = jest
      .spyOn(global.console, "error")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    // Re-setup the getConfig mock after clearing
    getConfig.mockImplementation(() => mockConfig);
  });

  it("should render successfully", async () => {
    validateToken.mockReturnValue(true);
    props.userData = userData;
    loadTranslation("en", "default");
    mountComponent(props);

    expect(
      screen.getByRole("textbox", {name: /mobile phone number/i}),
    ).toBeInTheDocument();
    expect(screen.getByRole("form")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {name: /change your phone number/i}),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", {name: /cancel/i})).toBeInTheDocument();

    // Wait for phone number to be populated from userData (componentDidMount)
    await waitFor(() => {
      const phoneInput = screen.getByRole("textbox", {
        name: /mobile phone number/i,
      });
      // Phone input formats the number, so check for the core digits
      expect(phoneInput.value.replace(/[\s-]/g, "")).toContain("393660011222");
    });
  });

  it("should change phone number successfully", async () => {
    validateToken.mockReturnValue(true);
    jest.spyOn(toast, "success");
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: null,
      }),
    );

    mountComponent(props);

    const phoneInput = screen.getByRole("textbox", {
      name: /mobile phone number/i,
    });
    fireEvent.change(phoneInput, {
      target: {value: "+393660011333", name: "phone_number"},
    });

    expect(phoneInput.value.replace(/[\s-]/g, "")).toContain("393660011333");

    const form = screen.getByRole("form");
    fireEvent.submit(form);

    await tick();

    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(props.navigate).toHaveBeenCalledWith(
      `/${props.orgSlug}/mobile-phone-verification`,
    );
    expect(props.setUserData).toHaveBeenCalledTimes(1);
    expect(props.setUserData).toHaveBeenCalledWith({
      is_verified: false,
      phone_number: expect.stringContaining("393660011333"),
    });
  });

  it("should render PhoneInput lazily and handlers should work correctly", async () => {
    props.userData = userData;
    renderWithProviders(<MobilePhoneChange {...props} />);

    // Wait for PhoneInput to load
    await waitFor(() => {
      expect(
        screen.getByRole("textbox", {name: /mobile phone number/i}),
      ).toBeInTheDocument();
    });

    const phoneInput = screen.getByRole("textbox", {
      name: /mobile phone number/i,
    });
    expect(phoneInput).toHaveAttribute("id", "phone-number");
    // Placeholder may be ttag key since translations are mocked
    expect(phoneInput).toHaveAttribute("placeholder");

    // Test onChange
    fireEvent.change(phoneInput, {
      target: {value: "+911234567890", name: "phone_number"},
    });

    expect(phoneInput.value.replace(/[\s-]/g, "")).toContain("911234567890");
  });

  it("should load fallback before PhoneInput and handlers should work correctly", async () => {
    renderWithProviders(<MobilePhoneChange {...props} />);

    // Check fallback input exists immediately
    const fallbackInput = screen.getByRole("textbox", {
      name: /mobile phone number/i,
    });
    expect(fallbackInput).toBeInTheDocument();
    expect(fallbackInput).toHaveClass("form-control", "input");
    // Placeholder may be ttag key since translations are mocked
    expect(fallbackInput).toHaveAttribute("placeholder");

    // Test onChange on fallback
    fireEvent.change(fallbackInput, {
      target: {value: "+911234567890", name: "phone_number"},
    });

    // Phone input may format the value
    expect(fallbackInput.value.replace(/[\s-]/g, "")).toContain("911234567890");
  });

  it("should render field error", async () => {
    jest.spyOn(toast, "success");

    const error = new Error("Request failed with status code 400");
    error.response = {
      status: 400,
      statusText: "OK",
      data: {
        phone_number: [
          "The new phone number must be different than the old one.",
        ],
      },
    };

    axios.mockImplementationOnce(() => Promise.reject(error));

    mountComponent(props);

    const form = screen.getByRole("form");
    fireEvent.submit(form);

    await tick();

    expect(toast.success).not.toHaveBeenCalled();

    // Check error message appears
    await waitFor(() => {
      expect(
        screen.getByText(
          /The new phone number must be different than the old one/i,
        ),
      ).toBeInTheDocument();
    });
  });

  it("should render nonField error", async () => {
    jest.spyOn(toast, "success");

    const error = new Error("Request failed with status code 400");
    error.response = {
      status: 400,
      statusText: "OK",
      data: {
        non_field_errors: ["Maximum daily limit reached."],
      },
    };
    axios.mockImplementationOnce(() => Promise.reject(error));

    mountComponent(props);

    const form = screen.getByRole("form");
    fireEvent.submit(form);

    await tick();

    expect(toast.success).not.toHaveBeenCalled();

    // Check error message appears
    await waitFor(() => {
      expect(
        screen.getByText(/Maximum daily limit reached/i),
      ).toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("should cancel successfully", async () => {
    jest.spyOn(toast, "success");
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: null,
      }),
    );

    mountComponent(props);

    const cancelButton = screen.queryByRole("link", {name: /cancel/i});
    expect(cancelButton).toBeInTheDocument();
    fireEvent.click(cancelButton);

    expect(toast.success).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("should set title", async () => {
    mountComponent(props);

    expect(props.setTitle).toHaveBeenCalledWith(
      "Change mobile number",
      props.orgName,
    );
  });
});

describe("Change Phone Number: corner cases", () => {
  let props;
  const mockAxios = (responseData = {}) => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: {
          response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
          radius_user_token: "o6AQLY0aQjD3yuihRKLknTn8krcQwuy2Av6MCsFB",
          username: "tester@tester.com",
          is_active: false,
          phone_number: "+393660011222",
          ...responseData,
        },
      }),
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.mockReset();
    props = createTestProps();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    // Re-setup the getConfig mock after clearing
    getConfig.mockImplementation(() => mockConfig);
  });

  it("should recognize if user is active", async () => {
    validateToken.mockReturnValue(true);
    const activeUserData = {...userData, is_active: true};
    props.userData = activeUserData;

    mountComponent(props);

    // Wait for phone number to be populated from userData (componentDidMount)
    await waitFor(() => {
      const phoneInput = screen.getByRole("textbox", {
        name: /mobile phone number/i,
      });
      // Phone input formats the number
      expect(phoneInput.value.replace(/[\s-]/g, "")).toContain("393660011222");
    });
    expect(props.setUserData).not.toHaveBeenCalled();
  });

  it("should not redirect if mobile_phone_verification is enabled", async () => {
    mockAxios();
    props.settings.mobile_phone_verification = true;

    mountComponent(props);

    expect(screen.queryByTestId("status-mock")).not.toBeInTheDocument();
  });

  it("shouldn't redirect if user is active and mobile verificaton is true", async () => {
    validateToken.mockReturnValue(true);
    props.userData = {...userData, is_active: true};
    props.settings.mobile_phone_verification = true;

    mountComponent(props);

    expect(screen.queryByTestId("status-mock")).not.toBeInTheDocument();
  });

  it("should not redirect if user registration method is mobile_phone", async () => {
    validateToken.mockReturnValue(true);
    props.userData = {
      ...userData,
      is_active: true,
      method: "mobile_phone",
    };
    props.settings.mobile_phone_verification = true;

    mountComponent(props);

    expect(screen.queryByTestId("status-mock")).not.toBeInTheDocument();
  });

  it("should validate token", async () => {
    mountComponent(props);

    expect(validateToken).toHaveBeenCalledWith(
      props.cookies,
      props.orgSlug,
      props.setUserData,
      props.userData,
      props.logout,
      props.language,
    );
  });

  it("should redirect if mobile_phone_verification disabled", async () => {
    props.settings.mobile_phone_verification = false;

    mountComponent(props);

    // Component renders Navigate component which triggers routing
    // The form should not be present when redirecting
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("should redirect if user registration method is not mobile_phone", async () => {
    validateToken.mockReturnValue(true);
    props.userData = {
      ...userData,
      is_active: true,
      method: "saml",
    };
    props.settings.mobile_phone_verification = true;

    mountComponent(props);

    // Component renders Navigate component which triggers routing
    // The form should not be present when redirecting
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });
});
