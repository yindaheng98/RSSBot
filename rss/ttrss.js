const config = require('../config')
const logger = require('../utils/logger')
const got = require('../utils/got')

let sid = undefined
let sid_updates = undefined
async function login() {
    if (sid && Date.now() - sid_updates < config.rss_update_interval) return
    else if (sid) {
        const { content } = await got.post(config.rss_host, {
            json: {
                sid: sid,
                op: 'isLoggedIn'
            }
        }).json()
        if (content.status) return
    }
    const { content } = await got.post(config.rss_host, {
        json: {
            op: 'login',
            user: config.rss_username,
            password: config.rss_password
        }
    }).json()
    sid = content.session_id
    sid_updates = Date.now()
}

let titles = undefined
let titles_updates = undefined
async function getCategories() {
    if (titles && titles_updates && Date.now() - titles_updates < config.rss_update_interval) return titles
    await login()
    const { content } = await got.post(config.rss_host, {
        json: {
            sid: sid,
            op: 'getCategories'
        }
    }).json()
    let _titles = {}
    for (let category of content) {
        if (category.id >= 0) {
            _titles[category.id] = category.title
        }
    }
    titles = _titles
    titles_updates = Date.now()
    return titles
}

async function getCategoryTitle(category_id) {
    await login()
    const titles = await getCategories()
    return titles[category_id]
}

let feeds = {}
let feed_updates = {}
async function _getFeeds(cid) {
    if (feeds[cid] && feed_updates[cid] && Date.now() - feed_updates[cid] < config.rss_update_interval) {
        return feeds[cid]
    }
    const { content } = await got.post(config.rss_host, {
        json: {
            sid: sid,
            op: 'getFeeds',
            categoryId: cid
        }
    }).json()
    feeds[cid] = content
    feed_updates[cid] = Date.now()
    return feeds[cid]
}

async function _subscribeToFeed(category_id, feed_url) {
    await login()
    for (let cid in await getCategories()) {
        for (let feed of await _getFeeds(cid)) {
            if (feed.feed_url === feed_url && '' + category_id !== cid) {
                await got.post(config.rss_host, {
                    json: {
                        sid: sid,
                        op: 'unsubscribeFeed',
                        feed_id: feed.id
                    }
                }).json()
            }
        }
    }
    try {
        const { content } = await got.post(config.rss_host, {
            json: {
                sid: sid,
                op: 'subscribeToFeed',
                feed_url: feed_url,
                category_id: category_id
            }
        }).json()
        if (content.status.code <= 1) {
            return { ok: true }
        }
        return { ok: false, err: JSON.stringify(content.status) }
    } catch (e) {
        return { ok: false, should_retry: true, err: e }
    }
}

async function subscribeToFeed(category_id, feed_url) {
    let status = await _subscribeToFeed(category_id, feed_url)
    while (status.should_retry) {
        logger.warn("TTRSS subscribe error", status.err)
        status = await _subscribeToFeed(category_id, feed_url)
    }
    return status
}

async function isSubscribed(feed_url) {
    try {
        await login()
        const categories = await getCategories()
        for (let category_id in categories) {
            const { content } = await got.post(config.rss_host, {
                json: {
                    sid: sid,
                    op: 'getFeeds',
                    cat_id: category_id
                }
            }).json()
            const feeds = await _getFeeds(category_id)
            for (let feed of feeds) {
                if (feed.feed_url === feed_url) {
                    return category_id
                }
            }
        }
    } catch (e) {
    }
}

module.exports = { getCategories, subscribeToFeed, getCategoryTitle, isSubscribed }