const { logger } = require("../utils/logger");

module.exports = {
  name: "unblacklist",
  ownerOnly: true,
  async execute(client, message) {
    const user = message.mentions.users.first();
    if (!user) {
      await message.channel.send("Usage: .unblacklist @user");
      return;
    }

    const updated = await client.app.stores.blacklist.update((obj) => {
      const o = obj && typeof obj === "object" ? obj : {};
      delete o[user.id];
      return o;
    });

    await logger(client, "info", "userUnblacklisted", { userId: user.id, by: message.author.id });
    const still = updated && typeof updated === "object" ? updated[user.id] : undefined;
    await message.channel.send(still ? "Failed to remove user from blacklist." : `Removed <@${user.id}> from blacklist.`);
  }
};