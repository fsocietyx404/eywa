const fs = require("fs");
const path = require("path");
const { logger } = require("./logger");

async function loadEvents(client) {
  const eventsPath = path.join(__dirname, "..", "events");
  const files = fs.readdirSync(eventsPath).filter((f) => f.endsWith(".js"));

  for (const [name, handler] of client.app.events.entries()) {
    try {
      client.removeListener(name, handler);
    } catch {}
  }
  client.app.events.clear();

  for (const file of files) {
    const full = path.join(eventsPath, file);
    try {
      delete require.cache[require.resolve(full)];
      const ev = require(full);
      if (!ev || typeof ev !== "object") throw new Error("Invalid event export.");
      if (!ev.name || typeof ev.name !== "string") throw new Error("Event missing name.");
      if (typeof ev.execute !== "function") throw new Error("Event missing execute function.");
      const handler = (...args) => {
        Promise.resolve(ev.execute(client, ...args)).catch(async (err) => {
          await logger(client, "error", "eventHandlerError", { event: ev.name, error: String(err && err.stack ? err.stack : err) });
        });
      };
      client.on(ev.name, handler);
      client.app.events.set(ev.name, handler);
    } catch (err) {
      await logger(client, "error", "loadEventFailed", { file, error: String(err && err.stack ? err.stack : err) });
    }
  }

  await logger(client, "info", "eventsLoaded", { count: client.app.events.size });
}

module.exports = { loadEvents };