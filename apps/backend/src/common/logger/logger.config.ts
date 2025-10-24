import * as winston from 'winston';

// Define log format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, context, stack, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = `\n${JSON.stringify(meta, null, 2)}`;
    }

    const contextStr = context ? ` [${context}]` : '';
    const stackStr = stack ? `\n${stack}` : '';

    return `[${timestamp}] [${level.toUpperCase()}]${contextStr}: ${message}${metaStr}${stackStr}`;
  }),
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export const getWinstonConfig = (env: string): winston.LoggerOptions => {
  const isDevelopment = env === 'development';

  return {
    level: isDevelopment ? 'debug' : 'warn',
    defaultMeta: { service: 'open-short-url' },
    transports: [
      // Console transport - all environments (development colored, production JSON)
      new winston.transports.Console({
        format: isDevelopment
          ? winston.format.combine(
              winston.format.colorize(),
              customFormat,
            )
          : jsonFormat,
      }),
    ],
  };
};

export const loggerConfig = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
