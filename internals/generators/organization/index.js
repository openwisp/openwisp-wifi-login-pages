
const organizationExists = require('../utils/organizationExists');

module.exports = {
  description: 'Add an organization',
  prompts: [
    {
      type: 'input',
      name: 'name',
      message: 'What is the name of the organization?',
      validate: value => {
        if (/.+/.test(value)) {
          return true;
        }
        return 'The name is required';
      },
    },
    {
      type: 'input',
      name: 'slug',
      message: 'What is the slug of the organization?',
      validate: value => {
        if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
          return organizationExists(`${value}-configuration`)
            ? 'An organization with this name already exists'
            : true;
        }
        return 'The slug is required';
      },
    },
    {
      type: 'input',
      name: 'uuid',
      message: 'What is the uuid of the organization?',
      validate: value => {
        if (/.+/.test(value)) {
          return true;
        }
        return 'The organization uuid is required';
      },
    },
    {
      type: 'input',
      name: 'secret_key',
      message: 'What is the secret key of the organization?',
      validate: value => {
        if (/.+/.test(value)) {
          return true;
        }
        return 'The secret key is required';
      },
    },
    {
      type: 'confirm',
      name: 'assets_confirm',
      message: 'Do you want to copy the default assets for your organization?',
      default:false,
    },
  ],
  actions: (data) => {
    const actions = [
      {
        type: 'add',
        path: '../../org-configurations/{{slug}}-configuration.yml',
        templateFile: './organization/config.yml.hbs',
        abortOnFail: true,
      },
    ];
    if(data.assets_confirm){
      actions.push({
        type: 'addMany',
        destination: '../../client/assets/{{slug}}/',
        base: '../../client/assets/default/',
        templateFiles: '../../client/assets/default/**/*',
        abortOnFail: true
      });
    }
    return actions;
  },
};
