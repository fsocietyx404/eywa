const { createClient } = require("./utils/discord");
const { loadCommands } = require("./utils/loadCommands");
const { loadEvents } = require("./utils/loadEvents");
const { logger } = require("./utils/logger");
const { JsonStore } = require("./utils/jsonStore");
const path = require("path");
const fs = require("fs");

function safeReadJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function main() {
  const configPath = path.join(__dirname, "config.json");
  const config = safeReadJson(configPath);
  if (!config || typeof config !== "object") {
    throw new Error("config.json is missing or invalid JSON.");
  }

  const token = typeof config.token === "string" ? config.token.trim() : "";
  if (!token) {
    throw new Error("config.json is missing a valid token field.");
  }

  const dataDir = path.join(__dirname, "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  const client = createClient();

  client.app = {
    configPath,
    config,
    stores: {
      keys: new JsonStore(path.join(__dirname, "data", "keys.json"), {}),
      blacklist: new JsonStore(path.join(__dirname, "data", "blacklist.json"), {}),
      logs: new JsonStore(path.join(__dirname, "data", "logs.json"), []),
      tickets: new JsonStore(path.join(__dirname, "data", "tickets.json"), {}),
      price: new JsonStore(path.join(__dirname, "data", "price.json"), {}),
      payments: new JsonStore(path.join(__dirname, "data", "payments.json"), {}),
      tutorial: new JsonStore(path.join(__dirname, "data", "tutorial.json"), {}),
      product1: new JsonStore(path.join(__dirname, "data", "product1.json"), {}),
      product2: new JsonStore(path.join(__dirname, "data", "product2.json"), {}),
      product3: new JsonStore(path.join(__dirname, "data", "product3.json"), {})
    },
    commands: new Map(),
    commandFiles: new Map(),
    events: new Map(),
    cooldowns: new Map()
  };

  process.on("unhandledRejection", async (reason) => {
    try {
      await logger(client, "error", "unhandledRejection", { reason: String(reason) });
    } catch {}
  });

  process.on("uncaughtException", async (err) => {
    try {
      await logger(client, "error", "uncaughtException", { error: String(err && err.stack ? err.stack : err) });
    } catch {}
    process.exitCode = 1;
  });

  await loadCommands(client);
  await loadEvents(client);

  await client.login(token);
}

main().catch(async (err) => {
  try {
    const msg = String(err && err.stack ? err.stack : err);
    console.error(msg);
  } catch {}
  process.exitCode = 1;
});