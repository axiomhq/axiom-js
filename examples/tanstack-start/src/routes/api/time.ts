import { createFileRoute } from '@tanstack/react-router'
import { startLogger } from '../../lib/logger'

export const Route = createFileRoute('/api/time')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const now = new Date().toISOString()

          startLogger.info('API /api/time called', {
            route: '/api/time',
            method: request.method,
            now,
          })

          return Response.json({
            ok: true,
            now,
            method: request.method,
            source: 'tanstack-start-api-route',
          })
        } catch (error) {
          startLogger.error(
            'API /api/time failed',
            error instanceof Error ? error : { error },
          )
          throw error
        }
      },
    },
  },
})
