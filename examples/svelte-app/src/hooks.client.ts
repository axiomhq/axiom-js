import type { HandleClientError } from '@sveltejs/kit';

import { Logger }  from '@axiomhq/sveltekit';

import { dev, browser, version } from '$app/environment'


const logger = new Logger({
	args: { dev, browser, version }
});


export const handleError: HandleClientError = async ({ error, event, status, message }) => {
	
	const url = new URL(event.url);
	console.log({ url })
	logger.error(`${message}`, {
		exception: error, request: {
			host: url.hostname,
			path: url.pathname,
			status: status
		},
		source: 'hooks-client',
	});

	await logger.flush()

	return { message }
}