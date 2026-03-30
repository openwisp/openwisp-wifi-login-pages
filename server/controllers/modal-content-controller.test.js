const fs = require("fs");

const mockParse = jest.fn();
const mockSanitize = jest.fn();

jest.mock("jsdom", () => ({
  JSDOM: jest.fn(() => ({window: {}})),
}));

jest.mock("marked", () => ({
  marked: {
    parse: (...args) => mockParse(...args),
  },
}));

jest.mock("dompurify", () =>
  jest.fn(() => ({
    sanitize: (...args) => mockSanitize(...args),
  })),
);

jest.mock("../config.json", () => [
  {slug: "default", name: "Default Organization"},
]);

const modalContent = require("./modal-content-controller").default;

const createResponse = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.type = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

describe("modal-content-controller", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockParse.mockReset();
    mockSanitize.mockReset();
  });

  it("parses and sanitizes markdown before returning modal html", () => {
    jest.spyOn(fs, "readdirSync").mockReturnValue(["test.md"]);
    jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue("# Title\n<script>alert(1)</script>\nok");
    mockParse.mockReturnValue(
      "<h1>Title</h1><script>alert(1)</script><p>ok</p>",
    );
    mockSanitize.mockReturnValue("<h1>Title</h1><p>ok</p>");

    const res = createResponse();

    modalContent(
      {
        params: {organization: "default"},
        query: {file: "test.md"},
      },
      res,
    );

    expect(mockParse).toHaveBeenCalledWith(
      "# Title\n<script>alert(1)</script>\nok",
    );
    expect(mockSanitize).toHaveBeenCalledWith(
      "<h1>Title</h1><script>alert(1)</script><p>ok</p>",
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.type).toHaveBeenCalledWith("application/json");
    expect(res.send).toHaveBeenCalledWith({
      __html: "<h1>Title</h1><p>ok</p>",
    });
  });

  it("returns 404 when the modal file is missing for a valid organization", () => {
    const readFileSyncSpy = jest.spyOn(fs, "readFileSync");
    jest.spyOn(fs, "readdirSync").mockReturnValue(["other.md"]);
    const res = createResponse();

    modalContent(
      {
        params: {organization: "default"},
        query: {file: "missing.md"},
      },
      res,
    );

    expect(readFileSyncSpy).not.toHaveBeenCalled();
    expect(mockParse).not.toHaveBeenCalled();
    expect(mockSanitize).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.type).toHaveBeenCalledWith("application/json");
    expect(res.send).toHaveBeenCalledWith({
      __html: "",
    });
  });

  it("returns 404 for an invalid organization slug", () => {
    const readdirSyncSpy = jest.spyOn(fs, "readdirSync");
    const res = createResponse();

    modalContent(
      {
        params: {organization: "missing-org"},
        query: {file: "terms-en.md"},
      },
      res,
    );

    expect(readdirSyncSpy).not.toHaveBeenCalled();
    expect(mockParse).not.toHaveBeenCalled();
    expect(mockSanitize).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.type).toHaveBeenCalledWith("application/json");
    expect(res.send).toHaveBeenCalledWith({
      response_code: "NOT_FOUND",
    });
  });
});
