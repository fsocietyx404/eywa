const { EmbedBuilder } = require("discord.js");

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hrs = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hrs || parts.length) parts.push(`${hrs}h`);
  if (mins || parts.length) parts.push(`${mins}m`);
  parts.push(`${secs}s`);
  return parts.join(" ");
}

module.exports = {
  name: "bot_info",
  ownerOnly: false,
  async execute(client, message) {
    const pkg = require("../package.json");
    const keysObj = await client.app.stores.keys.read();
    const obj = keysObj && typeof keysObj === "object" ? keysObj : {};
    const records = Object.values(obj).filter((v) => v && typeof v === "object");

    const totalKeys = records.length;
    const usedKeys = records.filter((r) => r.status === "used").length;
    const suspendedKeys = records.filter((r) => !!r.suspended).length;

    const blacklist = await client.app.stores.blacklist.read();
    const blObj = blacklist && typeof blacklist === "object" ? blacklist : {};
    const blacklistedUsers = Object.keys(blObj).length;

    const ping = client.ws && Number.isFinite(client.ws.ping) ? Math.round(client.ws.ping) : 0;

    const embed = new EmbedBuilder()
      .setTitle("Bot Info")
      .addFields(
        { name: "Bot Name", value: client.user ? client.user.username : "Unknown", inline: true },
        { name: "Version", value: String(pkg.version || "1.0.0"), inline: true },
        { name: "Developer", value: `<@${client.app.config.ownerId}>`, inline: true },
        { name: "Ping", value: `${ping}ms`, inline: true },
        { name: "Uptime", value: formatUptime(client.uptime || 0), inline: true },
        { name: "Total Keys", value: String(totalKeys), inline: true },
        { name: "Used Keys", value: String(usedKeys), inline: true },
        { name: "Suspended Keys", value: String(suspendedKeys), inline: true },
        { name: "Blacklisted Users", value: String(blacklistedUsers), inline: true }
      )
      .setTimestamp(new Date());

    await message.channel.send({ embeds: [embed] });
  }
};