const { getRSSHubLink } = require('./rsshub');
const bot = require('./bot');

// Matches "http://" or "https://"
bot.onText(/^https*:\/\//, async (msg) => {
    const chatId = msg.chat.id;
    const msgId = msg.message_id;
    const text = msg.text;
    const feeds = await getRSSHubLink(text);
    const inline_keyboards = []
    for (let feed of feeds) {
        inline_keyboards.push([{
            text: feed.title,
            switch_inline_query_current_chat: feed.url
        }]);
    }
    bot.sendMessage(chatId, "Please select a link to subscribe:", {
        reply_to_message_id: msgId,
        reply_markup: {
            inline_keyboard: inline_keyboards
        }
    });
});

bot.onQuery(/^https*:\/\/.+/, (msg, match) => {
    const chatId = msg.chat.id;
    const msgId = msg.message_id;
    const link = match[0];
    const inline_keyboards = [[{
        text: 'Category 1',
        switch_inline_query_current_chat: `/subscribe 1 ${link}`
    }], [{
        text: 'Category 2',
        switch_inline_query_current_chat: `/subscribe 2 ${link}`
    }]];
    bot.sendMessage(chatId, "Please select a category:", {
        reply_to_message_id: msgId,
        reply_markup: {
            inline_keyboard: inline_keyboards
        }
    });
});

bot.onQuery(/^\/subscribe ([0-9]+) (https*:\/\/.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const msgId = msg.message_id;
    const cat = match[1];
    const link = match[2];
    bot.sendMessage(chatId, `Subscribe to ${cat}: ${link}`, {
        reply_to_message_id: msgId
    });
})
