/* eslint-disable camelcase */
import {shallow} from "enzyme";
import React from "react";

import OrganizationWrapper from "./organization-wrapper";

const createTestProps = props => {
  return {
    match: {params: {organization: "default"}},
    organization: {
      configuration: {
        title: "Default",
        css_path: null,
        slug: "default",
        favicon: null,
      },
      exists: true,
    },
    setOrganization: jest.fn(),
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
    expect(wrapper.find(".owisp-app-container")).toHaveLength(0);
    expect(wrapper.find(".owisp-org-wrapper-not-found")).toHaveLength(0);
    expect(wrapper.find(".owisp-loader-container")).toHaveLength(1);
  });
  it("should render correctly when organization doesn't exist", () => {
    wrapper.setProps({
      organization: {...props.organization, exists: false},
    });
    expect(wrapper.find(".owisp-app-container")).toHaveLength(0);
    expect(wrapper.find(".owisp-org-wrapper-not-found")).toHaveLength(1);
    expect(wrapper.find(".owisp-loader-container")).toHaveLength(0);
  });
  it("should render correctly when organization exists", () => {
    wrapper.setProps({
      organization: {...props.organization, exists: true},
    });
    expect(wrapper.find(".owisp-app-container")).toHaveLength(1);
    expect(wrapper.find(".owisp-org-wrapper-not-found")).toHaveLength(0);
    expect(wrapper.find(".owisp-loader-container")).toHaveLength(0);
  });
});

describe("<OrganizationWrapper /> lifecycle method invocations", () => {
  let props;
  // eslint-disable-next-line no-unused-vars
  let wrapper;
  beforeEach(() => {
    props = createTestProps();
    wrapper = shallow(<OrganizationWrapper {...props} />);
  });
  it("should call setOrganization once", () => {
    expect(props.setOrganization).toHaveBeenCalledTimes(1);
  });
});
