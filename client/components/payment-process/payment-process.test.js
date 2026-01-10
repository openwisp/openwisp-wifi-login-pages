import {render, waitFor, act, within} from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import {Cookies} from "react-cookie";

import {Navigate} from "react-router-dom";
import {TestRouter} from "../../test-utils";
import {Provider} from "react-redux";
import getConfig from "../../utils/get-config";
import PaymentProcess from "./payment-process";
import tick from "../../utils/tick";
import validateToken from "../../utils/validate-token";
import loadTranslation from "../../utils/load-translation";
import getPaymentStatusRedirectUrl from "../../utils/get-payment-status";
import LoadingContext from "../../utils/loading-context";

// Mock modules BEFORE importing
jest.mock("axios");
jest.mock("../../utils/get-config", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    components: {
      payment_status_page: {
        content: {en: "Payment processing..."},
      },
    },
  })),
}));
jest.mock("../../utils/validate-token");
jest.mock("../../utils/load-translation");
jest.mock("../../utils/history");
jest.mock("../../utils/get-payment-status");

// Mock Navigate component
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    Navigate: jest.fn(({to}) => <div data-testid="navigate" data-to={to} />),
  };
});
/* eslint-enable import/first */

const defaultConfig = getConfig("default", true);
const createTestProps = (props) => ({
  orgSlug: "default",
  userData: {},
  setUserData: jest.fn(),
  page: defaultConfig.components.payment_status_page,
  cookies: new Cookies(),
  settings: {subscriptions: true, payment_iframe: true},
  logout: jest.fn(),
  authenticate: jest.fn(),
  isAuthenticated: true,
  navigate: jest.fn(),
  language: "en",
  ...props,
});

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

const renderWithProviders = (component, mockSetLoading = null) => {
  const setLoading = mockSetLoading || jest.fn();

  return render(
    <Provider store={createMockStore()}>
      <LoadingContext.Provider value={{setLoading}}>
        <TestRouter>
          {component}
        </TestRouter>
      </LoadingContext.Provider>
    </Provider>,
  );
};

// Helper to mock window message events
const mockMessageEvents = () => {
  const events = {};
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  window.addEventListener = jest.fn((event, callback) => {
    events[event] = callback;
  });
  window.removeEventListener = jest.fn((event) => {
    delete events[event];
  });

  return {
    events,
    restore: () => {
      window.addEventListener = originalAddEventListener;
      window.removeEventListener = originalRemoveEventListener;
    },
  };
};

const responseData = {
  response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
  is_active: true,
  is_verified: false,
  method: "bank_card",
  email: "tester@test.com",
  phone_number: null,
  username: "tester",
  key: "b72dad1cca4807dc21c00b0b2f171d29415ac541",
  radius_user_token: "jwyVSZYOze16ej6cc1AW5cxhRjahesLzh1Tm2y0d",
  first_name: "",
  last_name: "",
  birth_date: null,
  location: "",
  payment_url: "https://account.openwisp.io/payment/123",
};

describe("Test <PaymentProcess /> cases", () => {
  let props;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global.console, "log").mockImplementation(() => {});
    jest.spyOn(global.console, "error").mockImplementation(() => {});
    props = createTestProps();
    getPaymentStatusRedirectUrl.mockClear();
    loadTranslation("en", "default");
    validateToken.mockClear();
    validateToken.mockResolvedValue(true);
    Navigate.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    // Re-setup the getConfig mock after clearing
    getConfig.mockImplementation(() => ({
      components: {
        payment_status_page: {
          content: {en: "Payment processing..."},
        },
      },
    }));
  });

  it("should redirect if payment_url is not present", async () => {
    props = createTestProps({
      userData: {...responseData, payment_url: null},
    });
    validateToken.mockResolvedValue(true);

    renderWithProviders(<PaymentProcess {...props} />);

    await tick();

    await waitFor(() => {
      // Verify token validation occurred
      expect(validateToken).toHaveBeenCalled();
      // Verify Navigate was rendered with correct destination
      expect(Navigate).toHaveBeenCalledWith(
        expect.objectContaining({to: `/${props.orgSlug}/status`}),
        expect.anything(),
      );
    });
  });

  it("should redirect unauthenticated users", async () => {
    props = createTestProps({
      isAuthenticated: false,
      userData: responseData,
    });
    validateToken.mockResolvedValue(true);

    renderWithProviders(<PaymentProcess {...props} />);

    await tick();

    await waitFor(() => {
      // Verify token validation occurred
      expect(validateToken).toHaveBeenCalled();
      // Verify Navigate was rendered with correct destination
      expect(Navigate).toHaveBeenCalledWith(
        expect.objectContaining({to: `/${props.orgSlug}/status`}),
        expect.anything(),
      );
    });
  });

  it("should show loader if token is invalid", async () => {
    props = createTestProps({
      userData: responseData,
    });
    validateToken.mockReturnValue(false);

    // Create a mock setLoading function to track loading state changes
    const mockSetLoading = jest.fn();

    renderWithProviders(<PaymentProcess {...props} />, mockSetLoading);

    await tick();

    // Verify token validation occurred
    expect(validateToken).toHaveBeenCalled();

    // Verify setLoading was called with true to show loader initially
    expect(mockSetLoading).toHaveBeenCalledWith(true);

    // Verify setLoading was called with false after invalid token check
    await waitFor(() => {
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    // Verify the loading sequence: true first, then false
    expect(mockSetLoading).toHaveBeenNthCalledWith(1, true);
    expect(mockSetLoading).toHaveBeenNthCalledWith(2, false);
  });

  it("should render payment_url in iframe", async () => {
    props = createTestProps({
      userData: responseData,
    });
    validateToken.mockResolvedValue(true);

    const {container} = renderWithProviders(<PaymentProcess {...props} />);

    await tick();

    // Check for iframe element using title attribute
    await waitFor(() => {
      const paymentProcess = within(document.body).getByTitle(
        "owisp-payment-iframe",
      );
      expect(paymentProcess).toBeInTheDocument();
    });

    const iframe = within(document.body).getByTitle("owisp-payment-iframe");
    expect(iframe).toHaveAttribute("src", responseData.payment_url);

    expect(container).toMatchSnapshot();
  });

  it("test postMessage event listener firing", async () => {
    props = createTestProps({
      userData: responseData,
    });
    validateToken.mockResolvedValue(true);

    const eventMock = mockMessageEvents();

    const {unmount} = renderWithProviders(<PaymentProcess {...props} />);

    await tick();

    // Verify event listener was added
    expect(window.addEventListener).toHaveBeenCalledWith(
      "message",
      expect.any(Function),
    );

    // Simulate postMessage event
    expect(eventMock.events.message).toBeDefined();
    await act(async () => {
      eventMock.events.message({
        data: {
          type: "paymentClose",
          message: {paymentId: "paymentId"},
        },
        origin: window.location.origin,
      });
    });

    // Cleanup
    unmount();

    // Verify event listener was removed
    expect(window.removeEventListener).toHaveBeenCalled();

    eventMock.restore();
  });

  it("should redirect to /payment/:status on completed transaction", async () => {
    props = createTestProps({userData: responseData});
    validateToken.mockResolvedValue(true);
    getPaymentStatusRedirectUrl.mockReturnValue(
      `/${props.orgSlug}/payment/success/`,
    );

    const eventMock = mockMessageEvents();

    renderWithProviders(<PaymentProcess {...props} />);

    await tick();

    // Simulate payment completion message
    expect(eventMock.events.message).toBeDefined();
    await act(async () => {
      eventMock.events.message({
        data: {
          type: "paymentClose",
          message: {paymentId: "paymentId"},
        },
        origin: window.location.origin,
      });
    });

    await tick();

    expect(props.navigate).toHaveBeenCalledWith(
      `/${props.orgSlug}/payment/success/`,
    );

    eventMock.restore();
  });

  it("should handle postMessage for showLoader", async () => {
    props = createTestProps({userData: responseData});
    validateToken.mockResolvedValue(true);

    // Create a mock setLoading function to track loading state changes
    const mockSetLoading = jest.fn();

    const eventMock = mockMessageEvents();

    renderWithProviders(<PaymentProcess {...props} />, mockSetLoading);

    await tick();

    // Clear previous setLoading calls from componentDidMount
    mockSetLoading.mockClear();

    // Simulate showLoader message
    expect(eventMock.events.message).toBeDefined();
    await act(async () => {
      eventMock.events.message({
        data: {
          type: "showLoader",
        },
        origin: window.location.origin,
      });
    });

    await tick();

    // Verify setLoading was called with true to show loader
    expect(mockSetLoading).toHaveBeenCalledWith(true);

    // Verify event was processed
    expect(window.addEventListener).toHaveBeenCalled();

    eventMock.restore();
  });

  it("should handle postMessage for setHeight", async () => {
    props = createTestProps({userData: responseData});
    validateToken.mockResolvedValue(true);

    const events = {};
    const originalAddEventListener = window.addEventListener;

    window.addEventListener = jest.fn((event, callback) => {
      events[event] = callback;
    });

    renderWithProviders(<PaymentProcess {...props} />);

    await tick();

    // Simulate setHeight message
    expect(events.message).toBeDefined();
    await act(async () => {
      events.message({
        data: {
          type: "setHeight",
          message: 800,
        },
        origin: window.location.origin,
      });
    });

    await tick();

    // Check if iframe height was updated
    const iframe = within(document.body).getByTitle("owisp-payment-iframe");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("height", "800");

    window.addEventListener = originalAddEventListener;
  });

  it("should redirect to payment_url if payment_iframe set to false", async () => {
    props = createTestProps({
      userData: responseData,
      settings: {subscriptions: true, payment_iframe: false},
    });
    validateToken.mockResolvedValue(true);

    // Spy on PaymentProcess.redirectToPaymentUrl (static method)
    const redirectSpy = jest
      .spyOn(PaymentProcess, "redirectToPaymentUrl")
      .mockImplementation(() => {});

    renderWithProviders(<PaymentProcess {...props} />);

    // Wait for component to call redirectToPaymentUrl after token validation
    await waitFor(() => {
      expect(redirectSpy).toHaveBeenCalledWith(responseData.payment_url);
    });

    // Component should return null (no content) when redirecting
    expect(
      within(document.body).queryByText(/payment/i),
    ).not.toBeInTheDocument();

    redirectSpy.mockRestore();
  });

  it("should validate token on mount", async () => {
    props = createTestProps({
      userData: responseData,
    });
    validateToken.mockResolvedValue(true);

    renderWithProviders(<PaymentProcess {...props} />);

    await tick();

    expect(validateToken).toHaveBeenCalledWith(
      props.cookies,
      props.orgSlug,
      props.setUserData,
      props.userData,
      props.logout,
    );
  });
});
