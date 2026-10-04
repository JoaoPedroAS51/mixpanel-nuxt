<script setup lang="ts">
const { sections } = useDocsNavigation()
const variants = useUIConfig('navigationMenu')
</script>

<template>
  <USeparator class="hidden lg:flex" />

  <UContainer class="hidden lg:flex items-center justify-between">
    <UNavigationMenu
      :items="sections"
      :highlight="variants.highlight ?? true"
      :highlight-color="variants.highlightColor"
      :variant="variants.variant ?? 'pill'"
      :color="variants.color"
      class="-mx-2.5 -mb-px"
    />

    <AppHeaderBottomRight />
  </UContainer>
</template>
