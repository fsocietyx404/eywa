const { ChannelType, PermissionFlagsBits } = require("discord.js");
const { logger } = require("../utils/logger");

module.exports = {
  name: "ticket",
  ownerOnly: false,
  async execute(client, message) {
    if (!message.guild) {
      await message.channel.send("Tickets can only be created in a server.");
      return;
    }

    const guild = message.guild;
    const userId = message.author.id;
    const cfg = client.app.config;

    const tickets = await client.app.stores.tickets.read();
    const store = tickets && typeof tickets === "object" ? tickets : {};
    const guildTickets = store[guild.id] && typeof store[guild.id] === "object" ? store[guild.id] : {};

    const existingId = guildTickets[userId];
    if (existingId) {
      const existing = guild.channels.cache.get(existingId);
      if (existing) {
        const m = await message.channel.send(`You already have an open ticket: <#${existingId}>`);
        setTimeout(() => m.delete().catch(() => {}), 10000);
        return;
      }
      delete guildTickets[userId];
      store[guild.id] = guildTickets;
      await client.app.stores.tickets.write(store);
    }

    const supportRoleId = cfg.supportRoleId;
    const overwrites = [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      { id: cfg.ownerId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] },
      { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] }
    ];

    if (supportRoleId && guild.roles.cache.get(supportRoleId)) {
      overwrites.push({
        id: supportRoleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      });
    }

    const name = `ticket-${message.author.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 90);

    let channel;
    try {
      channel = await guild.channels.create({
        name,
        type: ChannelType.GuildText,
        permissionOverwrites: overwrites
      });
    } catch {
      const m = await message.channel.send("Failed to create ticket channel. Ensure I have Manage Channels permission.");
      setTimeout(() => m.delete().catch(() => {}), 10000);
      return;
    }

    guildTickets[userId] = channel.id;
    store[guild.id] = guildTickets;
    await client.app.stores.tickets.write(store);

    await logger(client, "info", "ticketCreated", { guildId: guild.id, userId, channelId: channel.id });

    const createdMsg = await message.channel.send(`Ticket created: <#${channel.id}>`);
    setTimeout(() => createdMsg.delete().catch(() => {}), 10000);

    await channel.send(`Hello <@${userId}>, support will be with you shortly.`);
  }
};