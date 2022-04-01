const { getRSSHubLink } = require('./rsshub');
const bot = require('./bot');
const db = require('./database');
const config = require('./config');
const user = require('./user');
const rss = require('./rss/' + config.rss_driver)

// Matches "http://" or "https://"
bot.onText(/^https*:\/\/[^\s]+/, async (msg, match) => {
    const chatId = msg.chat.id;
    const msgId = msg.message_id;
    const text = match[0];
    const feeds = await getRSSHubLink(text);
    const inline_keyboards = []
    for (let feed of feeds) {
        inline_keyboards.push([{
            text: feed.title,
            switch_inline_query_current_chat: feed.url
        }]);
        db.putFeedToUrl(text, feed);
    }
    bot.sendMessage(chatId, "Please select a link to subscribe:", {
        reply_to_message_id: msgId,
        reply_markup: {
            inline_keyboard: inline_keyboards
        }
    });
});

bot.onQuery(/^https*:\/\/.+/, async (msg, match) => {
    const chatId = msg.chat.id;
    const msgId = msg.message_id;
    const link = match[0];
    let inline_keyboards = [];
    const categories = await rss.getCategories();
    for (let category_id in categories) {
        const title = categories[category_id];
        inline_keyboards.push([{
            text: title,
            switch_inline_query_current_chat: `/subscribe ${category_id} ${link}`
        }]);
    }
    bot.sendMessage(chatId, "Please select a category:", {
        reply_to_message_id: msgId,
        reply_markup: {
            inline_keyboard: inline_keyboards
        }
    });
});

bot.onQuery(/^\/subscribe ([0-9]+) (https*:\/\/.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const msgId = msg.message_id;
    const category_id = parseInt(match[1]);
    const category_title = await rss.getCategoryTitle(category_id);
    const feed_url = match[2];
    const status = await rss.subscribeToFeed(category_id, feed_url);
    if (status.code <= 0) {
        bot.sendMessage(chatId, `Subscribed to ${category_title}: ${feed_url}`, {
            reply_to_message_id: msgId
        });
        db.delUrlByFeedurl(feed_url);
    } else {
        bot.sendMessage(chatId, `Cannot subscribed to ${category_title}: ${JSON.stringify(status)}`, {
            reply_to_message_id: msgId
        });
    }
});

bot.onQuery(/^\/unparse (https*:\/\/.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const msgId = msg.message_id;
    const url = match[1];
    db.delUrl(url);
    bot.sendMessage(chatId, `Canceled: ${url}`, {
        reply_to_message_id: msgId
    });
});

const schedule = require('node-schedule');
schedule.scheduleJob(config.unsubscribe_check_cron, async () => {
    const urls = await db.getAllUrl();
    if (urls.length <= 0) return;
    let msg = "You have this unsubscribed link:\n";
    for (let url of urls) {
        let inline_keyboards = [[{
            text: 'Subscribe it',
            switch_inline_query_current_chat: `/parse ${url}`
        }, {
            text: 'Cancel it',
            switch_inline_query_current_chat: `/unparse ${url}`
        }]];
        for (let chatId of user.getChatIds()) {
            bot.sendMessage(chatId, msg + url, {
                reply_markup: {
                    inline_keyboard: inline_keyboards
                }
            });
        }
    }
});