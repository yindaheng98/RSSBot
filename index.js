const { parseRSSHubLink } = require('./rsshub');
const bot = require('./bot');

// Matches "http://" or "https://"
bot.onText(/^https*:\/\//, async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const urls = await parseRSSHubLink(text);
    for (let url of urls) {
        bot.sendMessage(chatId, url);
    }
});

// Matches "/subscribe [whatever]"
bot.onText(/^\/subscribe (.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"
    bot.sendMessage(chatId, resp);
});