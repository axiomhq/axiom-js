import { GenericAdapter } from './adapters/generic-adapter';
import { NetlifyAdapter } from './adapters/netlify-adapter';
import { VercelAdapter } from './adapters/vercel-adapter';
import { Adapter } from './logging/adapter';
import { LoggerConfig, LoggingSource } from './logging/config';
import { Logger } from './logging/logger';
import { Transport } from './logging/transport';
import { enableLogDrain, isBrowser, isEdge, isNetlify, isVercel } from './platform';
import { ConsoleTransport } from './transports/console.transport';
import { FetchTransport } from './transports/fetch.transport';
import { LogDrainTransport } from './transports/log-drain.transport';

/* createLogger auto detects platform and adapters based on its environment
 surroundings and creates a logger that matches those.
*/
export function createLogger(args: { [key: string]: any } = {}, isWebVitals = false): Logger {
  // detect platform node/edge/browser
  let source: LoggingSource = LoggingSource.browser;
  if (isBrowser()) {
    source = LoggingSource.browser;
  } else if (isEdge()) {
    source = LoggingSource.edge;
  } else {
    source = LoggingSource.lambda;
  }
  // detect environment provider, and instantiate adapter
  // if no environment was detected, fallback to generic environment.
  let adapter;
  if (isVercel()) {
    adapter = new VercelAdapter(source, isWebVitals);
  } else if (isNetlify()) {
    adapter = new NetlifyAdapter(source);
  } else {
    adapter = new GenericAdapter(source);
  }
  const transport = getTransport(adapter, source);

  // prepare logger config and return logger instance
  const loggerConfig: LoggerConfig = {
    source,
    args,
    adapter,
    transport,
  };

  return new Logger(loggerConfig);
}

export function getTransport(adapter: Adapter, source: LoggingSource): Transport {
  // build a transport based on the detected source
  let transport: Transport;
  // if env vars are not set, fallback to console transport
  if (!adapter.isEnvVarsSet()) {
    transport = new ConsoleTransport();
  } else {
    switch (source) {
      case LoggingSource.browser:
        transport = new FetchTransport(adapter.getIngestEndpoint());
        break;
      case (LoggingSource.edge, LoggingSource.lambda):
        if (enableLogDrain) {
          transport = new LogDrainTransport();
        } else {
          transport = new FetchTransport();
        }
        break;
      default:
        transport = new FetchTransport();
        break;
    }
  }

  return transport;
}
