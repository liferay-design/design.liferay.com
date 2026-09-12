// Figma → Figma Components: pull real descriptions + render images via the REST API.
//
// Needs a read-only Figma token. Put it in astro/.env as FIGMA_ACCESS_TOKEN=...
// (the file is gitignored — the token is never committed) or export it in the shell.
//
//   cd astro && node scripts/figma-export.mjs            # all components
//   cd astro && node scripts/figma-export.mjs alert badge  # only these slugs
//
// For each component it:
//   1. reads figma.pageNodeId from src/data/figma-components/<slug>.json
//   2. fetches the page subtree, finds the COMPONENT_SET (variants) and any
//      "Playground" frame, plus the on-page "Description" text
//   3. exports those frames to static/images/lexicon/figma/<slug>(-playground).png
//   4. patches the JSON with description + componentSetNodeId + screenshot
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA = join(__dirname, '..', 'src', 'data', 'figma-components')
const IMG_DIR = join(__dirname, '..', '..', 'static', 'images', 'lexicon', 'figma')
const IMG_PUBLIC = '/images/lexicon/figma'
const FILE_KEY = 'YNNkt9Xd6ImDtEvIz4tETF'
const SCALE = 2

// load token from env (several common names) or astro/.env
const TOKEN_NAMES = ['FIGMA_ACCESS_TOKEN', 'FIGMA_TOKEN', 'FIGMA_PAT', 'FIGMA_API_TOKEN']
async function getToken() {
	for (const name of TOKEN_NAMES) {
		if (process.env[name]) return process.env[name]
	}
	try {
		const env = await readFile(join(__dirname, '..', '.env'), 'utf8')
		for (const name of TOKEN_NAMES) {
			const m = env.match(new RegExp(`^\\s*${name}\\s*=\\s*(.+)\\s*$`, 'm'))
			if (m) return m[1].replace(/['"]/g, '').trim()
		}
	} catch {}
	return null
}

const api = (token, path) =>
	fetch(`https://api.figma.com/v1${path}`, { headers: { 'X-Figma-Token': token } }).then(r => {
		if (!r.ok) throw new Error(`Figma API ${r.status} on ${path}`)
		return r.json()
	})

// depth-first helpers over a Figma node tree
function find(node, pred) {
	if (!node) return null
	if (pred(node)) return node
	for (const c of node.children || []) {
		const hit = find(c, pred)
		if (hit) return hit
	}
	return null
}
function collectText(node) {
	const out = []
	const walk = n => {
		if (!n) return
		if (n.type === 'TEXT' && n.characters) out.push({ name: n.name, text: n.characters.trim() })
		;(n.children || []).forEach(walk)
	}
	walk(node)
	return out
}

async function download(url, dest) {
	const res = await fetch(url)
	if (!res.ok) throw new Error(`download ${res.status}`)
	await pipeline(Readable.fromWeb(res.body), createWriteStream(dest))
}

async function main() {
	const token = await getToken()
	if (!token) {
		console.error(
			[
				'',
				'✖ No Figma token found.',
				'',
				'  This importer needs a Figma personal access token to read the',
				'  "Lexicon Components" library.',
				'',
				'  1. Create one: https://www.figma.com/developers/api#access-tokens',
				'     (Figma → Settings → Security → Personal access tokens)',
				'  2. Read access is enough for images/variants/descriptions.',
				'     (Design tokens/variables need a Figma Enterprise plan + the',
				'      file_variables:read scope; otherwise fill them via the Figma',
				'      desktop MCP get_variable_defs.)',
				'  3. Make it available, either:',
				'       echo \'FIGMA_ACCESS_TOKEN="figd_..."\' >> astro/.env   # gitignored',
				'     or for your shell:',
				'       export FIGMA_ACCESS_TOKEN="figd_..."',
				'',
				'  Then re-run:  node scripts/figma-export.mjs [slug ...]',
				'',
				`  (looked for ${TOKEN_NAMES.join(', ')} in the environment and astro/.env)`,
				'',
			].join('\n'),
		)
		process.exit(1)
	}
	await mkdir(IMG_DIR, { recursive: true })

	const only = process.argv.slice(2)
	const files = (await readdir(DATA)).filter(f => f.endsWith('.json'))
	const comps = []
	for (const f of files) {
		const data = JSON.parse(await readFile(join(DATA, f), 'utf8'))
		if (only.length && !only.includes(data.slug)) continue
		if (data.figma?.pageNodeId) comps.push({ file: f, data })
	}
	console.log(`Processing ${comps.length} components…`)

	// 1) batch-fetch page subtrees (ids endpoint accepts many)
	const ids = comps.map(c => c.data.figma.pageNodeId)
	const nodes = {}
	for (let i = 0; i < ids.length; i += 20) {
		const batch = ids.slice(i, i + 20)
		const res = await api(token, `/files/${FILE_KEY}/nodes?ids=${batch.join(',')}`)
		Object.assign(nodes, res.nodes)
	}

	// 2) resolve set/playground frame ids + description per component
	const toExport = [] // {slug, exportId, kind}
	for (const c of comps) {
		const root = nodes[c.data.figma.pageNodeId]?.document
		if (!root) {
			console.warn(`  ! ${c.data.slug}: page node not found`)
			continue
		}
		const set = find(root, n => n.type === 'COMPONENT_SET')
		// Hero/overview image: the COMPONENT_SET itself (the dashed box with the
		// variant grid) — i.e. the content of the "<Name> Variants" page frame
		// WITHOUT its logo/title/description header. Fall back to the whole
		// variants frame only when there's no component set (single-component pages).
		const variantsFrame = find(
			root,
			n => n.type === 'FRAME' && /\bvariants\b/i.test(n.name),
		)
		// header bits inside the "<Name> Variants" frame to always skip
		const isHeader = n => /logo|paragraph/i.test(n.name) || n.name.trim().startsWith('_')
		// single-component pages (no set): take the content child, not the logo/header
		const variantsContent =
			variantsFrame && !set
				? (variantsFrame.children || []).find(n => !isHeader(n)) || variantsFrame
				: variantsFrame
		const hero = set || variantsContent
		// Playground image: the inner "Playground Container" (the test area) only,
		// dropping the section header ("Playground" + the usage instructions).
		const playgroundSection = find(root, n => n.type === 'FRAME' && /playground/i.test(n.name))
		const playground = playgroundSection
			? find(playgroundSection, n => n.type === 'FRAME' && /^playground container$/i.test(n.name.trim())) ||
			  playgroundSection
			: null
		// description: an on-page TEXT named "Description", else the component-set description,
		// else the longest paragraph on the page
		const texts = collectText(root)
		const named = texts.find(t => /description/i.test(t.name))
		const setDesc = set?.description?.trim()
		const longest = texts.map(t => t.text).filter(t => t.length > 40).sort((a, b) => b.length - a.length)[0]
		const description = (named?.text || setDesc || longest || c.data.description || '').replace(/\s+/g, ' ').trim()

		if (set) {
			c.data.figma.componentSetNodeId = set.id
			// Variant axes + count from the set's COMPONENT children, whose names
			// encode the axes: "Variant=Vertical, Type=Image, State=Default".
			const variants = (set.children || []).filter(n => n.type === 'COMPONENT')
			if (variants.length) c.data.variantCount = variants.length
			const axes = new Map()
			for (const v of variants) {
				for (const part of v.name.split(',')) {
					const eq = part.indexOf('=')
					if (eq === -1) continue
					const key = part.slice(0, eq).trim()
					const val = part.slice(eq + 1).trim()
					if (!key || !val) continue
					if (!axes.has(key)) axes.set(key, new Set())
					axes.get(key).add(val)
				}
			}
			if (axes.size)
				c.data.properties = [...axes].map(([name, vals]) => ({ name, values: [...vals] }))
		}
		if (description) c.data.description = description
		if (hero || playground) c.data.status = 'documented'

		if (hero) toExport.push({ slug: c.data.slug, id: hero.id, kind: 'variants' })
		if (playground) toExport.push({ slug: c.data.slug, id: playground.id, kind: 'playground' })
		c._exports = { hero: !!hero, playground: !!playground }
	}

	// 3) export images. The /images endpoint 400s the *whole* request if a
	// single node can't be rendered, so use small batches and, on failure,
	// retry the batch one id at a time so one bad node doesn't sink the rest.
	const exportIds = toExport.map(e => e.id)
	const urls = {}
	const fetchImages = async ids =>
		Object.assign(
			urls,
			(await api(token, `/images/${FILE_KEY}?ids=${ids.join(',')}&format=png&scale=${SCALE}`)).images,
		)
	for (let i = 0; i < exportIds.length; i += 8) {
		const batch = exportIds.slice(i, i + 8)
		try {
			await fetchImages(batch)
		} catch {
			for (const id of batch) {
				try {
					await fetchImages([id])
				} catch {
					console.warn(`  ! image render failed for node ${id}`)
				}
			}
		}
	}
	for (const e of toExport) {
		const url = urls[e.id]
		if (!url) { console.warn(`  ! no image for ${e.slug} (${e.kind})`); continue }
		const fname = e.kind === 'playground' ? `${e.slug}-playground.png` : `${e.slug}.png`
		await download(url, join(IMG_DIR, fname))
		const c = comps.find(c => c.data.slug === e.slug)
		if (e.kind === 'variants') c.data.screenshot = `${IMG_PUBLIC}/${fname}`
		else c.data.playgroundImage = `${IMG_PUBLIC}/${fname}`
		console.log(`  ✓ ${e.slug} (${e.kind})`)
	}

	// 4) write JSON back
	for (const c of comps) {
		delete c._exports
		await writeFile(join(DATA, c.file), JSON.stringify(c.data, null, '\t') + '\n')
	}
	console.log('Done. Rebuild with: npm run build')
}

main().catch(e => { console.error(e); process.exit(1) })
