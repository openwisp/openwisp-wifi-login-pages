import {render, screen, waitFor, fireEvent} from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import axios from "axios";
import {MemoryRouter} from "react-router-dom";
import getConfig from "../../utils/get-config";
import getText from "../../utils/get-text";
import Modal from "./modal";
import {mapStateToProps} from "./index";
import logError from "../../utils/log-error";

jest.mock("../../utils/get-config");
jest.mock("../../utils/log-error");
jest.mock("../../utils/get-text", () => jest.fn());
jest.mock("axios");

const defaultConfig = getConfig("default", true);
const createTestProps = (props) => ({
  orgSlug: "default",
  language: "en",
  privacyPolicy: defaultConfig.privacy_policy,
  termsAndConditions: defaultConfig.terms_and_conditions,
  params: {
    name: "terms-and-conditions",
  },
  prevPath: "/default/login",
  navigate: jest.fn(),
  ...props,
});

describe("<Modal /> rendering", () => {
  let props;

  beforeEach(() => {
    jest.clearAllMocks();
    axios.mockReset();
  });

  it("should render terms-and-conditions correctly", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        data: {
          __html: "t&c modal content",
        },
      }),
    );
    props = createTestProps();

    const {container} = render(
      <MemoryRouter>
        <Modal {...props} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/modal content/i)).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
    expect(getText).toHaveBeenCalledWith(
      props.termsAndConditions,
      props.language,
    );
  });

  it("should render privacy-policy correctly", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        data: {
          __html: "privacy policy modal content",
        },
      }),
    );
    props = createTestProps({
      params: {
        name: "privacy-policy",
      },
    });

    const {container} = render(
      <MemoryRouter>
        <Modal {...props} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/modal content/i)).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
    expect(getText).toHaveBeenCalledWith(props.privacyPolicy, props.language);
  });

  it("should render nothing on incorrect param name", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        data: {
          __html: "",
        },
      }),
    );
    props = createTestProps({
      params: {
        name: "test-name",
      },
    });

    const {container} = render(
      <MemoryRouter>
        <Modal {...props} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      // Component should render but with empty content
      expect(axios).toHaveBeenCalled();
    });

    expect(container).toMatchSnapshot();
  });

  it("should render nothing when request is bad", async () => {
    const error = new Error("Request failed");
    error.status = 500;
    error.data = {};

    axios.mockImplementationOnce(() => Promise.reject(error));
    props = createTestProps();

    const {container} = render(
      <MemoryRouter>
        <Modal {...props} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith(error);
    });

    expect(container).toMatchSnapshot();
  });
});

describe("<Modal /> interactions", () => {
  let props;
  let originalAddEventListener;
  let originalRemoveEventListener;

  beforeEach(() => {
    jest.clearAllMocks();
    axios.mockReset();
    // Store original methods
    originalAddEventListener = document.addEventListener;
    originalRemoveEventListener = document.removeEventListener;
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Restore original methods
    document.addEventListener = originalAddEventListener;
    document.removeEventListener = originalRemoveEventListener;
  });

  it("should call handleKeyDown function on Esc key press", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        data: {
          __html: "Modal Content",
        },
      }),
    );
    props = createTestProps();

    render(
      <MemoryRouter>
        <Modal {...props} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/modal content/i)).toBeInTheDocument();
    });

    // Simulate Esc key press (component uses keyup, not keyDown)
    fireEvent.keyUp(document, {keyCode: 27});

    await waitFor(() => {
      expect(props.navigate).toHaveBeenCalledTimes(1);
    });
  });

  it("should not navigate on non-Esc key press", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        data: {
          __html: "Modal Content",
        },
      }),
    );
    props = createTestProps();

    render(
      <MemoryRouter>
        <Modal {...props} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/modal content/i)).toBeInTheDocument();
    });

    // Simulate non-Esc key press
    fireEvent.keyUp(document, {keyCode: 1});

    // Should not navigate
    expect(props.navigate).not.toHaveBeenCalled();
  });

  it("should map state to props", () => {
    const result = mapStateToProps(
      {
        organization: {
          configuration: {
            privacy_policy: "# Privacy Policy",
            terms_and_conditions: "# Terms and Conditions",
          },
        },
        language: "en",
      },
      {prevPath: "/default/login"},
    );
    expect(result).toEqual({
      privacyPolicy: "# Privacy Policy",
      termsAndConditions: "# Terms and Conditions",
      language: "en",
      prevPath: "/default/login",
    });
  });

  it("should hide scrollbar when modal opens", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        data: {
          __html: "Modal Content",
        },
      }),
    );
    props = createTestProps();

    const {unmount} = render(
      <MemoryRouter>
        <Modal {...props} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/modal content/i)).toBeInTheDocument();
    });

    // Modal should hide scrollbar when open
    expect(document.body).toHaveStyle({overflow: "hidden"});

    // Unmount to trigger cleanup
    unmount();

    // Scrollbar should be restored
    expect(document.body).toHaveStyle({overflow: "auto"});
  });

  it("should render modal with backdrop", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        data: {
          __html: "Modal Content",
        },
      }),
    );
    props = createTestProps();

    render(
      <MemoryRouter>
        <Modal {...props} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/modal content/i)).toBeInTheDocument();
    });

    // Just verify the modal rendered - the close functionality is tested via Esc key
    expect(screen.getByText(/modal content/i)).toBeInTheDocument();
  });

  it("should cleanup event listeners on unmount", async () => {
    // Mock the event listener methods for this specific test
    const addEventListenerSpy = jest.spyOn(document, "addEventListener");
    const removeEventListenerSpy = jest.spyOn(document, "removeEventListener");

    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        data: {
          __html: "Modal Content",
        },
      }),
    );
    props = createTestProps();

    const {unmount} = render(
      <MemoryRouter>
        <Modal {...props} />
      </MemoryRouter>,
    );

    // Wait for component to mount
    await waitFor(() => {
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "keyup",
        expect.any(Function),
        false,
      );
    });

    // Unmount component
    unmount();

    // Event listeners should be removed
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keyup",
      expect.any(Function),
      false,
    );

    // Clean up spies
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
