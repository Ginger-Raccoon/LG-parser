const { createLogger, format, transports } = require('winston');
// можно будет настроить потом как нужно
const monitorsLogsOutputFormat = format.combine(
    format.printf((i) => `${i.level}: ${i.message}`)
);

const serverLogger = createLogger({
    format: format.combine(
        format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
        format.align(),
        format.printf((i) => `${i.level}: ${[i.timestamp]}: ${i.message}`)
    ),
    transports: [
        new transports.File({
            filename: 'logs/info.log',
            level: 'info',
            format: format.combine(
                format.printf((i) =>
                    i.level === 'info' ? `${i.level}: ${i.timestamp} ${i.message}` : ''
                )
            ),
        }),
        new transports.File({
            filename: 'logs/errors.log',
            level: 'error',
        }),
    ],
});

const monitorsLogger = createLogger({
    transports: [
        new transports.File({
            filename: 'logs/monitors.log',
            format: monitorsLogsOutputFormat,
        }),
    ],
});

module.exports = {
    serverLogger: serverLogger,
    monitorsLogger: monitorsLogger,
};