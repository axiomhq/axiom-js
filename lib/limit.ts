import { AxiosResponse } from "axios";

export const headerRateScope     = "X-RateLimit-Scope"

export const headerRateLimit     = "X-RateLimit-Limit"
export const headerRateRemaining = "X-RateLimit-Remaining"
export const headerRateReset     = "X-RateLimit-Reset"

export const headerQueryLimit     = "X-QueryLimit-Limit"
export const headerQueryRemaining = "X-QueryLimit-Remaining"
export const headerQueryReset     = "X-QueryLimit-Reset"

export const headerIngestLimit     = "X-IngestLimit-Limit"
export const headerIngestRemaining = "X-IngestLimit-Remaining"
export const headerIngestReset     = "X-IngestLimit-Reset"

export enum LimitScope {
    unknown = "unknown",
    user = "user",
    organization = "organization",
    anonymous = "anonymous",
}
export enum LimitType {
    rate = "rate",
    query = "query",
    ingest = "ingest",
}

export class Limit {
    constructor(
        public scope: LimitScope,
        public type: LimitType,
        public value: number,
        public remaining: number,
        public reset: number,
    ) {}
}

// parse limit headers from axios response and return a limit object
export function parseLimitFromResponse(response: AxiosResponse): Limit {
    let limit: Limit;

    if (response.config.url?.endsWith("/ingest")) {
		limit = parseLimitFromHeaders(response, "", headerIngestLimit, headerIngestRemaining, headerIngestReset)
		limit.type = LimitType.ingest
	} else if (response.config.url?.endsWith("/query") || response.config.url?.endsWith("/_apl")) {
		limit = parseLimitFromHeaders(response, "", headerQueryLimit, headerQueryRemaining, headerQueryReset)
		limit.type = LimitType.query
	} else {
		limit = parseLimitFromHeaders(response, headerRateScope, headerRateLimit, headerRateRemaining, headerRateReset)
		limit.type = LimitType.rate
	}

    return limit;
}

// parseLimitFromHeaders parses the named headers from a `*http.Response`.
function parseLimitFromHeaders(response: AxiosResponse, headerScope: string, headerLimit: string, headerRemaining: string, headerReset: string): Limit {
	let limit: Limit = {
        scope: LimitScope.anonymous,
        type: LimitType.rate,
        value: 0,
        remaining: 0,
        reset: 0,
    }

    const scope: string = response.headers[headerScope.toLowerCase()] || LimitScope.anonymous;
    limit.scope = LimitScope[scope as keyof typeof LimitScope];
    
    const limitValue = response.headers[headerLimit.toLowerCase()];
    const limitValueNumber = parseInt(limitValue, 10);
    if (!isNaN(limitValueNumber)) {
        limit.value = limitValueNumber
    }
    
    const remainingValue = response.headers[headerRemaining.toLowerCase()];
    const remainingValueNumber = parseInt(remainingValue, 10);
    if (!isNaN(remainingValueNumber)) {
        limit.remaining = remainingValueNumber
    }


    const resetValue = response.headers[headerReset.toLowerCase()];
    const resetValueInt = parseInt(resetValue, 10);
    if(!isNaN(resetValueInt)) {
        limit.reset = resetValueInt;
    }

	return limit
}