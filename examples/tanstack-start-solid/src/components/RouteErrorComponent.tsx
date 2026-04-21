import { createEffect } from 'solid-js'
import {
  ErrorComponent,
  type ErrorComponentProps,
} from '@tanstack/solid-router'
import { createAxiomSolidErrorHandler } from '@axiomhq/tanstack-start/solid'
import { startLogger } from '../lib/logger'

const handleClientError = createAxiomSolidErrorHandler(startLogger, {
  source: 'tanstack-start-solid-router-error-boundary',
})

export default function RouteErrorComponent(props: ErrorComponentProps) {
  createEffect(() => {
    handleClientError(props.error, props.reset)
  })

  return (
    <main class="container">
      <section class="panel">
        <h1>Route Error Captured</h1>
        <p>
          TanStack Router caught this route error through
          <code> defaultErrorComponent</code>, and the Solid adapter logged it
          as a client-side event.
        </p>
        <div class="code">
          <ErrorComponent error={props.error} />
        </div>
        <div class="button-row">
          <button class="button alt" onClick={() => props.reset()}>
            Try again
          </button>
        </div>
      </section>
    </main>
  )
}
