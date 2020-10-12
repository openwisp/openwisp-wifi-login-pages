/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
const fs = require("fs");
const marked = require("marked");
const path = require("path");
const yaml = require("js-yaml");
const createDOMPurify = require("dompurify");
const {JSDOM} = require("jsdom");

const {window} = new JSDOM("");
const DOMPurify = createDOMPurify(window);

const rootDir = process.cwd();
const configDir = `${rootDir}/org-configurations`;
const clientDir = `${rootDir}/client`;
const serverDir = `${rootDir}/server`;

// array to store configurations of the organizations
const clientConfigs = [];
const serverConfigs = [];

// loop through all the config files
fs.readdirSync(configDir).forEach(file => {
  if (path.extname(file) === ".yml") {
    // read document, or log exception on error
    try {
      const config = yaml.safeLoad(
        fs.readFileSync(`${configDir}/${file}`, "utf8"),
      );
      // convert markdown to html
      if (config.client && config.client.privacy_policy) {
        const {slug} = config;
        const {content} = config.client.privacy_policy;
        if (content) {
          for (const key of Object.keys(content)) {
            if (
              path.extname(`${clientDir}/assets/${slug}/${content[key]}`) ===
              ".md"
            ) {
              try {
                const data = DOMPurify.sanitize(
                  marked(
                    fs.readFileSync(
                      `${clientDir}/assets/${slug}/${content[key]}`,
                      "utf8",
                    ),
                  ),
                );
                content[key] = data;
              } catch (error) {
                content[key] = "";
                console.warn(
                  `no such file or directory '${error.path}'. Privacy policy's content key '${key}' is set null.`,
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
        const {slug} = config;
        const {content} = config.client.terms_and_conditions;
        if (content) {
          for (const key of Object.keys(content)) {
            if (
              path.extname(`${clientDir}/assets/${slug}/${content[key]}`) ===
              ".md"
            ) {
              try {
                const data = DOMPurify.sanitize(
                  marked(
                    fs.readFileSync(
                      `${clientDir}/assets/${slug}/${content[key]}`,
                      "utf8",
                    ),
                  ),
                );
                content[key] = data;
              } catch (error) {
                content[key] = "";
                console.warn(
                  `no such file or directory '${error.path}'. Terms and conditions' content key '${key}' is set null.`,
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
    } catch (error) {
      console.log(error);
    }
  }
});

// write server configs
fs.writeFile(
  `${serverDir}/config.json`,
  JSON.stringify(serverConfigs, null, 2),
  error => {
    if (error) console.log(error);
  },
);

// write client configs
fs.writeFile(
  `${clientDir}/config.json`,
  JSON.stringify(clientConfigs, null, 2),
  error => {
    if (error) console.log(error);
  },
);
