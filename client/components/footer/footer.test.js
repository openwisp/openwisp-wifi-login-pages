/* eslint-disable camelcase */
import {shallow} from "enzyme";
import React from "react";
import renderer from "react-test-renderer";

import Footer from "./footer";

const createTestProps = props => {
  return {
    language: "en",
    footer: {
      links: [
        {
          text: {en: "link one"},
          url: "www.testurl.com",
        },
        {
          text: {en: "link two"},
          url: "www.testurl2.com",
        },
      ],
      secondary_text: {
        en: "this is secondary text",
      },
    },
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
    const {secondary_text} = props.footer;
    expect(wrapper.find(".owisp-footer-row-2-inner").text()).toBe(
      secondary_text.en,
    );
  });
});
