import { AXIOM_TOKEN, AXIOM_DATASET, AXIOM_URL } from '$env/static/private';
import { resolveRuntime, withAxiom, Logger } from '@axiomhq/svelte';
import { dev, browser, version } from '$app/environment'
import type { Handle } from '@sveltejs/kit';


console.log({ token: AXIOM_TOKEN, dataset: AXIOM_DATASET, url: AXIOM_URL })
const logger = new Logger({ token: AXIOM_TOKEN, dataset: AXIOM_DATASET, url: AXIOM_URL }, { runtime: resolveRuntime(), dev, browser, version });


// /** @type {import('@sveltejs/kit').Handle} */
export const handle: Handle = withAxiom(logger, async ({ event, resolve }) => {
	console.log('hooked')
	return resolve(event);
})


export async function handleError({ error, event, status, message }) {
	// console.error({ error, status, message })
	const url = new URL(event.request.url);
	logger.error(`${message}`, {
		exception: error, request: {
			host: url.hostname,
			path: url.pathname,
			method: event.request.method,
			status: status
		},
		source: 'hooks',
		dev,
		version,
		browser,
	});

	await logger.flush()

	return { message }
}