import winston from 'winston';
import { WinstonTransport as AxiomTransport } from '@axiomhq/axiom-js';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        // You can pass an option here, if you don't the transport is configured
        // using environment variables like `AXIOM_DATASET` and `AXIOM_TOKEN`
        new AxiomTransport(),
    ],
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
    message: 'Logger successfuly setup',
});
