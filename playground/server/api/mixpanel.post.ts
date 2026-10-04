import { defineEventHandler } from 'h3'
import { useMixpanelServer } from '#mixpanel/server'

export default defineEventHandler(async () => {
  const eventName = 'playground_server_clicked'

  try {
    const sdk = useMixpanelServer()

    await new Promise<void>((resolve, reject) => {
      sdk.track(eventName, { distinct_id: 'playground-user', source: 'playground' }, (error) => {
        if (error) reject(error)
        else resolve()
      })
    })

    return { event: eventName, ok: true, reused: sdk === useMixpanelServer() }
  }
  catch (error) {
    return { event: eventName, ok: false, error: error instanceof Error ? error.message : String(error) }
  }
})
