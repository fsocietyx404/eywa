const { normalizeKey } = require("../utils/keyUtils");
const { logger } = require("../utils/logger");

module.exports = {
  name: "reset_key",
  ownerOnly: true,
  async execute(client, message, args) {
    const key = normalizeKey(args && args[0] ? args[0] : "");
    if (!key) {
      await message.channel.send("Usage: .reset_key XXXX-XXXX-XXXX-XXXX");
      return;
    }

    const keysObj = await client.app.stores.keys.read();
    const obj = keysObj && typeof keysObj === "object" ? keysObj : {};
    const record = obj[key] || Object.values(obj).find((v) => v && v.key === key);

    if (!record) {
      await message.channel.send("Key not found.");
      return;
    }

    record.status = "unused";
    record.usedBy = null;
    record.usedAt = null;
    record.boundUser = null;
    record.revoked = false;
    record.suspended = false;
    record.attempts = {};

    await client.app.stores.keys.write(obj);
    await logger(client, "info", "keyReset", { key, by: message.author.id });

    await message.channel.send(`Key reset to unused: ${key}`);
  }
};