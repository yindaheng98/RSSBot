const fs = require('fs');
const path = require('path');
const logger = require("./utils/logger");
const config = require('./config');

let chatIds = {};

fs.mkdirSync(path.dirname(config.user_db_path), { recursive: true });
try {
    chatIds = JSON.parse(fs.readFileSync(config.user_db_path));
} catch (e) {
    logger.warn("Cannot read user database", e);
}

function write() {
    return fs.writeFile(config.user_db_path, JSON.stringify(chatIds), (err) => {
        if (err) logger.warn("Cannot write user database", err);
    });
}

function validate(msg) {
    if (msg.chat.username === config.valid_username) {
        chatIds[msg.chat.id] = msg.chat.username;
        write();
        return msg.chat.id;
    }
    return false;
}

function getChatIds() {
    let ids = [];
    for (let id in chatIds) {
        ids.push(id);
    }
    return ids;
}

module.exports = { validate, getChatIds };