const fs = require("fs");
const { logger } = require("../utils/logger");

function writeConfig(path, config) {
  fs.writeFileSync(path, JSON.stringify(config, null, 2), "utf8");
}

module.exports = {
  name: "maintenance",
  ownerOnly: true,
  async execute(client, message, args) {
    const mode = args && args[0] ? String(args[0]).toLowerCase() : "";
    if (mode !== "on" && mode !== "off") {
      await message.channel.send("Usage: .maintenance on | .maintenance off");
      return;
    }

    const enabled = mode === "on";
    client.app.config.maintenance = enabled;

    try {
      writeConfig(client.app.configPath, client.app.config);
    } catch {
      await message.channel.send("Failed to persist maintenance mode to config.json.");
      return;
    }

    await logger(client, "info", "maintenanceToggled", { enabled, by: message.author.id });
    await message.channel.send(`Maintenance mode is now ${enabled ? "ON" : "OFF"}.`);
  }
};