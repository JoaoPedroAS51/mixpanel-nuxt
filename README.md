# mixpanel-nuxt

> [Mixpanel](https://mixpanel.com/) integration for [Nuxt](https://nuxt.com).

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Track browser and server events with the official Mixpanel SDKs.

## Highlights

- 🖱️ **Browser events.** Access the browser SDK through `useMixpanel()`.
- 🖥️ **Nitro events.** Use the Node SDK in server routes, plugins and utilities.
- 🔄 **SSR support.** Browser tracking stays inactive during SSR and initializes in the browser.
- 🧭 **Vue Router integration.** Record pageviews automatically as users navigate.
- 📄 **Page meta.** Set custom properties or disable tracking for individual pages.
- 🪝 **Runtime hooks.** Enrich pageviews with async data or skip them before they are sent.

## Documentation

The [full documentation](https://mixpanel-nuxt.vercel.app) includes setup, integrations and API references.

- [Configuration](https://mixpanel-nuxt.vercel.app/get-started/configuration)
- [Pageviews](https://mixpanel-nuxt.vercel.app/integration/pageviews)
- [Nitro](https://mixpanel-nuxt.vercel.app/integration/nitro)

## Install

```bash
pnpm add -D mixpanel-nuxt
```

<details><summary>npm / yarn / bun</summary>

```bash
npm install --save-dev mixpanel-nuxt
yarn add --dev mixpanel-nuxt
bun add --dev mixpanel-nuxt
```

</details>

Requires Nuxt 4.6 or later.

## Usage

Register the module and set your project token:

```ts
export default defineNuxtConfig({
  modules: ['mixpanel-nuxt'],
  mixpanel: {
    client: {
      token: 'your-project-token',
    },
  },
})
```

Track an event with `useMixpanel()`:

```vue
<script setup lang="ts">
const mixpanel = useMixpanel()

function downloadReport() {
  mixpanel.track('Report downloaded', { format: 'csv' })
}
</script>

<template>
  <button @click="downloadReport">Download report</button>
</template>
```

## License

[MIT](./LICENSE)

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/mixpanel-nuxt/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/mixpanel-nuxt

[npm-downloads-src]: https://img.shields.io/npm/dm/mixpanel-nuxt.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/mixpanel-nuxt

[license-src]: https://img.shields.io/npm/l/mixpanel-nuxt.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/mixpanel-nuxt

[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
