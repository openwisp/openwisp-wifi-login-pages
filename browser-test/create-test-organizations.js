/* eslint-disable camelcase */
const child_process = require("child_process");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");
const data = require("./testData.json");

const writeOutput = (result) => {
  if (result.stdout) {
    process.stdout.write(`${result.stdout}\n`);
  }
  if (result.stderr) {
    process.stderr.write(`${result.stderr}\n`);
  }
  if (result.status !== 0) {
    process.exit(result.status);
  }
};

const jsDir = path.resolve(__dirname, "../organizations/js");

const createOrganization = (org, extraOptions, editConfig) => {
  const configDirPath = path.resolve(__dirname, `../organizations/${org}`);
  const configPath = path.join(configDirPath, `${org}.yml`);
  if (fs.existsSync(configDirPath)) {
    fs.rmSync(configDirPath, {recursive: true});
  }
  const options = {
    name: org,
    slug: org,
    uuid: "organization_uuid",
    secret_key: "organization_secret_key",
    mobile_phone_verification: false,
    subscriptions: false,
    login_action_url: "http://localhost:8000/captive-portal-mock/login/",
    logout_action_url: "http://localhost:8000/captive-portal-mock/logout/",
    logout_by_session_ID: true,
    remember_me: true,
    openwisp_radius_url: "http://127.0.0.1:8000",
    assets_confirm: true,
    ...extraOptions,
  };
  const result = child_process.spawnSync("yarn", [
    "add-org",
    "--noprompt",
    JSON.stringify(options),
  ]);
  writeOutput(result);
  const content = yaml.load(fs.readFileSync(configPath, "utf8"));
  editConfig(content, options);
  fs.writeFileSync(configPath, yaml.dump(content));
};

try {
  createOrganization(
    data.mobileVerificationTestUser.organization,
    {mobile_phone_verification: true},
    (content) => {
      Object.assign(content, {server: {...content.server, timeout: 5}});
      const {client} = content;
      client.languages = [
        {text: "english", slug: "en"},
        {text: "italiano", slug: "it"},
      ];
    },
  );
  const syncAuthOrg = data.syncAuthTestUser.organization;
  createOrganization(syncAuthOrg, {}, (content, options) => {
    const {components} = content.client;
    // The redirurl host must match the one used by the browser tests,
    // otherwise WLP cookies and localStorage are lost after the redirect.
    const redirurl = () => [
      {name: "redirurl", value: `http://127.0.0.1:8080/${syncAuthOrg}/status`},
    ];
    components.captive_portal_sync_auth = true;
    components.captive_portal_login_form = {
      ...components.captive_portal_login_form,
      additional_fields: redirurl(),
    };
    components.captive_portal_logout_form = {
      ...components.captive_portal_logout_form,
      action: options.logout_action_url,
      additional_fields: redirurl(),
    };
  });
  fs.writeFileSync(path.join(jsDir, data.allOrgScript), "");
} catch (err) {
  console.log(err);
}
