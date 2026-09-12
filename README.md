# Design.Liferay

The online presence of Liferay's Design Teams.

Designed in [Figma](https://figma.com), built with [Astro](https://astro.build),
powered by [Netlify](https://netlify.com).

> **Migrated from Gatsby to Astro.** The site now lives in [`astro/`](./astro);
> the old Gatsby app has been removed. Outdated sections are archived under
> [`deprecated/`](./deprecated) and are not built.

## Getting started

```bash
cd astro
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in astro/dist
npm run preview
```

Requirements: **Node ≥22** (Astro 6). No API keys or tokens are needed to build
— the site is fully static and reads committed content.

## How it's organised

| Path | What |
| --- | --- |
| `astro/` | The site: pages, components, content config, styles, scripts |
| `src/markdown/` | All editorial content + `Authors.yaml` / `Offices.yaml` |
| `static/` | Public assets (images, icons, files) — Astro's `publicDir` |
| `deprecated/` | Archived sections, kept for history, **not built** |

The Astro app reads `../src/markdown` and `../static` **in place** — content is
never copied or duplicated. Editing the site's content means editing those files.

### Live sections

Home, Articles, Events, Team, Alumni, Lexicon (plus Tags and Changelog). Routes
live in `astro/src/pages/**`; content collections in `astro/src/content.config.ts`.

### Markdown & MDX

Most content is markdown/MDX under `src/markdown/`. MDX files may import the
lightweight Astro shims (see `astro/src/shims/`) for the components used inline.

### Lexicon → Figma Components

`/lexicon/figma-components` is generated from the Figma "Lexicon Components"
library. Regenerate with:

```bash
cd astro
node scripts/figma-export.mjs            # all components
node scripts/figma-export.mjs checkbox   # one or more by slug
```

It needs a `FIGMA_ACCESS_TOKEN` (env var or `astro/.env`, gitignored) and pulls
images, descriptions and variant data; design tokens are filled via the Figma
desktop MCP. The build itself stays offline — it reads the committed JSON +
images. See `astro/README.md` and `.claude/skills/lexicon-figma-import` for the
full pipeline.

## Deploying

Netlify builds the Astro app (`base = "astro"`, `astro build`, Node 22 — see
`netlify.toml`). Pushing to `master` deploys; pull requests get a deploy preview.

## Contributing

See the [Contributing Guidelines](./CONTRIBUTING.md).
