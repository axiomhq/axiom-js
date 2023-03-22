# Axiom Kit

Axiom Kit is a collection of utilities to help build integrations and custom loggers to ship logs 
to axiom.

The function `createLogger()` is used to create an instance of the logger with automatic
configuration based on the runtime and environment variable.

```ts
import { createLogger } from '@axiomhq/kit';

const logger = createLogger();

logger.info('hello, world!')
```
