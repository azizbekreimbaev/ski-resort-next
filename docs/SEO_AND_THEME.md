# SEO and appearance

Set `NEXT_PUBLIC_SITE_URL` to the public HTTPS origin (for example, your deployed domain) before building for production. No production domain is assumed. Without it, canonical and alternate URLs are omitted; share image paths remain relative. Rebuild after changing the variable.

`/robots.txt` advertises `/sitemap.xml` once the origin is configured. The sitemap lists public entry pages in all three supported locales; dynamic API record URLs are intentionally excluded until a server-side catalog sitemap is added. Private account, admin, cart and checkout pages use noindex. Detail canonical URLs retain their record ID and discard tracking parameters.

To validate a production build without replacing dev output, set `SNOWAY_BUILD_DIR=node_modules/.cache/snoway-seo-build` and run the normal build command. The default remains `.next`.

Page metadata belongs in `libs/components/common/Seo.tsx` (`next/head`), not the static Document head. Document owns icons, browser colors and the early appearance script. Public detail components can pass `title`, `summary`, `image` and `imageAlt` to Seo using their existing API data. Do not add fabricated ratings or availability to structured data.

The 1200×630 JPEG share card is `/img/social/snoway-share.jpg`. Check deployed URLs with social platform preview inspectors after deployment; crawler caches may need refreshing. API-loaded details retain a useful section preview until data loads; entity-specific crawler previews need server-side data loading in a separate domain migration.

Appearance defaults to the device setting and supports explicit light/dark overrides. Preferences persist in `snoway.color-mode` and synchronize between tabs. The existing MUI 5 ThemeProvider remains in use. `scss/color-mode.scss` handles browser chrome and shared tokens. `scripts/generate-dark-palette.cjs` maps known palette declarations into scoped overrides while preserving imagery, layout and media queries. Run `node scripts/generate-dark-palette.cjs` after changing the source styles or palette mappings. The generated CSS is checked in; no runtime dependency is added.
