const { getPageRSSHub } = require('./radar');
async function parseRSSHubLink(url) {
    const feeds = await getPageRSSHub(url);
    const rsshubs = []
    for (let feed of feeds) {
        const url = feed.url;
        rsshubs.push(url.replace('{rsshubDomain}', config.rsshub_domain))
    }
    return rsshubs
}
module.exports = { parseRSSHubLink };