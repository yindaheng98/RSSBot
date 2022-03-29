const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const logger = require('./utils/logger');

// replace the value below with the Telegram token you receive from @BotFather
const token = config.telegram_bot_token;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

bot._sendMessage = bot.sendMessage
bot.sendMessage = function (chatId, text, options) {
    logger.info(`Message back ${chatId}: ${text}`);
    bot._sendMessage(chatId, text, options)
}
// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const msgId = msg.message_id;
    const text = msg.text;
    logger.info(`Message from ${chatId}: ${text}`)

    // send a message to the chat acknowledging receipt of their message
    bot._sendMessage(chatId, 'Received your message', {
        disable_web_page_preview: true,
        reply_to_message_id: msgId
    });
});

let username;
async function getUsername() {
    if (!username) {
        const me = await bot.getMe();
        username = me.username;
    }
    return username;
}

let onQueryInit = 0;
bot.onQuery = async function (regexp, callback) {
    onQueryInit += 1;
    logger.info(`Methods "onQuery" initializing: ${onQueryInit}`);
    const username = await getUsername();
    bot.onText(new RegExp(`^@${username} (.+)`), (msg, match) => {
        if (match && match.length > 1) {
            const result = regexp.exec(match[1]);
            if (!result) {
                return false;
            }
            // reset index so we start at the beginning of the regex each time
            regexp.lastIndex = 0;
            callback(msg, result);
        }
    });
    onQueryInit -= 1;
    if (onQueryInit <=0) {
        logger.info('All Methods "onQuery" initialized');
    }
}

module.exports = bot;