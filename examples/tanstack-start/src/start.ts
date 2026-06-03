import { createStart } from '@tanstack/react-start'
import {
  createAxiomFnMiddleware,
  createAxiomRequestMiddleware,
} from '@axiomhq/tanstack-start'
import { startLogger } from './lib/logger'

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createAxiomRequestMiddleware(startLogger),
  ],
  functionMiddleware: [
    createAxiomFnMiddleware(startLogger, {
      correlation: true,
    }),
  ],
}))
