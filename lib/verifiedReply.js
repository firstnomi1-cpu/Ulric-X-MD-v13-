/**
 * Ulric-X MD V13 - Verified WhatsApp-Style Reply
 *
 * Uses forwardedNewsletterMessageInfo to display "WhatsApp ✅"
 * verified blue tick at the top of every bot reply.
 *
 * This is the same technique used by official WhatsApp channels
 * and Meta AI — the newsletter JID triggers the verified badge.
 */
const config = require('../config');

const WHATSAPP_NEWSLETTER_JID = config.BOT_CHANNEL_JID || '120363404551577200@newsletter';

/**
 * Build verified context info — adds WhatsApp ✅ tick + bot thumbnail.
 */
function verifiedContext(extra = {}) {
  return {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: WHATSAPP_NEWSLETTER_JID,
      newsletterName: 'WhatsApp',
      serverMessageId: -1,
      ...extra
    },
    externalAdReply: {
      title: config.BOT_STYLE_NAME || 'Ulric-X MD',
      body: 'Verified WhatsApp Bot',
      thumbnailUrl: config.BOT_LOGO,
      sourceUrl: config.BOT_CHANNEL_URL || 'https://whatsapp.com',
      mediaType: 1,
      renderLargerThumbnail: false,
      showAdAttribution: false
    }
  };
}

/**
 * Send a verified WhatsApp-style message.
 * Automatically adds the WhatsApp ✅ tick to any message type.
 */
async function sendVerified(sock, jid, messageContent, opts = {}) {
  const finalMessage = { ...messageContent };
  finalMessage.contextInfo = {
    ...(messageContent.contextInfo || {}),
    ...verifiedContext()
  };
  return sock.sendMessage(jid, finalMessage, opts);
}

/**
 * Wrap ctx.reply to use verified context.
 */
function makeVerifiedReply(sock, jid, m) {
  return async (txt, opts = {}) => {
    if (typeof txt !== 'string') txt = String(txt ?? '');
    return sendVerified(sock, jid, {
      text: txt,
      mentions: (txt.match(/@\d{5,16}/g) || []).map(s => s.slice(1) + '@s.whatsapp.net')
    }, { quoted: m, ...opts });
  };
}

module.exports = {
  verifiedContext,
  sendVerified,
  makeVerifiedReply,
  WHATSAPP_NEWSLETTER_JID
};
