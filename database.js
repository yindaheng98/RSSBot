const fs = require('fs');
const path = require('path');
const logger = require("./utils/logger");
const config = require("./config");

let db = {}; //主数据库
let index = {}; //索引

fs.mkdirSync(path.dirname(config.unsubscribe_db_path), { recursive: true });
try {
    db = JSON.parse(fs.readFileSync(config.unsubscribe_db_path));
} catch (e) {
    logger.warn("Cannot read database", e);
}

function write() {
    return fs.writeFile(config.unsubscribe_db_path, JSON.stringify(db), (err) => {
        if (err) logger.warn("Cannot write database", err);
    });
}


function putFeedToUrl(url, feed) {
    if (typeof db[url] !== 'object') { //如果没有记录这个url
        db[url] = {}; //就创建
    }
    db[url][feed.url] = feed; //在这个URL下加入feed
    index[feed.url] = url; //并加索引
    write();
}

function delUrlByFeedurl(feedurl) {
    const url = index[feedurl] //索引里查url
    if (url) { //如果存在
        const feeds = db[url]; //就读取它的feed列表
        if (typeof feeds === 'object') { //如果feed列表存在
            for (let furl in feeds) {
                delete index[furl]; //就逐个删除索引
            }
        }
        delete db[url]; //最后删除数据库
    }
    write();
}

function delUrl(url) {
    delete db[url]; //删除数据库
    write();
}

function getAllUrl() {
    let urls = [];
    for (let url in db) {
        urls.push(url);
    }
    return urls
}

module.exports = { putFeedToUrl, delUrlByFeedurl, delUrl, getAllUrl }