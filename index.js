const { getRSSHubLink } = require('./rsshub');
const bot = require('./bot');
const db = require('./database');
const config = require('./config');
const user = require('./user');
const rss = require('./rss/' + config.rss_driver)
const { search_cats_title_by_feeds } = require('./utils/search')

async function saveParse(url) {
    for (let feed of (await getRSSHubLink(url))) {
        db.putFeedToUrl(url, feed);
    }
}

async function catInlineKeyboards(url) {
    const inline_keyboards = [];
    const categories = await rss.getCategories();
    for (let category_id in categories) {
        const title = categories[category_id];
        inline_keyboards.push([{
            text: title,
            switch_inline_query_current_chat: `/parseto ${category_id} ${url}`
        }]);
    }
    inline_keyboards.push([{
        text: 'Reparse it',
        switch_inline_query_current_chat: `/parse ${url}`
    }, {
        text: 'Cancel it',
        switch_inline_query_current_chat: `/unparse ${url}`
    }]);
    return inline_keyboards
}

async function sendParseTo(url, msg) {
    saveParse(url); // 先保存再说
    const chatId = msg.chat.id;
    const msgId = msg.message_id;
    bot.sendDeleteMessage(chatId, msgId, `${url}\nPlease select a category to subscribe`, {
        reply_markup: {
            inline_keyboard: await catInlineKeyboards(url)
        }
    });
}

// Matches "http://" or "https://"
bot.onValidText(/^https*:\/\/[^\s]+/, async (msg, match) => { //选择要订阅到哪个目录下
    return await sendParseTo(match[0], msg);
});

bot.onQuery(/^\/parse (https*:\/\/.+)/, async (msg, match) => { //选择要订阅到哪个目录下
    return await sendParseTo(match[1], msg);
});

bot.onQuery(/^\/parseto ([0-9]+) (https*:\/\/.+)/, async (msg, match) => { //已经选好了要订阅到哪个目录下，于是解析之
    const chatId = msg.chat.id;
    const msgId = msg.message_id;
    const category_id = parseInt(match[1]);
    const url = match[2];
    saveParse(url); // 先保存再说
    const category_title = await rss.getCategoryTitle(category_id);
    const feeds = await getRSSHubLink(url);
    if (feeds.length === 1) { // 如果只有一个就直接订阅之
        return sendSubscribe(msg, category_id, feeds[0].url);
    }
    const inline_keyboards = [];
    for (let feed of feeds) {
        inline_keyboards.push([{
            text: feed.title,
            switch_inline_query_current_chat: `/subscribe ${category_id} ${feed.url}`
        }]);
    }
    bot.sendDeleteMessage(chatId, msgId, `Please select a feed to subscribe to ${category_title}`, {
        reply_markup: {
            inline_keyboard: inline_keyboards
        }
    });
});

bot.onQuery(/^\/unparse (https*:\/\/.+)/, async (msg, match) => { //取消
    const chatId = msg.chat.id;
    const msgId = msg.message_id;
    const url = match[1];
    db.delUrl(url);
    bot.sendDeleteMessage(chatId, msgId, `Canceled: ${url}`);
});

const schedule = require('node-schedule');
const logger = require('./utils/logger');
async function sendUnsubscribe() {
    const urls = await db.getAllUrl();
    if (urls.length <= 0) return;
    const url = urls[Math.floor(Math.random() * urls.length)]; //随机选一个返回
    let msg = `You have this unsubscribed link:\n${url}\nPlease select a category to subscribe`;
    let feeds = [];
    for (let feed of await getRSSHubLink(url)) {
        feeds.push(feed.url);
    }
    let category_ids = await search_cats_title_by_feeds(feeds, rss);
    if (category_ids.length > 0) {
        msg = `You have this subscribed link in ${category_ids.join(', ')}:\n${url}\nPlease select a category to update subscription`;
    }
    const inline_keyboards = await catInlineKeyboards(url);
    for (let chatId of user.getChatIds()) {
        bot.sendMessage(chatId, msg, {
            reply_markup: {
                inline_keyboard: inline_keyboards
            }
        });
    }
}
if (config.unsubscribe_check === "cron") {
    schedule.scheduleJob(config.unsubscribe_check_cron, sendUnsubscribe);
} else {
    bot.on('message', sendUnsubscribe);
}

async function pongInlineKeyboards() {
    const inline_keyboards = [];
    const categories = await rss.getCategories();
    for (let category_id in categories) {
        const title = categories[category_id];
        inline_keyboards.push([{
            text: title,
            switch_inline_query_current_chat: `/parseto ${category_id} `
        }]);
    }
    return inline_keyboards
}
async function sendPong() {
    const urls = await db.getAllUrl();
    let msg = 'No url saved'
    if (urls.length > 0)
        msg = `There are still ${urls.length} saved urls`
    msg += '\nPlease select a category to start your next subscription'
    const inline_keyboards = await pongInlineKeyboards();
    for (let chatId of user.getChatIds()) {
        bot.sendMessage(chatId, msg, {
            reply_markup: {
                inline_keyboard: inline_keyboards
            }
        });
    }
}

async function sendSubscribe(msg, category_id, feed_url) {
    const chatId = msg.chat.id;
    const msgId = msg.message_id;
    logger.info(`Subscribing: ${feed_url}`)
    const category_title = await rss.getCategoryTitle(category_id);
    let ok, err;
    if (('' + category_id) === await rss.isSubscribed(feed_url)) {
        ok = true;
    } else {
        const res = await rss.subscribeToFeed(category_id, feed_url);
        ok = res.ok;
        err = res.err;
    }
    if (ok) {
        db.delUrlByFeedurl(feed_url);
        bot.sendDeleteMessage(chatId, msgId, `Subscribed to ${category_title}: ${feed_url}`);
    } else {
        const inline_keyboards = [[{
            text: 'Retry it',
            switch_inline_query_current_chat: `/subscribe ${category_id} ${feed_url}`
        }]];
        bot.sendMessage(chatId, `Cannot subscribed to ${category_title}: ${err}`, {
            reply_to_message_id: msgId,
            reply_markup: {
                inline_keyboard: inline_keyboards
            }
        });
    }
    sendUnsubscribe();
    sendPong();
}

bot.onQuery(/^\/subscribe ([0-9]+) (https*:\/\/.+)/, async (msg, match) => {
    const category_id = parseInt(match[1]);
    const feed_url = match[2];
    sendSubscribe(msg, category_id, feed_url);
});

bot.onPing(async (msg) => {
    const chatId = msg.chat.id;
    const msgId = msg.message_id;
    const urls = await db.getAllUrl();
    bot.sendMessage(chatId, `pong! I have saved ${urls.length} urls.\nPlease select a category to start your subscription`, {
        reply_to_message_id: msgId,
        reply_markup: {
            inline_keyboard: await pongInlineKeyboards()
        }
    })
})

module.exports = { bot, rss, user };