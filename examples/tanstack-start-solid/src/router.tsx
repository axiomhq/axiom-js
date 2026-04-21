import { createRouter } from '@tanstack/solid-router'
import { observeTanStackRouter } from '@axiomhq/tanstack-start/router'
import { routerLogger } from './lib/logger'
import { routeTree } from './routeTree.gen'
import RouteErrorComponent from './components/RouteErrorComponent'

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: RouteErrorComponent,
  })

  if (typeof window !== 'undefined') {
    const observe = observeTanStackRouter(routerLogger, {
      eventType: 'onResolved',
      source: 'tanstack-router-solid',
      performance: true,
    })

    observe(router)
  }

  return router
}

declare module '@tanstack/solid-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
