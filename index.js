const TelegramBot = require('node-telegram-bot-api');
const { getPageRSSHub } = require('./radar');
const config = require('./config');
const logger = require('./logger');

// replace the value below with the Telegram token you receive from @BotFather
const token = config.telegram_bot_token;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Matches "http://" or "https://"
bot.onText(/^https*:\/\//, async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const feeds = await getPageRSSHub(text);
    for (let feed of feeds) {
        const url = feed.url;
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

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const username = msg.chat.username;
    const text = msg.text;
    logger.info(`Message from ${username}: ${text}`)

    // send a message to the chat acknowledging receipt of their message
    bot.sendMessage(chatId, `Received your message: ${text}`);
});