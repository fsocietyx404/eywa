const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "help",
  ownerOnly: false,
  async execute(client, message) {
    const prefix = client.app.config.prefix || ".";
    const embed = new EmbedBuilder()
      .setTitle("Help")
      .setDescription("Lifetime license bot with channel-based multi-product downloads.")
      .addFields(
        {
          name: "Public Commands",
          value: [
            `${prefix}help`,
            `${prefix}bot_info`,
            `${prefix}ticket`,
            `${prefix}close_ticket`
          ].join("\n")
        },
        {
          name: "Owner Commands",
          value: [
            `${prefix}embed`,
            `${prefix}gen_key [count]`,
            `${prefix}key_info <key>`,
            `${prefix}key_list [all|unused|used|revoked|suspended]`,
            `${prefix}revoke_key <key>`,
            `${prefix}suspend_key <key>`,
            `${prefix}activate_key <key>`,
            `${prefix}reset_key <key>`,
            `${prefix}blacklist @user [reason]`,
            `${prefix}unblacklist @user`,
            `${prefix}maintenance on|off`,
            `${prefix}panic [maintenance]`,
            `${prefix}reload`,
            `${prefix}activity <text>`
          ].join("\n")
        },
        {
          name: "Lifetime License System",
          value: [
            "Keys never expire and are lifetime-only.",
            "A key becomes permanently bound to the first user who successfully activates it.",
            "Once used, the key cannot be used again."
          ].join("\n")
        },
        {
          name: "Product System (Channel Based)",
          value: [
            "Each channel can map to a different product JSON file in config.json.",
            "When you run the embed command in a mapped channel, the download button uses that channel's product file.",
            "If a channel is not mapped, the bot will refuse to create the embed."
          ].join("\n")
        },
        {
          name: "Troubleshooting",
          value: [
            "If the bot does not start, ensure Node.js 18+ is installed and DISCORD_TOKEN is set.",
            "If commands do nothing, verify prefix and ownerId in config.json.",
            "If embed fails, ensure the channel ID is mapped to product1.json/product2.json/product3.json in config.json.",
            "If downloads fail, ensure keys exist and the user is not blacklisted."
          ].join("\n")
        },
        {
          name: "Maintenance Mode",
          value: [
            "When enabled, only the owner can use commands.",
            "All other users will receive a maintenance message.",
            "Maintenance mode persists in config.json."
          ].join("\n")
        },
        {
          name: "Blacklist",
          value: [
            "Blacklisted users cannot redeem keys.",
            "Owner can add or remove users from blacklist with commands."
          ].join("\n")
        }
      )
      .setTimestamp(new Date());

    await message.channel.send({ embeds: [embed] });
  }
};