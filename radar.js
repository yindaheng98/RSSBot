const got = require('got');
const { HttpsProxyAgent } = require('hpagent');
const psl = require('psl');
const RouteRecognizer = require('route-recognizer');
const config = require('./config');

let rules;
let last_update;

async function getRules() {
    if (rules && last_update && (Date.now() - last_update) < config.radar_update_interval)
        return rules;
    const response = await got(
        {
            method: 'get',
            url: config.radar_url,
            agent: {
                https: new HttpsProxyAgent({
                    proxy: config.proxy
                })
            }
        }
    )
    rules = eval(response.body);
    last_update = Date.now();
    return rules;
}

function ruleHandler(rule, params, url, success, fail) {
    const run = () => {
        let reaultWithParams;
        if (typeof rule.target === 'function') {
            try {
                reaultWithParams = rule.target(params, url);
            } catch (error) {
                console.warn(error);
                reaultWithParams = '';
            }
        } else if (typeof rule.target === 'string') {
            reaultWithParams = rule.target;
        }

        if (reaultWithParams) {
            for (const param in params) {
                reaultWithParams = reaultWithParams.replace(`/:${param}`, `/${params[param]}`);
            }
        }

        return reaultWithParams;
    };
    const reaultWithParams = run();
    if (reaultWithParams && (!rule.verification || rule.verification(params))) {
        success(reaultWithParams);
    } else {
        fail();
    }
}

function formatBlank(str1, str2) {
    if (str1 && str2) {
        return str1 + (str1[str1.length - 1].match(/[a-zA-Z0-9]/) || str2[0].match(/[a-zA-Z0-9]/) ? ' ' : '') + str2;
    } else {
        return (str1 || '') + (str2 || '');
    }
}
async function getPageRSSHub(url) {
    const rules = await getRules();

    const parsedDomain = psl.parse(new URL(url).hostname);
    if (parsedDomain && parsedDomain.domain) {
        const subdomain = parsedDomain.subdomain;
        const domain = parsedDomain.domain;
        if (rules[domain]) {
            let rule = rules[domain][subdomain || '.'];
            if (!rule) {
                if (subdomain === 'www') {
                    rule = rules[domain]['.'];
                } else if (!subdomain) {
                    rule = rules[domain].www;
                }
            }
            if (rule) {
                const recognized = [];
                rule.forEach((ru, index) => {
                    if (ru.source !== undefined) {
                        if (Object.prototype.toString.call(ru.source) === '[object Array]') {
                            ru.source.forEach((source) => {
                                const router = new RouteRecognizer();
                                router.add([
                                    {
                                        path: source,
                                        handler: index,
                                    },
                                ]);
                                const result = router.recognize(new URL(url).pathname.replace(/\/$/, ''));
                                if (result && result[0]) {
                                    recognized.push(result[0]);
                                }
                            });
                        } else if (typeof ru.source === 'string') {
                            const router = new RouteRecognizer();
                            router.add([
                                {
                                    path: ru.source,
                                    handler: index,
                                },
                            ]);
                            const result = router.recognize(new URL(url).pathname.replace(/\/$/, ''));
                            if (result && result[0]) {
                                recognized.push(result[0]);
                            }
                        }
                    }
                });
                const result = [];
                Promise.all(
                    recognized.map(
                        (recog) =>
                            new Promise((resolve) => {
                                ruleHandler(
                                    rule[recog.handler],
                                    recog.params,
                                    url,
                                    (parsed) => {
                                        if (parsed) {
                                            result.push({
                                                title: formatBlank(rules[domain]._name ? '当前' : '', rule[recog.handler].title),
                                                url: '{rsshubDomain}' + parsed,
                                                path: parsed,
                                            });
                                        } else {
                                            result.push({
                                                title: formatBlank(rules[domain]._name ? '当前' : '', rule[recog.handler].title),
                                                url: rule[recog.handler].docs,
                                                isDocs: true,
                                            });
                                        }
                                        resolve();
                                    },
                                    () => {
                                        resolve();
                                    }
                                );
                            })
                    )
                );
                return result;
            } else {
                return [];
            }
        } else {
            return [];
        }
    } else {
        return [];
    }
}

module.exports = { getPageRSSHub };