# Liferay Design Website

Public website for Liferay Design (design.liferay.com). Content-driven Gatsby site with articles, Lexicon design system docs, events, and team pages. Older sections (handbook, blueprints, careers, resources) are parked under `deprecated/` and no longer build — see "Live vs deprecated scope".

## Critical constraints

- **Node 18.x required** (18.20.8, see `.nvmrc`) — Gatsby 5 needs Node ≥18; older Node will not build
- **Gatsby 5.16** + **React 18.3** + **MDX v2** — do not assume Gatsby 4 / React 16 / MDX v1 patterns
- **MDX v2**: templates render page content with `{children}` (the `MDXRenderer`/`body` field was removed). Pages are created with `component: \`${template}?__contentFilePath=${node.internal.contentFilePath}\``. MDX is stricter CommonMark+JSX: HTML comments are invalid (`{/* */}`), stray `<` must be escaped, inline JSX can't split across lines, and `style="..."` must be an object
- **YAML/JSON data `id` is exposed as `yamlId`/`jsonId`** (Gatsby 4+) — the `gatsby-config.mjs` `mapping` block and data-file GraphQL queries use `yamlId` (often aliased `id: yamlId`)
- **GraphQL sort syntax is the Gatsby 5 shape**: `sort: { field: DESC }` (not the old `sort: { fields: [field], order: DESC }`)
- **`timeToRead` is a custom resolver** in `gatsby-node.js` (Gatsby 5 dropped the built-in field) — powers the "X Min Read" badges
- **theme-ui 0.17**: use `Themed` (from `@theme-ui/mdx`) not `Styled`; `ThemeUIProvider` not `ThemeProvider`; `@emotion/react` not `@emotion/core`
- **sass (dart-sass) ~1.32** — pinned to keep node-sass-era SCSS syntax compiling without warnings
- **CSS modules use default exports** (`import styles from '*.module.scss'`) — preserved via `cssLoaderOptions` in `gatsby-plugin-sass` config; do not "modernize" to named imports piecemeal
- **`.npmrc` sets `legacy-peer-deps=true`** — required to resolve React 18 peer ranges across older plugins; keep it for both local installs and Netlify
- **Netlify** deployment, pinned to Node 18 (`netlify.toml` → `NODE_VERSION = "18"`)
- Stability > modernization. Do not upgrade packages unless migration is the explicit goal

## Local development

```bash
nvm use          # picks up 18.20.8 from .nvmrc
npm install
npm run dev      # starts on http://0.0.0.0:7777
```

- `src/utils/generateEnv.js` auto-creates `.env.development` if missing
- Some sections need API keys (Google APIs, Firebase) — site degrades gracefully without them

## Project structure

- `src/markdown/` — site content, scoped to the live sections (articles, lexicon, events, team)
- `src/markdown/*.yaml` — data files (Authors, Changelog, Countries, Offices)
- `src/components/` — atomic design: atoms, molecules, organisms, templates
- `src/pages/` — page entry points (home, articles, team, alumni, lexicon, events, tags, changelog)
- `src/utils/` — helpers (generateEnv, generateIcons, typography, logRocket)
- `static/` — public assets (images, icons, files, videos, admin)
- `deprecated/` — outdated sections kept out of the build (markdown, pages, templates,
  components). Gatsby only sources `./src`, so nothing here generates pages. Sections
  parked here: handbook, blueprints, resources, careers, newsletter, the yearly
  reports (2018–2021), office-hours, design-week, and the old lexicon-1. Restore by
  moving a folder back under `src/`.

## Live vs deprecated scope

The site builds only the core sections: **Home, Articles, Events, Team, Alumni, Lexicon**
(plus Tags and Changelog). Everything else lives under `deprecated/`. When adding content
or fixing a page, confirm it belongs to a live section first.

One exception: `/resources/license` is still live, served by the standalone page
`src/pages/resources/license.js`. The rest of `resources/` stays deprecated. It is a
page rather than markdown because `gatsby-node` resolves a markdown page's template
from the first slug segment, and `templates/Resources/` is deprecated — so the footer
link in `SiteCredits` keeps working without reviving that template.

## How content becomes pages

1. MDX/Markdown files in `src/markdown/{section}/` get slugs via `createFilePath()` with `/markdown/` stripped
2. First slug segment maps to template: `/articles/...` → `src/components/templates/Articles/index.js`
3. Tag pages auto-generated at `/tags/<kebab-case-tag>/`
4. Every `.js` under `src/pages/` also becomes a page — including colocated
   `components/` files (e.g. `/principles/components/PrincipleCard`). Put shared
   helpers outside `src/pages/` unless you want the extra URL

## Styling

Mixed model — check local area before changing:
- `gatsby-browser.js` imports `theme/global.scss`
- SCSS modules (`.module.scss`) per component
- Theme UI config in `src/gatsby-plugin-theme-ui/`
- Typography in `src/utils/typography.js`

## Icons

SVGs in `static/images/icons/` → auto-generated React map via `npm run icons` → output at `src/components/atoms/Icon/icons.js`. Do not hand-edit generated output.

## Working in this repo

### Content changes
1. Check `src/markdown/` first
2. Then YAML data files
3. Only edit React components if content is hardcoded

### Fixing a page
1. `src/pages/` entry point
2. `src/components/templates/` for the matching template
3. `src/markdown/` for the content
4. Utility code used by that page

### Adding a new content section
- Confirm if it fits an existing slug-to-template convention
- If not: new template in `src/components/templates/`, matching markdown folder, and navigation updates

### Do not
- Upgrade Gatsby, React, Node, or sass as part of a small task
- Move content from markdown into React components
- Apply Gatsby 2/3/4 or React 16 / MDX v1 patterns (the repo is on Gatsby 5 / React 18 / MDX v2)
- Remove odd-looking code without checking if it protects builds in no-key environments
- Hand-edit generated icon files
