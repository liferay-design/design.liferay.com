# design.liferay.com — Astro migration

Migration of the **live** sections of design.liferay.com from Gatsby 5 to
**Astro 6**. It coexists with the Gatsby app (repo root) and **reads the same
content in place** — nothing under `../src/markdown` or `../static` is copied or
duplicated.

```bash
cd astro
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/  (352 pages)
npm run preview
```

## Scope (the non-deprecated sections)

| Section | Route(s) | Source |
|---|---|---|
| Home | `/` | `src/pages/index.astro` |
| Articles | `/articles`, `/articles/<year>/<slug>` | `../src/markdown/articles` |
| Events | `/events`, `/events/<slug>` | `../src/markdown/events` |
| Team | `/team`, `/team/<lastname-firstname>` | `../src/markdown/team` + `Authors.yaml` |
| Alumni | `/alumni` | `Authors.yaml` (alumni) |
| Lexicon | `/lexicon`, `/lexicon/**` | `../src/markdown/lexicon` |
| Tags | `/tags/<tag>` | auto-generated from article tags |

Anything under `../deprecated/` is intentionally **not** built.

## How it maps to the old stack

- **GraphQL data layer → content collections** (`src/content.config.ts`). The
  `glob` loader points at `../src/markdown/**`; `Authors.yaml` / `Offices.yaml`
  load via the `file` loader. The Gatsby `mapping` (author/office foreign keys)
  is re-implemented as in-memory joins in `src/lib/content.ts`.
- **theme-ui `sx` → CSS custom properties.** The theme config and
  `variables.scss` are ported to tokens in `src/styles/global.css`; every
  component uses plain scoped CSS. No theme-ui / emotion runtime ships.
- **MDX shortcodes & Gatsby-era imports.** Content MDX imports
  (`components/atoms`, `components/molecules`, `theme-ui`, `gatsby`) are remapped
  via Vite aliases to lightweight `.astro` shims in `src/shims/`. The same shims
  are handed to every `<Content components>` for un-imported JSX usage.
- **Icons.** The SVG set in `../static/images/icons` is inlined at build time
  (`src/lib/icons.ts` + `Icon.astro`), keeping `currentColor` tinting.
- **Images.** Co-located markdown images (`./images/…`) are processed natively
  by `astro:assets` (optimized to webp). A remark plugin strips the
  `#width=49%;` `gatsby-remark-image-attributes` fragment that broke Astro's
  image collector, carrying the width over as an inline style.
- **Reading time / dates / author slugs.** Ported to `src/lib/helpers.ts`
  (no `moment`; `Intl.DateTimeFormat` instead).

## Known fidelity gaps (deferred, not blockers)

- **Parallax** on article heroes (`react-plx`) and the `ScrollProgress` bar are
  not reimplemented — content is static. The HeroBanner and FancyFooter CSS
  animations **are** ported.
- **Lexicon doc-link auth gating** (Firebase) renders the unauthenticated
  (lock) state statically. No content was server-gated in the original, so
  nothing leaks; a client island can restore the toggle later.
- **Algolia DocSearch** in the Lexicon sidebar is not wired yet.
- The Lexicon landing is a faithful re-creation (hero + explore cards + Clay),
  not a pixel match of the original `Banner`/`CardLexicon`/`Billboard`.
- Two `.md` files that contained JSX were renamed to `.mdx`
  (`lexicon/contributing`, `lexicon/patterns/common-content-patterns`) — Astro
  treats `.md` as plain markdown.

## Notes

- `markdown.remarkPlugins`/`rehypePlugins` emit an Astro 6 deprecation warning;
  still functional. Move to the `@astrojs/markdown-remark` `unified()` config
  when convenient.
- `publicDir` is set to `../static`, so `/images/…` paths resolve identically
  to production.
