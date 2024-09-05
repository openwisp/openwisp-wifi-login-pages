const shell = require("shelljs");
const cron = require("node-cron");

function runScript(command) {
  if (shell.exec(command).code !== 0) {
    shell.echo("Error: Script execution failed");
    shell.exit(1);
  }
}

cron.schedule("*/1 * * * *", () => {
  console.log("Running script every 1 minutes");
  runScript("sh ./wifi_login_pages.sh");
});
