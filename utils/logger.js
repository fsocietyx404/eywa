function nowIso() {
  return new Date().toISOString();
}

async function logger(client, level, event, data) {
  const entry = {
    ts: nowIso(),
    level: String(level || "info"),
    event: String(event || "event"),
    data: data && typeof data === "object" ? data : { message: String(data) }
  };
  try {
    await client.app.stores.logs.update((arr) => {
      const a = Array.isArray(arr) ? arr : [];
      a.push(entry);
      if (a.length > 2000) a.splice(0, a.length - 2000);
      return a;
    });
  } catch {}
  try {
    const printable = `[${entry.ts}] ${entry.level.toUpperCase()} ${entry.event} ${JSON.stringify(entry.data)}`;
    if (entry.level === "error") console.error(printable);
    else console.log(printable);
  } catch {}
}

module.exports = { logger };