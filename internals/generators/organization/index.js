const organizationExists = require("../utils/organizationExists");

module.exports = {
  description: "Add an organization",
  prompts: [
    {
      type: "input",
      name: "name",
      message: "What is the name of the organization?",
      validate: value => {
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
      validate: value => {
        if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
          return organizationExists(`${value}-configuration`)
            ? "An organization with this name already exists"
            : true;
        }
        return "The slug is required";
      },
    },
    {
      type: "input",
      name: "uuid",
      message: "What is the uuid of the organization?",
      validate: value => {
        if (/.+/.test(value)) {
          return true;
        }
        return "The organization uuid is required";
      },
    },
    {
      type: "confirm",
      name: "mobile_phone_verification",
      message: "Does this organization require SMS verification for its users?",
      default: false,
    },
    {
      type: "input",
      name: "secret_key",
      message: "What is the secret key of the organization?",
      validate: value => {
        if (/.+/.test(value)) {
          return true;
        }
        return "The secret key is required";
      },
    },
    {
      type: "input",
      name: "login_action_url",
      default: "http://127.0.0.1:8080/login",
      message: "What is the captive portal login action URL?",
      validate: value => {
        if (/.+/.test(value)) {
          return true;
        }
        return "The captive portal login action URL is required";
      },
    },
    {
      type: "input",
      name: "logout_action_url",
      default: "http://127.0.0.1:8080/logout",
      message: "What is the captive portal logout action URL?",
      validate: value => {
        if (/.+/.test(value)) {
          return true;
        }
        return "The captive portal logout action URL is required";
      },
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
  ],
  actions: data => {
    const actions = [
      {
        type: "add",
        path: "../../org-configurations/{{slug}}-configuration.yml",
        templateFile: "./organization/config.yml.hbs",
        abortOnFail: true,
      },
    ];
    if (data.assets_confirm) {
      actions.push({
        type: "addMany",
        destination: "../../client/assets/{{slug}}/",
        base: "../../client/assets/default/",
        templateFiles: "../../client/assets/default/**/*",
        abortOnFail: true,
      });
    }
    return actions;
  },
};
