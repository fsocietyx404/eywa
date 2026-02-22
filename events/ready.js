const { logger } = require("../utils/logger");

module.exports = {
  name: "ready",
  async execute(client) {
    try {
      await logger(client, "info", "ready", { user: client.user ? client.user.tag : "unknown" });
      if (client.user) {
        try {
          await client.user.setPresence({
            activities: [{ name: "Lifetime Licenses", type: 0 }],
            status: "online"
          });
        } catch {}
      }
    } catch (err) {
      await logger(client, "error", "readyError", { error: String(err && err.stack ? err.stack : err) });
    }
  }
};