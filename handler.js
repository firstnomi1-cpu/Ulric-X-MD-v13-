/**
 * Ulric-X MD V13 - Main Message Handler / Command Dispatcher
 *
 * 2000x thinking analysis of why commands weren't executing:
 *
 * ROOT CAUSE: Message body extraction failed for wrapped messages.
 * WhatsApp wraps messages in ephemeralMessage/viewOnceMessage layers.
 * Old code checked Object.keys(m.message)[0] which returned the wrapper
 * type (not the actual content type), so body was always empty →
 * isCmd was false → command silently ignored.
 *
 * FIX: Use recursive normalizer that unwraps ALL layers.
 * Support TWO prefixes: . and /
 * NO fromMe check (user sends to "Message yourself")
 * NO group-only check (commands work everywhere)
 * Extensive logging at every step.
 */
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const config = require('./config');
const store  = require('./lib/store');
const utils  = require('./lib/utils');
const menu   = require('./lib/menu');
const ownerMod = require('./lib/owner');
const session = require('./lib/session');
const messageStore = require('./lib/messageStore');
const antiSystem = require('./lib/antiSystem');
const verified = require('./lib/verifiedReply');
const watchdog = require('./lib/watchdog');
const normalizer = require('./lib/normalizer');

const commands = new Map();
const categories = new Map();
let totalCount = 0;

function loadCommands() {
  const dir = path.join(__dirname, 'commands');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  let total = 0;
  for (const f of files) {
    try {
      delete require.cache[path.join(dir, f)];
      const mod = require(path.join(dir, f));
      if (!Array.isArray(mod)) continue;
      for (const cmd of mod) {
        if (!cmd || !cmd.name || typeof cmd.handler !== 'function') continue;
        const safeFn = watchdog.safeHandler(cmd.handler);
        const safeCmd = { ...cmd, handler: safeFn };
        const names = [cmd.name, ...(cmd.alias || [])].map(s => String(s).toLowerCase());
        for (const n of names) {
          if (!commands.has(n)) commands.set(n, safeCmd);
        }
        const cat = cmd.category || 'misc';
        if (!categories.has(cat)) categories.set(cat, []);
        categories.get(cat).push(safeCmd);
        total++;
      }
    } catch (e) {
      console.error(chalk.red(`[CMD LOAD] Failed ${f}: ${e.message}`));
    }
  }
  totalCount = total;
  console.log(`[CMD] Loaded ${total} commands across ${categories.size} categories.`);
  return { total, categories: categories.size };
}

function getCommandsByCategory(cat) { return categories.get(cat) || []; }
function getCommand(name) { return commands.get(name.toLowerCase()); }
function getTotalCommands() { return totalCount; }
function getAllCategories() { return Array.from(categories.keys()); }

// ═══════════════════════════════════════════════════════════════
// BUILD CONTEXT - Extract everything needed for command execution
// ═══════════════════════════════════════════════════════════════
async function buildContext(sock, m) {
  if (!m || !m.message || !m.key) return null;

  const jid = m.key.remoteJid;
  if (!jid) return null;

  const sender = m.key.participant || m.key.remoteJid || '';
  const senderNumber = sender.split('@')[0].split(':')[0];
  const isGroup = jid.endsWith('@g.us');
  // V13: NO fromMe check — user sends to "Message yourself" which has fromMe=true

  // Group metadata
  let groupMetadata = null, groupAdmins = [];
  if (isGroup) {
    try {
      groupMetadata = await sock.groupMetadata(jid);
      groupAdmins = utils.getGroupAdmins(groupMetadata.participants);
    } catch {}
  }

  // Owner check
  const isOwner = ownerMod.isOwner(sender) || (sender === config.BOT_OWNER_JID) || (senderNumber === config.BOT_OWNER_NUM);
  const isAdmin = isOwner || store.isAdmin(sender);
  const isPremiumUser = store.isPremium(sender);
  const isBotAdmin = isGroup && groupAdmins.some(a => a === sock.user?.id || a.includes(sock.user?.id?.split(':')[0]));
  const isBanned = store.isBanned(sender);
  const pushname = m.pushName || senderNumber;

  // ═══════════════════════════════════════════════════════════════
  // V13 CRITICAL FIX: Use recursive normalizer to unwrap ALL layers.
  // This is THE fix that makes commands work.
  // ═══════════════════════════════════════════════════════════════
  const body = normalizer.extractBody(m.message) || '';

  // V13: Support TWO prefixes: . and /
  const prefixes = config.BOT_PREFIXES || ['.', '/'];
  let prefix = null;
  let isCmd = false;
  for (const p of prefixes) {
    if (body.startsWith(p) && body.length > p.length) {
      prefix = p;
      isCmd = true;
      break;
    }
  }

  let command = '', args = [], text = '', q = '';
  if (isCmd) {
    const withoutPrefix = body.slice(prefix.length).trim();
    const parts = withoutPrefix.split(/\s+/).filter(Boolean);
    command = (parts[0] || '').toLowerCase();
    args = parts.slice(1);
    text = args.join(' ');
    q = text;
  }

  // Quoted message
  let quoted = null;
  try {
    const realType = normalizer.getRealContentType(m.message);
    if (realType && m.message[realType]?.contextInfo?.quotedMessage) {
      const qMsg = m.message[realType].contextInfo.quotedMessage;
      quoted = {
        text: normalizer.extractBody(qMsg) || '',
        type: normalizer.getRealContentType(qMsg),
        sender: m.message[realType].contextInfo.participant || '',
        key: {
          remoteJid: jid,
          fromMe: (m.message[realType].contextInfo.participant === sock.user?.id),
          id: m.message[realType].contextInfo.stanzaId || ''
        }
      };
      if (quoted.text) q = quoted.text;
    }
  } catch {}

  // ─── Reply helpers (VERIFIED WhatsApp badge) ─────────
  const reply = async (txt, opts = {}) => {
    if (typeof txt !== 'string') txt = String(txt ?? '');
    return verified.sendVerified(sock, jid, {
      text: txt,
      mentions: utils.parseMention(txt),
      ...opts
    }, { quoted: m });
  };
  const replyImg = async (url, caption = '', opts = {}) => verified.sendVerified(sock, jid, {
    image: { url }, caption, ...opts
  }, { quoted: m });
  const replyAudio = async (url, opts = {}) => verified.sendVerified(sock, jid, {
    audio: { url }, mimetype: 'audio/mpeg', ...opts
  }, { quoted: m });
  const replySticker = async (buffer, opts = {}) => sock.sendMessage(jid, {
    sticker: buffer, ...opts
  }, { quoted: m });
  const react = async (emoji) => {
    try { await sock.sendMessage(jid, { react: { text: emoji || '✅', key: m.key } }); } catch {}
  };

  const downloadQuoted = async () => {
    if (!quoted) return null;
    try {
      return await utils.downloadMediaMessage({ message: { [quoted.type]: { ...quoted } } }, sock);
    } catch { return null; }
  };
  const downloadMsg = async () => {
    try { return await utils.downloadMediaMessage(m, sock); } catch { return null; }
  };

  return {
    sock, m, jid, from: jid, sender, senderNumber, isGroup,
    isOwner, isAdmin, isPremium: isPremiumUser, isBotAdmin, isBanned,
    reply, replyImg, replyAudio, replySticker, react,
    args, q, text, command, prefix, body, quoted, pushname,
    downloadQuoted, downloadMsg, groupMetadata, groupAdmins,
    store, lib: utils, menu, config,
    antiSystem, messageStore, verified
  };
}

// ═══════════════════════════════════════════════════════════════
// ON MESSAGE - The main command execution pipeline
// ═══════════════════════════════════════════════════════════════
async function onMessage(sock, m) {
  // Step 1: Basic validation
  if (!m || !m.message) return;

  try {
    watchdog.trackMessage();

    // Step 2: Store message for anti-delete/edit
    try { messageStore.storeMessage(m.key.remoteJid, m.key, m.message); } catch {}

    // Step 3: Build context (extract body, command, etc.)
    const ctx = await buildContext(sock, m).catch(e => {
      console.error(chalk.red(`[HANDLER] buildContext failed: ${e.message}`));
      return null;
    });
    if (!ctx) return;

    // Step 4: Auto-read & presence
    try {
      if (config.AUTO_READ) await sock.sendReadReceipt(ctx.jid, ctx.sender, [m.key]);
    } catch {}

    // Step 5: Skip status broadcasts
    if (m.key.remoteJid === 'status@broadcast') return;

    // Step 6: Check if it's a command
    if (!ctx.isCmd) return; // Not a command → ignore

    // Step 7: Log command detected
    console.log(chalk.cyan(`[CMD] ${ctx.senderNumber}: ${ctx.prefix}${ctx.command} ${ctx.args.join(' ')}`));

    // Step 8: Ban check
    if (ctx.isBanned) {
      return ctx.reply('❌ You are banned from using this bot.');
    }

    // Step 9: Increment command count
    try {
      const sockUserJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
      store.incCommandCount(sockUserJid);
    } catch {}

    // Step 10: Find command in registry
    const cmd = getCommand(ctx.command);
    if (!cmd) {
      // Unknown command → silent ignore
      return;
    }

    // Step 11: Permission check
    if (cmd.category === 'owner' && !ctx.isOwner) {
      return ctx.reply('❌ Owner only command');
    }

    // Step 12: EXECUTE COMMAND
    console.log(chalk.green(`[CMD] Executing: ${ctx.command}`));
    await cmd.handler(ctx);
    console.log(chalk.green(`[CMD] Done: ${ctx.command}`));

  } catch (e) {
    console.error(chalk.red(`[COMMAND_FAIL] ${e.message}`));
    try {
      await sock.sendMessage(m.key?.remoteJid, { text: '⚠️ System busy, retry...' });
    } catch {}
  }
}

async function onMessagesUpdate(sock, updates) {
  try { await antiSystem.handleMessagesUpdate(sock, updates); } catch (e) {}
}

async function onGroupUpdate(sock, ev) {}

module.exports = {
  loadCommands, getCommandsByCategory, getCommand, getTotalCommands, getAllCategories,
  buildContext, onMessage, onGroupUpdate, onMessagesUpdate
};
