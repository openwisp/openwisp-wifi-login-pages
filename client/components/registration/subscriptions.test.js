import axios from "axios";
import {render, screen, waitFor, fireEvent} from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import {toast} from "react-toastify";
import {cloneDeep} from "lodash";
import {Provider} from "react-redux";
import {TestRouter} from "../../test-utils";
import tick from "../../utils/tick";

import getConfig from "../../utils/get-config";
import Registration from "./registration";
import redirectToPayment from "../../utils/redirect-to-payment";

// Mock modules BEFORE importing
const mockConfig = {
  name: "default name",
  slug: "default",
  default_language: "en",
  settings: {
    mobile_phone_verification: false,
    subscriptions: true,
  },
  components: {
    registration_form: {
      input_fields: {
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
        first_name: {
          setting: "disabled",
        },
        last_name: {
          setting: "disabled",
        },
        birth_date: {
          setting: "disabled",
        },
        location: {
          pattern: "[a-zA-Z@.+\\-_\\d]{1,150}",
          setting: "disabled",
        },
        phone_number: {
          country: "in",
        },
        tax_number: {
          pattern: "[a-zA-Z@.+\\-_\\d]{1,150}",
        },
        country: {
          pattern: "[a-zA-Z@.+\\-_\\d\\s]{1,150}",
        },
        zipcode: {},
        street: {},
        city: {},
      },
      social_login: {
        links: [],
      },
    },
    contact_page: {},
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
jest.mock("axios");
jest.mock("../../utils/redirect-to-payment");
/* eslint-enable import/first */

const responseData = {
  key: "8a2b2b2dd963de23c17db30a227505f879866630",
  radius_user_token: "Lbdh3GKD7hvXUS5NUu5yoE4x5fCPPqlsXo7Ug8ld",
};

const createTestProps = (props, configName = "default") => {
  const config = getConfig(configName);
  return {
    language: "en",
    orgSlug: configName,
    orgName: "test",
    settings: config.settings,
    registration: config.components.registration_form,
    privacyPolicy: config.privacy_policy,
    termsAndConditions: config.terms_and_conditions,
    authenticate: jest.fn(),
    verifyMobileNumber: jest.fn(),
    setTitle: jest.fn(),
    setUserData: jest.fn(),
    loading: false,
    match: {
      path: "default/registration",
    },
    navigate: jest.fn(),
    defaultLanguage: config.default_language,
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
            social_links: [],
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
      <TestRouter>{component}</TestRouter>
    </Provider>,
  );

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
  {
    id: "363c9ba3-3354-48a5-a3e3-86062b070036",
    plan: "Free (used for identity verification)",
    pricing: "no expiration (free) (0 days)",
    plan_description: "3 hours per day\n300 MB per day",
    currency: "EUR",
    requires_payment: true,
    requires_invoice: false,
    price: "0.00",
    has_automatic_renewal: false,
  },
];

const mountComponent = (passedProps) => {
  const config = getConfig(passedProps.orgSlug || "default");
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
      <TestRouter>
        <Registration {...passedProps} />
      </TestRouter>
    </Provider>,
  );
};

describe("test subscriptions", () => {
  let props;
  let lastConsoleOutput;
  const event = {preventDefault: jest.fn()};

  beforeEach(() => {
    jest.clearAllMocks();
    axios.mockReset();
    lastConsoleOutput = null;
    jest.spyOn(global.console, "error").mockImplementation((data) => {
      lastConsoleOutput = data;
    });
    props = createTestProps();
    props.settings.subscriptions = true;
    props.configuration = getConfig("default", true);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    // Re-setup the getConfig mock after clearing
    getConfig.mockImplementation(() => mockConfig);
  });

  it("should not show choice form when plans is absent", () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 201,
        statusText: "ok",
        data: [],
      }),
    );

    renderWithProviders(<Registration {...props} />);

    expect(screen.queryAllByTestId(/plan-radio-/)).toHaveLength(0);
  });

  it("should auto select first plan when auto_select_first_plan is true", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 201,
        statusText: "ok",
        data: plans,
      }),
    );

    const customProps = cloneDeep(createTestProps());
    customProps.settings.mobile_phone_verification = true;
    customProps.registration.auto_select_first_plan = true;

    renderWithProviders(<Registration {...customProps} />);

    await waitFor(() => {
      const plansContainer = screen.queryByTestId("plans-container");
      expect(plansContainer).toBeInTheDocument();
    });

    const plansContainer = screen.queryByTestId("plans-container");
    expect(plansContainer).toHaveClass("hidden");

    // Verify form is rendered with register button
    expect(screen.getByRole("button", {name: /register/i})).toBeInTheDocument();
    // Verify email field is present
    expect(screen.getByTestId("registration-form")).toContainElement(
      screen.getByRole("textbox", {name: /email/i}),
    );
  });

  it("should handle plan selection when multiple plans are present", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 201,
        statusText: "ok",
        data: plans,
      }),
    );

    renderWithProviders(<Registration {...props} />);

    await tick();
    await waitFor(() => {
      const planInputs = screen.queryAllByTestId(/plan-radio-/);
      expect(planInputs.length).toBeGreaterThan(0);
    });

    // RTL may produce act() warnings which are expected for async state updates
    const hasOnlyActWarnings =
      lastConsoleOutput === null ||
      (typeof lastConsoleOutput === "string" &&
        lastConsoleOutput.includes("act(...)"));
    expect(hasOnlyActWarnings).toBe(true);

    const radio0 = screen.queryByTestId("plan-radio-0");
    const radio1 = screen.queryByTestId("plan-radio-1");

    expect(radio0).toBeInTheDocument();
    fireEvent.focus(radio0, {target: {value: "0"}});
    await waitFor(() => {
      const plan0 = screen.getByTestId("plan-0");
      expect(plan0).toHaveClass("active");
    });

    expect(radio1).toBeInTheDocument();
    fireEvent.focus(radio1, {target: {value: "1"}});
    await waitFor(() => {
      const plan1 = screen.getByTestId("plan-1");
      expect(plan1).toHaveClass("active");
    });
  });

  it("should not show billing info when requires_payment is false", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 201,
        statusText: "ok",
        data: plans,
      }),
    );

    props.settings.mobile_phone_verification = true;
    mountComponent(props);

    await tick();
    await waitFor(() => {
      const planInputs = screen.queryAllByTestId(/plan-radio-/);
      expect(planInputs).toHaveLength(3);
    });

    expect(screen.getByTestId("registration-form")).toBeInTheDocument();
    expect(screen.queryByTestId("billing-info")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", {name: /username/i}),
    ).not.toBeInTheDocument();
  });

  it("should not show billing info when requires_payment is true but requires_invoice is false", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 201,
        statusText: "ok",
        data: plans,
      }),
    );

    mountComponent(props);

    await tick();
    await waitFor(() => {
      const planInputs = screen.queryAllByTestId(/plan-radio-/);
      expect(planInputs).toHaveLength(3);
    });

    // Select plan that requires payment but not invoice (plan index 2)
    const radio2 = screen.queryByTestId("plan-radio-2");
    expect(radio2).toBeInTheDocument();
    fireEvent.click(radio2);
    await waitFor(() => {
      expect(screen.queryByTestId("billing-info")).not.toBeInTheDocument();
    });
  });

  it("should show billing info when both requires_payment and requires_invoice is true", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 201,
        statusText: "ok",
        data: plans,
      }),
    );

    mountComponent(props);

    await tick();
    await waitFor(() => {
      const planInputs = screen.queryAllByTestId(/plan-radio-/);
      expect(planInputs).toHaveLength(3);
    });

    // Select plan that requires both payment and invoice (plan index 1)
    const radio1 = screen.queryByTestId("plan-radio-1");
    expect(radio1).toBeInTheDocument();
    fireEvent.click(radio1);
    await waitFor(() => {
      const billingInfo = screen.queryByTestId("billing-info");
      expect(billingInfo).toBeInTheDocument();
    });
  });

  it("redirect to payment after registration with payment flow", async () => {
    const data = {
      ...responseData,
      payment_url: "https://account.openwisp.io/payment/123",
    };

    // Use mockImplementation to handle multiple calls persistently
    let callCount = 0;
    axios.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.resolve({
          status: 201,
          statusText: "ok",
          data: plans,
        });
      }
      return Promise.resolve({
        status: 201,
        statusText: "CREATED",
        data,
      });
    });

    renderWithProviders(<Registration {...props} />);

    await tick();

    // Wait for form and plan options to render
    await waitFor(() => {
      const form = screen.getByTestId("registration-form");
      expect(form).toBeInTheDocument();
      // Wait for plans to load
      const planInputs = screen.queryAllByTestId(/plan-radio-/);
      expect(planInputs.length).toBeGreaterThan(0);
    });

    // Select the Premium plan (index 1) which requires payment
    const premiumPlanRadio = screen.getByTestId("plan-radio-1");
    expect(premiumPlanRadio).toBeInTheDocument();
    fireEvent.click(premiumPlanRadio);

    // Wait for billing info fields to appear (since plan requires invoice)
    await waitFor(() => {
      const billingInfo = screen.queryByTestId("billing-info");
      expect(billingInfo).toBeInTheDocument();
    });

    // Use RTL queries with aria-label - will fail fast if elements don't exist
    const emailInput = screen.getByRole("textbox", {name: /email/i});
    const password1Input = screen.getByLabelText("Password");
    const password2Input = screen.getByLabelText("Confirm Password");
    const taxNumberInput = screen.getByLabelText("Tax Number");
    const cityInput = screen.getByLabelText("City");

    // Fill in required fields
    fireEvent.change(emailInput, {
      target: {name: "email", value: "tester@test.com"},
    });
    fireEvent.change(password1Input, {
      target: {name: "password1", value: "tester123"},
    });
    fireEvent.change(password2Input, {
      target: {name: "password2", value: "tester123"},
    });
    fireEvent.change(taxNumberInput, {
      target: {name: "tax_number", value: "123456"},
    });
    fireEvent.change(cityInput, {
      target: {name: "city", value: "Rome"},
    });

    const form = screen.getByTestId("registration-form");
    fireEvent.submit(form, event);

    await tick();

    await waitFor(() => {
      expect(redirectToPayment).toHaveBeenCalledWith("default", props.navigate);
      expect(props.authenticate).toHaveBeenCalledTimes(1);
    });
  });

  it("should show error if fetching plans fail", async () => {
    const error = new Error("Internal server error");
    error.status = 500;
    error.statusText = "Internal server error";
    error.response = {
      data: {
        detail: "Internal server error",
      },
    };
    axios.mockImplementationOnce(() => Promise.reject(error));

    const spyToast = jest.spyOn(toast, "error");

    renderWithProviders(<Registration {...props} />);

    await tick();

    await waitFor(() => {
      expect(spyToast).toHaveBeenCalledTimes(1);
    });
  });

  it("should keep sending phone number as username when plan does not require payment", async () => {
    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 201,
          statusText: "ok",
          data: plans,
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 201,
          statusText: "CREATED",
          data: responseData,
        }),
      );

    props.settings.mobile_phone_verification = true;
    renderWithProviders(<Registration {...props} />);

    await tick();

    // Wait for form and plans to render
    await waitFor(() => {
      expect(screen.getByTestId("registration-form")).toBeInTheDocument();
      const planInputs = screen.queryAllByTestId(/plan-radio-/);
      expect(planInputs.length).toBeGreaterThan(0);
    });

    // Select the free plan (index 0) which doesn't require payment
    const freePlanRadio = screen.getByTestId("plan-radio-0");
    fireEvent.click(freePlanRadio);

    await tick();

    // Use accessible queries with aria-label
    // PhoneInput library provides a special-label "Phone"
    const phoneInput = screen.getByLabelText(/phone/i);
    const emailInput = screen.getByRole("textbox", {name: /email/i});
    const password1Input = screen.getByLabelText("Password");
    const password2Input = screen.getByLabelText("Confirm Password");

    // Fill required fields
    fireEvent.change(phoneInput, {
      target: {name: "phone_number", value: "+393661223345"},
    });
    fireEvent.change(emailInput, {
      target: {name: "email", value: "tester@tester.com"},
    });
    fireEvent.change(password1Input, {
      target: {name: "password1", value: "tester123"},
    });
    fireEvent.change(password2Input, {
      target: {name: "password2", value: "tester123"},
    });

    const form = screen.getByTestId("registration-form");
    fireEvent.submit(form, event);

    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalledTimes(2);
      // Verify the second call (registration request) has phone_number as username
      const registrationCall = axios.mock.calls[1];
      const requestConfig = registrationCall[0];
      // The data is already an object in the mock, not a JSON string
      const requestPayload =
        typeof requestConfig.data === "string"
          ? JSON.parse(requestConfig.data)
          : requestConfig.data;
      expect(requestPayload.username).toBe("+393661223345");
    });
  });

  it("should send stripped email as username when plan requires payment", async () => {
    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 201,
          statusText: "ok",
          data: plans,
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 201,
          statusText: "CREATED",
          data: responseData,
        }),
      );

    props.settings.mobile_phone_verification = true;
    renderWithProviders(<Registration {...props} />);

    await tick();

    // Wait for form and plans to render
    await waitFor(() => {
      expect(screen.getByTestId("registration-form")).toBeInTheDocument();
      const planInputs = screen.queryAllByTestId(/plan-radio-/);
      expect(planInputs.length).toBeGreaterThan(0);
    });

    // Select plan that requires payment (plan index 2)
    const paymentPlanRadio = screen.getByTestId("plan-radio-2");
    fireEvent.click(paymentPlanRadio);

    await tick();

    // Use accessible queries with aria-label
    const emailInput = screen.getByRole("textbox", {name: /email/i});
    const password1Input = screen.getByLabelText("Password");
    const password2Input = screen.getByLabelText("Confirm Password");

    fireEvent.change(emailInput, {
      target: {name: "email", value: "tester@tester.com"},
    });
    fireEvent.change(password1Input, {
      target: {name: "password1", value: "tester123"},
    });
    fireEvent.change(password2Input, {
      target: {name: "password2", value: "tester123"},
    });

    const form = screen.getByTestId("registration-form");
    fireEvent.submit(form, event);

    await tick();

    await waitFor(() => {
      expect(axios).toHaveBeenCalledTimes(2);
      // Verify the second call (registration request) has email as username
      const registrationCall = axios.mock.calls[1];
      const requestConfig = registrationCall[0];
      // The data is already an object in the mock, not a JSON string
      const requestPayload =
        typeof requestConfig.data === "string"
          ? JSON.parse(requestConfig.data)
          : requestConfig.data;
      // Verify username is the email local part (everything before @)
      expect(requestPayload.username).toBe("tester");
    });
  });

  it("should show loader while fetching plans even if loading state changes", async () => {
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 201,
        statusText: "ok",
        data: plans,
      }),
    );

    const {rerender} = renderWithProviders(<Registration {...props} loading />);

    await tick();

    rerender(
      <Provider store={createMockStore()}>
        <TestRouter>
          <Registration {...props} loading={false} />
        </TestRouter>
      </Provider>,
    );

    await waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });
  });
});
