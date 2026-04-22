import { createFileRoute } from '@tanstack/solid-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <main class="container">
      <section class="panel">
        <h1>About this Solid example</h1>
        <p>
          It demonstrates the same shared Start middleware APIs as the React
          example, but swaps in Solid Router and the Solid error-boundary helper.
        </p>
        <ul>
          <li>Router navigation logs via the shared router observer.</li>
          <li>Route timing logs via paired router lifecycle events.</li>
          <li>Server function logs via Start function middleware.</li>
          <li>Route error logs via TanStack Router defaultErrorComponent and the Solid adapter.</li>
        </ul>
      </section>
    </main>
  )
}
