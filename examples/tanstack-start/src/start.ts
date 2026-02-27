import { createMiddleware, createStart } from '@tanstack/react-start'
import {
  createAxiomMiddleware,
  createAxiomRequestMiddleware,
} from '@axiomhq/tanstack-start'
import { startLogger } from './lib/logger'

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createAxiomRequestMiddleware(createMiddleware, startLogger),
  ],
  functionMiddleware: [
    createAxiomMiddleware(createMiddleware, startLogger, {
      correlation: true,
    }),
  ],
}))
