import React from "react";
import {render} from "@testing-library/react";
import "@testing-library/jest-dom";
import {MemoryRouter} from "react-router-dom";
import getConfig from "../../utils/get-config";
import loadTranslation from "../../utils/load-translation";
import DoesNotExist from "./404";

jest.mock("../../utils/get-config");
jest.mock("../../utils/load-translation");

const defaultConfig = getConfig("default", true);
const createTestProps = (props) => ({
  orgSlug: "default",
  orgName: "default name",
  page: defaultConfig.components["404_page"],
  setTitle: jest.fn(),
  ...props,
});

const renderWithRouter = (component) =>
  render(<MemoryRouter>{component}</MemoryRouter>);

describe("<DoesNotExist /> rendering with placeholder translation tags", () => {
  const props = createTestProps();
  it("should render translation placeholder correctly", () => {
    const {container} = renderWithRouter(<DoesNotExist {...props} />);
    expect(container).toMatchSnapshot();
  });
});

describe("<DoesNotExist /> rendering", () => {
  beforeEach(() => {
    loadTranslation("en", "default");
  });

  it("should render correctly default 404 page without props", () => {
    const {container} = renderWithRouter(<DoesNotExist />);
    expect(container).toMatchSnapshot();
  });

  it("should render correctly custom 404 page with props", () => {
    const props = createTestProps();
    const {container} = renderWithRouter(<DoesNotExist {...props} />);
    expect(container).toMatchSnapshot();
  });

  it("should set title with organisation name", () => {
    const props = createTestProps();
    renderWithRouter(<DoesNotExist {...props} />);
    const setTitleMock = props.setTitle.mock;
    expect(setTitleMock.calls.pop()).toEqual(["404 Not found", props.orgName]);
  });

  it("should not call setTitle if organization is undefined", () => {
    const props = createTestProps();
    props.page = undefined;
    props.orgName = undefined;
    renderWithRouter(<DoesNotExist {...props} />);
    const setTitleMock = props.setTitle.mock;
    expect(setTitleMock.calls.length).toBe(0);
  });
});
