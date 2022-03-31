let envs = process.env;
config = {
    proxy: envs.GLOBAL_AGENT_HTTP_PROXY || envs.GLOBAL_AGENT_HTTPS_PROXY || envs.HTTP_PROXY || envs.HTTPS_PROXY,
    radar_url: envs.RADAR_URL || "https://raw.githubusercontent.com/DIYgod/RSSHub/master/assets/radar-rules.js",
    radar_update_interval: parseInt(envs.RADAR_UPDATE_INTERVAL) * 1000 || 3600,
    telegram_bot_token: envs.TELEGRAM_BOT_TOKEN,
    rsshub_domain: envs.RSSHUB_DOMAIN || "https://rsshub.app",
    logger_level: envs.LOGGER_LEVEL || 'info',
    no_logfiles: envs.NO_LOGFILES,
    is_package: envs.IS_PACKAGE,
    rsshub_parser: envs.RSSHUB_PARSER || 'rssaid',
    unsubscribe_check_cron: envs.UNSUB_CHECK_CRON || '30 * * * * *'
}
config.rsshub_domain = config.rsshub_domain.replace(/\/$/, '');
module.exports = config;