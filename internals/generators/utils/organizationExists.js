const fs = require("fs");
const path = require("path");

const organizations = fs.readdirSync(
  path.join(__dirname, "../../../org-configurations"),
);
function componentExists(comp) {
  return organizations.indexOf(comp) >= 0;
}

module.exports = componentExists;
