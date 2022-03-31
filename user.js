const config = require('./config');

let chatIds = {};

function validate(msg) {
    if (msg.chat.username === config.valid_username) {
        chatIds[msg.chat.id] = msg.usename;
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