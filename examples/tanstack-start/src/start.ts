import { createMiddleware, createStart } from '@tanstack/react-start'
import {
  createAxiomFnMiddleware,
  createAxiomRequestMiddleware,
} from '@axiomhq/tanstack-start'
import { startLogger } from './lib/logger'

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createAxiomRequestMiddleware(createMiddleware, startLogger),
  ],
  functionMiddleware: [
    createAxiomFnMiddleware(createMiddleware, startLogger, {
      correlation: true,
    }),
  ],
}))
