/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable camelcase */
import {shallow} from "enzyme";
import React from "react";
import axios from "axios";
import getConfig from "../../utils/get-config";
import Modal from "./modal";
import {mapStateToProps} from "./index";
import logError from "../../utils/log-error";

jest.mock("../../utils/get-config");
jest.mock("../../utils/log-error");
jest.mock("axios");

const defaultConfig = getConfig("default", true);
const createTestProps = (props) => ({
  orgSlug: "default",
  language: "en",
  privacyPolicy: defaultConfig.privacy_policy,
  termsAndConditions: defaultConfig.terms_and_conditions,
  match: {
    params: {
      name: "terms-and-conditions",
    },
  },
  prevPath: "/default/login",
  history: {
    push: jest.fn(),
  },
  ...props,
});

describe("<Modal /> rendering", () => {
  let props;
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
    const component = await shallow(<Modal {...props} />);
    expect(component).toMatchSnapshot();
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
      match: {
        params: {
          name: "privacy-policy",
        },
      },
    });
    const component = await shallow(<Modal {...props} />);
    expect(component).toMatchSnapshot();
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
      match: {
        params: {
          name: "test-name",
        },
      },
    });
    const component = await shallow(<Modal {...props} />);
    expect(component).toMatchSnapshot();
  });
  it("should render nothing when request is bad", async () => {
    axios.mockImplementationOnce(() =>
      Promise.reject({
        status: 500,
        data: {},
      }),
    );
    props = createTestProps();
    const component = await shallow(<Modal {...props} />);
    expect(component).toMatchSnapshot();
    expect(logError).toHaveBeenCalledWith({
      status: 500,
      data: {},
    });
  });
});

describe("<Modal /> interactions", () => {
  let props;
  let wrapper;
  beforeEach(async () => {
    global.document.addEventListener = jest.fn();
    global.document.removeEventListener = jest.fn();
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        data: {
          __html: "Modal Content",
        },
      }),
    );
    props = createTestProps();
    wrapper = await shallow(<Modal {...props} />);
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
    wrapper.instance().handleKeyDown({keyCode: 1});
    expect(props.history.push).toHaveBeenCalledTimes(0);
    wrapper.instance().handleKeyDown({keyCode: 27});
    expect(props.history.push).toHaveBeenCalledTimes(1);
    await wrapper.instance().componentDidMount();
    await wrapper.instance().componentWillUnmount();
    expect(global.document.addEventListener).toHaveBeenCalled();
    expect(global.document.removeEventListener).toHaveBeenCalled();
  });
  it("should map state to props", async () => {
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
    expect(document.body.style.overflow).toEqual("hidden");
    wrapper.instance().componentWillUnmount();
    expect(document.body.style.overflow).toEqual("auto");
  });
});
