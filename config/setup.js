/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const _ = require("lodash");

const rootDir = process.cwd();
const organizationsDir = path.join(rootDir, "organizations");
const internalConfigDir = path.join(path.join(rootDir, "internals"), "config");
const clientDir = path.join(rootDir, "client");
const serverDir = path.join(rootDir, "server");
const clientConfigsDir = path.join(clientDir, "configs");
const extraJSFilesDir = path.join(organizationsDir, "js");

// array to store configurations of the organizations
const clientConfigs = [];
const serverConfigs = [];
const organizations = [];
const defaultConfigFile = path.join(internalConfigDir, "default.yml");

// eslint-disable-next-line consistent-return
const customizer = (objValue, srcValue) => {
  if (_.isArray(objValue) && _.isArray(srcValue)) return srcValue;
};

const merge = (origObj, srcObj) => _.mergeWith(origObj, srcObj, customizer);

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

const getConfig = (filePath) => {
  let defaultConfig = {};
  if (fs.existsSync(defaultConfigFile))
    defaultConfig = removeNullKeys(
      yaml.load(fs.readFileSync(defaultConfigFile, "utf-8")),
    );
  const config = yaml.load(fs.readFileSync(filePath, "utf-8"));
  return removeNullKeys(merge(defaultConfig, config));
};

const getModalContent = (config, modalKey, modalName, configDirPath) => {
  const content = config.client[modalKey];
  if (content) {
    for (const key of Object.keys(content)) {
      if (
        path.extname(`${configDirPath}/server_assets/${content[key]}`) === ".md"
      ) {
        if (!fs.existsSync(`${configDirPath}/server_assets/${content[key]}`)) {
          content[key] = "";
          console.warn(
            `no such file or directory '${configDirPath}/server_assets/${content[key]}'. ${modalName} content key '${key}' is set null.`,
          );
        }
      } else {
        console.warn(
          `'${content[key]}' is not a markdown file. ${modalName} content key '${key}' is set null.`,
        );
        content[key] = "";
      }
    }
  }
  return content;
};

const createConfig = (data, configDirPath, radiusSlug = null) => {
  try {
    const config = data;
    // convert markdown to html
    if (config.client && config.client.privacy_policy) {
      config.client.privacy_policy = getModalContent(
        config,
        "privacy_policy",
        "Privacy policy's",
        configDirPath,
      );
    }
    if (config.client && config.client.terms_and_conditions) {
      config.client.terms_and_conditions = getModalContent(
        config,
        "terms_and_conditions",
        "Terms and conditions",
        configDirPath,
      );
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

    if (radiusSlug) {
      serverConfig.custom = true;
      serverConfig.radiusSlug = radiusSlug;
    }

    clientConfigs.push(clientConfig);
    serverConfigs.push(serverConfig);
    organizations.push({slug: config.slug});

    // copy client assets
    const clientAssetsPath = path.resolve(clientDir, "assets", config.slug);
    fse.copySync(
      path.join(configDirPath, "client_assets"),
      clientAssetsPath,
      {overwrite: true},
      (err) => console.log(err),
    );

    // copy server assets
    const serverAssetsPath = path.resolve(serverDir, "assets", config.slug);
    fse.copySync(
      path.join(configDirPath, "server_assets"),
      serverAssetsPath,
      {overwrite: true},
      (err) => console.log(err),
    );
  } catch (err) {
    console.log(err);
  }
};

const writeConfigurations = () => {
  // loop through all the config files
  fs.readdirSync(organizationsDir).forEach((file) => {
    const configDirPath = path.join(organizationsDir, file);
    const configPath = path.join(configDirPath, `${file}.yml`);
    if (fs.existsSync(configPath)) {
      // read document, or log exception on error
      try {
        const config = getConfig(configPath);
        createConfig(config, configDirPath);
        // variants configurations
        fs.readdirSync(configDirPath).forEach((customFile) => {
          if (
            path.extname(customFile) === ".yml" &&
            customFile !== `${file}.yml`
          ) {
            try {
              const customConfig = removeNullKeys(
                merge(
                  getConfig(configPath),
                  yaml.load(
                    fs.readFileSync(
                      path.join(configDirPath, customFile),
                      "utf-8",
                    ),
                  ),
                ),
              );
              if (config.slug === customConfig.slug) {
                // for same radius organization
                customConfig.slug = `${file}-${path.basename(
                  customFile,
                  path.extname(customFile),
                )}`;
                createConfig(customConfig, configDirPath, file);
              } else {
                // for new organization
                createConfig(customConfig, configDirPath);
              }
            } catch (error) {
              console.log(error);
            }
          }
        });
        //
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

const getExtraJsScripts = () => {
  let customScript = "";
  fs.readdirSync(extraJSFilesDir).forEach((file) => {
    if (path.extname(file) === ".js")
      customScript += `<script src="/${file}"></script>`;
  });
  return customScript;
};

writeConfigurations();

module.exports = {
  removeDefaultConfig,
  writeConfigurations,
  getExtraJsScripts,
};
