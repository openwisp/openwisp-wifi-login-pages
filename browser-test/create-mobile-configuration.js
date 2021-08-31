/* eslint-disable camelcase */
const child_process = require("child_process");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");
const data = require("./testData.json");

const org = data.mobileVerificationTestUser.organization;

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
  mobile_phone_verification: true,
  subscriptions: false,
  login_action_url: "http://localhost:8000/captive-portal-mock/login/",
  logout_action_url: "http://localhost:8000/captive-portal-mock/logout/",
  logout_by_session_ID: true,
  remember_me: true,
  openwisp_radius_url: "http://127.0.0.1:8000",
  assets_confirm: true,
};

// Creating mobile configuration
const result = child_process.spawnSync("yarn", [
  "add-org",
  "--noprompt",
  JSON.stringify(options),
]);
writeOutput(result);

// Editing Created file
const content = yaml.load(fs.readFileSync(configPath, "utf8"));
content.client.languages = [
  {text: "english", slug: "en"},
  {text: "italiano", slug: "it"},
];
try {
  fs.writeFileSync(configPath, yaml.dump(content));
} catch (err) {
  console.log(err);
}
