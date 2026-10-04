import { expectTypeOf } from 'vitest'
import { useMixpanel } from '#imports'

export function checkClientTypes() {
  const sdk = useMixpanel()

  expectTypeOf(sdk).not.toBeAny()
  expectTypeOf(sdk.get_distinct_id()).toEqualTypeOf<string | undefined>()
  sdk.track('typed-event')

  // @ts-expect-error event names are strings
  sdk.track(123)
}
