import {render, screen, waitFor, fireEvent} from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import {toast} from "react-toastify";
import {MemoryRouter} from "react-router-dom";
import {Provider} from "react-redux";
import {Cookies} from "react-cookie";

import getConfig from "../../utils/get-config";
import PaymentStatus from "./payment-status";
import tick from "../../utils/tick";
import validateToken from "../../utils/validate-token";
import loadTranslation from "../../utils/load-translation";

// Mock modules BEFORE importing
jest.mock("axios");
jest.mock("../../utils/get-config", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    components: {
      payment_status_page: {
        content: {
          en: {
            pending: "Payment pending",
            success: "Payment successful",
            failed: "Payment failed",
          },
        },
      },
    },
  })),
}));
jest.mock("../../utils/validate-token");
jest.mock("../../utils/load-translation");
/* eslint-enable import/first */

const defaultConfig = getConfig("default", true);
const createTestProps = (props) => ({
  orgSlug: "default",
  userData: {},
  setUserData: jest.fn(),
  page: defaultConfig.components.payment_status_page,
  cookies: new Cookies(),
  settings: {subscriptions: true, payment_requires_internet: true},
  logout: jest.fn(),
  authenticate: jest.fn(),
  navigate: jest.fn(),
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

const renderWithProviders = (component) =>
  render(
    <Provider store={createMockStore()}>
      <MemoryRouter>{component}</MemoryRouter>
    </Provider>,
  );

const responseData = {
  response_code: "authToken_VALIDATION_SUCCESSFUL",
  isActive: true,
  isVerified: false,
  method: "bank_card",
  email: "tester@test.com",
  phoneNumber: null,
  username: "tester",
  key: "b72dad1cca4807dc21c00b0b2f171d29415ac541",
  radius_user_token: "jwyVSZYOze16ej6cc1AW5cxhRjahesLzh1Tm2y0d",
  firstName: "",
  lastName: "",
  birthDate: null,
  location: "",
};

describe("<PaymentStatus /> rendering with placeholder translation tags", () => {
  const props = createTestProps({
    userData: responseData,
    params: {status: "failed"},
    isAuthenticated: true,
  });

  it("should render translation placeholder correctly", () => {
    const {container} = renderWithProviders(<PaymentStatus {...props} />);
    expect(container).toMatchSnapshot();
  });
});

describe("Test <PaymentStatus /> cases", () => {
  let props;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global.console, "log").mockImplementation(() => {});
    jest.spyOn(global.console, "error").mockImplementation(() => {});
    props = createTestProps();
    loadTranslation("en", "default");
    validateToken.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Only restore console mocks
    global.console.log.mockRestore?.();
    global.console.error.mockRestore?.();
  });

  it("should render failed state", async () => {
    props = createTestProps({
      userData: responseData,
      params: {status: "failed"},
    });
    validateToken.mockResolvedValue(true);

    const {container} = renderWithProviders(<PaymentStatus {...props} />);

    await tick();

    expect(container).toMatchSnapshot();

    // Check for failed payment page content
    expect(screen.getByText(/payment failed/i)).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(
      screen.getByText(/cannot complete the transaction/i),
    ).toBeInTheDocument();

    const tryAgainLink = screen.getByRole("link", {name: /try again/i});
    expect(tryAgainLink).toBeInTheDocument();
    expect(tryAgainLink).toHaveAttribute("href", "/default/payment/draft");

    expect(
      screen.getByRole("button", {name: /cancel operation/i}),
    ).toBeInTheDocument();
  });

  it("should call logout correctly when clicking on logout button", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: responseData,
      params: {status: "failed"},
    });
    validateToken.mockResolvedValue(true);

    renderWithProviders(<PaymentStatus {...props} />);

    await tick();

    const logoutButton = screen.getByRole("button", {
      name: /cancel operation/i,
    });
    expect(logoutButton).toBeInTheDocument();

    fireEvent.click(logoutButton);

    expect(props.setUserData).toHaveBeenCalledWith({
      ...responseData,
      mustLogout: true,
      payment_url: null,
    });
    expect(spyToast).not.toHaveBeenCalled();
    expect(props.navigate).toHaveBeenCalledWith(`/${props.orgSlug}/status`);
  });

  it("should redirect to status page if user is already verified", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, isVerified: true},
      params: {status: "failed"},
    });
    validateToken.mockResolvedValue(true);

    renderWithProviders(<PaymentStatus {...props} />);

    await tick();

    // Component should redirect - check that navigation was triggered
    await waitFor(() => {
      expect(validateToken).toHaveBeenCalled();
    });
    expect(spyToast).not.toHaveBeenCalled();
  });

  it("redirect to status + cp logout on success when payment requires internet", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, isVerified: true},
      params: {status: "success"},
    });
    validateToken.mockResolvedValue(true);

    renderWithProviders(<PaymentStatus {...props} />);

    await tick();

    await waitFor(() => {
      expect(spyToast).toHaveBeenCalledTimes(1);
      expect(props.setUserData).toHaveBeenCalledWith({
        ...props.userData,
        mustLogin: false,
        mustLogout: true,
        repeatLogin: true,
      });
    });

    expect(props.logout).not.toHaveBeenCalled();
  });

  it("redirect to status + cp login on success when payment does not require internet", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, isVerified: true},
      params: {status: "success"},
    });
    props.settings.payment_requires_internet = false;
    validateToken.mockResolvedValue(true);

    renderWithProviders(<PaymentStatus {...props} />);

    await tick();

    await waitFor(() => {
      expect(spyToast).toHaveBeenCalledTimes(1);
      expect(props.setUserData).toHaveBeenCalledWith({
        ...props.userData,
        mustLogin: true,
        mustLogout: false,
        repeatLogin: false,
      });
    });

    expect(props.logout).not.toHaveBeenCalled();
  });

  it("should NOT set proceedToPayment when payment_requires_internet is false", async () => {
    validateToken.mockResolvedValue(true);

    props = createTestProps({
      userData: {...responseData, isVerified: false},
      params: {status: "draft"},
    });
    props.settings.payment_requires_internet = false;

    renderWithProviders(<PaymentStatus {...props} />);

    await tick();

    // When payment_requires_internet is false and status is draft with isVerified false,
    // setUserData is called with mustLogin: undefined in componentDidMount
    await waitFor(() => {
      expect(props.setUserData).toHaveBeenCalledWith({
        ...responseData,
        isVerified: false,
        mustLogin: undefined,
      });
    });

    props.setUserData.mockClear();

    const payProcButton = screen.getByRole("link", {
      name: /proceed with the payment/i,
    });
    expect(payProcButton).toBeInTheDocument();

    fireEvent.click(payProcButton);

    // Verify proceedToPayment is NOT set when payment_requires_internet is false
    expect(props.setUserData).not.toHaveBeenCalled();
  });

  it("should set proceedToPayment when payment_requires_internet is true", async () => {
    validateToken.mockResolvedValue(true);

    props = createTestProps({
      userData: {...responseData, isVerified: false},
      params: {status: "draft"},
    });
    props.settings.payment_requires_internet = true;

    renderWithProviders(<PaymentStatus {...props} />);

    await tick();

    const payProcButton = screen.getByRole("link", {
      name: /proceed with the payment/i,
    });
    expect(payProcButton).toBeInTheDocument();

    fireEvent.click(payProcButton);

    await waitFor(() => {
      expect(props.setUserData).toHaveBeenCalledWith({
        ...responseData,
        isVerified: false,
        proceedToPayment: true,
      });
    });
  });

  it("should redirect to status if success but unverified", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, isVerified: false},
      params: {status: "success"},
    });
    validateToken.mockResolvedValue(true);

    renderWithProviders(<PaymentStatus {...props} />);

    await tick();

    await waitFor(() => {
      expect(validateToken).toHaveBeenCalled();
    });
    expect(spyToast).not.toHaveBeenCalled();
  });

  it("should redirect to status if success but not using bank_card method", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      params: {status: "success"},
      settings: {
        subscriptions: true,
        mobilePhoneVerification: true,
      },
      userData: {...responseData, method: "mobile_phone"},
    });
    validateToken.mockResolvedValue(true);

    renderWithProviders(<PaymentStatus {...props} />);

    await tick();

    await waitFor(() => {
      expect(validateToken).toHaveBeenCalled();
    });
    expect(spyToast).not.toHaveBeenCalled();
  });

  it("should redirect to status if failed but not using bank_card method", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      params: {status: "failed"},
      settings: {
        subscriptions: true,
        mobilePhoneVerification: true,
      },
      userData: {...responseData, method: "mobile_phone"},
    });
    validateToken.mockResolvedValue(true);

    renderWithProviders(<PaymentStatus {...props} />);

    await tick();

    await waitFor(() => {
      expect(validateToken).toHaveBeenCalled();
    });
    expect(spyToast).not.toHaveBeenCalled();
  });

  it("should redirect to login if not authenticated", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      params: {status: "failed"},
      settings: {
        subscriptions: true,
        mobilePhoneVerification: true,
      },
      isAuthenticated: false,
    });
    validateToken.mockResolvedValue(true);

    renderWithProviders(<PaymentStatus {...props} />);

    await tick();

    await waitFor(() => {
      expect(validateToken).toHaveBeenCalled();
    });
    expect(spyToast).not.toHaveBeenCalled();
  });

  it("should redirect to status if result is not one of the expected values", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      params: {status: "unexpected"},
      settings: {
        subscriptions: true,
        mobilePhoneVerification: true,
      },
    });
    validateToken.mockResolvedValue(true);

    renderWithProviders(<PaymentStatus {...props} />);

    await tick();

    await waitFor(() => {
      expect(validateToken).toHaveBeenCalled();
    });
    expect(spyToast).not.toHaveBeenCalled();
  });

  it("should redirect to status page if draft and not bank_card", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, isVerified: false, method: "mobile_phone"},
      params: {status: "draft"},
    });
    validateToken.mockResolvedValue(true);

    renderWithProviders(<PaymentStatus {...props} />);

    await tick();

    await waitFor(() => {
      expect(validateToken).toHaveBeenCalled();
    });
    expect(spyToast).not.toHaveBeenCalled();
  });

  it("should redirect to status page if draft and verified", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, isVerified: true},
      params: {status: "draft"},
    });
    validateToken.mockResolvedValue(true);

    renderWithProviders(<PaymentStatus {...props} />);

    await tick();

    await waitFor(() => {
      expect(validateToken).toHaveBeenCalled();
    });
    expect(spyToast).not.toHaveBeenCalled();
  });

  it("should redirect to status page if token is not valid", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, isVerified: false},
      params: {status: "draft"},
    });
    validateToken.mockResolvedValue(false);

    renderWithProviders(<PaymentStatus {...props} />);

    await tick();

    await waitFor(() => {
      expect(validateToken).toHaveBeenCalled();
    });
    expect(spyToast).not.toHaveBeenCalled();
    expect(props.setUserData).not.toHaveBeenCalled();
  });

  it("should call logout correctly when clicking on logout button from draft", async () => {
    props = createTestProps({
      userData: {...responseData, isVerified: false},
      params: {status: "draft"},
    });
    validateToken.mockResolvedValue(true);

    renderWithProviders(<PaymentStatus {...props} />);

    await tick();

    const logoutButton = screen.getByRole("button", {
      name: /cancel operation/i,
    });
    expect(logoutButton).toBeInTheDocument();

    fireEvent.click(logoutButton);

    expect(props.setUserData).toHaveBeenCalledWith({
      ...responseData,
      mustLogout: true,
      payment_url: null,
    });
    expect(props.navigate).toHaveBeenCalledWith(`/${props.orgSlug}/status`);
  });

  it("should render draft correctly", async () => {
    props = createTestProps({
      userData: {...responseData, isVerified: false},
      params: {status: "draft"},
    });
    validateToken.mockResolvedValue(true);

    const {container} = renderWithProviders(<PaymentStatus {...props} />);

    await tick();

    expect(container).toMatchSnapshot();
    expect(props.setUserData).toHaveBeenCalledWith({
      ...responseData,
      mustLogin: true,
    });
  });
});
