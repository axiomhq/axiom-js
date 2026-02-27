import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { observeTanStackRouter } from '@axiomhq/tanstack-start/router'
import { routeTree } from './routeTree.gen'
import { routerLogger } from './lib/logger'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,

    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  if (typeof window !== 'undefined') {
    observeTanStackRouter(router, routerLogger, {
      eventType: 'onResolved',
      source: 'tanstack-router-spa',
    })
  }

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
