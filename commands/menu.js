/**
 * Ulric-X MD V13 - Menu & Test Commands
 * Pre-defined menus for instant response.
 * .test command for verification.
 */
const config = require('../config');
const menu   = require('../lib/menu');
const handler= require('../handler');
const utils  = require('../lib/utils');
const verified = require('../lib/verifiedReply');

function makeCategoryMenuCommand(category, aliases = []) {
  return {
    name: `${category}menu`,
    alias: aliases,
    category: 'main',
    desc: `Show ${category} commands`,
    handler: async (ctx) => {
      const cmds = handler.getCommandsByCategory(category);
      if (!cmds.length) return ctx.reply(`No commands in: ${category}`);
      const text = menu.categoryMenu(ctx.prefix, category, cmds);
      await menu.sendVerifiedMenu(ctx.sock, ctx.jid, text, ctx.m);
    }
  };
}

module.exports = [
  // ─── TEST COMMAND (for verification) ───────────────────────
  {
    name: 'test', alias: ['check', 'verify'], category: 'main', desc: 'Test if commands work',
    handler: async (ctx) => {
      await ctx.reply(`╭━━❖ ✅ 𝐓𝐄𝐒𝐓 ❖━┈⊷
┃│ ✅ Commands are WORKING!
┃│ 🤖 Bot: ${config.BOT_NAME}
┃│ 📦 Version: ${config.BOT_VERSION}
┃│ 👑 Owner: ${config.BOT_OWNER}
┃│ ⏱️ Uptime: ${utils.runtime(process.uptime())}
┃│ 📦 Commands: ${handler.getTotalCommands()}
┃│ 🔤 Prefix: ${ctx.prefix}
┃│ 💬 Your msg: ${ctx.body}
┃╰────────────────
╰━━━━━━━━━━━━━━━┈⊷

${config.BOT_FOOTER}`);
    }
  },

  // ─── MAIN MENU ─────────────────────────────────────────────
  {
    name: 'menu', alias: ['listmenu','help','h','?'], category: 'main', desc: 'Show main menu',
    handler: async (ctx) => {
      const runtime = utils.runtime(process.uptime());
      const totalUsers = ctx.store.getUsers().length;
      const totalCommands = handler.getTotalCommands();
      const text = menu.mainMenu(ctx.prefix, runtime, totalUsers, totalCommands);
      await menu.sendVerifiedMenu(ctx.sock, ctx.jid, text, ctx.m);
    }
  },

  // ─── ALL MENU ──────────────────────────────────────────────
  {
    name: 'allmenu', alias: ['allcmds','menu2','commands'], category: 'main', desc: 'Show all commands',
    handler: async (ctx) => {
      const runtime = utils.runtime(process.uptime());
      const totalUsers = ctx.store.getUsers().length;
      const totalCommands = handler.getTotalCommands();
      const categories = new Map();
      for (const cat of handler.getAllCategories()) {
        categories.set(cat, handler.getCommandsByCategory(cat));
      }
      const text = menu.allMenu(ctx.prefix, runtime, totalUsers, totalCommands, categories);
      await menu.sendVerifiedMenu(ctx.sock, ctx.jid, text, ctx.m);
    }
  },

  // ─── PING ──────────────────────────────────────────────────
  {
    name: 'ping', alias: ['p','speed'], category: 'main', desc: 'Bot speed test',
    handler: async (ctx) => {
      const start = Date.now();
      await ctx.reply('⚡ Testing...');
      const ms = Date.now() - start;
      await ctx.reply(`╭━━❖ ⚡ 𝐏𝐈𝐍𝐆 ❖━┈⊷
┃│ ⚡ Speed: ${ms}ms
┃│ ⏱️ Uptime: ${utils.runtime(process.uptime())}
┃│ 💾 RAM: ${utils.formatBytes(process.memoryUsage().rss)}
┃╰────────────────
╰━━━━━━━━━━━━━━━┈⊷

${config.BOT_FOOTER}`);
    }
  },

  // ─── ALIVE ─────────────────────────────────────────────────
  {
    name: 'alive', alias: ['online','status'], category: 'main', desc: 'Check bot status',
    handler: async (ctx) => {
      await ctx.reply(`╭━━❖ ✅ 𝐀𝐋𝐈𝐕𝐄 ❖━┈⊷
┃│ 🤖 ${config.BOT_NAME} is ALIVE!
┃│ ⏱️ Uptime: ${utils.runtime(process.uptime())}
┃│ 📦 Commands: ${handler.getTotalCommands()}
┃│ 👥 Users: ${ctx.store.getUsers().length}
┃╰────────────────
╰━━━━━━━━━━━━━━━┈⊷

${config.BOT_FOOTER}`);
    }
  },

  // ─── CATEGORY MENUS ────────────────────────────────────────
  makeCategoryMenuCommand('owner', ['om']),
  makeCategoryMenuCommand('group', ['gm']),
  makeCategoryMenuCommand('download', ['dlmenu']),
  makeCategoryMenuCommand('sticker', ['smenu','stmenu']),
  makeCategoryMenuCommand('fun', ['fmenu']),
  makeCategoryMenuCommand('game', ['gmenu']),
  makeCategoryMenuCommand('anime', ['amenu']),
  makeCategoryMenuCommand('ai', ['aim']),
  makeCategoryMenuCommand('logo', ['lgmenu']),
  makeCategoryMenuCommand('voice', ['vmenu']),
  makeCategoryMenuCommand('image', ['imenu']),
  makeCategoryMenuCommand('media', ['medmenu']),
  makeCategoryMenuCommand('utility', ['umenu','utilmenu']),
  makeCategoryMenuCommand('religion', ['rmenu','islammenu']),
  makeCategoryMenuCommand('info', ['imenu2']),
  makeCategoryMenuCommand('text', ['tmenu']),
  makeCategoryMenuCommand('random', ['rdmenu']),
  makeCategoryMenuCommand('reaction', ['rcmenu']),
  makeCategoryMenuCommand('convert', ['cmenu']),
  makeCategoryMenuCommand('search', ['smenu2']),
  makeCategoryMenuCommand('database', ['dbmenu']),

  // ─── CHANNEL ───────────────────────────────────────────────
  {
    name: 'channel', alias: ['ch','newsletter'], category: 'main', desc: 'Show channel info',
    handler: async (ctx) => {
      await ctx.reply(`╭━━❖ 📢 𝐎𝐅𝐅𝐈𝐂𝐈𝐀𝐋 𝐂𝐇𝐀𝐍𝐍𝐄𝐋 ❖━┈⊷
┃╭────────────────
┃│ ✓ ${config.BOT_CHANNEL_NAME}
┃│ 🆔 ${config.BOT_CHANNEL_ID}
┃│ 🔗 ${config.BOT_CHANNEL_URL}
┃╰────────────────
╰━━━━━━━━━━━━━━━┈⊷

${config.BOT_FOOTER}`);
    }
  },

  // ─── OWNER INFO ────────────────────────────────────────────
  {
    name: 'owner', alias: ['creator','dev'], category: 'main', desc: 'Show owner info',
    handler: async (ctx) => {
      await ctx.reply(`╭━━❖ 👑 𝐎𝐖𝐍𝐄𝐑 ❖━┈⊷
┃╭────────────────
┃│ 👑 ${config.BOT_OWNER}
┃│ 📞 +${config.BOT_OWNER_NUM}
┃│ 🤖 ${config.BOT_NAME}
┃│ 📦 v${config.BOT_VERSION}
┃╰────────────────
╰━━━━━━━━━━━━━━━┈⊷

${config.BOT_FOOTER}`);
    }
  }
];
