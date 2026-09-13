# models.md

## Repository profile

This repository powers the legacy **Liferay Design** website. It is a Gatsby 2 site with a strong content-driven structure, a large amount of MDX/markdown content, custom templates, legacy plugins, and a build process that still depends on **Node 12** and other older ecosystem packages.

Any AI model working on this repository should assume that **stability matters more than modernization** unless the task is explicitly a migration project.

## What this repo is

- A public website for Liferay Design.
- Built with **Gatsby 2.32.13** and **React 16.14.0**.
- Hosted through **Netlify**, with Netlify configured to use **NODE_VERSION = "12"**.
- Mostly content-driven, with the README stating that **98.3% of the site content lives in markdown**.
- Organized around **atomic design** concepts in `src/components`.
- Backed by a mix of local content and external integrations such as Mailchimp, Firebase, Google APIs, Netlify CMS, and a custom sheets plugin.

## Critical constraints

### 1. Node version is not optional
Use **Node 12.x**, ideally **12.14.1** when reproducing the repo's original expectation.

Why this matters:
- The README says the project only works with Node v12 and recommends `nvm install v12.14.1`.
- Netlify is also pinned to Node 12.
- The dependency graph includes older Gatsby 2-era packages and `node-sass@4.14.1`, both of which are common sources of breakage on newer Node versions.

### 2. Treat this as a legacy Gatsby codebase
This is not a good target for opportunistic upgrades.

Avoid doing any of the following unless the task is explicitly about migration:
- upgrading Gatsby major versions
- upgrading React major versions
- replacing Sass tooling
- rewriting CommonJS files to a new architecture
- introducing assumptions from modern Gatsby docs
- reworking the routing model without verifying existing slug conventions

### 3. Some parts of the site depend on secrets or remote data
The repo is designed to create a placeholder `.env.development` file through `src/utils/generateEnv.js`, but the README warns that some parts of the site may not build fully without API keys.

Important nuance:
- `gatsby-node.js` contains a fallback schema for newsletter data when `MAILCHIMP_KEY` is missing, so newsletter queries do not necessarily crash the build.
- That does **not** mean every external integration has the same fallback behavior.

## How the site is structured

### Content
Most content lives under:

- `src/markdown/annual-reports`
- `src/markdown/articles`
- `src/markdown/blueprints`
- `src/markdown/careers`
- `src/markdown/events`
- `src/markdown/handbook`
- `src/markdown/lexicon`
- `src/markdown/lexicon-1`
- `src/markdown/resources`
- `src/markdown/team`

Supporting datasets also live in `src/markdown`, including:

- `Authors.yaml`
- `Changelog.yaml`
- `Countries.yaml`
- `Offices.yaml`

### Pages
`src/pages` contains page entry points and some historical sections, including:

- yearly sections `2018`, `2019`, `2020`, `2021`
- `index.js`
- `team.js`
- `articles.js`
- `careers.js`
- `changelog.js`
- `alumni.js`
- `tags.js`
- `lexicon.js`
- `lexicon-1.js`
- `404.js`

### Components
`src/components` follows atomic design:

- `atoms`
- `molecules`
- `organisms`
- `templates`

Templates currently include at least:

- `Articles`
- `Blueprints`
- `Careers`
- `Events`
- `Handbook`
- `Lexicon`
- `Lexicon-1`
- `Newsletters`
- `Resources`
- `Tags`
- `Team`
- `MainLayout`
- `PrivatePage`

### Utilities
`src/utils` contains repo-specific helpers and scripts, including:

- `generateEnv.js`
- `generateIcons.js`
- `logRocket.js`
- `typography.js`
- `index.js`

### Static assets
`static` includes public assets such as:

- `admin`
- `files`
- `images`
- `videos/dxp`
- `_redirects`

## How content becomes pages

This repo uses convention-based page generation.

### MDX slug generation
For MDX nodes, `gatsby-node.js` creates a `slug` field using Gatsby's `createFilePath()` and removes `/markdown/` from the generated path.

### Template mapping
The template is selected from the first segment of the slug.

Example idea:
- a slug that starts with `/articles/...` maps to `src/components/templates/Articles/index.js`
- a slug that starts with `/resources/...` maps to `src/components/templates/Resources/index.js`

This means that changing slugs, folder names, or template names can have build-time consequences.

### Generated tag pages
Tag pages are generated automatically at:

`/tags/<kebab-case-tag>/`

### Generated newsletter pages
Newsletter pages are generated automatically at:

`/newsletter/YYYY-MM`

## Styling model

Styling is legacy and mixed:

- `gatsby-browser.js` imports `theme/global.scss`
- typography is configured in `src/utils/typography.js`
- there is also `src/gatsby-plugin-theme-ui`

Do not assume a single modern styling strategy. Check the local area before changing anything.

## Icons

SVG icons under `static/images/icons` are converted into a React icon map by `src/utils/generateIcons.js`, which writes to:

`src/components/atoms/Icon/icons.js`

Rule:
- do not hand-maintain generated icon output if the source workflow is still intended to be used
- prefer updating source SVGs and rerunning the generation flow

## TypeScript status

This is not a true TypeScript-first repo.

`tsconfig.json` is mainly used for:
- `allowJs: true`
- `noEmit: true`
- path aliases such as `components/*`, `images/*`, and `theme/*`

Interpret this as:
- JavaScript remains the main implementation language
- path alias support exists
- large TS migrations are likely out of scope for normal tasks

## Recommended model behavior

### Good default behavior
A good AI assistant for this repo should:
- preserve the current stack unless asked to migrate it
- make small, localized changes
- prefer editing markdown or MDX content when the task is content-related
- check template conventions before creating new pages
- respect existing folder naming and slug patterns
- avoid introducing dependencies that require newer Node or Gatsby versions
- be careful with build-time external integrations

### Bad default behavior
A poor AI assistant for this repo would:
- upgrade packages reflexively
- rewrite legacy code to modern patterns without need
- move content from markdown into page components
- assume current best practices from Gatsby 5 or React 18 apply here
- remove apparently odd code without checking whether it protects the build in no-key environments

## Task-specific instructions for future AI work

### When asked to change content
Prefer this order:
1. check `src/markdown`
2. check YAML data files in `src/markdown`
3. only then edit React pages or templates if the content is actually hardcoded

### When asked to fix a page
Check in this order:
1. corresponding file in `src/pages`
2. generated template under `src/components/templates`
3. supporting content in `src/markdown`
4. utility code used by that page

### When asked to add a new content section
Confirm whether it fits an existing slug-to-template convention.
If not, the change may require:
- a new template folder in `src/components/templates`
- compatible markdown placement under `src/markdown`
- possibly updates to page listings or navigation

### When asked to fix local setup
Assume environment issues first:
- wrong Node version
- missing `.env.development`
- missing API keys
- incompatible dependency install caused by modern npm or Node

## Safe summary

This repository should be treated as a **legacy, content-heavy Gatsby 2 site with strict runtime assumptions**. The most reliable AI behavior is conservative: work within the current conventions, preserve compatibility, and avoid upgrades unless migration is the explicit goal.
