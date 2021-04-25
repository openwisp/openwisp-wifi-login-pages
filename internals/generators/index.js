const organizationGenerator = require("./organization/index");

module.exports = (plop) => {
  plop.setGenerator("organization", organizationGenerator);
};
