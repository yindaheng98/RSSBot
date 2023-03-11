const config = require('../config');
const ApiFactory = require('ttrss-js-api2').ApiFactory;
const api = ApiFactory.build(config.rss_host);

async function login() {
    try {
        if (await api.isLoggedIn()) {
            await _getCategories();
            return;
        }
    } catch (e) {
    }
    await api.login(config.rss_username, config.rss_password);
}

let titles = {};
async function _getCategories() {
    let all = await api.getCategories();
    let _titles = {};
    for (let category of all) {
        if (category.id >= 0) {
            _titles[category.id] = category.title;
        }
    }
    titles = _titles;
}

async function getCategories() {
    await login();
    if (JSON.stringify(titles) === '{}') {
        await _getCategories();
    }
    return titles;
}

async function getCategoryTitle(category_id) {
    await login();
    if (titles[category_id]) {
        _getCategories();
        return titles[category_id]
    } else {
        await _getCategories();
        return titles[category_id]
    }
}

async function subscribeToFeed(category_id, feed_url) {
    await login();
    const categories = await getCategories();
    L:
    for (let cid in categories) {
        const feeds = await api.getFeeds({ categoryId: cid });
        for (let feed of feeds) {
            if (feed.feed_url === feed_url) {
                if ('' + category_id !== cid) {
                    await api.unsubscribeFeed({ feed_id: feed.id });
                    break L;
                }
            }
        }
    }
    const status = await api.subscribeToFeed({ feed_url: feed_url, category_id: category_id });
    if (status.code <= 1) {
        return { ok: true };
    }
    return { ok: false, err: JSON.stringify(status) };
}

async function isSubscribed(feed_url) {
    await login();
    const categories = await getCategories();
    for (let category_id in categories) {
        const feeds = await api.getFeeds({ categoryId: category_id });
        for (let feed of feeds) {
            if (feed.feed_url === feed_url) {
                return category_id
            }
        }
    }
}

module.exports = { getCategories, subscribeToFeed, getCategoryTitle, isSubscribed }