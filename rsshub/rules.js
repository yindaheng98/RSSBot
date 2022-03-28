const got = require('../utils/got');
const config = require('../config');

let rules;
let last_update;

async function getRules() {
    if (rules && last_update && (Date.now() - last_update) < config.radar_update_interval)
        return rules;
    const response = await got(
        {
            method: 'get',
            url: config.radar_url
        }
    )
    rules = eval(response.body);
    last_update = Date.now();
    return rules;
}

module.exports = { getRules }