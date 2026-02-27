import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

const getServerTime = createServerFn({ method: 'GET' }).handler(async () => {
  return {
    now: new Date().toISOString(),
  }
})

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [serverTime, setServerTime] = useState<string | null>(null)
  const [apiTime, setApiTime] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiLoading, setApiLoading] = useState(false)

  const fetchServerTime = async () => {
    setLoading(true)
    try {
      const result = await getServerTime()
      setServerTime(result.now)
    } finally {
      setLoading(false)
    }
  }

  const fetchApiTime = async () => {
    setApiLoading(true)
    try {
      const response = await fetch('/api/time')
      const result = (await response.json()) as { now: string }
      setApiTime(result.now)
    } finally {
      setApiLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 text-slate-100">
      <h1 className="mb-3 text-4xl font-bold">TanStack + Axiom Example</h1>
      <p className="mb-8 text-slate-300">
        This app demonstrates <code>@axiomhq/tanstack-start</code> for both
        TanStack Router SPA navigation events and TanStack Start middleware.
      </p>

      <div className="mb-8 rounded-xl border border-slate-700 bg-slate-900/60 p-6">
        <h2 className="mb-2 text-2xl font-semibold">1. Router SPA Logging</h2>
        <p className="mb-4 text-slate-300">
          Click around the app to generate client-side navigation logs.
        </p>
        <div className="flex gap-3">
          <Link
            to="/about"
            className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-white hover:bg-cyan-600"
          >
            Go to About
          </Link>
          <Link
            to="/"
            className="rounded-md border border-slate-600 px-4 py-2 font-medium text-slate-200 hover:bg-slate-800"
          >
            Stay on Home
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
        <h2 className="mb-2 text-2xl font-semibold">2. Start Function Middleware</h2>
        <p className="mb-4 text-slate-300">
          Call a server function to generate function-level middleware logs.
        </p>
        <button
          onClick={fetchServerTime}
          disabled={loading}
          className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Calling server function...' : 'Call getServerTime()'}
        </button>
        {serverTime ? (
          <p className="mt-4 text-sm text-slate-300">
            Server time: <code>{serverTime}</code>
          </p>
        ) : null}
      </div>

      <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900/60 p-6">
        <h2 className="mb-2 text-2xl font-semibold">3. Start API Route Middleware</h2>
        <p className="mb-4 text-slate-300">
          Call <code>/api/time</code> to generate request-middleware logs from a server route.
        </p>
        <button
          onClick={fetchApiTime}
          disabled={apiLoading}
          className="rounded-md bg-violet-500 px-4 py-2 font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {apiLoading ? 'Calling /api/time...' : 'Call /api/time'}
        </button>
        {apiTime ? (
          <p className="mt-4 text-sm text-slate-300">
            API time: <code>{apiTime}</code>
          </p>
        ) : null}
      </div>
    </div>
  )
}
