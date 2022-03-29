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

(async function () {
    await bot.onQuery(/https*:\/\/.+/, (msg, match) => {
        const chatId = msg.chat.id;
        const msgId = msg.message_id;
        const link = match[0];
        const inline_keyboards = [[]];
        bot.sendMessage(chatId, "Please select a category:", {
            reply_to_message_id: msgId,
            reply_markup: {
                inline_keyboard: inline_keyboards
            }
        });
    });

    await bot.onQuery(/^\/subscribe ([0-9]+) (https*:\/\/)/, (msg, match) => {

    })
})()

// Matches "/subscribe [whatever]"
bot.onText(/^\/subscribe (.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"
    bot.sendMessage(chatId, resp);
});