import { AxiosResponse } from 'axios';

export const headerRateScope = 'X-RateLimit-Scope';

export const headerAPILimit = 'X-RateLimit-Limit';
export const headerAPIRateRemaining = 'X-RateLimit-Remaining';
export const headerAPIRateReset = 'X-RateLimit-Reset';

export const headerQueryLimit = 'X-QueryLimit-Limit';
export const headerQueryRemaining = 'X-QueryLimit-Remaining';
export const headerQueryReset = 'X-QueryLimit-Reset';

export const headerIngestLimit = 'X-IngestLimit-Limit';
export const headerIngestRemaining = 'X-IngestLimit-Remaining';
export const headerIngestReset = 'X-IngestLimit-Reset';

export enum LimitScope {
    unknown = 'unknown',
    user = 'user',
    organization = 'organization',
    anonymous = 'anonymous',
}
export enum LimitType {
    api = 'api',
    query = 'query',
    ingest = 'ingest',
}

export class Limit {
    constructor(
        public scope: LimitScope = LimitScope.unknown,
        public type: LimitType = LimitType.api,
        public value: number = 0,
        public remaining: number = -1,
        public reset: Date = new Date(),
    ) {}
}

// parse limit headers from axios response and return a limit object
export function parseLimitFromResponse(response: AxiosResponse): Limit {
    let limit: Limit;

    if (response.config.url?.endsWith('/ingest')) {
        limit = parseLimitFromHeaders(response, '', headerIngestLimit, headerIngestRemaining, headerIngestReset);
        limit.type = LimitType.ingest;
    } else if (response.config.url?.endsWith('/query') || response.config.url?.endsWith('/_apl')) {
        limit = parseLimitFromHeaders(response, '', headerQueryLimit, headerQueryRemaining, headerQueryReset);
        limit.type = LimitType.query;
    } else {
        limit = parseLimitFromHeaders(
            response,
            headerRateScope,
            headerAPILimit,
            headerAPIRateRemaining,
            headerAPIRateReset,
        );
        limit.type = LimitType.api;
    }

    return limit;
}

export const limitKey = (type: LimitType, scope: LimitScope): string => `${type}:${scope}`;

// parseLimitFromHeaders parses the named headers from a `*http.Response`.
function parseLimitFromHeaders(
    response: AxiosResponse,
    headerScope: string,
    headerLimit: string,
    headerRemaining: string,
    headerReset: string,
): Limit {
    let limit: Limit = new Limit();

    const scope: string = response.headers[headerScope.toLowerCase()] || LimitScope.unknown;
    limit.scope = LimitScope[scope as keyof typeof LimitScope];

    const limitValue = response.headers[headerLimit.toLowerCase()] || '';
    const limitValueNumber = parseInt(limitValue, 10);
    if (!isNaN(limitValueNumber)) {
        limit.value = limitValueNumber;
    }

    const remainingValue = response.headers[headerRemaining.toLowerCase()] || '';
    const remainingValueNumber = parseInt(remainingValue, 10);
    if (!isNaN(remainingValueNumber)) {
        limit.remaining = remainingValueNumber;
    }

    const resetValue = response.headers[headerReset.toLowerCase()] || '';
    const resetValueInt = parseInt(resetValue, 10);
    if (!isNaN(resetValueInt)) {
        limit.reset = new Date(resetValueInt * 1000);
    }

    return limit;
}
