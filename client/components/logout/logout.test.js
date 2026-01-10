import {render, screen, fireEvent} from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import {TestRouter} from "../../test-utils";
import * as toastify from "react-toastify";
import logError from "../../utils/log-error";
import loadTranslation from "../../utils/load-translation";
import Logout from "./logout";
import {mapStateToProps, mapDispatchToProps} from "./index";

jest.mock("axios");
jest.mock("../../utils/get-config");
jest.mock("../../utils/log-error");
jest.mock("../../utils/load-translation");
logError.mockImplementation(jest.fn());

const userData = {
  username: "tester@tester.com",
  email: "tester@tester.com",
  is_verified: true,
  is_active: true,
  mustLogin: false,
};

const createTestProps = (props) => ({
  orgSlug: "default",
  orgName: "default name",
  authenticate: jest.fn(),
  setTitle: jest.fn(),
  setUserData: jest.fn(),
  userData,
  ...props,
});

describe("<Logout /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const {container} = render(
      <TestRouter>
        <Logout {...props} />
      </TestRouter>,
    );
    expect(container).toMatchSnapshot();
  });
});

describe("<Logout /> rendering", () => {
  let props;

  it("should render correctly", () => {
    props = createTestProps();
    loadTranslation("en", "default");
    const {container} = render(
      <TestRouter>
        <Logout {...props} />
      </TestRouter>,
    );
    expect(container).toMatchSnapshot();
  });
});

describe("<Logout /> interactions", () => {
  let props;

  beforeEach(() => {
    jest.clearAllMocks();
    loadTranslation("en", "default");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should set user authenticated when log in again is clicked", () => {
    props = createTestProps();
    render(
      <TestRouter>
        <Logout {...props} />
      </TestRouter>,
    );

    const loginButton = screen.getByRole("link", {name: /login again/i});
    expect(loginButton).toBeInTheDocument();

    fireEvent.click(loginButton);

    // ensure mustLogin:true is passed
    // otherwise captive portal login won't be done
    expect(props.setUserData).toHaveBeenCalledWith({
      ...userData,
      mustLogin: true,
    });
  });

  it("should call setTitle to set the title", () => {
    props = createTestProps();
    render(
      <TestRouter>
        <Logout {...props} />
      </TestRouter>,
    );

    expect(props.setTitle).toHaveBeenCalledWith("Logout", props.orgName);
  });

  it("should login if user is already authenticated and clicks log in again", () => {
    const spyToast = jest.spyOn(toastify.toast, "success");
    props = createTestProps();
    props.isAuthenticated = true;

    render(
      <TestRouter>
        <Logout {...props} />
      </TestRouter>,
    );

    const loginButton = screen.getByRole("link", {name: /login again/i});
    fireEvent.click(loginButton);

    expect(spyToast).toHaveBeenCalled();
    expect(spyToast).toHaveBeenCalledWith("Login successful", {
      toastId: "main_toast_id",
    });
  });

  it("should mapStatetoProps and dispatchtoProps correctly", () => {
    const state = {
      organization: {
        configuration: {
          slug: "default",
          name: "default name",
          isAuthenticated: false,
          userData,
        },
      },
    };
    const dispatch = jest.fn();
    let result = mapStateToProps(state);
    expect(result).toEqual({
      orgSlug: "default",
      orgName: "default name",
      isAuthenticated: false,
      userData,
    });
    result = mapDispatchToProps(dispatch);
    expect(result).toEqual({
      authenticate: expect.any(Function),
      setUserData: expect.any(Function),
      setTitle: expect.any(Function),
    });
  });
});
