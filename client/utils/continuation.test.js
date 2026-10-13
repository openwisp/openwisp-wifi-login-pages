import routes from "../constants/routes";
import {
  resolveDestination,
  beginContinuation,
  readContinuation,
  bindContinuation,
  takeContinuation,
  clearContinuation,
  rebindContinuation,
  isRoute,
} from "./continuation";
import {sessionStorage} from "./storage";

const orgSlug = "default";

describe("continuation destinations", () => {
  it.each([
    "/default/status",
    "/default/status/",
    "/default/change-password",
    "/default/change-phone-number",
    "/default/payment/draft",
    "/default/payment/success",
    "/default/payment/failed",
    "/default/payment/process/",
  ])("accepts %s as a destination", (url) => {
    expect(resolveDestination(url, orgSlug)).toEqual({url});
  });

  it.each([
    "",
    " /default/status",
    "/default/status ",
    "https://example.com/default/status",
    "//example.com/default/status",
    "/other/status",
    "/default-other/status",
    "/default/../other/status",
    "/default/%2e%2e/status",
    "/default%2fstatus",
    "/default/status%252f",
    "/default\\status",
    "/default/status\n",
    "/default/%00status",
    "/default/%zz",
    "/default/unknown",
    "/default/login",
    "/default/logout",
    "/default/complete-signup",
    "/default/mobile-phone-verification",
    "/default/registration",
    "/default/password/reset",
    "/default/password/reset/confirm/user/token",
    "/default/",
    "/default/payment/unknown",
    "/default/status?",
    "/default/status?view=sessions",
    "/default/status#active",
    "/default/status?next=%2Fdefault%2Fstatus",
    "/default/status?sesame=secret",
    "/default/status#sesame=secret",
  ])("rejects unsafe destination %j", (url) => {
    expect(resolveDestination(url, orgSlug)).toBeNull();
  });

  it("uses the router catalog for downstream destinations", () => {
    routes.custom = {path: "custom", continuation: true};
    try {
      expect(resolveDestination("/default/custom", orgSlug)).toEqual({
        url: "/default/custom",
      });
    } finally {
      delete routes.custom;
    }
  });

  it.each([
    "",
    "?next=",
    "?next=%zz",
    "?next=/default/status&next=/default/payment/failed",
    "?next=%2Fdefault%2Fstatus%3Fview%3Dsessions",
  ])("ignores missing or malformed continuation %j", (search) => {
    expect(beginContinuation(search, orgSlug)).toBeNull();
  });

  it.each(["default", "other-org"])(
    "expands n=pay to the payment process of %s",
    (slug) => {
      expect(beginContinuation("?n=pay", slug)).toMatchObject({
        destination: `/${slug}/payment/process/`,
      });
    },
  );

  it.each([
    "?n=",
    "?n=PAY",
    "?n=pp",
    "?n=status",
    "?n=/default/status",
    "?n=pay&n=pay",
    "?next=&n=pay",
    "?n=pay&next=",
    "?next=https://example.com&n=pay",
    "?n=pay&next=%2Fdefault%2Fstatus%3Fview%3D1",
    "?next=/default/status&next=/default/status&n=pay",
  ])("does not resolve %j through the alias", (search) => {
    expect(beginContinuation(search, orgSlug)).toBeNull();
  });

  it("prefers next over n", () => {
    expect(
      beginContinuation("?n=pay&next=/default/change-password", orgSlug),
    ).toMatchObject({destination: "/default/change-password"});
  });

  it("accepts the alias in the next param too", () => {
    expect(beginContinuation("?next=pay", orgSlug)).toMatchObject({
      destination: "/default/payment/process/",
    });
    expect(beginContinuation("?next=pay&next=pay", orgSlug)).toBeNull();
  });

  it.each([
    ["/default/status", true],
    ["/default/status/", true],
    ["/default/status/extra", false],
    ["/other/status", false],
  ])("matches %s against the status route: %s", (path, expected) => {
    expect(isRoute(path, orgSlug, routes.status)).toBe(expected);
  });

  it.each([
    ["/default/payment/process/", routes.paymentProcess],
    ["/default/payment/process", routes.paymentProcess],
    ["/default/payment/failed", routes.paymentStatus],
  ])("matches %s with the same rule as resolveDestination", (path, route) => {
    expect(isRoute(path, orgSlug, route)).toBe(true);
  });
});

describe("continuation lifecycle", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it("captures a tab-scoped record without login secrets", () => {
    const record = beginContinuation(
      "?sesame=secret&next=%2Fdefault%2Fpayment%2Ffailed",
      orgSlug,
    );
    expect(record).toMatchObject({
      orgSlug: "default",
      destination: "/default/payment/failed",
      username: null,
    });
    expect(sessionStorage.getItem("ow_continuation")).not.toContain("secret");
  });

  it("consumes a workflow URL once for the bound user only", () => {
    beginContinuation("?next=/default/payment/failed", orgSlug);
    bindContinuation(orgSlug, "alice");
    expect(takeContinuation(orgSlug, "bob")).toBeNull();
    expect(takeContinuation(orgSlug, "alice")).toEqual({
      url: "/default/payment/failed",
    });
    expect(takeContinuation(orgSlug, "alice")).toBeNull();
    expect(readContinuation(orgSlug)).toBeNull();
  });

  it("drops the record when another user binds it", () => {
    beginContinuation("?next=/default/status", orgSlug);
    bindContinuation(orgSlug, "alice");
    expect(bindContinuation(orgSlug, "bob")).toBeNull();
    expect(readContinuation(orgSlug)).toBeNull();
  });

  it("rejects expired records", () => {
    const capturedAt = Date.now();
    beginContinuation("?next=/default/status", orgSlug, {now: capturedAt});
    expect(
      readContinuation(orgSlug, {now: capturedAt + 30 * 60 * 1000}),
    ).toBeNull();
  });

  it("clears old state on entry without next", () => {
    beginContinuation("?next=/default/status", orgSlug);
    expect(beginContinuation("", orgSlug)).toBeNull();
    expect(readContinuation(orgSlug)).toBeNull();
  });

  it("only rebinds the expected identity", () => {
    beginContinuation("?next=/default/status", orgSlug);
    bindContinuation(orgSlug, "alice");
    expect(rebindContinuation(orgSlug, "bob", "new")).toBeNull();
    expect(rebindContinuation(orgSlug, "alice", "new").username).toBe("new");
    clearContinuation();
    expect(readContinuation(orgSlug)).toBeNull();
  });

  it("drops another organization's record when it is read", () => {
    beginContinuation("?next=/other/status", "other");
    expect(readContinuation(orgSlug)).toBeNull();
    expect(readContinuation("other")).toBeNull();
  });

  it.each([
    ["invalid json", () => "invalid json"],
    ["unknown version", () => JSON.stringify({version: 2})],
    [
      "external destination",
      (record) =>
        JSON.stringify({...record, destination: "https://example.com"}),
    ],
    [
      "secret-bearing field",
      (record) => JSON.stringify({...record, sesame: "secret"}),
    ],
  ])("rejects restored state with %s", (label, build) => {
    const record = beginContinuation("?next=/default/status", orgSlug);
    sessionStorage.setItem("ow_continuation", build(record));
    expect(readContinuation(orgSlug)).toBeNull();
  });
});
