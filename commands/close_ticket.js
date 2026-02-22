const { logger } = require("../utils/logger");

module.exports = {
  name: "close_ticket",
  ownerOnly: false,
  async execute(client, message) {
    if (!message.guild) {
      await message.channel.send("This command can only be used in a server.");
      return;
    }

    const guild = message.guild;
    const channel = message.channel;
    const cfg = client.app.config;
    const isOwner = message.author.id === cfg.ownerId;
    const supportRoleId = cfg.supportRoleId;

    if (!isOwner) {
      const member = await guild.members.fetch(message.author.id).catch(() => null);
      const hasSupport = member && supportRoleId && member.roles.cache.has(supportRoleId);
      if (!hasSupport) {
        await message.channel.send("You do not have permission to close tickets.");
        return;
      }
    }

    const tickets = await client.app.stores.tickets.read();
    const store = tickets && typeof tickets === "object" ? tickets : {};
    const guildTickets = store[guild.id] && typeof store[guild.id] === "object" ? store[guild.id] : {};

    let ownerUserId = null;
    for (const [uid, cid] of Object.entries(guildTickets)) {
      if (cid === channel.id) {
        ownerUserId = uid;
        break;
      }
    }

    if (!ownerUserId) {
      await message.channel.send("This channel is not recognized as an open ticket.");
      return;
    }

    delete guildTickets[ownerUserId];
    store[guild.id] = guildTickets;
    await client.app.stores.tickets.write(store);

    await logger(client, "info", "ticketClosed", { guildId: guild.id, closedBy: message.author.id, channelId: channel.id, ownerUserId });

    await message.channel.send("Closing ticket...");
    await channel.delete("Ticket closed").catch(async () => {
      await message.channel.send("Failed to delete this channel. Ensure I have Manage Channels permission.");
    });
  }
};