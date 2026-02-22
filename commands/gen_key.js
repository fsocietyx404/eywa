const { generateUniqueKey, buildKeyRecord } = require("../utils/keyUtils");
const { logger } = require("../utils/logger");

module.exports = {
  name: "gen_key",
  ownerOnly: true,
  async execute(client, message, args) {
    const countArg = args && args[0] ? parseInt(args[0], 10) : 1;
    const count = Number.isFinite(countArg) && countArg > 0 ? Math.min(countArg, 50) : 1;

    const created = [];
    const keysObj = await client.app.stores.keys.read();
    const storeObj = keysObj && typeof keysObj === "object" ? keysObj : {};

    for (let i = 0; i < count; i++) {
      const key = await generateUniqueKey(client.app.stores.keys);
      const record = buildKeyRecord(key);
      storeObj[key] = record;
      created.push(key);
    }

    await client.app.stores.keys.write(storeObj);
    await logger(client, "info", "keysGenerated", { count, by: message.author.id });

    const chunks = [];
    let current = "";
    for (const k of created) {
      const line = k + "\n";
      if ((current + line).length > 1800) {
        chunks.push(current);
        current = "";
      }
      current += line;
    }
    if (current.length) chunks.push(current);

    await message.channel.send(`Generated ${created.length} lifetime key(s):`);
    for (const c of chunks) {
      await message.channel.send("```" + c.trim() + "```");
    }
  }
};