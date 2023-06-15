
import { useLogger } from '@axiomhq/nextjs'

export default async function Home() {
  const log = useLogger()
  log.debug('AXIOM/NEXT::FRONTEND_LOG')

  await log.flush()
  return (
    <div>Test</div>
  )
}
