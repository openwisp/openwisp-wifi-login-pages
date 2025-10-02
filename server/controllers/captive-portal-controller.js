import config from "../config.json";

// RFC 8908 Captive Portal API Basic Support
const captivePortal = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      // build URL using the Node.js host, not OpenWISP-RADIUS host
      const hostUrl = `${req.protocol}://${req.get("host")}`;
      res
        .status(200)
        .type("application/json")
        .send({
          captive: true,
          "user-portal-url": `${hostUrl}/${reqOrg}/login`,
        });
    }
    return org.slug === reqOrg;
  });
  // return 404 for invalid organization slug or org not listed in config
  if (!validSlug) {
    res.status(404).type("application/json").send({
      response_code: "NOT_FOUND",
    });
  }
};

export default captivePortal;
