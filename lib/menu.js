/**
 * Ulric-X MD V13 - Pre-Defined Verified Menu System
 *
 * Menus are PRE-DEFINED (not dynamically fetched) for instant response.
 * Uses stylish font: 𝐔𝐥𝐫𝐢𝐜 - 𝐗 - 𝐒𝐡𝐚𝐡 𝐌𝐃 𝐛𝐨𝐭
 * Footer: > 𝑷𝑶𝑾𝑬𝑹𝑬𝑫 𝑩𝒀 ↪ 𝑼𝒍𝒓𝒊𝒄 𝑿 𝑴𝒊𝒔𝒕𝒆𝒓 𝑺𝒉𝒂𝒉
 * Verified WhatsApp ✅ tick on all responses.
 */
const config = require('../config');
const verified = require('./verifiedReply');

const FOOTER = config.BOT_FOOTER || '> 𝑷𝑶𝑾𝑬𝑹𝑬𝑫 𝑩𝒀 ↪ 𝑼𝒍𝒓𝒊𝒄 𝑿 𝑴𝒊𝒔𝒕𝒆𝒓 𝑺𝒉𝒂𝒉';
const STYLE_NAME = config.BOT_STYLE_NAME || '𝐔𝐥𝐫𝐢𝐜 - 𝐗 - 𝐒𝐡𝐚𝐡 𝐌𝐃 𝐛𝐨𝐭';
const READMORE = '\u200E'.repeat(4000);

// ═══════════════════════════════════════════════════════════════
// MAIN MENU (.menu) - Pre-defined, instant response
// ═══════════════════════════════════════════════════════════════
function mainMenu(prefix, runtime, totalUsers, totalCommands) {
  return `╭━━❖ ${STYLE_NAME} ❖━┈⊷
┃╭────────────────
┃│ 👑 𝐎𝐰𝐧𝐞𝐫 : ${config.BOT_OWNER}
┃│ 🤖 𝐁𝐨𝐭   : ${config.BOT_NAME}
┃│ 📦 𝐕𝐞𝐫   : ${config.BOT_VERSION}
┃│ ⏱️ 𝐔𝐩   : ${runtime}
┃│ 👥 𝐔𝐬𝐞𝐫 : ${totalUsers}
┃│ 📦 𝐂𝐦𝐝 : ${totalCommands}
┃╰────────────────
╰━━━━━━━━━━━━━━━┈⊷

╭━━❖ 📂 𝐌𝐄𝐍𝐔 𝐋𝐈𝐒𝐓 ❖━┈⊷
┃│ ➤ ${prefix}allmenu — All Commands
┃│ ➤ ${prefix}ownermenu
┃│ ➤ ${prefix}groupmenu
┃│ ➤ ${prefix}downloadmenu
┃│ ➤ ${prefix}stickermenu
┃│ ➤ ${prefix}funmenu
┃│ ➤ ${prefix}gamemenu
┃│ ➤ ${prefix}animemenu
┃│ ➤ ${prefix}aimenu
┃│ ➤ ${prefix}logomenu
┃│ ➤ ${prefix}voicemenu
┃│ ➤ ${prefix}imagemenu
┃│ ➤ ${prefix}mediamenu
┃│ ➤ ${prefix}utilitymenu
┃│ ➤ ${prefix}religionmenu
┃│ ➤ ${prefix}infomenu
┃│ ➤ ${prefix}textmenu
┃│ ➤ ${prefix}randommenu
┃│ ➤ ${prefix}reactionmenu
┃│ ➤ ${prefix}convertmenu
┃│ ➤ ${prefix}searchmenu
┃│ ➤ ${prefix}databasemenu
┃╰────────────────
╰━━━━━━━━━━━━━━━┈⊷

╭━━❖ 📢 𝐂𝐇𝐀𝐍𝐍𝐄𝐋 ❖━┈⊷
┃│ ✓ ${config.BOT_CHANNEL_NAME}
┃│ 🔗 ${config.BOT_CHANNEL_URL}
┃╰────────────────
╰━━━━━━━━━━━━━━━┈⊷

${FOOTER}`;
}

// ═══════════════════════════════════════════════════════════════
// ALL MENU (.allmenu) - All commands with readMore
// ═══════════════════════════════════════════════════════════════
function allMenu(prefix, runtime, totalUsers, totalCommands, categories) {
  let text = `╭━━❖ ${STYLE_NAME} ❖━┈⊷
┃╭────────────────
┃│ 👑 𝐎𝐰𝐧𝐞𝐫 : ${config.BOT_OWNER}
┃│ 🤖 𝐁𝐨𝐭   : ${config.BOT_NAME}
┃│ 📦 𝐕𝐞𝐫   : ${config.BOT_VERSION}
┃│ ⏱️ 𝐔𝐩   : ${runtime}
┃│ 👥 𝐔𝐬𝐞𝐫 : ${totalUsers}
┃│ 📦 𝐂𝐦𝐝 : ${totalCommands}
┃╰────────────────
╰━━━━━━━━━━━━━━━┈⊷`;

  text += '\n' + READMORE + '\n';

  const emojis = {
    main:'📋', owner:'👑', group:'👥', download:'📥', sticker:'🎭',
    fun:'🎮', game:'🎯', anime:'🌸', ai:'🤖', logo:'🎨',
    voice:'🔊', image:'🖼️', media:'🎬', utility:'🛠️', religion:'🕌',
    info:'ℹ️', text:'📝', random:'🎲', reaction:'💫', convert:'🔄',
    search:'🔍', database:'💾', misc:'📌'
  };

  const sortedCats = [...categories.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [cat, cmds] of sortedCats) {
    const emoji = emojis[cat] || '📌';
    text += `\n╭━━❖ ${emoji} ${cat.toUpperCase()} ❖━┈⊷\n`;
    for (const c of cmds) {
      text += `┃ └ ${prefix}${c.name}\n`;
    }
    text += `╰━━━━━━━━━━━━━━━┈⊷\n`;
  }

  text += `\n╭━━❖ 📢 𝐂𝐇𝐀𝐍𝐍𝐄𝐋 ❖━┈⊷
┃│ ✓ ${config.BOT_CHANNEL_NAME}
┃│ 🔗 ${config.BOT_CHANNEL_URL}
┃╰────────────────
╰━━━━━━━━━━━━━━━┈⊷

${FOOTER}`;

  return text;
}

// ═══════════════════════════════════════════════════════════════
// CATEGORY MENU - Pre-defined for each category
// ═══════════════════════════════════════════════════════════════
function categoryMenu(prefix, catName, cmds) {
  const emojis = {
    main:'📋', owner:'👑', group:'👥', download:'📥', sticker:'🎭',
    fun:'🎮', game:'🎯', anime:'🌸', ai:'🤖', logo:'🎨',
    voice:'🔊', image:'🖼️', media:'🎬', utility:'🛠️', religion:'🕌',
    info:'ℹ️', text:'📝', random:'🎲', reaction:'💫', convert:'🔄',
    search:'🔍', database:'💾', misc:'📌'
  };
  const emoji = emojis[catName] || '📌';

  let text = `╭━━❖ ${emoji} ${catName.toUpperCase()} 𝐌𝐄𝐍𝐔 ❖━┈⊷
┃╭────────────────
┃│ 📦 Total: ${cmds.length} commands
┃╰────────────────
╰━━━━━━━━━━━━━━━┈⊷
`;

  for (const c of cmds) {
    text += `┃ └ ${prefix}${c.name}\n`;
  }

  text += `╰━━━━━━━━━━━━━━━┈⊷\n\n${FOOTER}`;
  return text;
}

// ═══════════════════════════════════════════════════════════════
// SEND VERIFIED MENU - With WhatsApp ✅ tick + image
// ═══════════════════════════════════════════════════════════════
async function sendVerifiedMenu(sock, jid, menuText, quoted) {
  return verified.sendVerified(sock, jid, {
    image: { url: config.BOT_LOGO },
    caption: menuText,
    contextInfo: verified.verifiedContext()
  }, { quoted });
}

module.exports = {
  mainMenu,
  allMenu,
  categoryMenu,
  sendVerifiedMenu,
  FOOTER,
  STYLE_NAME,
  READMORE
};
  
