/* eslint-disable camelcase */
import {shallow} from "enzyme";
import React from "react";
import renderer from "react-test-renderer";

import getConfig from "../../utils/get-config";
import Footer from "./footer";

const defaultConfig = getConfig("default");
const createTestProps = props => {
  return {
    language: "en",
    footer: defaultConfig.components.footer,
    ...props,
  };
};

describe("<Footer /> rendering", () => {
  let props;
  let wrapper;
  beforeEach(() => {
    props = createTestProps();
    wrapper = shallow(<Footer {...props} />);
  });
  it("should render correctly", () => {
    props = createTestProps();
    const component = renderer.create(<Footer {...props} />).toJSON();
    expect(component).toMatchSnapshot();
  });
  it("should render without links", () => {
    const links = {
      footer: {...props.footer, links: []},
    };
    props = createTestProps(links);
    wrapper = shallow(<Footer {...props} />);
    expect(wrapper.find(".owisp-footer-link")).toHaveLength(0);
  });
  it("should render secondary text", () => {
    wrapper.setProps({
      footer: {...props.footer, secondary_text: {en: "secondary text"}},
    });
    expect(
      wrapper
        .update()
        .find(".owisp-footer-row-2-inner")
        .text(),
    ).toBe("secondary text");
  });
});
