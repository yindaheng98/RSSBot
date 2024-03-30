const got = require('../utils/got');
const logger = require('../utils/logger');
const config = require('../config')
const { getPageRSSHub } = require('./rsshub');
const { getRules } = require("./rules");

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
    const feeds = getPageRSSHub(
        { url, host, pathname, html, rules }
    );
    for (let feed of feeds) {
        feed.url = feed.url.replace('{rsshubDomain}', config.rsshub_domain);
    }
    return feeds
}

module.exports = { getRSSHubLink };