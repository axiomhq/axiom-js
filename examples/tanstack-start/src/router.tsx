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

  const observe = observeTanStackRouter(routerLogger, {
    source: 'tanstack-router-spa',
    performance: true,
  })
  const unsubscribe = observe(router)

  if (import.meta.hot) {
    import.meta.hot.dispose(unsubscribe)
  }

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
