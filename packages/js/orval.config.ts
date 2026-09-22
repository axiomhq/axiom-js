export default {
  v2: {
    input: {
      target: './openapi/.cache/v2.json',
    },
    output: {
      target: './src/generated/v2/client.ts',
      client: 'fetch',
      mode: 'tags-split',
      clean: true,
      override: {
        fetch: {
          forceSuccessResponse: true,
          includeHttpResponseReturnType: false,
        },
        mutator: {
          path: './src/openapiRequest.ts',
          name: 'openapiRequest',
        },
      },
    },
  },
};
