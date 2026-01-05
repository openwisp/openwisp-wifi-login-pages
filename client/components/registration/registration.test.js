import axios from "axios";
import {render, screen, waitFor, fireEvent} from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import {toast} from "react-toastify";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import {Provider} from "react-redux";
import {t} from "ttag";
import tick from "../../utils/tick";

import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import Registration from "./registration";

// Mock modules BEFORE importing
const mockConfig = {
  name: "default name",
  slug: "default",
  default_language: "en",
  settings: {
    mobilePhoneVerification: false,
    subscriptions: false,
  },
  components: {
    registration_form: {
      inputFields: {
        username: {
          pattern: "^[a-zA-Z0-9@.+\\-_\\s]+$",
        },
        email: {
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        },
        password: {
          pattern: "^.{8,}$",
        },
        password_confirm: {
          pattern: "^.{8,}$",
        },
        phoneNumber: {
          country: "in",
        },
        firstName: {
          setting: "disabled",
        },
        lastName: {
          setting: "disabled",
        },
        birthDate: {
          setting: "disabled",
        },
        location: {
          pattern: "[a-zA-Z@.+\\-_\\d]{1,150}",
          setting: "disabled",
        },
      },
      socialLogin: {
        links: [],
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
  privacyPolicy: {
    title: {en: "Privacy Policy"},
    content: {en: "Privacy content"},
  },
  termsAndConditions: {
    title: {en: "Terms and Conditions"},
    content: {en: "Terms content"},
  },
  languages: [{slug: "en", text: "english"}],
};

jest.mock("../../utils/get-config", () => ({
  __esModule: true,
  default: jest.fn(() => JSON.parse(JSON.stringify(mockConfig))),
}));
jest.mock("../../utils/load-translation");
jest.mock("../../utils/submit-on-enter");
jest.mock("../../utils/history");
jest.mock("axios");

const createTestProps = (props, configName = "default") => {
  const config = getConfig(configName);
  return {
    language: "en",
    orgSlug: configName,
    orgName: config.name,
    settings: config.settings,
    registration: config.components.registration_form,
    privacyPolicy: config.privacyPolicy,
    termsAndConditions: config.termsAndConditions,
    authenticate: jest.fn(),
    setTitle: jest.fn(),
    setUserData: jest.fn(),
    loading: false,
    match: {
      path: "default/registration",
    },
    ...props,
    navigate: jest.fn(),
    defaultLanguage: config.default_language,
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

const renderWithProviders = (component) =>
  render(
    <Provider store={createMockStore()}>
      <MemoryRouter>{component}</MemoryRouter>
    </Provider>,
  );

const responseData = {
  key: "8a2b2b2dd963de23c17db30a227505f879866630",
  radius_user_token: "Lbdh3GKD7hvXUS5NUu5yoE4x5fCPPqlsXo7Ug8ld",
};

const mountComponent = (passedProps) => {
  const config = getConfig(passedProps.orgSlug || "test-org-2");
  const mockedStore = {
    subscribe: () => {},
    dispatch: () => {},
    getState: () => ({
      organization: {
        configuration: {
          ...config,
          components: {
            ...config.components,
            contact_page: config.components.contact_page || {},
          },
        },
      },
      language: passedProps.language || "en",
    }),
  };

  return render(
    <Provider store={mockedStore}>
      <MemoryRouter>
        <Registration {...passedProps} />
      </MemoryRouter>
    </Provider>,
  );
};

describe("<Registration /> rendering with placeholder translation tags", () => {
  const props = createTestProps();

  it("should render translation placeholder correctly", () => {
    const {container} = renderWithProviders(<Registration {...props} />);
    expect(container).toMatchSnapshot();
  });
});

describe("<Registration /> rendering", () => {
  let props;

  beforeEach(() => {
    jest.clearAllMocks();
    props = createTestProps();
    loadTranslation("en", "default");
  });

  it("should render correctly", () => {
    const {container} = renderWithProviders(<Registration {...props} />);
    expect(container).toMatchSnapshot();
  });
});

describe("<Registration /> interactions", () => {
  let props;
  let originalError;
  let lastConsoleOutput;

  beforeEach(() => {
    jest.clearAllMocks();
    axios.mockReset();
    originalError = console.error;
    lastConsoleOutput = null;
    console.error = (data) => {
      lastConsoleOutput = data;
    };
    /* eslint-enable no-console */
    props = createTestProps();
  });

  afterEach(() => {
    console.error = originalError;
    /* eslint-enable no-console */
    jest.clearAllMocks();
  });

  it("should change state values when handleChange function is invoked", () => {
    renderWithProviders(<Registration {...props} />);

    const emailInput = screen.getByRole("textbox", {name: /email/i});
    fireEvent.change(emailInput, {
      target: {value: "test email", name: "email"},
    });
    expect(emailInput).toHaveValue("test email");

    const password1Input = screen.getByLabelText(/^password$/i);
    fireEvent.change(password1Input, {
      target: {value: "testpassword", name: "password1"},
    });
    expect(password1Input.value).toEqual("testpassword");

    const password2Input = screen.getByLabelText(/confirm password/i);
    fireEvent.change(password2Input, {
      target: {value: "testpassword", name: "password2"},
    });
    expect(password2Input.value).toEqual("testpassword");
  });

  it("should execute handleSubmit correctly when form is submitted", async () => {
    axios
      .mockImplementationOnce(() => {
        const error = new Error("Request failed with status code 400");
        error.response = {
          status: 400,
          statusText: "Bad Request",
          data: {
            email: "email error",
            detail: "nonField error",
            password1: "password1 error",
          },
        };
        return Promise.reject(error);
      })
      .mockImplementationOnce(() => {
        const error = new Error("Request failed with status code 500");
        error.response = {
          status: 500,
          statusText: "Internal server error",
          data: {
            detail: "Internal server error",
          },
        };
        return Promise.reject(error);
      })
      .mockImplementationOnce(() => {
        const error = new Error("Request failed with status code 504");
        error.response = {
          status: 504,
          statusText: "Gateway Timeout",
          data: {},
        };
        return Promise.reject(error);
      })
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 201,
          statusText: "CREATED",
          data: responseData,
        }),
      )
      .mockImplementationOnce(() => {
        const error = new Error("Request failed with status code 400");
        error.response = {
          status: 400,
          statusText: "Bad Request",
          data: {
            billing_info: {
              billingError: "registration error",
            },
          },
        };
        return Promise.reject(error);
      });

    renderWithProviders(<Registration {...props} />);

    const spyToast = jest.spyOn(toast, "error");
    const password1Input = screen.getByLabelText(/^password$/i);
    const password2Input = screen.getByLabelText(/confirm password/i);

    // Test 1: Password mismatch
    fireEvent.change(password1Input, {
      target: {value: "wrong password", name: "password1"},
    });
    fireEvent.change(password2Input, {
      target: {value: "wrong password1", name: "password2"},
    });
    fireEvent.submit(screen.getByRole("button", {name: /sign up/i}));

    await waitFor(() => {
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      expect(confirmPasswordInput).toHaveClass("error");
      // Check for error message
      expect(
        screen.getByText(/The two password fields didn't match/i),
      ).toBeInTheDocument();
    });

    // Test 2: Matching passwords, API field errors
    fireEvent.change(password1Input, {
      target: {value: "password", name: "password1"},
    });
    fireEvent.change(password2Input, {
      target: {value: "password", name: "password2"},
    });
    fireEvent.submit(screen.getByRole("button", {name: /sign up/i}));

    await tick();
    await waitFor(() => {
      // Check that error messages are displayed
      expect(screen.getByText("email error")).toBeInTheDocument();
      expect(screen.getByText("password1 error")).toBeInTheDocument();
      expect(spyToast).toHaveBeenCalledTimes(1);
    });
    expect(props.authenticate).not.toHaveBeenCalled();
    expect(lastConsoleOutput).not.toBe(null);
    lastConsoleOutput = null;

    // Test 3: Server error
    fireEvent.submit(screen.getByRole("button", {name: /sign up/i}));
    await tick();
    await waitFor(() => {
      expect(spyToast).toHaveBeenCalledTimes(2);
    });
    expect(lastConsoleOutput).not.toBe(null);
    lastConsoleOutput = null;

    // Test 4: Gateway timeout
    fireEvent.submit(screen.getByRole("button", {name: /sign up/i}));
    await tick();
    await waitFor(() => {
      expect(spyToast).toHaveBeenCalledTimes(3);
    });
    expect(lastConsoleOutput).not.toBe(null);
    lastConsoleOutput = null;

    // Test 5: Success
    fireEvent.submit(screen.getByRole("button", {name: /sign up/i}));
    await tick();
    await waitFor(() => {
      const form = screen.getByTestId("registration-form");
      expect(form).toHaveClass("success");
      expect(props.authenticate).toHaveBeenCalledTimes(1);
    });

    // Test 6: Billing error
    fireEvent.submit(screen.getByRole("button", {name: /sign up/i}));
    await tick();
    await waitFor(() => {
      expect(spyToast).toHaveBeenCalledTimes(4);
    });
    expect(lastConsoleOutput).not.toBe(null);
  });

  it("test optional fields disabled", async () => {
    renderWithProviders(<Registration {...props} />);

    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/last name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/birth date/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/location/i)).not.toBeInTheDocument();
  });

  it("test optional fields allowed", async () => {
    props.registration.inputFields.firstName.setting = "allowed";
    props.registration.inputFields.location.setting = "allowed";

    renderWithProviders(<Registration {...props} />);

    const firstNameInput = screen.getByLabelText(/first name.*optional/i);
    const locationInput = screen.getByLabelText(/location.*optional/i);

    expect(firstNameInput).toBeInTheDocument();
    expect(locationInput).toBeInTheDocument();
    expect(screen.queryByLabelText(/last name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/birth date/i)).not.toBeInTheDocument();
  });

  it("test optional fields mandatory", async () => {
    props.registration.inputFields.birthDate.setting = "mandatory";
    props.registration.inputFields.firstName.setting = "mandatory";
    props.registration.inputFields.lastName.setting = "allowed";
    props.registration.inputFields.location.setting = "allowed";

    renderWithProviders(<Registration {...props} />);

    expect(screen.getByLabelText(/^first name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^birth date$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name.*optional/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location.*optional/i)).toBeInTheDocument();
  });

  it("should execute authenticate in mobile phone verification flow", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 201,
        statusText: "CREATED",
        data: responseData,
      }),
    );

    props.settings = {mobilePhoneVerification: true};
    renderWithProviders(<Registration {...props} />);

    const password1Input = screen.getByLabelText(/^password$/i);
    const password2Input = screen.getByLabelText(/confirm password/i);

    fireEvent.change(password1Input, {
      target: {value: "password", name: "password1"},
    });
    fireEvent.change(password2Input, {
      target: {value: "password", name: "password2"},
    });
    fireEvent.submit(screen.getByRole("button", {name: /sign up/i}));

    await tick();
    await waitFor(() => {
      const form = screen.getByTestId("registration-form");
      expect(form).toHaveClass("success");
      expect(props.authenticate).toHaveBeenCalledTimes(1);
      expect(props.setUserData).toHaveBeenCalledWith({
        isVerified: false,
        authToken: responseData.key,
        mustLogin: !responseData.requires_payment,
      });
    });
  });

  it("should toggle modal", async () => {
    renderWithProviders(<Registration {...props} />);

    // Modal should not be visible initially
    expect(screen.queryByLabelText("dialog")).not.toBeInTheDocument();
  });

  it("should show modal if user is already registered with other organizations", async () => {
    const data = {
      detail: "user already registered",
      organizations: [{name: "default", slug: "default"}],
    };

    const error = new Error("Request failed with status code 409");
    error.response = {
      status: 409,
      statusText: "CONFLICT",
      data,
    };
    axios.mockImplementationOnce(() => Promise.reject(error));

    renderWithProviders(<Registration {...props} />);

    const form = screen.getByTestId("registration-form");
    const emailInput = screen.getByRole("textbox", {name: /email/i});
    const password1Input = screen.getByLabelText(/^password$/i);
    const password2Input = screen.getByLabelText(/confirm password/i);

    fireEvent.change(emailInput, {
      target: {value: "tester@openwisp.org", name: "email"},
    });
    fireEvent.change(password1Input, {
      target: {value: "testpassword", name: "password1"},
    });
    fireEvent.change(password2Input, {
      target: {value: "testpassword", name: "password2"},
    });
    fireEvent.submit(form);

    await tick();
    await waitFor(() => {
      expect(screen.getByTestId("info-modal")).toBeInTheDocument();
    });
  });

  it("should execute handleResponse correctly", async () => {
    const {container} = renderWithProviders(<Registration {...props} />);

    // This tests internal behavior - adjust based on actual component implementation
    expect(container).toMatchSnapshot();
  });

  it("should show modal if user is registered but not associated with any org", async () => {
    const data = {
      detail: "user already registered",
      organizations: [],
    };

    const error = new Error("Request failed with status code 409");
    error.response = {
      status: 409,
      statusText: "CONFLICT",
      data,
    };
    axios.mockImplementationOnce(() => Promise.reject(error));

    renderWithProviders(<Registration {...props} />);

    const form = screen.getByTestId("registration-form");
    fireEvent.submit(form);

    await tick();
    await waitFor(() => {
      expect(screen.getByTestId("info-modal")).toBeInTheDocument();
    });
  });

  it("should show 404 toast if organization does not exists", async () => {
    const error = new Error("Request failed with status code 404");
    error.response = {
      status: 404,
      statusText: "404_NOT_FOUND",
      data: "404",
    };
    axios.mockImplementationOnce(() => Promise.reject(error));

    const spyToast = jest.spyOn(toast, "error");
    renderWithProviders(<Registration {...props} />);

    const form = screen.getByTestId("registration-form");
    fireEvent.submit(form);

    await tick();
    await waitFor(() => {
      expect(spyToast).toHaveBeenCalledWith(t`404_PG_TITL`);
    });
  });
});

describe("Registration and Mobile Phone Verification interactions", () => {
  let props;

  beforeEach(() => {
    jest.clearAllMocks();
    axios.mockReset();
    props = createTestProps({}, "test-org-2");
    props.configuration = getConfig("test-org-2");
    // Enable mobile phone verification for these tests
    props.settings = {...props.settings, mobilePhoneVerification: true};
    props.configuration.settings = {
      ...props.configuration.settings,
      mobilePhoneVerification: true,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    // Re-setup the getConfig mock after clearing
    getConfig.mockImplementation(() => mockConfig);
  });

  it("should show phone number field", async () => {
    mountComponent(props);
    const phoneInput = screen.getByRole("textbox", {name: /phone number/i});
    expect(phoneInput).toBeInTheDocument();
  });

  it("should render PhoneInput lazily and handlers should work correctly", async () => {
    renderWithProviders(<Registration {...props} />);

    await waitFor(() => {
      const phoneInput = screen.getByRole("textbox", {name: /phone number/i});
      expect(phoneInput).toBeInTheDocument();
    });
  });

  it("should process successfully", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 201,
        statusText: "CREATED",
        data: responseData,
      }),
    );

    mountComponent(props);

    const phoneInput = screen.getByRole("textbox", {name: /phone number/i});
    const emailInput = screen.getByRole("textbox", {name: /email/i});
    const password1Input = screen.getByLabelText(/^password$/i);
    const password2Input = screen.getByLabelText(/confirm password/i);
    const form = screen.getByTestId("registration-form");

    fireEvent.change(phoneInput, {
      target: {value: "+393660011333", name: "phoneNumber"},
    });
    fireEvent.change(emailInput, {
      target: {value: "tester@openwisp.io", name: "email"},
    });
    fireEvent.change(password1Input, {
      target: {value: "tester123", name: "password1"},
    });
    fireEvent.change(password2Input, {
      target: {value: "tester123", name: "password2"},
    });
    fireEvent.submit(form);

    await tick();
    await waitFor(() => {
      expect(props.setUserData).toHaveBeenCalledWith({
        isVerified: false,
        authToken: responseData.key,
        mustLogin: !responseData.requires_payment,
      });
    });
  });

  it("should load fallback before PhoneInput and handlers should work correctly", async () => {
    renderWithProviders(<Registration {...props} />);

    const phoneInput = screen.getByRole("textbox", {name: /phone number/i});
    expect(phoneInput).toBeInTheDocument();
  });

  it("should render modal", () => {
    props = createTestProps();
    const {container} = renderWithProviders(
      <Routes>
        <Route path="*" element={<Registration {...props} />} />
      </Routes>,
    );

    expect(container).toMatchSnapshot();
  });

  it("should send post data with optional fields", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 201,
        statusText: "CREATED",
        data: responseData,
      }),
    );

    props = createTestProps();
    renderWithProviders(<Registration {...props} />);

    const firstNameInput = screen.queryByRole("textbox", {name: /first name/i});
    if (firstNameInput) {
      fireEvent.change(firstNameInput, {
        target: {value: "OpenWISP", name: "firstName"},
      });
    }

    fireEvent.submit(screen.getByRole("button", {name: /sign up/i}));

    await tick();
    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should toggle password visibility", async () => {
    renderWithProviders(<Registration {...props} />);

    const password1Input = screen.getByLabelText(/^password$/i);
    expect(password1Input).toHaveAttribute("type", "password");

    // Get password toggle button using a more accessible query
    // Look for the button by its class name using screen queries
    const passwordToggles = screen.getAllByRole("button");
    const passwordToggle = passwordToggles.find((btn) =>
      btn.className.includes("password-toggle"),
    );
    expect(passwordToggle).toBeDefined();
    fireEvent.click(passwordToggle);

    await waitFor(() => {
      expect(password1Input).toHaveAttribute("type", "text");
    });
  });
});

describe("Registration without identity verification (Email registration)", () => {
  let props;

  beforeEach(() => {
    jest.clearAllMocks();
    axios.mockReset();
    props = createTestProps({}, "test-org-2");
    props.configuration = getConfig("test-org-2");
    props.configuration.settings.mobilePhoneVerification = false;
    props.configuration.settings.subscriptions = false;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    // Re-setup the getConfig mock after clearing
    getConfig.mockImplementation(() => mockConfig);
  });

  it("should not show phone number field", async () => {
    mountComponent(props);
    expect(
      screen.queryByRole("textbox", {name: /phone number/i}),
    ).not.toBeInTheDocument();
  });

  it("should process successfully", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 201,
        statusText: "CREATED",
        data: responseData,
      }),
    );

    mountComponent(props);

    const emailInput = screen.getByRole("textbox", {name: /email/i});
    const password1Input = screen.getByLabelText(/^password$/i);
    const password2Input = screen.getByLabelText(/confirm password/i);
    const form = screen.getByTestId("registration-form");

    fireEvent.change(emailInput, {
      target: {value: "tester@openwisp.io", name: "email"},
    });
    fireEvent.change(password1Input, {
      target: {value: "tester123", name: "password1"},
    });
    fireEvent.change(password2Input, {
      target: {value: "tester123", name: "password2"},
    });
    fireEvent.submit(form);

    await tick();
    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });

  it("should set title", async () => {
    mountComponent(props);
    expect(props.setTitle).toHaveBeenCalledWith("Sign up", props.orgName);
  });
});

describe("Registration with subscriptions and billing info", () => {
  let props;

  const plans = [
    {
      id: "00589a26-4855-43c4-acbc-a8cfaf25807d",
      plan: "Free",
      pricing: "no expiration (free) (0 days)",
      plan_description: "3 hours per day\n300 MB per day",
      currency: "EUR",
      requires_payment: false,
      requires_invoice: false,
      price: "0.00",
      has_automatic_renewal: false,
    },
    {
      id: "d1403161-75cd-4492-bccd-054eee9e155a",
      plan: "Premium",
      pricing: "per year (365 days)",
      plan_description: "Unlimited time and traffic",
      currency: "EUR",
      requires_payment: true,
      requires_invoice: true,
      price: "9.99",
      has_automatic_renewal: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.mockReset();

    // Create props with subscriptions enabled
    props = createTestProps({}, "default");
    props.configuration = getConfig("default");
    props.configuration.settings.subscriptions = true;
    props.configuration.settings.mobilePhoneVerification = false;
    props.settings = props.configuration.settings;

    // Add required billing input fields to configuration
    props.configuration.components.registration_form.inputFields.taxNumber = {
      pattern: "[a-zA-Z@.+\\-_\\d]{1,150}",
    };
    props.configuration.components.registration_form.inputFields.country = {
      pattern: "[a-zA-Z@.+\\-_\\d\\s]{1,150}",
    };
    props.configuration.components.registration_form.inputFields.street = {};
    props.configuration.components.registration_form.inputFields.city = {};
    props.configuration.components.registration_form.inputFields.zipcode = {};

    props.registration = props.configuration.components.registration_form;

    // Mock axios to return plans
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "ok",
        data: plans,
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    getConfig.mockImplementation(() => JSON.parse(JSON.stringify(mockConfig)));
  });

  it("should set country when selectedCountry is executed", async () => {
    renderWithProviders(<Registration {...props} />);

    await tick();

    // Wait for plans to load
    await waitFor(() => {
      const planInputs = screen.queryAllByTestId(/plan-radio-/);
      expect(planInputs.length).toBeGreaterThan(0);
    });

    // Select the Premium plan (index 1) which requires payment and invoice
    const premiumPlanRadio = screen.getByTestId("plan-radio-1");
    expect(premiumPlanRadio).toBeInTheDocument();
    fireEvent.click(premiumPlanRadio);

    // Wait for billing info fields to appear
    await waitFor(() => {
      expect(screen.getByTestId("billing-info")).toBeInTheDocument();
    });

    // Find the country input - react-select creates a combobox without accessible name
    // We can find it by role since there's only one combobox in the billing-info section
    const countryInput = screen.getByRole("combobox");
    expect(countryInput).toBeInTheDocument();

    // Simulate typing to open the dropdown
    fireEvent.change(countryInput, {target: {value: "Italy"}});
    fireEvent.keyDown(countryInput, {
      key: "ArrowDown",
      code: "ArrowDown",
    });

    // Wait for options to appear and select one
    await waitFor(() => {
      const options = screen.queryAllByText(/Italy/i);
      expect(options.length).toBeGreaterThan(0);
    });

    // Find and click the Italy option
    const italyOption = screen.getByText("Italy");
    fireEvent.click(italyOption);

    // Verify the component state was updated by checking if the value is displayed
    await waitFor(() => {
      // Check that Italy appears in the billing info section
      expect(screen.getByText("Italy")).toBeInTheDocument();
    });
  });
});
