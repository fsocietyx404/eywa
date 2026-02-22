const { logger } = require("../utils/logger");

module.exports = {
  name: "blacklist",
  ownerOnly: true,
  async execute(client, message, args) {
    const user = message.mentions.users.first();
    if (!user) {
      await message.channel.send("Usage: .blacklist @user [reason]");
      return;
    }

    const reason = args && args.length > 1 ? args.slice(1).join(" ").trim() : "No reason provided";
    const updated = await client.app.stores.blacklist.update((obj) => {
      const o = obj && typeof obj === "object" ? obj : {};
      o[user.id] = reason;
      return o;
    });

    await logger(client, "info", "userBlacklisted", { userId: user.id, by: message.author.id, reason });
    await message.channel.send(`Blacklisted <@${user.id}>. Reason: ${updated[user.id]}`);
  }
};