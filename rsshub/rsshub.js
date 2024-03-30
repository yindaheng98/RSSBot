// Generate: npx tsc src/lib/rsshub.ts --target es5
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebsiteRSSHub = exports.getPageRSSHub = void 0;
var route_recognizer_1 = require("route-recognizer");
var tldts_1 = require("tldts");
var rules_1 = require("./rules");
function ruleHandler(rule, params, url, html, success, fail) {
    var run = function () {
        var _a;
        var resultWithParams;
        if (typeof rule.target === "function") {
            try {
                resultWithParams = rule.target(params, url);
            }
            catch (error) {
                resultWithParams = "";
            }
        }
        else if (typeof rule.target === "string") {
            resultWithParams = rule.target;
        }
        if (resultWithParams) {
            // if no :param in resultWithParams, requiredParams will be null
            // in that case, just skip the following steps and return resultWithParams
            var requiredParams = (_a = resultWithParams
                .match(/\/:\w+\??(?=\/|$)/g)) === null || _a === void 0 ? void 0 : _a.map(function (param) { return ({
                name: param.slice(2).replace(/\?$/, ""),
                optional: param.endsWith("?"),
            }); });
            if (!requiredParams) {
                return resultWithParams;
            }
            for (var _i = 0, requiredParams_1 = requiredParams; _i < requiredParams_1.length; _i++) {
                var param = requiredParams_1[_i];
                if (params[param.name]) {
                    // successfully matched
                    var regex = new RegExp("/:".concat(param.name, "\\??(?=/|$)"));
                    resultWithParams = resultWithParams.replace(regex, "/".concat(params[param.name]));
                }
                else if (param.optional) {
                    // missing optional parameter, drop all following parameters, otherwise the route will be invalid
                    var regex = new RegExp("/:".concat(param.name, "\\?(/.*)?$"));
                    resultWithParams = resultWithParams.replace(regex, "");
                    break;
                }
                else {
                    // missing necessary parameter, fail
                    resultWithParams = "";
                    break;
                }
            }
            // bypassing double-check since `:` maybe a part of parameter value
            // if (resultWithParams && resultWithParams.includes(':')) {
            //     // double-check
            //     resultWithParams = '';
            // }
        }
        return resultWithParams;
    };
    var resultWithParams = run();
    if (resultWithParams) {
        success(resultWithParams);
    }
    else {
        fail();
    }
}
function formatBlank(str1, str2) {
    if (str1 && str2) {
        return (str1 +
            (str1[str1.length - 1].match(/[a-zA-Z0-9]/) ||
                str2[0].match(/[a-zA-Z0-9]/)
                ? " "
                : "") +
            str2);
    }
    else {
        return (str1 || "") + (str2 || "");
    }
}
function getPageRSSHub(data) {
    var url = data.url, html = data.html;
    var rules = (0, rules_1.parseRules)(data.rules);
    var parsedDomain;
    try {
        parsedDomain = (0, tldts_1.parse)(new URL(url).hostname);
    }
    catch (error) {
        return [];
    }
    if (parsedDomain && parsedDomain.domain) {
        var subdomain = parsedDomain.subdomain;
        var domain_1 = parsedDomain.domain;
        if (rules[domain_1]) {
            var rule_1 = rules[domain_1][subdomain || "."];
            if (!rule_1) {
                if (subdomain === "www") {
                    rule_1 = rules[domain_1]["."];
                }
                else if (!subdomain) {
                    rule_1 = rules[domain_1].www;
                }
            }
            if (rule_1) {
                var recognized_1 = [];
                rule_1.forEach(function (ru, index) {
                    var oriSources = Object.prototype.toString.call(ru.source) === "[object Array]"
                        ? ru.source
                        : typeof ru.source === "string"
                            ? [ru.source]
                            : [];
                    var sources = [];
                    // route-recognizer do not support optional segments or partial matching
                    // thus, we need to manually handle it
                    // allowing partial matching is necessary, since many rule authors did not mark optional segments
                    oriSources.forEach(function (source) {
                        // trimming `?` is necessary, since route-recognizer considers it as a part of segment
                        source = source.replace(/(\/:\w+)\?(?=\/|$)/g, "$1");
                        sources.push(source);
                        var tailMatch;
                        do {
                            tailMatch = source.match(/\/:\w+$/);
                            if (tailMatch) {
                                var tail = tailMatch[0];
                                source = source.slice(0, source.length - tail.length);
                                sources.push(source);
                            }
                        } while (tailMatch);
                    });
                    // deduplicate (some rule authors may already have done similar job)
                    sources = sources.filter(function (item, index) { return sources.indexOf(item) === index; });
                    // match!
                    sources.forEach(function (source) {
                        var router = new route_recognizer_1();
                        router.add([
                            {
                                path: source,
                                handler: index,
                            },
                        ]);
                        var result = router.recognize(new URL(url).pathname.replace(/\/$/, ""));
                        if (result && result[0]) {
                            recognized_1.push(result[0]);
                        }
                    });
                });
                var result_1 = [];
                Promise.all(recognized_1.map(function (recog) {
                    return new Promise(function (resolve) {
                        ruleHandler(rule_1[recog.handler], recog.params, url, html, function (parsed) {
                            if (parsed) {
                                result_1.push({
                                    title: formatBlank(rules[domain_1]._name ? "Current" : "", rule_1[recog.handler].title),
                                    url: "{rsshubDomain}" + parsed,
                                    path: parsed,
                                });
                            }
                            else {
                                result_1.push({
                                    title: formatBlank(rules[domain_1]._name ? "Current" : "", rule_1[recog.handler].title),
                                    url: rule_1[recog.handler].docs,
                                    isDocs: true,
                                });
                            }
                            resolve();
                        }, function () {
                            resolve();
                        });
                    });
                }));
                return result_1;
            }
            else {
                return [];
            }
        }
        else {
            return [];
        }
    }
    else {
        return [];
    }
}
exports.getPageRSSHub = getPageRSSHub;
function getWebsiteRSSHub(data) {
    var url = data.url;
    var rules = (0, rules_1.parseRules)(data.rules);
    var parsedDomain;
    try {
        parsedDomain = (0, tldts_1.parse)(new URL(url).hostname);
    }
    catch (error) {
        return [];
    }
    if (parsedDomain && parsedDomain.domain) {
        var domain_2 = parsedDomain.domain;
        if (rules[domain_2]) {
            var domainRules = [];
            for (var subdomainRules in rules[domain_2]) {
                if (subdomainRules[0] !== "_") {
                    domainRules.push.apply(domainRules, rules[domain_2][subdomainRules]);
                }
            }
            return domainRules.map(function (rule) {
                return ({
                    title: formatBlank(rules[domain_2]._name, rule.title),
                    url: rule.docs,
                    isDocs: true,
                });
            });
        }
        else {
            return [];
        }
    }
    else {
        return [];
    }
}
exports.getWebsiteRSSHub = getWebsiteRSSHub;
