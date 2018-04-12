const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const logFormat = printf(info => {
    return `${info.timestamp} [${info.label} (${process.env.NODE_ENV})] ${
        info.level
    }: ${info.message}`;
});

const logger = createLogger({
    transports: [
        new transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: combine(
                label({ label: 'rv-backend' }),
                timestamp(),
                logFormat
            ),
            json: false
        }),
        new transports.File({
            filename: 'logs/rv.log',
            format: combine(
                label({ label: 'rv-backend' }),
                timestamp(),
                logFormat
            ),
            json: false
        })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new transports.Console({
            format: format.simple(),
            colorize: true,
            timestamp: true
        })
    );
}

module.exports = logger;
