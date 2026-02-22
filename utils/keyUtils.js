const crypto = require("crypto");

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomCode(len) {
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

function formatKey(raw16) {
  return `${raw16.slice(0, 4)}-${raw16.slice(4, 8)}-${raw16.slice(8, 12)}-${raw16.slice(12, 16)}`;
}

async function generateUniqueKey(keysStore) {
  const keysObj = await keysStore.read();
  const keysMap = keysObj && typeof keysObj === "object" ? keysObj : {};
  for (let i = 0; i < 50; i++) {
    const k = formatKey(randomCode(16));
    const exists = Object.values(keysMap).some((v) => v && v.key === k);
    if (!exists) return k;
  }
  throw new Error("Failed to generate a unique key after multiple attempts.");
}

function buildKeyRecord(key) {
  return {
    key,
    status: "unused",
    revoked: false,
    suspended: false,
    boundUser: null,
    usedBy: null,
    usedAt: null,
    attempts: {}
  };
}

function normalizeKey(input) {
  if (!input || typeof input !== "string") return null;
  const cleaned = input.trim().toUpperCase();
  const ok = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cleaned);
  return ok ? cleaned : null;
}

function getAttemptState(record, userId) {
  const attempts = record.attempts && typeof record.attempts === "object" ? record.attempts : {};
  const s = attempts[userId] && typeof attempts[userId] === "object" ? attempts[userId] : { fails: 0, cooldownUntil: 0 };
  const fails = Number.isFinite(s.fails) ? s.fails : 0;
  const cooldownUntil = Number.isFinite(s.cooldownUntil) ? s.cooldownUntil : 0;
  return { fails, cooldownUntil };
}

function setAttemptState(record, userId, state) {
  if (!record.attempts || typeof record.attempts !== "object") record.attempts = {};
  record.attempts[userId] = {
    fails: Number.isFinite(state.fails) ? state.fails : 0,
    cooldownUntil: Number.isFinite(state.cooldownUntil) ? state.cooldownUntil : 0
  };
}

module.exports = {
  generateUniqueKey,
  buildKeyRecord,
  normalizeKey,
  getAttemptState,
  setAttemptState
};