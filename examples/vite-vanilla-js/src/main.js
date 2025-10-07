import { Logger, ConsoleTransport } from '@axiomhq/logging';

class CustomTransport {
  log(events) {
    console.log('CustomTransport', events);
  }
}

const logger = new Logger({
  transports: [new ConsoleTransport(), new ConsoleTransport({ prettyPrint: true }), new CustomTransport()],
});

logger.info('Hello World!');
logger.warn('Warning!');
logger.error('Error!');
logger.debug('Debug!');
