import { randomUUID } from 'node:crypto'
import { defineEventHandler, getQuery } from 'h3'
import { useMixpanelServer } from '#mixpanel/server'

const instances = new WeakMap<object, string>()

export default defineEventHandler(async (event) => {
  try {
    const sdk = useMixpanelServer()

    if (!instances.has(sdk)) {
      instances.set(sdk, randomUUID())
    }

    const query = getQuery(event)
    const error = await new Promise<Error | undefined>((resolve) => {
      sdk.track('server_event', {
        distinct_id: String(query.id || 'one'),
        fail: query.fail === '1',
      }, resolve)
    })

    return {
      same: sdk === useMixpanelServer(),
      instanceId: instances.get(sdk),
      error: error?.message,
    }
  }
  catch (error) {
    return { error: (error as Error).message }
  }
})
