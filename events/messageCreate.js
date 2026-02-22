const { logger } = require("../utils/logger");

function parseArgs(content) {
  const parts = content.trim().split(/\s+/);
  const cmd = parts.shift();
  return { cmd, args: parts };
}

module.exports = {
  name: "messageCreate",
  async execute(client, message) {
    try {
      if (!message || !message.guild) return;
      if (!message.content || typeof message.content !== "string") return;
      if (message.author && message.author.bot) return;

      const config = client.app.config;
      const prefix = typeof config.prefix === "string" ? config.prefix : ".";
      if (!message.content.startsWith(prefix)) return;

      const { cmd, args } = parseArgs(message.content.slice(prefix.length));
      if (!cmd) return;

      const command = client.app.commands.get(cmd.toLowerCase());
      if (!command) return;

      const isOwner = message.author && message.author.id === config.ownerId;
      if (config.maintenance && !isOwner) {
        await message.channel.send("The bot is currently under maintenance.");
        return;
      }

      if (command.ownerOnly && !isOwner) {
        await message.channel.send("You do not have permission to use this command.");
        return;
      }

      await command.execute(client, message, args);
    } catch (err) {
      try {
        await logger(client, "error", "messageCreateError", { error: String(err && err.stack ? err.stack : err) });
      } catch {}
      try {
        if (message && message.channel) await message.channel.send("An unexpected error occurred while processing that command.");
      } catch {}
    }
  }
};