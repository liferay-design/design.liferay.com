# Liferay Design Website

Public website for Liferay Design (design.liferay.com). An **Astro** content
site — articles, events, team/alumni, and the Lexicon design-system docs.

> The site was migrated from Gatsby to Astro. The old Gatsby app has been
> removed; the Astro app in `astro/` is the only build. Outdated sections
> (handbook, blueprints, resources, careers, newsletter, the 2018–2021 yearly
> reports, office-hours, design-week, old lexicon-1) are archived under
> `deprecated/` and are **not** built.

## Critical constraints

- **The app lives in `astro/`** — that's the project root for installs/builds.
  Node **≥22** (Astro 6). The repo root is no longer a Node project.
- **Content is read in place, never copied.** Astro reads `../src/markdown/**`
  (markdown + `Authors.yaml` / `Offices.yaml`) and `../static/**` (`publicDir`).
  Editing content = editing those files; no duplication under `astro/`.
- **No client runtime by default.** Astro ships HTML/CSS with zero JS unless a
  component opts into an island. There is no React / theme-ui / emotion runtime
  — styling is plain scoped CSS + CSS custom properties (`astro/src/styles`).
- **Netlify builds Astro** via `netlify.toml` (`base = "astro"`, `astro build`,
  Node 22). The build is offline — no API keys/tokens needed.

## Local development

```bash
cd astro
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in astro/dist
npm run preview
```

## Structure

- `astro/` — the site (pages, components, content config, styles, scripts)
- `src/markdown/` — all editorial content + `Authors.yaml` / `Offices.yaml`
  (read by Astro's content collections)
- `static/` — public assets (images, icons, files); Astro's `publicDir`
- `deprecated/` — archived sections, kept for history, **not built**

## How content becomes pages (Astro)

- Content collections in `astro/src/content.config.ts` load the markdown/YAML
  via `glob`/`file` loaders pointed at `../src/markdown`.
- Routes live in `astro/src/pages/**`. Live sections: **Home, Articles, Events,
  Team, Alumni, Lexicon** (plus Tags and Changelog).
- Author/office foreign keys (the old Gatsby `mapping`) are in-memory joins in
  `astro/src/lib/content.ts`.

## Lexicon → Figma Components docs

`/lexicon/figma-components` is data-driven: one JSON per component in
`astro/src/data/figma-components/<slug>.json`, rendered by
`astro/src/pages/lexicon/figma-components/[slug].astro`.

- **Regenerate from Figma**: `cd astro && node scripts/figma-export.mjs [slug …]`
  (Figma REST API; `FIGMA_ACCESS_TOKEN` from env or `astro/.env`). Pulls the
  overview image (the component set), playground image, description, variant
  axes and `variantCount`. Runs on demand; the committed JSON + images are what
  the build reads, so no token is needed at build time.
- **Tokens** (design variables) come from the Figma desktop MCP
  `get_variable_defs` (the REST `/variables/local` endpoint needs an Enterprise
  scope the token lacks). See `.claude/skills/lexicon-figma-import`.

## Working in this repo

### Content changes
1. Edit `src/markdown/` (and `Authors.yaml` / `Offices.yaml`) — that's ~all content.
2. Confirm the section is live (not under `deprecated/`).

### Fixing a page
1. Route in `astro/src/pages/`
2. Component in `astro/src/components/`
3. Content in `src/markdown/`
4. Helpers in `astro/src/lib/`

### Do not
- Add a Node/Gatsby project back at the repo root — the site is `astro/`.
- Copy content into `astro/`; it reads `../src/markdown` + `../static` in place.
- Reach for React / theme-ui / `sx` — use scoped CSS + CSS custom properties.
- Build the `deprecated/` sections.
