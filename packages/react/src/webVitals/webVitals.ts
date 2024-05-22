import { config, Version } from '../config';
import { throttle } from '../shared';

const url = config.getIngestURL();

const throttledSendMetrics = throttle(sendMetrics, 1000);
let collectedMetrics: any[] = [];

export function reportWebVitalsWithPath(metric: any, route: string) {
  collectedMetrics.push({ route, ...metric });
  // if Axiom env vars are not set, do nothing,
  // otherwise devs will get errors on dev environments
  if (!config.isEnvVarsSet()) {
    return;
  }
  throttledSendMetrics();
}

function sendMetrics() {
  const body = JSON.stringify(config.wrapWebVitalsObject(collectedMetrics));
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'User-Agent': 'next-axiom/v' + Version,
  };
  if (config.token) {
    headers['Authorization'] = `Bearer ${config.token}`;
  }
  const reqOptions: RequestInit = { body, method: 'POST', keepalive: true, headers };

  function sendFallback() {
    // Do not leak network errors; does not affect the running app
    fetch(url, reqOptions).catch(console.error);
  }

  sendFallback();

  collectedMetrics = [];
}

