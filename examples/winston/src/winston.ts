import winston from 'winston';
import { WinstonTransport as AxiomTransport } from '@axiomhq/winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [new AxiomTransport({ token: process.env.AXIOM_TOKEN || '', dataset: process.env.AXIOM_DATASET })],
});

// Add the console logger if we're not in production
if (process.env.NODE_ENV != 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

logger.log({
  level: 'info',
  message: 'Logger successfully setup',
});
