const { normalizeKey } = require("../utils/keyUtils");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "key_info",
  ownerOnly: true,
  async execute(client, message, args) {
    const key = normalizeKey(args && args[0] ? args[0] : "");
    if (!key) {
      await message.channel.send("Usage: .key_info XXXX-XXXX-XXXX-XXXX");
      return;
    }

    const keysObj = await client.app.stores.keys.read();
    const obj = keysObj && typeof keysObj === "object" ? keysObj : {};
    const record = obj[key] || Object.values(obj).find((v) => v && v.key === key);

    if (!record) {
      await message.channel.send("Key not found.");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Key Info")
      .setDescription(`\`${record.key}\``)
      .addFields(
        { name: "Status", value: String(record.status), inline: true },
        { name: "Revoked", value: String(!!record.revoked), inline: true },
        { name: "Suspended", value: String(!!record.suspended), inline: true },
        { name: "Bound User", value: record.boundUser ? `<@${record.boundUser}> (${record.boundUser})` : "None", inline: false },
        { name: "Used By", value: record.usedBy ? `<@${record.usedBy}> (${record.usedBy})` : "None", inline: false },
        { name: "Used At", value: record.usedAt ? String(record.usedAt) : "None", inline: false }
      )
      .setTimestamp(new Date());

    await message.channel.send({ embeds: [embed] });
  }
};