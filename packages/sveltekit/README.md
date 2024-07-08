# Axiom Transport for Winston logger

You can use Winston logger to send logs to Axiom. First, install the winston and @axiomhq/winston packages, then create an instance of the logger with the AxiomTransport.

## Quickstart

Install using `npm install`:

```shell
npm install @axiomhq/sveltekit
```


Create a new API token and add it to your `.env` file, along with the dataset name, e.g:

```shell
AXIOM_TOKEN=your-api-token
AXIOM_DATASET=your-dataset-name
```

Create a new API endpoint in your SvelteKit project, under `/api/axiom/server.js`:

```ts
import type { RequestHandler } from '@sveltejs/kit';

import { AxiomWithoutBatching } from '@axiomhq/js'

import { AXIOM_TOKEN, AXIOM_DATASET } from '$env/static/private';

const axiom = new AxiomWithoutBatching({ token: AXIOM_TOKEN });

export const POST: RequestHandler = async ({ request }) => {
    
    const events = await request.json()
    axiom.ingest(AXIOM_DATASET, events)

    return new Response("OK");
}
```

## Server Hook

Create a `server.hooks.ts` file in your SvelteKit project if you don't have one already, and wrap your handler function inside `withAxiom()`, e.g:

```ts
import type { Handle } from '@sveltejs/kit';

import { resolveRuntime, withAxiom, Logger } from '@axiomhq/sveltekit';

import { AXIOM_TOKEN, AXIOM_DATASET, AXIOM_URL } from '$env/static/private';
import { dev, browser, version } from '$app/environment'


const logger = new Logger({
	dataset: AXIOM_DATASET,
	token: AXIOM_TOKEN,
	url: AXIOM_URL,
	runtime: resolveRuntime(),
	args: { dev, browser, version }
});


export const handle: Handle = withAxiom(logger, async ({ event, resolve }) => {
	return resolve(event);
})
```

### Handling server errors

The server hook could be extended to capture errors and send them using the same logger. export `handleError` function from the `hooks.server.ts` by appending the following towards the end of the file:

```ts
export const handleError: HandleServerError = async  ({ error, event, status, message }) => {
	
	const url = new URL(event.request.url);
	logger.error(`${message}`, {
		exception: error, request: {
			host: url.hostname,
			path: url.pathname,
			method: event.request.method,
			status: status
		},
		source: 'hooks',
	});

	await logger.flush()

	return { message }
}
```


## Client Hook


This follows the same concepts as the server hook, but for the client side. Create a `hooks.client.ts` file in your SvelteKit project, and wrap your handler function inside `withAxiom()`, e.g:

```ts
import type { HandleClientError } from '@sveltejs/kit';

import { Logger }  from '@axiomhq/sveltekit';

import { dev, browser, version } from '$app/environment'


const logger = new Logger({
	args: { dev, browser, version }
});


export const handleError: HandleClientError = async ({ error, event, status, message }) => {
	
	const url = new URL(event.url);
	
	logger.error(`${message}`, {
		exception: error, request: {
			host: url.hostname,
			path: url.pathname,
			status: status
		},
		source: 'hooks',
	});

	await logger.flush()

	return { message }
}
```

For further examples, head over to the [examples](../../examples/winston/) directory.

## License

Distributed under the [MIT License](../../LICENSE).
