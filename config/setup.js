/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const rootDir = process.cwd();
const configDir = `${rootDir}/org-configurations`;
const clientDir = `${rootDir}/client`;
const serverDir = `${rootDir}/server`;

// array to store configurations of the organizations
const clientConfigs = [];
const serverConfigs = [];

// loop through all the config files
fs.readdirSync(configDir).forEach((file) => {
  if (path.extname(file) === ".yml") {
    // read document, or log exception on error
    try {
      const config = yaml.safeLoad(
        fs.readFileSync(`${configDir}/${file}`, "utf8"),
      );
      // extract client config from object
      const clientConfig = {
        name: config.name,
        slug: config.slug,
        settings: config.settings,
        ...config.client,
      };

      // extract server config from object
      const serverConfig = {
        name: config.name,
        slug: config.slug,
        settings: config.settings,
        ...config.server,
      };

      // creates directory for assets
      if (!fs.existsSync(`${clientDir}/assets/${config.slug}`))
        fs.mkdirSync(`${clientDir}/assets/${config.slug}`);

      clientConfigs.push(clientConfig);
      serverConfigs.push(serverConfig);
    } catch (error) {
      console.log(error);
    }
  }
});

// write server configs
fs.writeFile(
  `${serverDir}/config.json`,
  JSON.stringify(serverConfigs, null, 2),
  (error) => {
    if (error) console.log(error);
  },
);

// write client configs
fs.writeFile(
  `${clientDir}/config.json`,
  JSON.stringify(clientConfigs, null, 2),
  (error) => {
    if (error) console.log(error);
  },
);
