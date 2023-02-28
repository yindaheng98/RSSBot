# RSSBot

RSSBot 是一个能帮你订阅 RSSHub 的 Telegram Bot

## Use it

Run it

```sh
git clone https://github.com/yindaheng98/RSSBot
cd RSSBot
export TELEGRAM_BOT_TOKEN=<your telegram bot token>
export RSS_DRIVER=ttrss
export RSS_HOST=<your ttrss host>
export RSS_USERNAME=<your ttrss username>
export RSS_PASSWORD=<your ttrss password>
npm run start
```

Send a URL to your RSSBot e.g. `https://twitter.com/DIYgod`:

![](_/use1.jpg)

The RSSBot will parse the URL and fetch the category list from your specified rss driver (e.g. `RSS_DRIVER=ttrss`).
Then you will receive a reply, and you can select a category:

![](_/use2.jpg)

Select a category and send the message (e.g. select the category "Uncategorized"):

![](_/use3.jpg)

The RSSBot will convert the URL to an RSSHub link and call the API (e.g. [TTRSS API](https://tt-rss.org/wiki/ApiReference)) to subscribe to the RSSHub link.

## Config

All config variables are read from environments. See [`config.js`](config.js).

## Add custom functions

Install RSSBot as a package:

```sh
npm install rss-telegram-bot
```

Write your app:

```js
const { bot, rss, user } = require('rss-telegram-bot');

function getEHLink(tag) {
    let feeds = [];
    for (let url_format of config.eh_feed_formats) {
        feeds.push(util.format(url_format, encodeURIComponent(tag)));
    }
    return feeds
}

async function sendSubscribe(msg, category_id, tag) {
    const chatId = msg.chat.id;
    const msgId = msg.message_id;
    const category_title = await rss.getCategoryTitle(category_id);
    for (let feed_url of getEHLink(tag)) {
        logger.info(`Subscribing: ${feed_url}`);
        if (('' + category_id) === await rss.isSubscribed(feed_url)) {
            continue;
        }
        const { ok, err } = await rss.subscribeToFeed(category_id, feed_url);
        if (!ok) {
            const inline_keyboards = [[{
                text: 'Retry it',
                switch_inline_query_current_chat: `/subscribe_eh ${category_id} ${tag}`
            }]];
            bot.sendMessage(chatId, `Cannot subscribed to ${category_title}: ${err}`, {
                reply_to_message_id: msgId,
                reply_markup: {
                    inline_keyboard: inline_keyboards
                }
            });
            return;
        }
    }
    bot.sendMessage(chatId, `Subscribed to ${category_title}: ${tag}`, {
        reply_to_message_id: msgId
    });
}

bot.onQuery(/^\/subscribe_eh ([0-9]+) (artist:"[A-Za-z0-9 ]+\$")$/, async (msg, match) => {
    const category_id = parseInt(match[1]);
    const tag = match[2];
    sendSubscribe(msg, category_id, tag);
});
```

## API

```js
const { bot, rss, user } = require('rss-telegram-bot');
```

TBD