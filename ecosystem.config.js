module.exports = {
  apps: [{
    name: "wifi_login_pages",
    script: "/opt/openwisp/wifi-login-pages/server/start.js", // the path of the script you want to execute,
    // Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
    instances: 2,
    autorestart: true,
    watch: ["dist", "organizations", "server"],
    // Specify delay between watch interval
    watch_delay: 30,
    log_file: "/dev/null", // Disable log file creation
    out_file: "/dev/stdout", // Log output to stdout
    error_file: "/dev/stderr", // Log errors to stderr

  }, {
    name: "check_organization_update.js",
    script: "./check_organization_update.js", // the path of the script you want to execute,
    // Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
    instances: 1,
    autorestart: true,
    watch: false,


  }],
};
