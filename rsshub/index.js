const got = require('../utils/got');
const logger = require('../utils/logger');
const config = require('../config')
const { getPageRSSHub: rssaidGet } = require('./rule-driver/rssaid');
const { getPageRSSHub: radarGet } = require('./rule-driver/radar');
const { getRules } = require("./rules");

async function getPageRSSHub(data) {
    if (config.rsshub_parser === 'radar') {
        return await radarGet({
            url: data.url,
            html: data.html,
            rules: data.rules
        });
    }
    return JSON.parse(await rssaidGet({
        url: data.url,
        host: data.host,
        path: data.pathname,
        html: data.html,
        rules: data.rules
    }));
}

async function getRSSHubLink(url) {
    const { host, pathname } = new URL(url);
    const rules = await getRules();
    let html;
    try {
        const response = await got(url);
        html = response.body;
    } catch (e) {
        logger.warn(`Cannot get html from ${url}`);
    }
    const feeds = await getPageRSSHub(
        { url, host, pathname, html, rules }
    );
    for (let feed of feeds) {
        feed.url = feed.url.replace('{rsshubDomain}', config.rsshub_domain);
    }
    return feeds
}

module.exports = { getRSSHubLink };