const fs = require("fs");
const path = require("path");

const organizations = fs.readdirSync(
  path.join(__dirname, "../../../organizations"),
);
function componentExists(comp) {
  return organizations.indexOf(comp) >= 0;
}

module.exports = componentExists;
