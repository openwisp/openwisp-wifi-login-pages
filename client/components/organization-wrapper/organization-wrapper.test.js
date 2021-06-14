/* eslint-disable camelcase */
import {shallow} from "enzyme";
import React from "react";
import {Cookies} from "react-cookie";
import OrganizationWrapper from "./organization-wrapper";

const createTestProps = (props) => {
  return {
    match: {params: {organization: "default"}, path: "/default"},
    organization: {
      configuration: {
        title: "Default",
        css_path: null,
        slug: "default",
        favicon: null,
        userData: {is_active: true, is_verified: true},
      },
      exists: true,
    },
    setOrganization: jest.fn(),
    cookies: new Cookies(),
    ...props,
  };
};

describe("<OrganizationWrapper /> rendering", () => {
  let props;
  let wrapper;

  beforeEach(() => {
    props = createTestProps();
    wrapper = shallow(<OrganizationWrapper {...props} />);
  });

  it("should render correctly when in loading state", () => {
    wrapper.setProps({
      organization: {...props.organization, exists: undefined},
    });
    expect(wrapper.find(".app-container")).toHaveLength(0);
    expect(wrapper.find(".org-wrapper-not-found")).toHaveLength(0);
    expect(wrapper.find(".loader-container")).toHaveLength(1);
  });

  it("should render correctly when organization doesn't exist", () => {
    wrapper.setProps({
      organization: {...props.organization, exists: false},
    });
    expect(wrapper.find(".app-container")).toHaveLength(0);
    expect(wrapper.find(".org-wrapper-not-found")).toHaveLength(1);
    expect(wrapper.find(".loader-container")).toHaveLength(0);
  });

  it("should render correctly when organization exists", () => {
    wrapper.setProps({
      organization: {...props.organization, exists: true},
    });
    expect(wrapper.find(".app-container")).toHaveLength(1);
    expect(wrapper.find(".org-wrapper-not-found")).toHaveLength(0);
    expect(wrapper.find(".loader-container")).toHaveLength(0);
  });
});

describe("<OrganizationWrapper /> interactions", () => {
  // eslint-disable-next-line
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
    props = createTestProps();
    wrapper = shallow(<OrganizationWrapper {...props} />);
  });

  afterEach(() => {
    console.error = originalError;
  });

  it("should call setOrganization once", () => {
    expect(props.setOrganization).toHaveBeenCalledTimes(1);
  });

  it("test componentDidUpdate lifecycle method", () => {
    wrapper.setProps({
      match: {params: {organization: "new-org"}},
      organization: {
        configuration: {
          title: undefined,
          css_path: "index.css",
          slug: "default",
          favicon: "favicon.png",
          userData: {is_active: true, is_verified: true},
        },
        exists: true,
      },
    });
    expect(props.setOrganization).toHaveBeenCalledTimes(2);
    expect(props.setOrganization).toHaveBeenCalledTimes(2);

    jest.spyOn(console, "error");
    wrapper.setProps({
      match: {params: {organization: undefined}},
    });
    expect(lastConsoleOutuput).not.toBe(null);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it("test setLoading method", () => {
    wrapper.instance().setLoading(true);
    expect(wrapper.instance().state.loading).toBe(true);
  });
});
