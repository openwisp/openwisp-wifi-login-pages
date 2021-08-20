/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const _ = require("lodash");

const rootDir = process.cwd();
const configDir = path.join(rootDir, "organizations");
const internalConfigDir = path.join(path.join(rootDir, "internals"), "config");
const clientDir = path.join(rootDir, "client");
const serverDir = path.join(rootDir, "server");
const clientConfigsDir = path.join(clientDir, "configs");

// array to store configurations of the organizations
const clientConfigs = [];
const serverConfigs = [];
const organizations = [];
const defaultConfigFile = path.join(internalConfigDir, "default.yml");

const removeNullKeys = (obj) => {
  const object = obj;
  Object.entries(object).forEach(([k, v]) => {
    if (v && typeof v === "object") {
      removeNullKeys(v);
    }
    if ((v && typeof v === "object" && !Object.keys(v).length) || v === null) {
      if (Array.isArray(object)) {
        object.splice(k, 1);
      } else if (!_.isEqual(object[k], {})) {
        delete object[k];
      }
    }
  });
  return object;
};

const removeDefaultConfig = () => {
  const organizationsFile = path.join(clientDir, "organizations.json");
  const config = `${path.join(clientConfigsDir, "default")}.json`;

  if (fs.existsSync(config)) fs.rmSync(config, {recursive: true});

  if (fs.existsSync(organizationsFile)) {
    const organization = JSON.parse(fs.readFileSync(organizationsFile));
    fs.writeFileSync(
      organizationsFile,
      JSON.stringify(
        organization.filter((org) => org.slug !== "default"),
        null,
        2,
      ),
    );
  }

  const serverConfigFile = path.join(serverDir, "config.json");
  if (fs.existsSync(serverConfigFile)) {
    const serverConfig = JSON.parse(fs.readFileSync(serverConfigFile));
    fs.writeFileSync(
      serverConfigFile,
      JSON.stringify(
        serverConfig.filter((org) => org.slug !== "default"),
        null,
        2,
      ),
    );
  }
};

const getConfig = (file) => {
  let defaultConfig = {};
  if (fs.existsSync(defaultConfigFile))
    defaultConfig = removeNullKeys(
      yaml.load(fs.readFileSync(defaultConfigFile, "utf-8")),
    );
  const config = yaml.load(
    fs.readFileSync(path.join(configDir, file), "utf-8"),
  );
  return removeNullKeys(_.merge(defaultConfig, config));
};

const writeConfigurations = () => {
  // loop through all the config files
  fs.readdirSync(configDir).forEach((file) => {
    if (path.extname(file) === ".yml") {
      // read document, or log exception on error
      try {
        const config = getConfig(file);
        // convert markdown to html
        const {slug} = config;
        if (config.client && config.client.privacy_policy) {
          const content = config.client.privacy_policy;
          if (content) {
            for (const key of Object.keys(content)) {
              if (
                path.extname(`${serverDir}/assets/${slug}/${content[key]}`) ===
                ".md"
              ) {
                if (
                  !fs.existsSync(`${serverDir}/assets/${slug}/${content[key]}`)
                ) {
                  content[key] = "";
                  console.warn(
                    `no such file or directory '${serverDir}/assets/${slug}/${content[key]}'. Privacy policy's content key '${key}' is set null.`,
                  );
                }
              } else {
                console.warn(
                  `'${content[key]}' is not a markdown file. Privacy policy's content key '${key}' is set null.`,
                );
                content[key] = "";
              }
            }
          }
        }
        if (config.client && config.client.terms_and_conditions) {
          const content = config.client.terms_and_conditions;
          if (content) {
            for (const key of Object.keys(content)) {
              if (
                path.extname(`${serverDir}/assets/${slug}/${content[key]}`) ===
                ".md"
              ) {
                if (
                  !fs.existsSync(`${serverDir}/assets/${slug}/${content[key]}`)
                ) {
                  content[key] = "";
                  console.warn(
                    `no such file or directory '${serverDir}/assets/${slug}/${content[key]}'. Terms and conditions' content key '${key}' is set null.`,
                  );
                }
              } else {
                console.warn(
                  `'${content[key]}' is not a markdown file. Terms and conditions' content key '${key}' is set null.`,
                );
                content[key] = "";
              }
            }
          }
        }
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
        organizations.push({slug: config.slug});
      } catch (error) {
        console.log(error);
      }
    }
  });

  if (fs.existsSync(clientConfigsDir))
    fs.rmSync(clientConfigsDir, {recursive: true});
  if (!fs.existsSync(clientConfigsDir))
    fs.mkdirSync(clientConfigsDir, {recursive: true});

  clientConfigs.forEach((config) => {
    // write client configs
    fs.writeFileSync(
      `${path.join(clientConfigsDir, config.slug)}.json`,
      JSON.stringify(config, null, 2),
      (error) => {
        if (error) console.log(error);
      },
    );
  });

  // write organizations
  fs.writeFileSync(
    `${clientDir}/organizations.json`,
    JSON.stringify(organizations, null, 2),
    (error) => {
      if (error) console.log(error);
    },
  );

  // write server configs
  fs.writeFileSync(
    `${serverDir}/config.json`,
    JSON.stringify(serverConfigs, null, 2),
    (error) => {
      if (error) console.log(error);
    },
  );
};

writeConfigurations();

module.exports = {
  removeDefaultConfig,
  writeConfigurations,
};
