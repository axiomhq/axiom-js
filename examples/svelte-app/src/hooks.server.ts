import type { Handle, HandleServerError } from '@sveltejs/kit';

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