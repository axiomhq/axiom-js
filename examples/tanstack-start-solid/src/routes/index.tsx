import { createSignal } from 'solid-js'
import { createFileRoute } from '@tanstack/solid-router'
import { createServerFn, useServerFn } from '@tanstack/solid-start'

const getServerTime = createServerFn({ method: 'GET' }).handler(async () => {
  return {
    now: new Date().toISOString(),
  }
})

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const getServerTimeFn = useServerFn(getServerTime)
  const [serverTime, setServerTime] = createSignal<string>()
  const [loading, setLoading] = createSignal(false)
  const [crashRouteBoundary, setCrashRouteBoundary] = createSignal(false)

  if (crashRouteBoundary()) {
    throw new Error('Solid route boundary demo triggered from the TanStack Start example')
  }

  const fetchServerTime = async () => {
    setLoading(true)
    try {
      const result = await getServerTimeFn()
      setServerTime(result.now)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main class="container">
      <section class="hero">
        <h1>Shared TanStack Start observability for Solid</h1>
        <p>
          This example uses the shared Start middleware core from
          <code> @axiomhq/tanstack-start</code>, router instrumentation from
          <code> @axiomhq/tanstack-start/router</code>, and the Solid client
          adapter from <code> @axiomhq/tanstack-start/solid</code>.
        </p>
      </section>

      <div class="stack">
        <section class="panel">
          <h2>Server function middleware</h2>
          <p>
            Call a TanStack Start server function to generate function middleware logs and correlation-aware request context.
          </p>
          <div class="button-row">
            <button class="button" onClick={fetchServerTime} disabled={loading()}>
              {loading() ? 'Calling server function...' : 'Call getServerTime()'}
            </button>
          </div>
          {serverTime() ? <div class="code">Server time: {serverTime()}</div> : null}
        </section>

        <section class="panel">
          <h2>TanStack route error boundary</h2>
          <p>
            Trigger a route render error and let TanStack Router&apos;s
            <code> defaultErrorComponent</code> pass it through the Solid adapter
            helper.
          </p>
          <div class="button-row">
            <button class="button alt" onClick={() => setCrashRouteBoundary(true)}>
              Trigger route error
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
