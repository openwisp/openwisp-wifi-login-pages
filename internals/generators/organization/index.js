module.exports = {
  description: "Add an organization",
  actions: (data) => {
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
