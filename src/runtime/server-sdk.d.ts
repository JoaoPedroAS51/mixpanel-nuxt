import type NodeMixpanel from 'mixpanel'

export type MixpanelServerConfig = Partial<NodeMixpanel.InitConfig>
export type MixpanelServer = ReturnType<typeof NodeMixpanel.init>
export type MixpanelServerSDK = Pick<typeof NodeMixpanel, 'init'>
