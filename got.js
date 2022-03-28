const got = require('got');
const { HttpsProxyAgent } = require('hpagent');
const config = require('./config');
got.extend({
    agent: {
        https: new HttpsProxyAgent({
            proxy: config.proxy
        })
    }
});
module.exports = got;