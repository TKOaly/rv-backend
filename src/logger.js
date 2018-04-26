const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf, splat } = format;

const logFormat = printf(info => {
    return `${info.timestamp} ${info.level.padEnd(8)}: ${info.message}`;
});

const logger = createLogger({
    transports: [
        new transports.File({
            filename: 'logs/errors.log',
            level: 'error',
            format: combine(timestamp(), splat(), logFormat),
            json: false
        }),
        new transports.File({
            filename: 'logs/combined.log',
            level: 'info',
            format: combine(timestamp(), splat(), logFormat),
            json: false
        })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new transports.Console({
            format: format.combine(splat(), format.simple()),
            colorize: true,
            timestamp: true
        })
    );
}

module.exports = logger;
