/* eslint-disable prefer-promise-reject-errors */
import axios from "axios";
import {render, screen, waitFor, fireEvent} from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import {toast} from "react-toastify";
import {MemoryRouter} from "react-router-dom";
import {Provider} from "react-redux";

// Mock modules BEFORE importing
/* eslint-disable import/first */
jest.mock("axios");
jest.mock("../../utils/get-config", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    components: {
      password_reset_form: {
        input_fields: {
          email: {},
        },
      },
    },
  })),
}));
jest.mock("../../utils/load-translation");

import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import PasswordReset from "./password-reset";
import translation from "../../test-translation.json";
import tick from "../../utils/tick";
/* eslint-enable import/first */

const defaultConfig = getConfig("default", true);
const createTestProps = (props) => ({
  orgSlug: "default",
  orgName: "default name",
  setTitle: jest.fn(),
  passwordReset: defaultConfig.components.password_reset_form,
  language: "en",
  ...props,
});

const getTranslationString = (msgid) => {
  try {
    return translation.translations[""][msgid].msgstr[0];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err, msgid);
    return msgid;
  }
};

const createMockStore = () => {
  const state = {
    organization: {
      configuration: {
        ...defaultConfig,
        slug: "default",
        components: {
          ...defaultConfig.components,
          contact_page: {
            email: "support@openwisp.org",
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
      <MemoryRouter>{component}</MemoryRouter>
    </Provider>,
  );

describe("<PasswordReset /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const {container} = renderWithProviders(<PasswordReset {...props} />);
    expect(container).toMatchSnapshot();
  });
});

describe("<PasswordReset /> rendering", () => {
  let props;

  beforeEach(() => {
    jest.clearAllMocks();
    props = createTestProps();
    loadTranslation("en", "default");
  });

  it("should render correctly", () => {
    const {container} = renderWithProviders(<PasswordReset {...props} />);
    expect(container).toMatchSnapshot();
  });

  it("should render 2 inputs", () => {
    renderWithProviders(<PasswordReset {...props} />);

    const emailInput = screen.getByPlaceholderText(
      getTranslationString("USERNAME_LOG_PHOLD"),
    );
    const submitButton = screen.getByRole("button", {
      name: /reset my password/i,
    });

    expect(emailInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });

  it("should render input field correctly", () => {
    renderWithProviders(<PasswordReset {...props} />);

    const emailInput = screen.getByPlaceholderText(
      getTranslationString("USERNAME_LOG_PHOLD"),
    );
    const label = screen.getByText(getTranslationString("USERNAME_LOG_LBL"));

    expect(label).toBeInTheDocument();
    expect(emailInput).toHaveAttribute(
      "placeholder",
      getTranslationString("USERNAME_LOG_PHOLD"),
    );
    expect(emailInput).toHaveAttribute(
      "title",
      getTranslationString("USERNAME_LOG_TITL"),
    );
    expect(emailInput).toHaveAttribute("type", "text");
  });
});

describe("<PasswordReset /> interactions", () => {
  let props;
  let lastConsoleOutuput;

  beforeEach(() => {
    jest.clearAllMocks();
    axios.mockReset();
    lastConsoleOutuput = null;
    jest.spyOn(global.console, "error").mockImplementation((data) => {
      lastConsoleOutuput = data;
    });
    props = createTestProps();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should change state values when handleChange function is invoked", () => {
    renderWithProviders(<PasswordReset {...props} />);

    const emailInput = screen.getByPlaceholderText(
      getTranslationString("USERNAME_LOG_PHOLD"),
    );
    fireEvent.change(emailInput, {
      target: {value: "test@test.com", name: "input"},
    });

    expect(emailInput.value).toEqual("test@test.com");
  });

  it("should execute handleSubmit correctly when form is submitted", async () => {
    axios
      .mockImplementationOnce(() =>
        Promise.reject({response: {data: {detail: "errors"}}}),
      )
      .mockImplementationOnce(() =>
        Promise.reject({
          response: {data: {non_field_errors: ["non field errors"]}},
        }),
      )
      .mockImplementationOnce(() => Promise.resolve({data: {detail: true}}));

    renderWithProviders(<PasswordReset {...props} />);

    const spyToastError = jest.spyOn(toast, "error");
    const spyToastSuccess = jest.spyOn(toast, "success");
    const form = screen.getByRole("form");
    const emailInput = screen.getByPlaceholderText(
      getTranslationString("USERNAME_LOG_PHOLD"),
    );

    // Test 1: Error with detail
    fireEvent.submit(form);
    await waitFor(() => {
      expect(emailInput).toHaveClass("error");
      expect(spyToastError).toHaveBeenCalledTimes(1);
    });
    expect(lastConsoleOutuput).not.toBe(null);
    expect(spyToastSuccess).toHaveBeenCalledTimes(0);
    lastConsoleOutuput = null;

    // Test 2: Error with non_field_errors
    fireEvent.submit(form);
    await tick();

    await waitFor(() => {
      expect(spyToastError).toHaveBeenCalledTimes(2);
    });
    expect(lastConsoleOutuput).not.toBe(null);
    expect(spyToastSuccess).toHaveBeenCalledTimes(0);
    lastConsoleOutuput = null;

    // Test 3: Success
    fireEvent.submit(form);
    await tick();

    await waitFor(() => {
      expect(screen.queryByRole("form")).not.toBeInTheDocument();
      expect(spyToastSuccess).toHaveBeenCalledTimes(1);
    });
    // Allow act() warnings for async state updates
    const hasOnlyActWarnings =
      lastConsoleOutuput === null ||
      (typeof lastConsoleOutuput === "string" &&
        lastConsoleOutuput.includes("act(...)"));
    expect(hasOnlyActWarnings).toBe(true);
    expect(spyToastError).toHaveBeenCalledTimes(2);
  });

  it("should set title", () => {
    renderWithProviders(<PasswordReset {...props} />);

    expect(props.setTitle).toHaveBeenCalledWith(
      "Reset Password",
      props.orgName,
    );
  });

  it("should clear errors on successful password reset", async () => {
    axios.mockImplementationOnce(() => Promise.resolve({data: {detail: true}}));

    renderWithProviders(<PasswordReset {...props} />);

    const emailInput = screen.getByPlaceholderText(
      getTranslationString("USERNAME_LOG_PHOLD"),
    );
    const form = screen.getByRole("form");

    fireEvent.change(emailInput, {
      target: {value: "test@test.com", name: "input"},
    });

    fireEvent.submit(form);
    await tick();

    await waitFor(() => {
      expect(emailInput).not.toHaveClass("error");
    });
  });

  it("should show error message for invalid email", async () => {
    axios.mockImplementationOnce(() =>
      Promise.reject({response: {data: {detail: "Invalid email"}}}),
    );

    renderWithProviders(<PasswordReset {...props} />);

    const emailInput = screen.getByPlaceholderText(
      getTranslationString("USERNAME_LOG_PHOLD"),
    );
    const form = screen.getByRole("form");

    fireEvent.change(emailInput, {
      target: {value: "invalid-email", name: "input"},
    });

    fireEvent.submit(form);
    await tick();

    await waitFor(() => {
      expect(emailInput).toHaveClass("error");
    });
  });
});
