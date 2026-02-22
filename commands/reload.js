const { loadCommands } = require("../utils/loadCommands");
const { loadEvents } = require("../utils/loadEvents");
const { logger } = require("../utils/logger");

module.exports = {
  name: "reload",
  ownerOnly: true,
  async execute(client, message) {
    await loadCommands(client);
    await loadEvents(client);
    await logger(client, "info", "reloaded", { by: message.author.id });
    await message.channel.send("Reloaded commands and events.");
  }
};