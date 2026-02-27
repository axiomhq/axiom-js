import { Axiom } from '@axiomhq/js'
import { AxiomJSTransport, ConsoleTransport, Logger } from '@axiomhq/logging'
import type { Transport } from '@axiomhq/logging'
import { tanStackRouterFormatters } from '@axiomhq/tanstack-start'
import { tanStackStartServerFormatters } from '@axiomhq/tanstack-start/start'

function createTransports(): [Transport, ...Transport[]] {
  const token = import.meta.env.VITE_AXIOM_TOKEN ?? ''
  const dataset = import.meta.env.VITE_AXIOM_DATASET ?? ''

  const transports: [Transport, ...Transport[]] = [
    new ConsoleTransport({ prettyPrint: true }),
  ]

  if (token && dataset) {
    const axiom = new Axiom({ token })
    transports.unshift(new AxiomJSTransport({ axiom, dataset }))
  }

  return transports
}

export const routerLogger = new Logger({
  transports: createTransports(),
  formatters: tanStackRouterFormatters,
})

export const startLogger = new Logger({
  transports: createTransports(),
  formatters: tanStackStartServerFormatters,
})
