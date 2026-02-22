const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

class JsonStore {
  constructor(filePath, defaultValue) {
    this.filePath = filePath;
    this.defaultValue = defaultValue;
    this._queue = Promise.resolve();
    this._ensure();
  }

  _ensure() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify(this.defaultValue, null, 2), "utf8");
    } else {
      try {
        const raw = fs.readFileSync(this.filePath, "utf8");
        JSON.parse(raw);
      } catch {
        fs.writeFileSync(this.filePath, JSON.stringify(this.defaultValue, null, 2), "utf8");
      }
    }
  }

  _enqueue(fn) {
    this._queue = this._queue.then(fn, fn);
    return this._queue;
  }

  async read() {
    return this._enqueue(async () => {
      try {
        const raw = await fsp.readFile(this.filePath, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed === null || parsed === undefined) return this._cloneDefault();
        return parsed;
      } catch {
        await this.write(this._cloneDefault());
        return this._cloneDefault();
      }
    });
  }

  async write(value) {
    return this._enqueue(async () => {
      const tmp = `${this.filePath}.tmp`;
      const json = JSON.stringify(value, null, 2);
      await fsp.writeFile(tmp, json, "utf8");
      await fsp.rename(tmp, this.filePath);
      return true;
    });
  }

  async update(mutator) {
    return this._enqueue(async () => {
      const current = await this._unsafeReadNoQueue();
      const updated = await mutator(current);
      await this._unsafeWriteNoQueue(updated);
      return updated;
    });
  }

  async _unsafeReadNoQueue() {
    try {
      const raw = await fsp.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed === null || parsed === undefined) return this._cloneDefault();
      return parsed;
    } catch {
      return this._cloneDefault();
    }
  }

  async _unsafeWriteNoQueue(value) {
    const tmp = `${this.filePath}.tmp`;
    const json = JSON.stringify(value, null, 2);
    await fsp.writeFile(tmp, json, "utf8");
    await fsp.rename(tmp, this.filePath);
  }

  _cloneDefault() {
    const d = this.defaultValue;
    if (Array.isArray(d)) return [...d];
    if (isPlainObject(d)) return { ...d };
    return d;
  }
}

module.exports = { JsonStore };