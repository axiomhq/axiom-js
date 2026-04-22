import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { observeTanStackRouter } from '@axiomhq/tanstack-start/router'
import { routeTree } from './routeTree.gen'
import RouteErrorComponent from './components/RouteErrorComponent'
import { routerLogger } from './lib/logger'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: RouteErrorComponent,
  })

  if (typeof window !== 'undefined') {
    const observe = observeTanStackRouter(routerLogger, {
      eventType: 'onResolved',
      source: 'tanstack-router-spa',
      performance: true,
    })
    observe(router)
  }

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
