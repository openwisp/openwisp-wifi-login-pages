import axios from "axios";
import {render, screen, waitFor, fireEvent} from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import {Provider} from "react-redux";
import {toast} from "react-toastify";
import {TestRouter} from "../../test-utils";
import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import PasswordConfirm from "./password-confirm";
import translation from "../../test-translation.json";
import tick from "../../utils/tick";

const mockConfig = {
  name: "default name",
  slug: "default",
  default_language: "en",
  components: {
    password_reset_confirm_form: {
      input_fields: {
        password: {
          pattern: ".{6,}",
        },
        password_confirm: {
          pattern: ".{6,}",
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
jest.mock("../../utils/load-translation");

const defaultConfig = getConfig("default", true);
const createTestProps = (props) => ({
  language: "en",
  orgSlug: "default",
  orgName: "default name",
  configuration: defaultConfig,
  passwordConfirm: defaultConfig.components.password_reset_confirm_form,
  setTitle: jest.fn(),
  params: {
    uid: "testUid",
    token: "testToken",
  },
  ...props,
});

const getTranslationString = (msgid) => {
  try {
    return translation.translations[""][msgid].msgstr[0];
  } catch (err) {
    console.error(err, msgid);
    return msgid;
  }
};

const renderWithProviders = (props) => {
  const state = {
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
  };

  const mockedStore = {
    subscribe: () => {},
    dispatch: () => {},
    getState: () => state,
  };

  return render(
    <Provider store={mockedStore}>
      <TestRouter>
        <PasswordConfirm {...props} />
      </TestRouter>
    </Provider>,
  );
};

describe("<PasswordConfirm /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const {container} = renderWithProviders(props);
    expect(container).toMatchSnapshot();
  });
});

describe("<PasswordConfirm /> rendering", () => {
  let props;

  beforeEach(() => {
    jest.clearAllMocks();
    props = createTestProps();
    loadTranslation("en", "default");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render correctly", () => {
    const {container} = renderWithProviders(props);
    expect(container).toMatchSnapshot();
  });

  it("should render 2 input fields", () => {
    renderWithProviders(props);
    const passwordInput = screen.getByPlaceholderText(
      getTranslationString("PWD_PHOLD"),
    );
    const confirmInput = screen.getByPlaceholderText(
      getTranslationString("CONFIRM_PWD_PHOLD"),
    );
    expect(passwordInput).toBeInTheDocument();
    expect(confirmInput).toBeInTheDocument();
  });

  it("should render password field correctly", () => {
    renderWithProviders(props);

    const passwordLabel = screen.getByText(getTranslationString("PWD_LBL"));
    expect(passwordLabel).toBeInTheDocument();

    const passwordInput = screen.getByPlaceholderText(
      getTranslationString("PWD_PHOLD"),
    );
    expect(passwordInput).toHaveAttribute(
      "placeholder",
      getTranslationString("PWD_PHOLD"),
    );
    expect(passwordInput).toHaveAttribute(
      "title",
      getTranslationString("PWD_PTRN_DESC"),
    );
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("should render password confirm field correctly", () => {
    renderWithProviders(props);

    const confirmLabel = screen.getByText(
      getTranslationString("CONFIRM_PWD_LBL"),
    );
    expect(confirmLabel).toBeInTheDocument();

    const confirmInput = screen.getByPlaceholderText(
      getTranslationString("CONFIRM_PWD_PHOLD"),
    );
    expect(confirmInput).toHaveAttribute(
      "placeholder",
      getTranslationString("CONFIRM_PWD_PHOLD"),
    );
    expect(confirmInput).toHaveAttribute(
      "title",
      getTranslationString("PWD_PTRN_DESC"),
    );
    expect(confirmInput).toHaveAttribute("type", "password");
  });
});

describe("<PasswordConfirm /> interactions", () => {
  let props;

  beforeEach(() => {
    jest.clearAllMocks();
    axios.mockReset();
    props = createTestProps();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("should change state values when handleChange function is invoked", () => {
    renderWithProviders(props);

    const passwordInput = screen.getByPlaceholderText(
      getTranslationString("PWD_PHOLD"),
    );
    fireEvent.change(passwordInput, {
      target: {value: "123456", name: "newPassword1"},
    });
    expect(passwordInput.value).toEqual("123456");

    const confirmInput = screen.getByPlaceholderText(
      getTranslationString("CONFIRM_PWD_PHOLD"),
    );
    fireEvent.change(confirmInput, {
      target: {value: "123456", name: "newPassword2"},
    });
    expect(confirmInput.value).toEqual("123456");
  });

  describe("<PasswordConfirm /> form submission scenarios", () => {
    let testProps;
    let spyToastError;
    let spyToastSuccess;
    let consoleErrorSpy;

    beforeEach(() => {
      jest.clearAllMocks();
      axios.mockReset();
      consoleErrorSpy = jest
        .spyOn(global.console, "error")
        .mockImplementation(() => {});
      testProps = createTestProps();
      spyToastError = jest.spyOn(toast, "error");
      spyToastSuccess = jest.spyOn(toast, "success");
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });

    it("should show validation error for password mismatch", async () => {
      renderWithProviders(testProps);

      const passwordInput = screen.getByPlaceholderText(
        getTranslationString("PWD_PHOLD"),
      );
      const confirmInput = screen.getByPlaceholderText(
        getTranslationString("CONFIRM_PWD_PHOLD"),
      );
      const form = screen.getByRole("form");

      fireEvent.change(passwordInput, {
        target: {value: "wrong password", name: "newPassword1"},
      });
      fireEvent.change(confirmInput, {
        target: {value: "wrong password1", name: "newPassword2"},
      });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(confirmInput).toHaveClass("error");
      });

      // Verify API was not called
      expect(axios).not.toHaveBeenCalled();
    });

    it("should handle API error with detail field", async () => {
      const error = new Error("Request failed");
      error.response = {data: {detail: "errors"}};
      axios.mockRejectedValueOnce(error);

      renderWithProviders(testProps);

      const passwordInput = screen.getByPlaceholderText(
        getTranslationString("PWD_PHOLD"),
      );
      const confirmInput = screen.getByPlaceholderText(
        getTranslationString("CONFIRM_PWD_PHOLD"),
      );
      const form = screen.getByRole("form");

      fireEvent.change(passwordInput, {
        target: {value: "password", name: "newPassword1"},
      });
      fireEvent.change(confirmInput, {
        target: {value: "password", name: "newPassword2"},
      });
      fireEvent.submit(form);

      await tick();
      await waitFor(() => {
        expect(spyToastError).toHaveBeenCalledTimes(1);
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should handle API error with non_field_errors", async () => {
      const error = new Error("Request failed");
      error.response = {data: {non_field_errors: ["non field errors"]}};
      axios.mockRejectedValueOnce(error);

      renderWithProviders(testProps);

      const passwordInput = screen.getByPlaceholderText(
        getTranslationString("PWD_PHOLD"),
      );
      const confirmInput = screen.getByPlaceholderText(
        getTranslationString("CONFIRM_PWD_PHOLD"),
      );
      const form = screen.getByRole("form");

      fireEvent.change(passwordInput, {
        target: {value: "password", name: "newPassword1"},
      });
      fireEvent.change(confirmInput, {
        target: {value: "password", name: "newPassword2"},
      });
      fireEvent.submit(form);

      await tick();
      await waitFor(() => {
        expect(spyToastError).toHaveBeenCalledTimes(1);
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should handle API error with token field", async () => {
      const error = new Error("Request failed");
      error.response = {data: {token: ["Invalid token"]}};
      axios.mockRejectedValueOnce(error);

      renderWithProviders(testProps);

      const passwordInput = screen.getByPlaceholderText(
        getTranslationString("PWD_PHOLD"),
      );
      const confirmInput = screen.getByPlaceholderText(
        getTranslationString("CONFIRM_PWD_PHOLD"),
      );
      const form = screen.getByRole("form");

      fireEvent.change(passwordInput, {
        target: {value: "password", name: "newPassword1"},
      });
      fireEvent.change(confirmInput, {
        target: {value: "password", name: "newPassword2"},
      });
      fireEvent.submit(form);

      await tick();
      await waitFor(() => {
        expect(spyToastError).toHaveBeenCalledTimes(1);
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should show success message after successful submission", async () => {
      axios.mockResolvedValueOnce({
        data: {detail: "Password reset successful"},
      });

      renderWithProviders(testProps);

      const passwordInput = screen.getByPlaceholderText(
        getTranslationString("PWD_PHOLD"),
      );
      const confirmInput = screen.getByPlaceholderText(
        getTranslationString("CONFIRM_PWD_PHOLD"),
      );
      const form = screen.getByRole("form");

      fireEvent.change(passwordInput, {
        target: {value: "password", name: "newPassword1"},
      });
      fireEvent.change(confirmInput, {
        target: {value: "password", name: "newPassword2"},
      });
      fireEvent.submit(form);

      await tick();
      await waitFor(() => {
        expect(spyToastSuccess).toHaveBeenCalledTimes(1);
      });
      expect(spyToastError).not.toHaveBeenCalled();

      // Verify inputs don't have error class
      expect(passwordInput).not.toHaveClass("error");
      expect(confirmInput).not.toHaveClass("error");
    });
  });

  it("should set title", () => {
    renderWithProviders(props);
    expect(props.setTitle).toHaveBeenCalledWith(
      "Reset Password",
      props.orgName,
    );
  });

  it("should toggle password visibility for both fields", async () => {
    renderWithProviders(props);

    const passwordInput = screen.getByPlaceholderText(
      getTranslationString("PWD_PHOLD"),
    );
    const confirmInput = screen.getByPlaceholderText(
      getTranslationString("CONFIRM_PWD_PHOLD"),
    );

    // Initially both should be password type
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(confirmInput).toHaveAttribute("type", "password");

    // Get all toggle buttons (should be 2)
    const toggleButtons = screen.getAllByTestId("password-toggle-icon");
    expect(toggleButtons).toHaveLength(2);

    // Click first toggle to reveal passwords
    fireEvent.click(toggleButtons[0]);

    await waitFor(() => {
      expect(passwordInput).toHaveAttribute("type", "text");
      expect(confirmInput).toHaveAttribute("type", "text");
    });

    // Click again to hide passwords
    fireEvent.click(toggleButtons[0]);

    await waitFor(() => {
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(confirmInput).toHaveAttribute("type", "password");
    });
  });

  it("should toggle using either toggle button", async () => {
    renderWithProviders(props);

    const passwordInput = screen.getByPlaceholderText(
      getTranslationString("PWD_PHOLD"),
    );
    const confirmInput = screen.getByPlaceholderText(
      getTranslationString("CONFIRM_PWD_PHOLD"),
    );

    const toggleButtons = screen.getAllByTestId("password-toggle-icon");

    // Click second toggle button (for confirm password field)
    fireEvent.click(toggleButtons[1]);

    await waitFor(() => {
      // Both fields should toggle since they share hidePassword state
      expect(passwordInput).toHaveAttribute("type", "text");
      expect(confirmInput).toHaveAttribute("type", "text");
    });
  });

  it("should clear errors on successful submit", async () => {
    axios.mockImplementationOnce(() => Promise.resolve({data: {detail: true}}));

    renderWithProviders(props);

    const passwordInput = screen.getByPlaceholderText(
      getTranslationString("PWD_PHOLD"),
    );
    const confirmInput = screen.getByPlaceholderText(
      getTranslationString("CONFIRM_PWD_PHOLD"),
    );
    const form = screen.getByRole("form");

    fireEvent.change(passwordInput, {
      target: {value: "password123", name: "newPassword1"},
    });
    fireEvent.change(confirmInput, {
      target: {value: "password123", name: "newPassword2"},
    });

    fireEvent.submit(form);

    await tick();
    await waitFor(() => {
      expect(passwordInput).not.toHaveClass("error");
      expect(confirmInput).not.toHaveClass("error");
    });
  });
});
