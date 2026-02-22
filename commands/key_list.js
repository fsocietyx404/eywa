module.exports = {
  name: "key_list",
  ownerOnly: true,
  async execute(client, message, args) {
    const filter = args && args[0] ? String(args[0]).toLowerCase() : "all";
    const allowed = new Set(["all", "unused", "used", "revoked", "suspended"]);
    if (!allowed.has(filter)) {
      await message.channel.send("Usage: .key_list [all|unused|used|revoked|suspended]");
      return;
    }

    const keysObj = await client.app.stores.keys.read();
    const obj = keysObj && typeof keysObj === "object" ? keysObj : {};
    const records = Object.values(obj).filter((v) => v && typeof v === "object");

    const list = records.filter((r) => {
      if (filter === "all") return true;
      if (filter === "unused") return r.status === "unused" && !r.revoked && !r.suspended;
      if (filter === "used") return r.status === "used";
      if (filter === "revoked") return !!r.revoked;
      if (filter === "suspended") return !!r.suspended;
      return true;
    }).map((r) => r.key);

    if (list.length === 0) {
      await message.channel.send("No keys found for that filter.");
      return;
    }

    const chunks = [];
    let current = "";
    for (const k of list) {
      const line = k + "\n";
      if ((current + line).length > 1800) {
        chunks.push(current);
        current = "";
      }
      current += line;
    }
    if (current.length) chunks.push(current);

    await message.channel.send(`Keys (${filter}) count: ${list.length}`);
    for (const c of chunks) {
      await message.channel.send("```" + c.trim() + "```");
    }
  }
};