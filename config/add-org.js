const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const nodePlop = require("node-plop");
const {prompt} = require("inquirer");
const _ = require("lodash");
const {detailedDiff} = require("deep-object-diff");
const organizationExists = require("../internals/generators/utils/organizationExists");

const rootDir = process.cwd();
const orgConfigurationDir = path.join(rootDir, "organizations");
const internalConfigDir = path.join(path.join(rootDir, "internals"), "config");
const defaultConfigFile = path.join(internalConfigDir, "default.yml");

const prompts = [
  {
    type: "input",
    name: "name",
    message: "What is the name of the organization?",
    validate: (value) => {
      if (/.+/.test(value)) {
        return true;
      }
      return "The name is required";
    },
  },
  {
    type: "input",
    name: "slug",
    message: "What is the slug of the organization?",
    validate: (value) => {
      if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
        return organizationExists(value)
          ? "An organization with this slug already exists"
          : true;
      }
      return "The slug is required";
    },
  },
  {
    type: "input",
    name: "uuid",
    message:
      "What is the uuid of the organization? You can get this information from the organization details in OpenWISP.",
    validate: (value) => {
      if (/.+/.test(value)) {
        return true;
      }
      return "The organization uuid is required";
    },
  },
  {
    type: "input",
    name: "secret_key",
    message:
      "What is the Organization RADIUS settings Token of this organization? You can get this information from the organization details in OpenWISP.",
    validate: (value) => {
      if (/.+/.test(value)) {
        return true;
      }
      return "The secret key is required";
    },
  },
  {
    type: "confirm",
    name: "mobile_phone_verification",
    message: "Does this organization require SMS verification for its users?",
    default: false,
  },
  {
    type: "confirm",
    name: "subscriptions",
    message:
      "Are you using OpenWISP Subscriptions to provide paid subscriptions for WiFi plans or identity verification via credit/debit card?",
    default: false,
  },
  {
    type: "input",
    name: "login_action_url",
    default: "http://localhost:8000/captive-portal-mock/login/",
    message: "What is the captive portal login action URL?",
    validate: (value) => {
      if (/.+/.test(value)) {
        return true;
      }
      return "The captive portal login action URL is required";
    },
  },
  {
    type: "input",
    name: "logout_action_url",
    default: "http://localhost:8000/captive-portal-mock/logout/",
    message: "What is the captive portal logout action URL?",
    validate: (value) => {
      if (/.+/.test(value)) {
        return true;
      }
      return "The captive portal logout action URL is required";
    },
  },
  {
    type: "confirm",
    name: "logout_by_session_ID",
    message: "Does your captive portal support log out by session ID?",
    default: false,
  },
  {
    type: "confirm",
    name: "remember_me",
    message: "Do you want to support automatic logins (remember me checkbox)?",
    default: true,
  },
  {
    type: "input",
    name: "openwisp_radius_url",
    message: "What is the URL of OpenWISP RADIUS?",
    default: "http://127.0.0.1:8000",
  },
  {
    type: "confirm",
    name: "assets_confirm",
    message: "Do you want to copy the default assets for your organization?",
    default: false,
  },
];

const writeConfigFile = (filePath, object) => {
  try {
    fs.writeFileSync(
      path.join(orgConfigurationDir, filePath),
      yaml.dump(object),
    );
  } catch (err) {
    console.log(err);
  }
};

const removeNullKeys = (obj) => {
  const object = obj;
  Object.entries(object).forEach(([k, v]) => {
    if (v && typeof v === "object") {
      removeNullKeys(v);
    }
    if ((v && typeof v === "object" && !Object.keys(v).length) || v === null) {
      if (Array.isArray(object)) {
        object.splice(k, 1);
      } else {
        delete object[k];
      }
    }
  });
  return object;
};

const isArray = (arr) => {
  const nums = arr.map((i) => +i);
  const checkArr = Array.from({length: _.max(nums) + 1}, (u, i) => i);
  return nums.every((num) => checkArr.includes(num));
};

const createConfiguration = async (response) => {
  const plop = nodePlop(`./internals/generators/index.js`);
  const organizationGenerator = plop.getGenerator("organization");
  await organizationGenerator.runActions(response).then((results) => {
    if (results.changes && results.changes.length > 0) {
      results.changes.forEach((change) => {
        process.stdout.write(`Created:\n ${change.path}\n`);
      });
    }
    if (results.failures && results.failures.length > 0) {
      results.failures.forEach((failure) => {
        process.stderr.write(`${failure.error}\n`);
        if (failure.type === "add") {
          process.exit(1);
        }
      });
    }
  });
  if (fs.existsSync(defaultConfigFile)) {
    const defaultConfig = yaml.load(fs.readFileSync(defaultConfigFile, "utf8"));
    const generatedConfig = yaml.load(
      fs.readFileSync(
        path.resolve(
          orgConfigurationDir,
          response.slug,
          `${response.slug}.yml`,
        ),
        "utf-8",
      ),
    );
    const diffConfig = detailedDiff(defaultConfig, generatedConfig);
    let config = removeNullKeys(
      _.merge(
        _.merge(diffConfig.updated, diffConfig.added),
        diffConfig.deleted,
      ),
    );
    config = JSON.parse(
      JSON.stringify(config, (k, v) => {
        // to convert value with keys ["0", "1", ...] to array
        const value =
          typeof v === "object" && isArray(Object.keys(v))
            ? Object.values(v)
            : v;
        // to remove empty objects
        return _.isEqual(v, {}) ? undefined : value;
      }),
    );
    writeConfigFile(path.join(response.slug, `${response.slug}.yml`), config);
  }
};

const createConfigurationWithPrompts = async () => {
  const response = await prompt(prompts);
  createConfiguration(response);
};

const createConfigurationWithoutPrompts = (passedData) => {
  const requiredKeys = [
    "name",
    "slug",
    "uuid",
    "secret_key",
    "mobile_phone_verification",
    "subscriptions",
    "login_action_url",
    "logout_action_url",
    "logout_by_session_ID",
    "remember_me",
    "openwisp_radius_url",
    "assets_confirm",
  ];
  try {
    const response = JSON.parse(passedData);
    // eslint-disable-next-line no-prototype-builtins
    if (requiredKeys.every((key) => response.hasOwnProperty(key)))
      createConfiguration(response);
    else console.error("Key is missing");
  } catch (err) {
    console.error(err);
  }
};

if (process.argv.includes("--noprompt"))
  createConfigurationWithoutPrompts(process.argv[process.argv.length - 1]);
else createConfigurationWithPrompts();
