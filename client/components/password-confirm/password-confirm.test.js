/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable camelcase */
import axios from "axios";
import {shallow} from "enzyme";
import React from "react";
import PropTypes from "prop-types";
import {BrowserRouter as Router} from "react-router-dom";
import {Provider} from "react-redux";
import renderer from "react-test-renderer";
import {toast} from "react-toastify";
import {loadingContextValue} from "../../utils/loading-context";
import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import PasswordConfirm from "./password-confirm";
import translation from "../../test-translation.json";

jest.mock("axios");
jest.mock("../../utils/load-translation");
const defaultConfig = getConfig("default");
const createTestProps = (props) => {
  return {
    language: "en",
    orgSlug: "default",
    orgName: "default name",
    configuration: defaultConfig,
    passwordConfirm: defaultConfig.components.password_reset_confirm_form,
    setTitle: jest.fn(),
    match: {
      params: {
        uid: "testUid",
        token: "testToken",
      },
    },
    ...props,
  };
};

const getTranslationString = (msgid) => {
  try {
    return translation.translations[""][msgid].msgstr[0];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err, msgid);
    return msgid;
  }
};

describe("<PasswordConfirm /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const wrapper = shallow(<PasswordConfirm {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});

describe("<PasswordConfirm /> rendering", () => {
  let props;
  let wrapper;

  beforeEach(() => {
    props = createTestProps();
    loadTranslation("en", "default");
    wrapper = shallow(<PasswordConfirm {...props} />);
  });

  it("should render correctly", () => {
    props = createTestProps();
    const mockedStore = {
      subscribe: () => {},
      dispatch: () => {},
      // needed to render <Contact/>
      getState: () => {
        return {
          organization: {
            configuration: props.configuration,
          },
          language: props.language,
        };
      },
    };
    const component = renderer
      .create(
        <Provider store={mockedStore}>
          <Router>
            <PasswordConfirm {...props} />
          </Router>
        </Provider>,
      )
      .toJSON();
    expect(component).toMatchSnapshot();
  });

  it("should render 2 input fields", () => {
    expect(wrapper.find(".input")).toHaveLength(2);
  });

  it("should render password field correctly", () => {
    const {password} = props.passwordConfirm.input_fields;
    expect(wrapper.find(".row.password label").text()).toBe(
      getTranslationString("PWD_LABEL"),
    );
    const passwordInput = wrapper.find(".row.password input");
    expect(passwordInput.prop("placeholder")).toBe(
      getTranslationString("PWD_PLACEHOLDER"),
    );
    expect(passwordInput.prop("title")).toBe(
      getTranslationString("PWD_PATTERN_DESCRIPTION"),
    );
    expect(passwordInput.prop("type")).toBe(password.type);
  });

  it("should render password confirm field correctly", () => {
    const {password_confirm} = props.passwordConfirm.input_fields;
    expect(wrapper.find(".row.password-confirm label").text()).toBe(
      getTranslationString("CONFIRM_PWD_LABEL"),
    );
    const confirmInput = wrapper.find(".row.password-confirm input");
    expect(confirmInput.prop("placeholder")).toBe(
      getTranslationString("CONFIRM_PWD_PLACEHOLDER"),
    );
    expect(confirmInput.prop("title")).toBe(
      getTranslationString("PWD_PATTERN_DESCRIPTION"),
    );
    expect(confirmInput.prop("type")).toBe(password_confirm.type);
  });
});

describe("<PasswordConfirm /> interactions", () => {
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
    PasswordConfirm.contextTypes = {
      setLoading: PropTypes.func,
      getLoading: PropTypes.func,
    };
    props = createTestProps();
    wrapper = shallow(<PasswordConfirm {...props} />, {
      context: loadingContextValue,
    });
  });

  afterEach(() => {
    console.error = originalError;
  });

  it("should change state values when handleChange function is invoked", () => {
    wrapper
      .find(".password input")
      .simulate("change", {target: {value: "123456", name: "newPassword1"}});
    expect(wrapper.state("newPassword1")).toEqual("123456");
    wrapper
      .find(".password-confirm input")
      .simulate("change", {target: {value: "123456", name: "newPassword2"}});
    expect(wrapper.state("newPassword2")).toEqual("123456");
  });

  it("should execute handleSubmit correctly when form is submitted", () => {
    axios
      .mockImplementationOnce(() => {
        return Promise.reject({response: {data: {detail: "errors"}}});
      })
      .mockImplementationOnce(() => {
        return Promise.reject({
          response: {data: {non_field_errors: ["non field errors"]}},
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({data: {detail: true}});
      });
    wrapper.setState({
      newPassword1: "wrong password",
      newPassword2: "wrong password1",
    });
    wrapper.instance().handleSubmit({preventDefault: () => {}});
    expect(wrapper.update().find(".password-confirm div.error")).toHaveLength(
      1,
    );
    wrapper.setState({
      newPassword1: "password",
      newPassword2: "password",
    });
    const spyToastError = jest.spyOn(toast, "error");
    const spyToastSuccess = jest.spyOn(toast, "success");
    return wrapper
      .instance()
      .handleSubmit({preventDefault: () => {}})
      .then(() => {
        expect(wrapper.instance().state.errors.nonField).toEqual("errors");
        expect(wrapper.find(".error.non-field")).toHaveLength(1);
        expect(lastConsoleOutuput).not.toBe(null);
        expect(spyToastError.mock.calls.length).toBe(1);
        expect(spyToastSuccess.mock.calls.length).toBe(0);
        lastConsoleOutuput = null;
      })
      .then(() => {
        return wrapper
          .instance()
          .handleSubmit({preventDefault: () => {}})
          .then(() => {
            expect(wrapper.instance().state.errors.nonField).toEqual(
              "non field errors",
            );
            expect(lastConsoleOutuput).not.toBe(null);
            expect(spyToastError.mock.calls.length).toBe(2);
            expect(spyToastSuccess.mock.calls.length).toBe(0);
            lastConsoleOutuput = null;
          });
      })
      .then(() => {
        return wrapper
          .instance()
          .handleSubmit({preventDefault: () => {}})
          .then(() => {
            expect(wrapper.instance().state.errors).toEqual({});
            expect(wrapper.instance().state.success).toBe(true);
            expect(wrapper.find(".input.error")).toHaveLength(0);
            expect(wrapper.find(".success")).toHaveLength(1);
            expect(lastConsoleOutuput).toBe(null);
            expect(spyToastError.mock.calls.length).toBe(2);
            expect(spyToastSuccess.mock.calls.length).toBe(1);
            lastConsoleOutuput = null;
          });
      });
  });
  it("should set title", () => {
    const setTitleMock = wrapper.instance().props.setTitle.mock;
    expect(setTitleMock.calls.pop()).toEqual(["Reset Password", props.orgName]);
  });
});
