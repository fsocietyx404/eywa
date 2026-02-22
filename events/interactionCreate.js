const { logger } = require("../utils/logger");
const { normalizeKey, getAttemptState, setAttemptState } = require("../utils/keyUtils");
const { EmbedBuilder } = require("discord.js");

function isOwner(client, userId) {
  return userId === client.app.config.ownerId;
}

function getProductFileFromCustomId(customId) {
  if (typeof customId !== "string") return null;
  if (!customId.startsWith("download:")) return null;
  const file = customId.slice("download:".length).trim();
  if (!/^[a-zA-Z0-9_.-]+\.json$/.test(file)) return null;
  return file;
}

async function loadProductStore(client, productFile) {
  const lower = productFile.toLowerCase();
  if (lower === "product1.json") return client.app.stores.product1;
  if (lower === "product2.json") return client.app.stores.product2;
  if (lower === "product3.json") return client.app.stores.product3;
  if (lower === "tutorial.json") return client.app.stores.tutorial;
  return null;
}

function nowMs() {
  return Date.now();
}

async function sendAutoDelete(channel, payload, ms) {
  try {
    const msg = await channel.send(payload);
    if (ms && Number.isFinite(ms) && ms > 0) {
      setTimeout(() => msg.delete().catch(() => {}), ms);
    }
    return msg;
  } catch {
    return null;
  }
}

module.exports = {
  name: "interactionCreate",
  async execute(client, interaction) {
    try {
      if (!interaction) return;
      if (!interaction.isButton || !interaction.isButton()) return;

      const productFile = getProductFileFromCustomId(interaction.customId);
      if (!productFile) return;

      try {
        await interaction.deferUpdate();
      } catch {}

      const channel = interaction.channel;
      if (!channel) return;

      const user = interaction.user;
      if (!user) return;

      const config = client.app.config;
      const owner = isOwner(client, user.id);

      if (config.maintenance && !owner) {
        await sendAutoDelete(channel, "The bot is currently under maintenance.", 5 * 60 * 1000);
        return;
      }

      const blacklist = await client.app.stores.blacklist.read();
      if (blacklist && typeof blacklist === "object" && blacklist[user.id]) {
        await sendAutoDelete(channel, "You are blacklisted and cannot redeem keys.", 5 * 60 * 1000);
        return;
      }

      const productStore = await loadProductStore(client, productFile);
      if (!productStore) {
        await sendAutoDelete(channel, "This product configuration is missing or invalid.", 5 * 60 * 1000);
        return;
      }

      const product = await productStore.read();
      if (!product || typeof product !== "object" || !product.content || typeof product.content !== "string") {
        await sendAutoDelete(channel, "This product is not configured correctly.", 5 * 60 * 1000);
        return;
      }

      const promptMsg = await channel.send(`${user}, please type your license key in this channel within 60 seconds.`);
      const promptTimer = setTimeout(() => {
        promptMsg.delete().catch(() => {});
      }, 60000);

      let collectedKey = null;

      const collector = channel.createMessageCollector({
        filter: (m) => m && m.author && m.author.id === user.id && typeof m.content === "string",
        time: 60000,
        max: 1
      });

      collector.on("collect", (m) => {
        collectedKey = m.content;
        m.delete().catch(() => {});
      });

      await new Promise((resolve) => collector.on("end", resolve));

      clearTimeout(promptTimer);
      await promptMsg.delete().catch(() => {});

      const normalized = normalizeKey(collectedKey);
      if (!normalized) {
        await sendAutoDelete(channel, "Invalid key format. Use: XXXX-XXXX-XXXX-XXXX", 5 * 60 * 1000);
        return;
      }

      const keysData = await client.app.stores.keys.read();
      const keysObj = keysData && typeof keysData === "object" ? keysData : {};
      const record = Object.values(keysObj).find((v) => v && typeof v === "object" && v.key === normalized);

      if (!record) {
        await sendAutoDelete(channel, "Key not found.", 5 * 60 * 1000);
        return;
      }

      const attempt = getAttemptState(record, user.id);
      if (attempt.cooldownUntil && nowMs() < attempt.cooldownUntil) {
        const remaining = Math.ceil((attempt.cooldownUntil - nowMs()) / 1000);
        await sendAutoDelete(channel, `Too many failed attempts. Try again in ${remaining} seconds.`, 5 * 60 * 1000);
        return;
      }

      if (record.revoked) {
        attempt.fails += 1;
        if (attempt.fails >= 3) {
          attempt.cooldownUntil = nowMs() + 5 * 60 * 1000;
          attempt.fails = 0;
        }
        setAttemptState(record, user.id, attempt);
        await client.app.stores.keys.write(keysObj);
        await sendAutoDelete(channel, "This key has been revoked.", 5 * 60 * 1000);
        return;
      }

      if (record.suspended) {
        attempt.fails += 1;
        if (attempt.fails >= 3) {
          attempt.cooldownUntil = nowMs() + 5 * 60 * 1000;
          attempt.fails = 0;
        }
        setAttemptState(record, user.id, attempt);
        await client.app.stores.keys.write(keysObj);
        await sendAutoDelete(channel, "This key is suspended.", 5 * 60 * 1000);
        return;
      }

      if (record.status === "used") {
        attempt.fails += 1;
        if (attempt.fails >= 3) {
          attempt.cooldownUntil = nowMs() + 5 * 60 * 1000;
          attempt.fails = 0;
        }
        setAttemptState(record, user.id, attempt);
        await client.app.stores.keys.write(keysObj);
        await sendAutoDelete(channel, "This key has already been used.", 5 * 60 * 1000);
        return;
      }

      if (record.boundUser && record.boundUser !== user.id) {
        attempt.fails += 1;
        if (attempt.fails >= 3) {
          attempt.cooldownUntil = nowMs() + 5 * 60 * 1000;
          attempt.fails = 0;
        }
        setAttemptState(record, user.id, attempt);
        await client.app.stores.keys.write(keysObj);
        await sendAutoDelete(channel, "This key is bound to another user.", 5 * 60 * 1000);
        return;
      }

      record.status = "used";
      record.usedBy = user.id;
      record.boundUser = user.id;
      record.usedAt = new Date().toISOString();
      setAttemptState(record, user.id, { fails: 0, cooldownUntil: 0 });

      await client.app.stores.keys.write(keysObj);

      await logger(client, "info", "keyActivated", {
        key: record.key,
        userId: user.id,
        guildId: interaction.guildId || null,
        productFile
      });

      const embed = new EmbedBuilder()
        .setTitle(product.title || "Download")
        .setDescription(product.content)
        .setFooter({ text: "Lifetime License Activated" })
        .setTimestamp(new Date());

      await sendAutoDelete(channel, { embeds: [embed] }, 5 * 60 * 1000);
    } catch (err) {
      try {
        await logger(client, "error", "interactionCreateError", { error: String(err && err.stack ? err.stack : err) });
      } catch {}
      try {
        if (interaction && interaction.channel) await interaction.channel.send("An unexpected error occurred while processing that interaction.");
      } catch {}
    }
  }
};