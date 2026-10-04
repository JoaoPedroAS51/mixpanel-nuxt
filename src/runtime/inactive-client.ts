import type { Group, People } from 'mixpanel-browser'
import type { MixpanelClient, MixpanelClientFlags } from './types'

const noop = () => undefined
const noopAsync = async () => undefined

/** Create a browser-shaped API that performs no tracking or state changes. */
export function createInactiveClient(): MixpanelClient {
  const group: Group = {
    set: () => group,
    set_once: () => group,
    union: () => group,
    remove: () => group,
    unset: noop,
    delete: noop,
  }
  const people: People = {
    set: noop,
    set_once: noop,
    unset: noop,
    increment: noop,
    remove: noop,
    append: noop,
    union: noop,
    track_charge: noop,
    clear_charges: noop,
    delete_user: noop,
  }
  const flags: MixpanelClientFlags = {
    are_flags_ready: noop,
    load_flags: noopAsync,
    when_ready: noopAsync,
    update_context: noopAsync,
    get_variant: noopAsync,
    get_variant_sync: noop,
    get_variant_value: noopAsync,
    get_variant_value_sync: noop,
    get_all_variants: noopAsync,
    get_all_variants_sync: noop,
    is_enabled: noopAsync,
    is_enabled_sync: noop,
  }
  const client: MixpanelClient = {
    init: () => client,
    people,
    flags,
    get_group: () => group,
    get_config: noop,
    get_distinct_id: noop,
    get_property: noop,
    get_session_replay_url: noop,
    get_session_recording_properties: noop,
    has_opted_in_tracking: noop,
    has_opted_out_tracking: noop,
    add_group: noop,
    remove_group: noop,
    set_group: noop,
    alias: noop,
    identify: noop,
    reset: noop,
    clear_opt_in_out_tracking: noop,
    disable: noop,
    opt_in_tracking: noop,
    opt_out_tracking: noop,
    push: noop,
    register: noop,
    register_once: noop,
    unregister: noop,
    set_config: noop,
    start_batch_senders: noop,
    time_event: noop,
    track: noop,
    track_forms: noop,
    track_links: noop,
    track_pageview: noop,
    track_with_groups: noop,
    start_session_recording: noop,
    stop_session_recording: noop,
  }
  return client
}
