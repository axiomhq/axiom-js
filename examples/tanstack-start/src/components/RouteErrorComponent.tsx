import { useEffect } from 'react'
import {
  ErrorComponent,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { createAxiomReactErrorHandler } from '@axiomhq/tanstack-start/react'
import { startLogger } from '../lib/logger'

const handleClientError = createAxiomReactErrorHandler(startLogger, {
  source: 'tanstack-start-react-router-error-boundary',
})

export default function RouteErrorComponent({
  error,
  reset,
}: ErrorComponentProps) {
  useEffect(() => {
    handleClientError(error)
  }, [error])

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-slate-100">
      <div className="rounded-xl border border-rose-900/60 bg-slate-900/80 p-6 shadow-2xl shadow-rose-950/20">
        <h1 className="mb-3 text-3xl font-semibold">Route Error Captured</h1>
        <p className="mb-5 text-slate-300">
          TanStack Router caught this route error through
          <code> defaultErrorComponent</code>, and the Axiom React adapter logged
          it as a client-side event.
        </p>
        <div className="rounded-lg border border-slate-700 bg-slate-950/80 p-4">
          <ErrorComponent error={error} />
        </div>
        <button
          onClick={() => reset()}
          className="mt-5 rounded-md bg-rose-500 px-4 py-2 font-medium text-white hover:bg-rose-600"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
