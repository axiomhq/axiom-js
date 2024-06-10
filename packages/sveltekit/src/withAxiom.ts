import type { Handle } from '@sveltejs/kit';
import { Logger } from './node';

export function withAxiom(logger: Logger, handler: Handle): Handle {

    return async (context: any) => {
        const startTime = new Date();
        const { event } = context;
        const response = await handler(context);
        const endTime = new Date();
        const durationMs = endTime.getTime() - startTime.getTime()


        const url = new URL(event.request.url);
        logger.info(`[${event.request.method}] ${event.request.url} ${response.status} ${durationMs}ms`, {
            request: {
                method: event.request.method,
                path: url.pathname,
                host: url.hostname,
                status: response.status,
                durationMs: durationMs,
            },
            source: 'hooks'
        });

        await logger.flush();
        return response;
    };
}
