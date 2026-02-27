import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-slate-100">
      <h1 className="mb-4 text-3xl font-semibold">About This Example</h1>
      <p className="mb-3 text-slate-300">
        This app demonstrates <code>@axiomhq/tanstack-start</code> in a TanStack
        Start project.
      </p>
      <ul className="list-disc space-y-2 pl-6 text-slate-300">
        <li>Client-side route navigation logs via router observer.</li>
        <li>Server request logs via request middleware.</li>
        <li>Server function logs via function middleware.</li>
        <li>API route logs via Start server handlers.</li>
      </ul>
    </div>
  )
}
