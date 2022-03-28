const { resolve } = require('path');
const winston = require('winston');
const config = require('@/config');

let transports = [];
if (!config.no_logfiles) {
    transports = [
        new winston.transports.File({
            filename: resolve('logs/error.log'),
            level: 'error',
        }),
        new winston.transports.File({ filename: resolve('logs/combined.log') }),
    ];
}
const logger = winston.createLogger({
    level: config.logger_level,
    format: winston.format.json(),
    transports,
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (!config.is_package) {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
            silent: process.env.NODE_ENV === 'test',
        })
    );
}

module.exports = logger;
