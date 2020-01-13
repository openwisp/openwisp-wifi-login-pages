/* eslint-disable prefer-promise-reject-errors */
import axios from "axios";
/* eslint-disable camelcase */
import {shallow} from "enzyme";
import React from "react";
import {Cookies} from "react-cookie";
import ShallowRenderer from "react-test-renderer/shallow";

import getConfig from "../../utils/get-config";
import Status from "./status";

jest.mock("axios");

const defaultConfig = getConfig("default");
const createTestProps = props => {
  return {
    language: "en",
    orgSlug: "default",
    statusPage: defaultConfig.components.status_page,
    cookies: new Cookies(),
    logout: jest.fn(),
    ...props,
  };
};

describe("<Status /> rendering", () => {
  let props;
  it("should render correctly", () => {
    props = createTestProps();
    const renderer = new ShallowRenderer();
    const component = renderer.render(<Status {...props} />);
    expect(component).toMatchSnapshot();
  });
});

describe("<Status /> interactions", () => {
  let props;
  let wrapper;
  let originalError;
  let lastConsoleOutuput;
  beforeEach(() => {
    originalError = console.error;
    lastConsoleOutuput = null;
    console.error = (data) => {
      lastConsoleOutuput = data;
    };
  });
  afterEach(() => {
    console.error = originalError;
  });
  it("should call logout function when logout button is clicked", () => {
    axios.mockImplementationOnce(() => {
      return Promise.resolve({
        status: 200,
        statusText: 'OK',
        data: {
          "control:Auth-Type": "Accept",
        }
      });
    });
    props = createTestProps();
    wrapper = shallow(<Status {...props} />);
    wrapper.find("#owisp-status-logout-btn").simulate("click", {});
    expect(wrapper.instance().props.logout.mock.calls.length).toBe(1);
  });
  it("test componentDidMount lifecycle method", () => {
    axios
      .mockImplementationOnce(() => {
        return Promise.reject({
          status: 500,
          statusText: 'Internal Server Error',
          response: {
            data: {}
          }
        });
      })
      .mockImplementationOnce(() => {
        return Promise.reject({
          status: 504,
          statusText: "Gateway Timeout",
          response: {
            data: {}
          },
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({
          data: {
            "control:Auth-Type": "Accept",
          },
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({
          response: {
            status: 200,
            statusText: 'OK',
          },
          data: {
            "control:Auth-Type": "Reject",
          },
        });
      });
    props = createTestProps();
    wrapper = shallow(<Status {...props} />);
    return wrapper
      .instance()
      .componentDidMount()
      .then(() => {
        expect(wrapper.instance().props.logout.mock.calls.length).toBe(2);
        expect(lastConsoleOutuput).not.toBe(null);
        lastConsoleOutuput = null;
        return wrapper
          .instance()
          .componentDidMount()
          .then(() => {
            expect(wrapper.instance().props.logout.mock.calls.length).toBe(2);
            expect(lastConsoleOutuput).toBe(null);
            lastConsoleOutuput = null;
            return wrapper
              .instance()
              .componentDidMount()
              .then(() => {
                expect(wrapper.instance().props.logout.mock.calls.length).toBe(
                  3,
                );
                expect(lastConsoleOutuput).not.toBe(null);
                lastConsoleOutuput = null;
              });
          });
      });
  });
});
