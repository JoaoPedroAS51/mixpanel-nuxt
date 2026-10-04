---
seo:
  title: Mixpanel for Nuxt
  description: Track browser events, router pageviews and server events with the official Mixpanel SDKs.
---

::u-page-hero
#title
Mixpanel for Nuxt

#description
Track browser events, router pageviews and server events with the official [Mixpanel](https://mixpanel.com/) SDKs.

#links
  :::u-button
  ---
  to: /get-started/installation
  size: xl
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :::u-button
  ---
  to: https://github.com/JoaoPedroAS51/mixpanel-nuxt
  size: xl
  color: neutral
  variant: outline
  icon: i-simple-icons-github
  ---
  GitHub
  :::
::

::u-page-section
#title
Browser and server tracking

#features

  :::u-page-feature
  ---
  icon: i-lucide-mouse-pointer-click
  to: /integration/browser
  ---
  #title
  Browser events
  #description
  Access the browser SDK through `useMixpanel()`.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-server
  to: /integration/nitro
  ---
  #title
  Nitro events
  #description
  Use the Node SDK in server routes, plugins and utilities.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-monitor
  to: /integration/browser#server-rendering
  ---
  #title
  SSR support
  #description
  Browser tracking stays inactive during SSR and initializes in the browser.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-route
  to: /integration/pageviews
  ---
  #title
  Vue Router integration
  #description
  Record pageviews automatically as users navigate.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-file-cog
  to: /integration/pageviews#page-properties
  ---
  #title
  Page meta
  #description
  Set custom properties or disable tracking for individual pages.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-plug
  to: /integration/pageviews#enriching-pageviews
  ---
  #title
  Runtime hooks
  #description
  Enrich pageviews with async data or skip them before they are sent.
  :::
::
