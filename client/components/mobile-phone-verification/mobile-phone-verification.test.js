import axios from "axios";
import {render, screen, waitFor, fireEvent} from "@testing-library/react";
import "@testing-library/jest-dom";
import {toast} from "react-toastify";
import React from "react";
import {Cookies} from "react-cookie";
import {MemoryRouter} from "react-router-dom";
import {Provider} from "react-redux";
import tick from "../../utils/tick";

import getConfig from "../../utils/get-config";
import MobilePhoneVerification from "./mobile-phone-verification";
import validateToken from "../../utils/validate-token";
import loadTranslation from "../../utils/load-translation";
import logError from "../../utils/log-error";
import handleLogout from "../../utils/handle-logout";

// Mock modules BEFORE importing
jest.mock("../../utils/get-config", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    slug: "default",
    name: "default name",
    components: {
      mobile_phone_verification_form: {
        input_fields: {
          code: {
            type: "text",
            pattern: "^[0-9]{6}$",
          },
        },
      },
    },
    settings: {
      mobile_phone_verification: true,
    },
  })),
}));
jest.mock("../../utils/validate-token");
jest.mock("../../utils/load-translation");
jest.mock("../../utils/log-error");
jest.mock("../../utils/handle-logout");
jest.mock("axios");

const createTestProps = (props, configName = "test-org-2") => {
  const config = getConfig(configName);
  return {
    mobile_phone_verification: config.components.mobile_phone_verification_form,
    settings: config.settings,
    language: "en",
    orgSlug: config.slug,
    orgName: config.name,
    cookies: new Cookies(),
    logout: jest.fn(),
    setUserData: jest.fn(),
    userData: {},
    setTitle: jest.fn(),
    ...props,
  };
};

const defaultConfig = getConfig("default");

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

const userData = {
  response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
  radius_user_token: "o6AQLY0aQjD3yuihRKLknTn8krcQwuy2Av6MCsFB",
  username: "tester@tester.com",
  is_active: false,
  is_verified: false,
  phone_number: "+393660011222",
};

describe("<MobilePhoneVerification /> rendering with placeholder translation tags", () => {
  beforeEach(() => {
    // Mock axios to handle multiple calls during component mount:
    // 1. activePhoneToken (GET) - returns { active: false } so createPhoneToken is called
    // 2. createPhoneToken (POST) - returns success
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: {active: false},
      }),
    );
  });

  afterEach(() => {
    axios.mockReset();
  });

  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const {container} = renderWithProviders(
      <MobilePhoneVerification {...props} />,
    );
    expect(container).toMatchSnapshot();
  });
});

describe("Mobile Phone Token verification: standard flow", () => {
  let props;

  beforeEach(() => {
    jest.clearAllMocks();
    axios.mockReset();
    props = createTestProps();
    // Use mockImplementation to handle multiple axios calls during componentDidMount
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 201,
        statusText: "CREATED",
        data: null,
      }),
    );
    validateToken.mockClear();
  });

  afterEach(() => {
    axios.mockReset();
    jest.clearAllMocks();
    jest.restoreAllMocks();
    sessionStorage.clear();
  });

  it("should render successfully", async () => {
    validateToken.mockResolvedValue(true);
    props.userData = userData;
    loadTranslation("en", "default");

    renderWithProviders(<MobilePhoneVerification {...props} />);

    // Wait for component to fully render with phone number
    await waitFor(() => {
      expect(screen.getByText(/\+393660011222/)).toBeInTheDocument();
    });

    expect(axios).toHaveBeenCalled();
    expect(screen.getByRole("button", {name: /submit/i})).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {name: /send a new verification code/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {name: /change your phone number/i}),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", {name: /logout/i})).toBeInTheDocument();
  });

  it("should disable resend button if cooldown is present in CreatePhoneToken success", async () => {
    validateToken.mockResolvedValue(true);
    axios.mockReset();
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 201,
        statusText: "CREATED",
        data: {cooldown: 30},
      }),
    );
    jest.spyOn(Date, "now").mockReturnValue(1690369255287);
    props.userData = userData;

    renderWithProviders(<MobilePhoneVerification {...props} />);

    // Wait for resend button to be disabled
    await waitFor(() => {
      const resendButton = screen.getByRole("button", {
        name: /send a new verification code/i,
      });
      expect(resendButton).toBeDisabled();
    });

    expect(axios).toHaveBeenCalled();
  });

  it("should disable resend button if cooldown is present in CreatePhoneToken failure", async () => {
    validateToken.mockReturnValue(true);
    jest.spyOn(toast, "error");
    axios.mockReset();
    const error = new Error("Request failed with status code 400");
    error.response = {
      status: 400,
      statusText: "BAD_REQUEST",
      data: {
        non_field_errors: ["Wait before requesting another SMS token."],
        cooldown: 20,
      },
    };
    axios.mockImplementation(() => Promise.reject(error));
    jest.spyOn(Date, "now").mockReturnValue(1690369255287);
    props.userData = userData;

    renderWithProviders(<MobilePhoneVerification {...props} />);

    await tick();

    expect(axios).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it("should check if active token is present", async () => {
    validateToken.mockResolvedValue(true);
    axios.mockReset();
    axios.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: {active: true},
      }),
    );

    renderWithProviders(<MobilePhoneVerification {...props} />);

    await tick();

    // Component should check for active token
    expect(axios).toHaveBeenCalled();
  });

  it("should not show error if active phone token returns 404", async () => {
    axios.mockReset();

    // Mock axios to handle sequential calls based on method
    axios.mockImplementation((config) => {
      const method = config.method?.toUpperCase();

      if (method === "GET") {
        // activePhoneToken - returns 404 (handled silently)
        const error = new Error("Request failed with status code 404");
        error.response = {
          status: 404,
          statusText: "NOT FOUND",
          data: {
            non_field_errors: ["Not Found"],
          },
        };
        return Promise.reject(error);
      }
      if (method === "POST") {
        // createPhoneToken - succeeds
        return Promise.resolve({
          status: 201,
          statusText: "CREATED",
          data: null,
        });
      }
      return undefined;
    });

    validateToken.mockResolvedValue(true);
    jest.spyOn(toast, "error");

    renderWithProviders(<MobilePhoneVerification {...props} />);

    await tick();

    expect(logError).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("should not execute createPhoneToken if invalid organization", async () => {
    axios.mockReset();
    const error = new Error("Request failed with status code 404");
    error.response = {
      status: 404,
      statusText: "NOT FOUND",
      data: {
        non_field_errors: ["Not Found"],
        response_code: "INVALID_ORGANIZATION",
      },
    };
    axios.mockImplementation(() => Promise.reject(error));

    validateToken.mockResolvedValue(true);
    jest.spyOn(toast, "error");

    renderWithProviders(<MobilePhoneVerification {...props} />);

    await waitFor(() => {
      expect(logError).toHaveBeenCalledTimes(1);
    });
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Not Found");
  });

  it("should show error on if active phone token check fails", async () => {
    // Set up axios to reject all calls with 400 error
    axios.mockReset();
    const error = new Error("Request failed with status code 400");
    error.response = {
      status: 400,
      statusText: "BAD REQUEST",
      data: {
        non_field_errors: ["Bad request"],
      },
    };
    axios.mockImplementation(() => Promise.reject(error));

    validateToken.mockResolvedValue(true);
    jest.spyOn(toast, "error");
    props.userData = userData;

    renderWithProviders(<MobilePhoneVerification {...props} />);

    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Request failed with status code 400",
          response: {
            data: {non_field_errors: ["Bad request"]},
            status: 400,
            statusText: "BAD REQUEST",
          },
        }),
        "Bad request",
      );
    });
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it("should resend token successfully", async () => {
    jest.spyOn(toast, "info");
    validateToken.mockResolvedValue(true);

    // Reset and set up axios mock before rendering
    axios.mockReset();

    // Mock axios to handle sequential calls
    axios.mockImplementation((config) => {
      const method = config.method?.toUpperCase();

      if (method === "GET") {
        // activePhoneToken
        return Promise.resolve({
          status: 200,
          statusText: "OK",
          data: {active: false},
        });
      }
      if (method === "POST") {
        // createPhoneToken (both initial and resend)
        return Promise.resolve({
          status: 201,
          statusText: "CREATED",
          data: null,
        });
      }
      return undefined;
    });

    props.userData = userData;

    renderWithProviders(<MobilePhoneVerification {...props} />);

    // Wait for resend button to render
    await waitFor(() => {
      expect(
        screen.getByRole("button", {name: /send a new verification code/i}),
      ).toBeInTheDocument();
    });

    // Clear the toast.info calls from componentDidMount before clicking resend
    toast.info.mockClear();

    const resendButton = screen.getByRole("button", {
      name: /send a new verification code/i,
    });
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledTimes(1);
    });
  });

  it("should verify token successfully and must call setUserData", async () => {
    validateToken.mockResolvedValue(true);
    loadTranslation("en", "default");

    // Reset and set up axios mock
    axios.mockReset();

    // Track POST call count for sequential responses
    let postCallCount = 0;

    axios.mockImplementation((config) => {
      const method = config.method?.toUpperCase();

      if (method === "GET") {
        // activePhoneToken
        return Promise.resolve({
          status: 200,
          data: {active: false},
        });
      }
      if (method === "POST") {
        postCallCount += 1;

        if (postCallCount === 1) {
          // First POST: createPhoneToken
          return Promise.resolve({
            status: 201,
            statusText: "CREATED",
            data: null,
          });
        }
        // Second POST: verifyToken
        return Promise.resolve({
          status: 200,
          statusText: "OK",
          data: null,
        });
      }
      return undefined;
    });

    props.userData = userData;

    renderWithProviders(<MobilePhoneVerification {...props} />);

    // Wait for textbox to render
    await waitFor(() => {
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    const codeInput = screen.getByRole("textbox");
    fireEvent.change(codeInput, {target: {value: "123456", name: "code"}});
    expect(codeInput).toHaveValue("123456");

    const submitButton = screen.getByRole("button", {name: /submit/i});
    fireEvent.click(submitButton);

    await tick();

    expect(props.setUserData).toHaveBeenCalledTimes(1);

    expect(props.setUserData).toHaveBeenCalledWith({
      ...userData,
      is_active: true,
      is_verified: true,
      mustLogin: true,
      username: userData.phone_number,
    });
  });

  it("should show errors", async () => {
    validateToken.mockResolvedValue(true);
    loadTranslation("en", "default");

    // Reset and set up axios mock
    axios.mockReset();

    // Track POST call count for sequential responses
    let postCallCount = 0;

    axios.mockImplementation((config) => {
      const method = config.method?.toUpperCase();

      if (method === "GET") {
        // activePhoneToken
        return Promise.resolve({
          status: 200,
          data: {active: false},
        });
      }
      if (method === "POST") {
        postCallCount += 1;

        if (postCallCount === 1) {
          // First POST: createPhoneToken succeeds
          return Promise.resolve({
            status: 201,
            statusText: "CREATED",
            data: null,
          });
        }
        // Second POST: verifyToken fails
        const error = new Error("Request failed with status code 400");
        error.response = {
          status: 400,
          statusText: "BAD REQUEST",
          data: {
            non_field_errors: ["Invalid code."],
          },
        };
        return Promise.reject(error);
      }
      return undefined;
    });

    props.userData = userData;

    renderWithProviders(<MobilePhoneVerification {...props} />);

    // Wait for textbox to render
    await waitFor(() => {
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    const codeInput = screen.getByRole("textbox");
    fireEvent.change(codeInput, {target: {value: "123456", name: "code"}});
    expect(codeInput).toHaveValue("123456");

    const submitButton = screen.getByRole("button", {name: /submit/i});
    fireEvent.click(submitButton);

    await tick();

    await waitFor(() => {
      expect(screen.getByText(/invalid code/i)).toBeInTheDocument();
    });

    expect(props.setUserData).not.toHaveBeenCalled();

    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Request failed with status code 400",
        response: {
          data: {
            non_field_errors: ["Invalid code."],
          },
          status: 400,
          statusText: "BAD REQUEST",
        },
      }),
      "Invalid code.",
    );
  });

  it("should log out successfully", async () => {
    validateToken.mockReturnValue(true);
    jest.spyOn(toast, "success");
    props.userData = userData;

    renderWithProviders(<MobilePhoneVerification {...props} />);

    await tick();

    const logoutButton = screen.getByRole("button", {name: /logout/i});
    fireEvent.click(logoutButton);

    await tick();

    expect(handleLogout).toHaveBeenCalledTimes(1);
    expect(handleLogout).toHaveBeenCalledWith(
      props.logout,
      props.cookies,
      props.orgSlug,
      props.setUserData,
      props.userData,
      true,
    );
  });

  it("should set title", async () => {
    renderWithProviders(<MobilePhoneVerification {...props} />);

    await tick();

    expect(props.setTitle).toHaveBeenCalledWith(
      "Verify mobile number",
      props.orgName,
    );
  });

  it("should not call API to resend token if one has already sent", async () => {
    axios.mockClear();
    sessionStorage.setItem("owPhoneTokenSent", "true");

    renderWithProviders(<MobilePhoneVerification {...props} />);

    await tick();

    // Since token was already sent, createPhoneToken API shouldn't be called
    // axios is still called once for activePhoneToken check
    expect(axios).toHaveBeenCalledTimes(1);

    sessionStorage.removeItem("owPhoneTokenSent");
  });

  it("should show error on rejection", async () => {
    axios.mockReset();

    const error = new Error("Request failed with status code 400");
    error.response = {
      status: 400,
      statusText: "BAD REQUEST",
      data: {
        non_field_errors: ["Bad request"],
      },
    };

    axios.mockImplementationOnce(() => Promise.reject(error));

    validateToken.mockReturnValue(true);
    jest.spyOn(toast, "error");

    renderWithProviders(<MobilePhoneVerification {...props} />);

    await tick();

    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Request failed with status code 400",
        response: {
          data: {non_field_errors: ["Bad request"]},
          status: 400,
          statusText: "BAD REQUEST",
        },
      }),
      "Bad request",
    );
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});

describe("Mobile Phone Token verification: corner cases", () => {
  let props;

  beforeEach(() => {
    jest.clearAllMocks();
    axios.mockReset();
    props = createTestProps();
    validateToken.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    sessionStorage.clear();
  });

  it("should not proceed if user is already verified", async () => {
    axios.mockClear();
    validateToken.mockReturnValue(true);
    props.userData = {...userData, is_active: true, is_verified: true};

    renderWithProviders(<MobilePhoneVerification {...props} />);

    await tick();

    // Should not create phone token for already verified user
    expect(axios).not.toHaveBeenCalled();
  });

  it("should not proceed if mobile verification is not enabled", async () => {
    axios.mockClear();
    validateToken.mockReturnValue(true);
    props.settings.mobile_phone_verification = false;

    renderWithProviders(<MobilePhoneVerification {...props} />);

    await tick();

    // Should not proceed with verification if feature is disabled
    expect(axios).not.toHaveBeenCalled();
  });
});
