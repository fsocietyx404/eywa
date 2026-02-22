const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "embed",
  ownerOnly: true,
  async execute(client, message) {
    const cfg = client.app.config;
    const mapping = cfg.channelProducts && typeof cfg.channelProducts === "object" ? cfg.channelProducts : {};
    const productFile = mapping[message.channel.id];

    if (!productFile) {
      await message.channel.send("This channel is not mapped to a product. Please configure channelProducts in config.json.");
      return;
    }

    const lower = String(productFile).toLowerCase();
    const allowed = ["product1.json", "product2.json", "product3.json", "tutorial.json"];
    if (!allowed.includes(lower)) {
      await message.channel.send("Invalid product mapping for this channel.");
      return;
    }

    const store = lower === "product1.json" ? client.app.stores.product1
      : lower === "product2.json" ? client.app.stores.product2
      : lower === "product3.json" ? client.app.stores.product3
      : client.app.stores.tutorial;

    const product = await store.read();
    if (!product || typeof product !== "object") {
      await message.channel.send("Product configuration is missing or invalid.");
      return;
    }

    const title = typeof product.embedTitle === "string" ? product.embedTitle : (typeof product.title === "string" ? product.title : "Download");
    const description = typeof product.embedDescription === "string" ? product.embedDescription : "Click the button below to redeem your lifetime license key and receive your download.";
    const color = Number.isFinite(product.embedColor) ? product.embedColor : 0x2b2d31;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setFooter({ text: "Lifetime License System" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`download:${lower}`)
        .setLabel("Download")
        .setStyle(ButtonStyle.Success)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }
};