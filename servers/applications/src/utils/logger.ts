import winston from 'winston';
import fs from 'fs';

const logsDir = __dirname + '/../../logs';
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

const logFormat = winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`); 

const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(winston.format.splat(), winston.format.colorize()),
});

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        logFormat,
    ),
    transports : [
        new winston.transports.File({
            filename: 'error.log',
            dirname: logsDir + "/error",
            level: 'error'
        }),
        new winston.transports.File({
            filename: 'combined.log',
            dirname: logsDir + "/debug",
        }),
    ]
});


if (process.env.NODE_ENV === 'local') {
    logger.add(consoleTransport);
}

export { logger };
