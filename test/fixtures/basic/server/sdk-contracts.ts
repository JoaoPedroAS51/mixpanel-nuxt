import { expectTypeOf } from 'vitest'
import { useMixpanelServer } from '#mixpanel/server'

export function checkServerTypes() {
  const sdk = useMixpanelServer()

  expectTypeOf(sdk).not.toBeAny()
  sdk.track('typed-event', { distinct_id: 'one' })

  // @ts-expect-error event names are strings
  sdk.track(123)
}
