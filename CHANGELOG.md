# Changelog

## [1.0.0](https://github.com/JoaoPedroAS51/mixpanel-nuxt/compare/v0.0.17...v1.0.0) (2026-10-08)

The module has been rewritten around the official Mixpanel browser and Node SDKs. Version 1.0.0 requires **Nuxt 4.6.0 or later**.

- **Browser tracking:** access the browser SDK through `useMixpanel()`. Tracking stays inactive during SSR and initializes in the browser.
- **Nitro support:** track server events with `useMixpanelServer()` in server routes, plugins and utilities.
- **Router pageviews:** automatic pageviews wait for the destination page, title and transitions to render. Cancelled navigations send no pageview, and redirects record the final destination.
- **Page metadata and hooks:** add properties or exclude pages through `definePageMeta()`. Use the async `mixpanel:pageview` hook to enrich or skip events before they are sent.
- **Separate client and server configuration:** configure each SDK independently, with optional `mixpanel.client.config.ts` and `mixpanel.server.config.ts` files for callbacks and other runtime options.

This is a breaking release. Review your existing configuration before upgrading.

See the [documentation](https://mixpanel-nuxt.vercel.app) for setup, configuration and API references.

## v0.0.17

[compare changes](https://github.com/JoaoPedroAS51/mixpanel-nuxt/compare/v0.0.16...v0.0.17)

## v0.0.16

[compare changes](https://github.com/JoaoPedroAS51/mixpanel-nuxt/compare/v0.0.15...v0.0.16)

### 🩹 Fixes

- **plugin:** Set plugin name to `mixpanel` ([abea822](https://github.com/JoaoPedroAS51/mixpanel-nuxt/commit/abea822))

### ❤️ Contributors

- JoaoPedroAS51 ([@JoaoPedroAS51](https://github.com/JoaoPedroAS51))

## v0.0.15

[compare changes](https://github.com/JoaoPedroAS51/mixpanel-nuxt/compare/v0.0.14...v0.0.15)

## v0.0.14

[compare changes](https://github.com/JoaoPedroAS51/mixpanel-nuxt/compare/v0.0.13...v0.0.14)

### 🩹 Fixes

- Lint ([80cf0e8](https://github.com/JoaoPedroAS51/mixpanel-nuxt/commit/80cf0e8))

### 🏡 Chore

- Update mixpanel-browser to 2.65.0 ([#2](https://github.com/JoaoPedroAS51/mixpanel-nuxt/pull/2))
- Update to nuxt 4 ([044db14](https://github.com/JoaoPedroAS51/mixpanel-nuxt/commit/044db14))
- Nuxt 4 compatibility ([cac3af6](https://github.com/JoaoPedroAS51/mixpanel-nuxt/commit/cac3af6))

### ❤️ Contributors

- JoaoPedroAS51 ([@JoaoPedroAS51](https://github.com/JoaoPedroAS51))
- Senicar <senicar@gmail.com>

## v0.0.13

[compare changes](https://github.com/JoaoPedroAS51/mixpanel-nuxt/compare/v0.0.12...v0.0.13)

### 🩹 Fixes

- Remove custom track pageview behavior ([de2f659](https://github.com/JoaoPedroAS51/mixpanel-nuxt/commit/de2f659))

### ❤️ Contributors

- JoaoPedroAS51 ([@JoaoPedroAS51](http://github.com/JoaoPedroAS51))

## v0.0.12

[compare changes](https://github.com/JoaoPedroAS51/mixpanel-nuxt/compare/v0.0.11...v0.0.12)

### 🩹 Fixes

- OptimizeDeps ([2a5a523](https://github.com/JoaoPedroAS51/mixpanel-nuxt/commit/2a5a523))

### ❤️ Contributors

- JoaoPedroAS51 ([@JoaoPedroAS51](http://github.com/JoaoPedroAS51))

## v0.0.11

[compare changes](https://github.com/JoaoPedroAS51/mixpanel-nuxt/compare/v0.0.10...v0.0.11)

### 🩹 Fixes

- Don’t add to optimizeDeps ([c10ec65](https://github.com/JoaoPedroAS51/mixpanel-nuxt/commit/c10ec65))

### ❤️ Contributors

- JoaoPedroAS51 ([@JoaoPedroAS51](http://github.com/JoaoPedroAS51))

## v0.0.10

[compare changes](https://github.com/JoaoPedroAS51/mixpanel-nuxt/compare/v0.0.9...v0.0.10)

### 🩹 Fixes

- Mixpanel type ([942e0c8](https://github.com/JoaoPedroAS51/mixpanel-nuxt/commit/942e0c8))

### ❤️ Contributors

- JoaoPedroAS51 ([@JoaoPedroAS51](http://github.com/JoaoPedroAS51))

## v0.0.9

[compare changes](https://github.com/JoaoPedroAS51/mixpanel-nuxt/compare/v0.0.8...v0.0.9)

### 🏡 Chore

- Save @types/mixpanel-browser as dependency ([5b3c35b](https://github.com/JoaoPedroAS51/mixpanel-nuxt/commit/5b3c35b))

### ❤️ Contributors

- JoaoPedroAS51 ([@JoaoPedroAS51](http://github.com/JoaoPedroAS51))

## v0.0.8

[compare changes](https://github.com/JoaoPedroAS51/mixpanel-nuxt/compare/v0.0.7...v0.0.8)

### 🩹 Fixes

- Use `import.meta` for client and server ([e3fa5d3](https://github.com/JoaoPedroAS51/mixpanel-nuxt/commit/e3fa5d3))

### 🏡 Chore

- Update deps and dev deps ([012bedb](https://github.com/JoaoPedroAS51/mixpanel-nuxt/commit/012bedb))
- Update scripts ([1cc2d4f](https://github.com/JoaoPedroAS51/mixpanel-nuxt/commit/1cc2d4f))

### ❤️ Contributors

- JoaoPedroAS51 ([@JoaoPedroAS51](http://github.com/JoaoPedroAS51))

## v0.0.7

[compare changes](https://github.com/JoaoPedroAS51/mixpanel-nuxt/compare/v0.0.6...v0.0.7)

### 🩹 Fixes

- Import from #imports ([79bfed3](https://github.com/JoaoPedroAS51/mixpanel-nuxt/commit/79bfed3))
- Auto track pageview using route middleware ([91bf3f9](https://github.com/JoaoPedroAS51/mixpanel-nuxt/commit/91bf3f9))
- RuntimeConfig type ([b6014d6](https://github.com/JoaoPedroAS51/mixpanel-nuxt/commit/b6014d6))

### 🏡 Chore

- Update commit email ([4cb0927](https://github.com/JoaoPedroAS51/mixpanel-nuxt/commit/4cb0927))

### ❤️ Contributors

- João Pedro Antunes Silva ([@JoaoPedroAS51](http://github.com/JoaoPedroAS51))

## v0.0.6

[compare changes](https://undefined/undefined/compare/v0.0.5...v0.0.6)

### 🩹 Fixes

- **module:** Transpile and optimizeDeps (4c6e222)

### ❤️  Contributors

- João Pedro Antunes Silva <hi@joaopedroas.com>

## v0.0.5

[compare changes](https://undefined/undefined/compare/v0.0.4...v0.0.5)

### 🩹 Fixes

- Only create mixpanel instance on init" (29abf12)

### ❤️  Contributors

- João Pedro Antunes Silva <hi@joaopedroas.com>

## v0.0.4

[compare changes](https://undefined/undefined/compare/v0.0.3...v0.0.4)

### 🩹 Fixes

- Only create mixpanel instance on init (e532309)

### ❤️  Contributors

- João Pedro Antunes Silva <hi@joaopedroas.com>

## v0.0.3

[compare changes](https://undefined/undefined/compare/v0.0.2...v0.0.3)

### 🩹 Fixes

- **runtime:** Disable in server side (da9121c)
- **runtime:** Log only if debug is enabled (373e7b2)

### ❤️  Contributors

- João Pedro Antunes Silva <hi@joaopedroas.com>

## v0.0.2

[compare changes](https://undefined/undefined/compare/v0.0.1...v0.0.2)


### 🩹 Fixes

  - **runtime:** Fix mixpanel wrapper (12b3294)

### ❤️  Contributors

- João Pedro Antunes Silva <hi@joaopedroas.com>

## v0.0.1


### 🩹 Fixes

  - Support disabling and disable in server side (49a6f79)
  - **module:** Set nuxt compatibility (4b9ffb9)

### 🏡 Chore

  - Update readme (95db465)
  - Rename to `mixpanel-nuxt` (8a3554d)
  - Update readme (76c5821)

### ❤️  Contributors

- João Pedro Antunes Silva <hi@joaopedroas.com>
