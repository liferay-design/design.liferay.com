# Lexicon Docs Sync — Figma plugin

Lets a designer push the Lexicon **tokens** from Figma to the docs site **as a
pull request**, with no terminal, no git and no token handling.

```
Designer in Figma → "Sync Foundations → open PR"
   → plugin reads the variables (native API, no REST token)
   → UI POSTs the generated JSON to the figma-sync Netlify function
   → function commits the files on a branch and opens a PR   (GitHub token stays server-side)
   → Netlify builds the preview → review → merge → live
```

The plugin reads design variables with the Figma API directly, so it needs **no
REST token and no Enterprise plan** (which is what blocks the headless scripts).

## Pieces

| Where | What |
|---|---|
| `figma-plugin/` | the plugin: `manifest.json`, `code.js` (reads variables, builds the files), `ui.html` (settings + Sync button + PR link) |
| `netlify/functions/figma-sync.js` | the endpoint: validates a secret, commits the files, opens a PR. No deps (uses `fetch` + the GitHub API). |

---

## ⚠️ STATUS — read this first (2026-06)

The flow is **built and pushed but NOT yet wired up end-to-end.** What's done and
what's pending:

- ✅ Plugin (`code.js` / `ui.html` / `manifest.json`) — committed on branch
  **`figma-plugin-poc`** (PR #1332). Syntax-validated.
- ✅ Backend function `netlify/functions/figma-sync.js` — committed on the same
  branch. Syntax-validated. **Never executed against real GitHub yet.**
- ❌ **Not deployed to the production domain.** The function currently lives
  ONLY on `figma-plugin-poc`. It is NOT on `master` and NOT on
  `migration-to-astro`. So `https://liferaydesign.netlify.app/.netlify/functions/figma-sync`
  returns **404** — that's expected, the production branch doesn't have the
  function.
- ❌ Netlify env vars (`GITHUB_TOKEN`, `SYNC_SECRET`, `GITHUB_BASE`) not set yet.
- ❌ Plugin never imported/run in Figma yet.

### How to test it before merging (deploy-preview URL)

Every PR gets its own Netlify deploy with its own functions. Use the **deploy
preview** URL of PR #1332, not the production domain:

```
https://deploy-preview-1332--liferaydesign.netlify.app/.netlify/functions/figma-sync
```

Open it in a browser: **"Method not allowed"** = the function is live (it only
accepts POST). **404** = that deploy didn't build the function yet.

### Pending fix to make it work on the PRODUCTION domain (the "B" task)

The function must live on the branch that becomes production — the Astro branch —
not on a separate PoC branch. Otherwise, after Astro merges to `master`, the
public site will STILL 404 on the function.

Detail: on `migration-to-astro`, `netlify.toml` has `base = "astro"`, so Netlify
resolves the functions directory **relative to `astro/`**. So the move is:

1. Put the function at **`astro/netlify/functions/figma-sync.js`** (under base).
2. Add to **`astro/netlify.toml`**:
   ```toml
   [functions]
     directory = "netlify/functions"
     node_bundler = "esbuild"
   ```
3. Commit on `migration-to-astro` (PR #1331). Then the production domain serves
   the function once that PR merges.

(The copy on `figma-plugin-poc` can stay for PoC testing, or be removed once the
function lives on the Astro branch.)

---

## The two "Connection" fields in the plugin

The plugin can't hold the GitHub token (any holder of the plugin could write to
the repo). So the plugin never talks to GitHub directly — it sends the files to
*your* Netlify function, and the function (which holds the token, server-side)
opens the PR. To do that the plugin needs two things:

| Field | What it is | Example |
|---|---|---|
| **Sync endpoint URL** | the address of your function on Netlify — where the plugin sends the JSON | `https://liferaydesign.netlify.app/.netlify/functions/figma-sync` (or the deploy-preview URL while testing) |
| **Sync secret** | a shared password; the plugin sends it on every request, the function compares it to its own `SYNC_SECRET` and rejects (401) if it doesn't match — the only thing stopping a stranger from using your function | a random string you invent, e.g. `lexicon-sync-9f2k7x` |

**The plugin's `Sync secret` must be the exact same value as the `SYNC_SECRET`
env var in Netlify.** They are two sides of the same password.

---

## PART 1 — One-time setup (technical, done once, ~10 min)

### Step 1 — Create a GitHub token
This is the token the function uses to open PRs. It lives only in Netlify, never
in the plugin.

1. GitHub → your avatar → **Settings** → **Developer settings** → **Personal
   access tokens** → **Fine-grained tokens** → **Generate new token**.
2. **Repository access** → *Only select repositories* → `liferay-design/liferay.design`.
3. **Permissions**:
   - **Contents**: Read and write
   - **Pull requests**: Read and write
4. Generate and **copy** the token (`github_pat_…`) — shown only once.

### Step 2 — Invent the secret
Any random string, e.g. `lexicon-sync-9f2k7x`. Write it down — you'll use it
twice (Netlify + plugin).

### Step 3 — Set the Netlify environment variables
Netlify → your site → **Site configuration → Environment variables → Add a
variable**:

| Key | Value |
|---|---|
| `GITHUB_TOKEN` | the token from Step 1 (`repo`: Contents + Pull requests) |
| `SYNC_SECRET` | the secret from Step 2 (must equal the plugin's "Sync secret") |
| `GITHUB_BASE` | **`migration-to-astro`** for now (the docs data lives there); switch to `master` after the Astro migration merges. Defaults to `master`. |
| `GITHUB_REPO` | optional, defaults to `liferay-design/liferay.design` |

### Step 4 — Deploy
The function only exists after Netlify deploys with these vars and the
`[functions]` config present on the deployed branch. The endpoint is then:
```
https://<your-netlify-site>/.netlify/functions/figma-sync
```
Sanity check: opening that URL in a browser should say **"Method not allowed"**
(it only accepts POST). That means it's alive.

---

## PART 2 — Use it (each designer)

### Step 5 — Import the plugin (first time only)
1. Figma **desktop** → open the **Lexicon Foundations** file.
2. **Plugins → Development → Import plugin from manifest…** → `figma-plugin/manifest.json`.

### Step 6 — Connect (first time per person)
1. Run the plugin → **Connection**.
2. **Sync endpoint URL** → paste the URL from Step 4 (or the deploy-preview URL).
3. **Sync secret** → paste the secret from Step 2.
4. **Save connection** (stored in Figma `clientStorage`, never committed).

### Step 7 — Sync
1. (Optional) **Preview** — shows what it will extract without sending anything.
2. **↑ Sync Foundations → open PR**.
3. Follow the **review it ↗** link to the PR. Merge it → Netlify deploys.

---

## Security

- The GitHub token lives only in Netlify env vars — never in the plugin.
- The function rejects requests without the right `SYNC_SECRET`, and only writes
  paths under `astro/src/data/figma-foundations/`, `astro/src/data/figma-components/`
  and `static/images/lexicon/figma/`.
- It always opens a **PR** (never pushes to the base branch), so changes are
  reviewed before they reach the public site.

## Scope & next steps

- **Done:** Foundations tokens (colors, typography, spacing, border-radius,
  opacity, shadow) — produces the 6 `figma-foundations/*.json` files.
- **Next — deploy:** the "B" task above (move the function onto the Astro branch
  so the production domain serves it), set the Netlify env vars, run it once.
- **Next — Components:** same flow plus component-set variants and **image
  export** (`node.exportAsync` → committed as base64; the function already
  accepts `contentBase64`). The function is generic, so this is mostly plugin
  work.
