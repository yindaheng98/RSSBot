const { getRSSHubLink } = require('./rsshub');
const bot = require('./bot');
const db = require('./database');
const config = require('./config');
const user = require('./user');
const rss = require('./rss/' + config.rss_driver)

// Matches "http://" or "https://"
bot.onText(/^https*:\/\/[^\s]+/, async (msg, match) => {
    const chatId = user.validate(msg);
    if (!chatId) {
        return;
    }
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
    const chatId = user.validate(msg);
    if (!chatId) {
        return;
    }
    const msgId = msg.message_id;
    const link = match[0];
    let inline_keyboards = [];
    for (let category of (await rss.getCategories())) {
        const { title, id } = category;
        inline_keyboards.push([{
            text: title,
            switch_inline_query_current_chat: `/subscribe ${id} ${link}`
        }]);
    }
    bot.sendMessage(chatId, "Please select a category:", {
        reply_to_message_id: msgId,
        reply_markup: {
            inline_keyboard: inline_keyboards
        }
    });
});

bot.onQuery(/^\/subscribe ([0-9]+) (https*:\/\/.+)/, (msg, match) => {
    const chatId = user.validate(msg);
    if (!chatId) {
        return;
    }
    const msgId = msg.message_id;
    const cat = match[1];
    const link = match[2];
    bot.sendMessage(chatId, `Subscribed to ${cat}: ${link}`, {
        reply_to_message_id: msgId
    });
    db.delUrlByFeedurl(link);
})

const schedule = require('node-schedule');
schedule.scheduleJob(config.unsubscribe_check_cron, async () => {
    const urls = await db.getAllUrl();
    if (urls.length <= 0) return;
    let msg = "You have this unsubscribed link:\n\n";
    for (let url of urls) {
        msg += url + "\n";
    }
    for (let chatId of user.getChatIds()) {
        bot.sendMessage(chatId, msg);
    }
});