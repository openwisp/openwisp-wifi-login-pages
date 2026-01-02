/* eslint-disable prefer-promise-reject-errors */
const fs = require("fs");
const path = require("path");
const {spawnSync} = require("child_process");
const yaml = require("js-yaml");

// Test data and helpers
const configDir = path.resolve(__dirname, "../../organizations");
const testOrgSlug = "testorg";
const testOrgDir = path.join(configDir, testOrgSlug);
const testOrgConfig = path.join(testOrgDir, `${testOrgSlug}.yml`);
const addOrgScript = path.resolve(__dirname, "../add-org.js");

const validData = {
  name: "Test Organization",
  slug: testOrgSlug,
  uuid: "test-uuid",
  secret_key: "test-secret",
  radius_realms: false,
  mobile_phone_verification: false,
  subscriptions: false,
  login_action_url: "http://localhost:8000/login/",
  logout_action_url: "http://localhost:8000/logout/",
  logout_by_session_ID: false,
  remember_me: true,
  openwisp_radius_url: "http://127.0.0.1:8000",
  assets_confirm: false,
};

describe("add-org command", () => {
  const cleanTestOrgDir = () => {
    if (fs.existsSync(testOrgDir)) {
      fs.rmSync(testOrgDir, {recursive: true, force: true});
    }
  };

  beforeEach(cleanTestOrgDir);
  afterEach(cleanTestOrgDir);

  it("creates a new organization config with --noprompt and valid data", () => {
    const result = spawnSync(
      "node",
      [addOrgScript, "--noprompt", JSON.stringify(validData)],
      {encoding: "utf-8"},
    );
    expect(result.status).toBe(0);
    expect(fs.existsSync(testOrgConfig)).toBe(true);
    const config = yaml.load(fs.readFileSync(testOrgConfig, "utf8"));
    expect(config.name).toBe(validData.name);
    expect(config.slug).toBe(validData.slug);
  });

  it("fails with missing required keys in --noprompt", () => {
    const invalidData = {...validData};
    delete invalidData.name;
    const result = spawnSync(
      "node",
      [addOrgScript, "--noprompt", JSON.stringify(invalidData)],
      {encoding: "utf-8"},
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Require key\(s\) missing/);
  });

  it("prevents duplicate organization slugs", () => {
    // First creation should succeed
    const result1 = spawnSync(
      "node",
      [addOrgScript, "--noprompt", JSON.stringify(validData)],
      {encoding: "utf-8"},
    );
    expect(result1.status).toBe(0);
    // Second creation with same slug should fail
    const result = spawnSync(
      "node",
      [addOrgScript, "--noprompt", JSON.stringify(validData)],
      {
        encoding: "utf-8",
      },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/already exists/);
  });

  it("creates config via interactive prompts using expect for TTY", () => {
    // Use 'expect' command to provide a pseudo-TTY for inquirer
    // This allows us to actually test the interactive flow
    // eslint-disable-next-line global-require
    const {execSync} = require("child_process");

    // Create an expect script that automates the interactive prompts
    const expectScript = `#!/usr/bin/expect -f
set timeout 30
spawn node ${addOrgScript}

expect "name of the organization"
send "${validData.name}\\r"

expect "slug of the organization"
send "${validData.slug}\\r"

expect "uuid of the organization"
send "${validData.uuid}\\r"

expect "Organization RADIUS"
send "${validData.secret_key}\\r"

expect "REALMs"
send "n\\r"

expect "SMS verification"
send "n\\r"

expect "Subscriptions"
send "n\\r"

expect "login action URL"
send "${validData.login_action_url}\\r"

expect "logout action URL"
send "${validData.logout_action_url}\\r"

expect "session ID"
send "n\\r"

expect "remember me"
send "y\\r"

expect "URL of OpenWISP"
send "${validData.openwisp_radius_url}\\r"

expect "copy the default assets"
send "n\\r"

expect eof
`;

    // Write expect script to a temp file
    const expectFile = path.join(configDir, ".test-expect.exp");
    fs.writeFileSync(expectFile, expectScript);
    fs.chmodSync(expectFile, "755");

    try {
      // Run the expect script
      execSync(`expect ${expectFile}`, {
        encoding: "utf-8",
        timeout: 30000,
        cwd: process.cwd(),
      });

      // Verify the config was created
      expect(fs.existsSync(testOrgConfig)).toBe(true);
      const config = yaml.load(fs.readFileSync(testOrgConfig, "utf8"));
      expect(config.name).toBe(validData.name);
      expect(config.slug).toBe(validData.slug);
    } finally {
      // Clean up temp expect file
      if (fs.existsSync(expectFile)) {
        fs.unlinkSync(expectFile);
      }
    }
  });
});
