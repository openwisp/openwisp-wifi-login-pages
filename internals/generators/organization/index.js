module.exports = {
  description: "Add an organization",
  actions: (data) => {
    const actions = [
      {
        type: "add",
        path: "../../organizations/{{slug}}.yml",
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
      actions.push({
        type: "addMany",
        destination: "../../server/assets/{{slug}}/",
        base: "../../server/assets/default/",
        templateFiles: "../../server/assets/default/**/*",
        abortOnFail: true,
      });
    }
    return actions;
  },
};
