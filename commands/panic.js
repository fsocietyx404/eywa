const fs = require("fs");
const { EmbedBuilder } = require("discord.js");
const { logger } = require("../utils/logger");

function writeConfig(path, config) {
  fs.writeFileSync(path, JSON.stringify(config, null, 2), "utf8");
}

module.exports = {
  name: "panic",
  ownerOnly: true,
  async execute(client, message, args) {
    const enableMaintenance = args && args[0] ? String(args[0]).toLowerCase() === "maintenance" : false;

    const keysObj = await client.app.stores.keys.read();
    const obj = keysObj && typeof keysObj === "object" ? keysObj : {};
    let changed = 0;

    for (const r of Object.values(obj)) {
      if (r && typeof r === "object" && !r.suspended) {
        r.suspended = true;
        changed += 1;
      }
    }

    await client.app.stores.keys.write(obj);

    if (enableMaintenance) {
      client.app.config.maintenance = true;
      try {
        writeConfig(client.app.configPath, client.app.config);
      } catch {}
    }

    await logger(client, "info", "panicMode", { by: message.author.id, suspendedCount: changed, maintenance: !!enableMaintenance });

    const embed = new EmbedBuilder()
      .setTitle("Panic Mode Activated")
      .setDescription("All keys have been suspended. Please investigate immediately.")
      .addFields(
        { name: "Suspended Keys Updated", value: String(changed), inline: true },
        { name: "Maintenance Mode", value: enableMaintenance ? "Enabled" : "Unchanged", inline: true }
      )
      .setTimestamp(new Date());

    await message.channel.send({ embeds: [embed] });
  }
};