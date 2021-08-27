module.exports = {
  description: "Add an organization",
  actions: (data) => {
    const actions = [
      {
        type: "add",
        path: "../../organizations/{{slug}}/{{slug}}.yml",
        templateFile: "./organization/config.yml.hbs",
        abortOnFail: true,
      },
    ];
    if (data.assets_confirm) {
      actions.push({
        type: "addMany",
        destination: "../../organizations/{{slug}}/client_assets/",
        base: "../../organizations/default/client_assets/",
        templateFiles: "../../organizations/default/client_assets/**/*",
        abortOnFail: true,
      });
      actions.push({
        type: "addMany",
        destination: "../../organizations/{{slug}}/server_assets/",
        base: "../../organizations/default/server_assets/",
        templateFiles: "../../organizations/default/server_assets/**/*",
        abortOnFail: true,
      });
    }
    return actions;
  },
};
