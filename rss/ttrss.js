const config = require('../config');
const ApiFactory = require('ttrss-js-api').ApiFactory;
const api = ApiFactory.build(config.rss_host);

async function login() {
    try {
        if (await api.isLoggedIn()) {
            return;
        }
    } catch (e) {
    }
    await api.login(config.rss_username, config.rss_password);
}

async function getCategories() {
    await login();
    let all = await api.getCategories();
    let categories = [];
    for (let category of all) {
        if (category.id >= 0) {
            categories.push(category);
        }
    }
    return categories;
}

async function subscribeToFeed(category_id, feed_url) {
    await login();
    return await api.subscribeToFeed({ feed_url: feed_url, category_id: category_id });
}

module.exports = { getCategories, subscribeToFeed }