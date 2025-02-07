import { Logger, AxiomFetchTransport, ConsoleTransport } from '@axiomhq/logging';
import {
  createAxiomRouteHandler,
  getLogLevelFromStatusCode,
  serverContextFieldsFormatter,
  transformRouteHandlerErrorResult,
} from '@axiomhq/nextjs';

export const logger = new Logger({
  transports: [
    new AxiomFetchTransport({
      dataset: process.env.AXIOM_DATASET!,
      token: process.env.AXIOM_TOKEN!,
    }),
    new ConsoleTransport({ prettyPrint: true }),
  ],
  formatters: [serverContextFieldsFormatter],
});

export const withAxiom = createAxiomRouteHandler({
  logger,
  onError: (error) => {
    if (error.error instanceof Error) {
      logger.error(error.error.message, error.error);
    }
    const [message, report] = transformRouteHandlerErrorResult(error);
    logger.log(getLogLevelFromStatusCode(report.statusCode), message, report);
    logger.flush();
  },
});
