export const mockFetchResponse = (body: any, statusCode: number = 200, headers = {}) => {
    return jest.fn().mockImplementationOnce(() => {
        return Promise.resolve(new Response(JSON.stringify(body), { status: statusCode, headers }))
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
