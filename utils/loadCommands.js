const fs = require("fs");
const path = require("path");
const { logger } = require("./logger");

async function loadCommands(client) {
  const commandsPath = path.join(__dirname, "..", "commands");
  const files = fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"));
  client.app.commands.clear();
  client.app.commandFiles.clear();

  for (const file of files) {
    const full = path.join(commandsPath, file);
    try {
      delete require.cache[require.resolve(full)];
      const cmd = require(full);
      if (!cmd || typeof cmd !== "object") throw new Error("Invalid command export.");
      if (!cmd.name || typeof cmd.name !== "string") throw new Error("Command missing name.");
      if (typeof cmd.execute !== "function") throw new Error("Command missing execute function.");
      client.app.commands.set(cmd.name, cmd);
      client.app.commandFiles.set(cmd.name, full);
    } catch (err) {
      await logger(client, "error", "loadCommandFailed", { file, error: String(err && err.stack ? err.stack : err) });
    }
  }
  await logger(client, "info", "commandsLoaded", { count: client.app.commands.size });
}

module.exports = { loadCommands };