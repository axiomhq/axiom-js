![@axiomhq/nextjs: The official Next.js library for Axiom](.github/images/banner-dark.svg#gh-dark-mode-only)
![@axiomhq/nextjs: The official Next.js library for Axiom](.github/images/banner-light.svg#gh-light-mode-only)

<div align="center">

[![build](https://img.shields.io/github/actions/workflow/status/axiomhq/@axiomhq/nextjs/ci.yml?branch=main&ghcache=unused)](https://github.com/axiomhq/@axiomhq/nextjs/actions?query=workflow%3ACI)
[![Latest release](https://img.shields.io/github/release/axiomhq/@axiomhq/nextjs.svg)](https://github.com/axiomhq/@axiomhq/nextjs/releases/latest)
[![License](https://img.shields.io/github/license/axiomhq/@axiomhq/nextjs.svg?color=blue)](https://opensource.org/licenses/MIT)

</div>


## Installation

:info: this documentation is for Nextjs 13 with app directory support, if you are looking for Nextjs 12 support, please check out the [next12-axiom docs](./packages/next12-axiom/README.md).

### Using Vercel Integration

Make sure you have the [Axiom Vercel integration](https://www.axiom.co/vercel) installed. Once it is done, perform the steps below: 

- In your Next.js project, run install `@axiomhq/nextjs` as follows:

```sh
npm install --save @axiomhq/nextjs
```

- In the `next.config.js` file, wrap your Next.js config in `withAxiom` as follows:

```js
const { withAxiom } = require('@axiomhq/nextjs');

module.exports = withAxiom({
  // ... your existing config
});
```

### Using Any Other Platform

Create an API token in [Axiom settings](https://cloud.axiom.co/settings/profile) and export it as `AXIOM_TOKEN`, as well as the Axiom dataset name as `AXIOM_DATASET`. Once it is done, perform the steps below:

- In your Next.js project, run install `@axiomhq/nextjs` as follows:

```sh
npm install --save @axiomhq/nextjs
```

- In the `next.config.js` file, wrap your Next.js config in `withAxiom` as follows:

```js
const { withAxiom } = require('@axiomhq/nextjs');

module.exports = withAxiom({
  // ... your existing config
});
```

## Usage

### Web Vitals

> **Warning**: Web-Vitals are not yet supported in Next.js 13 and above. Please use Next.js 12 or below. We [submitted a patch](https://github.com/vercel/next.js/pull/47319) and as soon as Next.js 13.2.5 is out, we'll add support here.

Go to `app/layout.tsx` and add the following line to import web vitals component:

```js
export { AxiomWebVitals } from '@axiomhq/nextjs';
```

then add the component to your layout:

```js
return (
  <html>
    ...
    <AxiomWebVitals />
    <div>...</div>
  </html>
);
```

> **Note**: WebVitals are only sent from production deployments.

Wrapping your handlers in `withAxiom` will make `req.log` available and log
exceptions:

```ts
import { withAxiom, AxiomRequest } from '@axiomhq/nextjs';

async function handler(req: AxiomRequest) {
  req.log.info('Login function called');

  // You can create intermediate loggers
  const log = req.log.with({ scope: 'user' });
  log.info('User logged in', { userId: 42 });

  res.status(200).text('hi');
}

export default withAxiom(handler);
```

Import and use `useLogger` in the components like this:

```js
import { useLogger } from `@axiomhq/nextjs`;

// pages/index.js
function home() {
    const log = useLogger();
    log.debug('User logged in', { userId: 42 })
    ...
}
```

### Log Levels

The log level defines the lowest level of logs sent to Axiom.
The default is debug, resulting in all logs being sent.
Available levels are (from lowest to highest): `debug`, `info`, `warn`, `error`

For example, if you don't want debug logs to be sent to Axiom:

```sh
export AXIOM_LOG_LEVEL=info
```

You can also disable logging completely by setting the log level to `off`:

```sh
export AXIOM_LOG_LEVEL=off
```


## FAQ

### How can I send logs from Vercel preview deployments?
The Axiom Vercel integration sets up an environment variable called `NEXT_PUBLIC_AXIOM_INGEST_ENDPOINT`, which by default is only enabled for the production environment. To send logs from preview deployments, go to your site settings in Vercel and enable preview deployments for that environment variable.

### How can I extend the logger?
You can use `log.with` to create an intermediate logger, for example:
```ts
const logger = userLogger().with({ userId: 42 })
logger.info("Hi") // will ingest { ..., "message": "Hi", "fields" { "userId": 42 }}
```

## License

Distributed under the [MIT License](LICENSE).
