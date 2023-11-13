const config = require('../config')
const logger = require('../utils/logger')
const got = require('../utils/got')
const async = require('async')

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

const feeds = {}
const feed_updates = {}
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

const tobe_subscribe_queue = async.queue((task, callback) => {
    logger.info(`Processing subscription: ${task.category_id} <- ${task.feed_url}`)
    _subscribeToFeed(task.category_id, task.feed_url)
        .then((status) => {
            if (!status.should_retry) {
                callback(null, status)
            } else {
                logger.warn(`TTRSS subscribe error: ${status.err}`)
                tobe_subscribe_queue.push(task, callback)
            }
        })
        .catch((err) => {
            callback(err)
        })
}, config.rss_concurrency)

async function subscribeToFeed(category_id, feed_url) {
    return new Promise((resolve, reject) => {
        tobe_subscribe_queue.push(
            { category_id: category_id, feed_url: feed_url },
            (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
    })
}

async function isSubscribed(feed_url) {
    await login()
    for (let category_id in await getCategories()) {
        for (let feed of await _getFeeds(category_id)) {
            if (feed.feed_url === feed_url) {
                return category_id
            }
        }
    }
}

module.exports = { getCategories, subscribeToFeed, getCategoryTitle, isSubscribed }