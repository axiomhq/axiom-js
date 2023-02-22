export const mockFetchResponse = (body: any, statusCode: number = 200, headers = {}) => {
    return jest.fn().mockImplementationOnce(() => {
        return Promise.resolve(new Response(JSON.stringify(body), { status: statusCode, headers }))
    })
}

interface mockArgs {
    body: any;
    status: number;
    headers: HeadersInit,
}

export const mockFetchResponses = (args: mockArgs[]) => {
    let calls = 0
    return jest.fn().mockImplementation(() => {
        for(let i = 0; i < args.length; i++) {
            const { body, status, headers } = args[i]
            calls++
            return Promise.resolve(new Response(JSON.stringify(body), { status: status, headers }))
        }
    })
}

export const mockFetchResponseError = (body: any, statusCode: number = 500, headers = {}) => {
    return jest.fn().mockImplementationOnce(() => {
        return Promise.reject(new Response(JSON.stringify(body), { status: statusCode, headers }))
    })
}

export const testMockedFetchCall = (test: any, body: any, statusCode: number = 200, headers = {}) => {
    return jest.fn().mockImplementationOnce((url, init) => {
        test(url, init)
        return Promise.resolve(new Response(JSON.stringify(body), { status: statusCode, headers }))
    })
}

export const mockNoContentResponse = () => {
    return jest.fn().mockImplementationOnce(() => {
        return Promise.resolve(new Response(null, { status: 204, statusText: 'No Content'}))
    })
}
