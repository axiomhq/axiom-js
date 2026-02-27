import { createMiddleware, createStart } from '@tanstack/react-start'
import {
  createAxiomStartFunctionMiddleware,
  createAxiomStartRequestMiddleware,
} from '@axiomhq/tanstack-start/start'
import { startLogger } from './lib/logger'

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createAxiomStartRequestMiddleware(createMiddleware, startLogger),
  ],
  functionMiddleware: [
    createAxiomStartFunctionMiddleware(createMiddleware, startLogger, {
      correlation: true,
    }),
  ],
}))
