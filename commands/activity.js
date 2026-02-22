const { logger } = require("../utils/logger");

module.exports = {
  name: "activity",
  ownerOnly: true,
  async execute(client, message, args) {
    const text = args && args.length ? args.join(" ").trim() : "";
    if (!text) {
      await message.channel.send("Usage: .activity <text>");
      return;
    }

    try {
      await client.user.setPresence({
        activities: [{ name: text, type: 0 }],
        status: "online"
      });
    } catch {
      await message.channel.send("Failed to set activity.");
      return;
    }

    await logger(client, "info", "activitySet", { by: message.author.id, text });
    await message.channel.send("Activity updated.");
  }
};