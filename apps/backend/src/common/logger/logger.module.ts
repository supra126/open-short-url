import { Global, Module } from '@nestjs/common';
import * as winston from 'winston';
import { LoggerService } from './logger.service';
import { getWinstonConfig } from './logger.config';

@Global()
@Module({
  providers: [
    {
      provide: 'WINSTON_LOGGER',
      useFactory: () => {
        const logger = winston.createLogger(
          getWinstonConfig(process.env.NODE_ENV || 'development'),
        );
        return logger;
      },
    },
    {
      provide: LoggerService,
      useFactory: (winstonLogger: winston.Logger) => {
        return new LoggerService(winstonLogger);
      },
      inject: ['WINSTON_LOGGER'],
    },
  ],
  exports: [LoggerService, 'WINSTON_LOGGER'],
})
export class LoggerModule {}
