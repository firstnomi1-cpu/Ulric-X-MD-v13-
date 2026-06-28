/**
 * Ulric-X MD V13 - Message Normalizer
 *
 * 2000x thinking: The #1 reason commands fail is message wrapping.
 * WhatsApp wraps messages in MULTIPLE layers:
 *   ephemeralMessage → viewOnceMessage → extendedTextMessage
 *
 * This normalizer recursively unwraps ALL layers and extracts body text.
 * It tries Baileys' built-in normalizeMessageContent first,
 * then falls back to manual recursive unwrapping.
 */
const baileys = require('@whiskeysockets/baileys');

// All possible wrapper types
const WRAPPERS = [
  'ephemeralMessage',
  'viewOnceMessage',
  'viewOnceMessageV2',
  'viewOnceMessageV2Extension',
  'documentWithCaptionMessage',
  'editedMessage',
  'buttonsMessage',
  'templateMessage',
  'interactiveMessage',
  'productMessage'
];

/**
 * Recursively unwrap ALL message wrappers.
 * Handles nested wrappers (e.g. ephemeralMessage → viewOnceMessage → conversation)
 */
function unwrapMessage(message, depth = 0) {
  if (!message || depth > 5) return message;

  // Try Baileys' built-in normalizer first
  if (depth === 0) {
    try {
      if (typeof baileys.normalizeMessageContent === 'function') {
        const normalized = baileys.normalizeMessageContent(message);
        if (normalized && Object.keys(normalized).length > 0) {
          // Still check for wrappers in the normalized result
          const type = Object.keys(normalized)[0];
          if (WRAPPERS.includes(type) && normalized[type]?.message) {
            return unwrapMessage(normalized[type].message, depth + 1);
          }
          return normalized;
        }
      }
    } catch (e) {}
  }

  // Manual recursive unwrap
  const type = message ? Object.keys(message)[0] : null;
  if (!type) return message;

  if (WRAPPERS.includes(type) && message[type]?.message) {
    return unwrapMessage(message[type].message, depth + 1);
  }

  return message;
}

/**
 * Extract body text from ANY message type.
 * Returns the text content for command parsing.
 */
function extractBody(message) {
  if (!message) return '';

  // Unwrap all layers first
  const unwrapped = unwrapMessage(message);
  if (!unwrapped) return '';

  const type = Object.keys(unwrapped)[0];
  if (!type) return '';

  const content = unwrapped[type];

  // ─── Text-based messages ──────────────────────────────
  if (type === 'conversation') return content || '';
  if (type === 'extendedTextMessage') return content?.text || '';
  if (type === 'imageMessage') return content?.caption || '';
  if (type === 'videoMessage') return content?.caption || '';

  // ─── Response messages ────────────────────────────────
  if (type === 'buttonsResponseMessage') return content?.selectedButtonId || '';
  if (type === 'listResponseMessage') return content?.singleSelectReply?.selectedRowId || '';
  if (type === 'templateButtonReplyMessage') return content?.selectedId || '';
  if (type === 'interactiveResponseMessage') {
    try {
      const parsed = JSON.parse(content?.nativeFlowResponseMessage?.nameJson || '{}');
      return parsed.name || '';
    } catch { return ''; }
  }

  // ─── Document ─────────────────────────────────────────
  if (type === 'documentMessage') return content?.caption || '';

  // ─── Media (no text but don't crash) ──────────────────
  if (type === 'audioMessage' || type === 'stickerMessage' || type === 'ptvMessage') return '';

  // ─── Contact / Location ───────────────────────────────
  if (type === 'contactMessage') return content?.displayName || '';
  if (type === 'locationMessage') return content?.name || content?.address || '';

  // ─── Fallback: try common fields ──────────────────────
  if (content?.text) return content.text;
  if (content?.caption) return content.caption;
  if (content?.conversation) return content.conversation;
  if (content?.selectedButtonId) return content.selectedButtonId;
  if (content?.selectedRowId) return content.selectedRowId;

  return '';
}

/**
 * Get the real content type (after unwrapping).
 */
function getRealContentType(message) {
  const unwrapped = unwrapMessage(message);
  if (!unwrapped) return null;
  return Object.keys(unwrapped)[0] || null;
}

/**
 * Get the actual message content object (after unwrapping).
 */
function getRealContent(message) {
  const unwrapped = unwrapMessage(message);
  if (!unwrapped) return null;
  const type = Object.keys(unwrapped)[0];
  return unwrapped[type];
}

module.exports = {
  unwrapMessage,
  extractBody,
  getRealContentType,
  getRealContent
};
