import { Suspense } from 'solid-js'
import type { JSXElement } from 'solid-js'
import { HydrationScript } from 'solid-js/web'
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/solid-router'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Axiom TanStack Start Solid Example',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument(props: { children: JSXElement }) {
  return (
    <html lang="en">
      <head>
        <HydrationScript />
      </head>
      <body class="shell">
        <HeadContent />
        <header class="header">
          <div class="brand">Axiom + TanStack Start (Solid)</div>
          <nav class="nav">
            <Link to="/" class="nav-link">
              Home
            </Link>
            <Link to="/about" class="nav-link">
              About
            </Link>
          </nav>
        </header>
        <Suspense>{props.children}</Suspense>
        <Scripts />
      </body>
    </html>
  )
}
