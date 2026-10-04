# Documentation

The site uses [Docus](https://docus.dev). Pages live in `content/`; numbered files and directories set navigation order.

Run these commands from the repository root:

```bash
pnpm install
pnpm docs:dev
pnpm docs:build
pnpm docs:generate
pnpm docs:preview
pnpm docs:typecheck
```

`docs:build` produces a Node server in `docs/.output`. `docs:generate` produces a static site in `docs/.output/public`.

The canonical site URL is `https://mixpanel-nuxt.vercel.app`, configured in `nuxt.config.ts`.

## Type checking

Docus 5.14.0 reports type errors in its `DocsAsideRight.vue` and `useSeo.ts` sources with this Nuxt 4.6 setup. `docs:typecheck` includes the layer and reports those errors; the site build is checked separately.
