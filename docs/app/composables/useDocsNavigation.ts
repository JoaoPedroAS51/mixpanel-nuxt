import type { ContentNavigationProps } from '#ui/types'

type Navigation = NonNullable<ContentNavigationProps['navigation']>

export function useDocsNavigation() {
  const route = useRoute()
  const navigation = inject<Ref<Navigation>>('navigation')
  const isApi = computed(() => route.path === '/api' || route.path.startsWith('/api/'))

  const sections = computed(() => [
    { label: 'Guide', to: '/get-started/installation', active: !isApi.value },
    { label: 'API', to: '/api/options', active: isApi.value },
  ])

  const sidebarNavigation = computed(() => {
    const items = navigation?.value || []
    if (isApi.value) {
      return items.find(item => item.path === '/api')?.children || []
    }
    return items.filter(item => item.path === '/get-started' || item.path === '/integration')
  })

  return { sections, sidebarNavigation }
}
