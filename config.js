let envs = process.env;
module.exports = {
    proxy: envs.HTTP_PROXY || envs.HTTPS_PROXY, // 请求失败重试次数
    radar_url: envs.RADAR_URL || "https://raw.githubusercontent.com/DIYgod/RSSHub/master/assets/radar-rules.js",
    radar_update_interval: parseInt(envs.RADAR_UPDATE_INTERVAL) * 1000 || 3600
}