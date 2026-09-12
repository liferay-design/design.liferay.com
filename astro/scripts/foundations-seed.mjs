// Foundations: generate the /lexicon/foundations data from the Figma file
// "Lexicon Foundations" (one JSON per token group → one sub-page).
//
// Token values live in foundations-tokens.json, keyed by slug. They come from
// the Figma desktop MCP `get_variable_defs` run on each page node, filtered to
// the group that page documents (the page chrome reuses other tokens, so we
// keep only the matching prefix). To refresh: re-run get_variable_defs on each
// pageNodeId below, paste the group's variables into foundations-tokens.json,
// then `node scripts/foundations-seed.mjs`.
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'src', 'data', 'figma-foundations')
const FILE_KEY = 'uJmaBABXsx9voFQEdn20Di'
const FILE_NAME = 'Lexicon Foundations'

// name, slug, order, pageNodeId, description
const REGISTRY = [
	['Colors', 'colors', 10, '1:14', 'The Lexicon color palette: brand, neutral and state colors, plus the chart ramps.'],
	['Typography', 'typography', 20, '1:15', 'The type scale — every size/weight pairing used across the system.'],
	['Spacing', 'spacing', 30, '1:16', 'The spacing scale used for padding, gaps and layout rhythm.'],
	['Border Radius', 'border-radius', 40, '18:176', 'Corner radius tokens, from subtle rounding to fully pill-shaped.'],
	['Opacity', 'opacity', 50, '245:3', 'Translucency tokens for overlays, disabled states and scrims.'],
	['Shadow', 'shadow', 60, '1:17', 'Elevation tokens — the drop shadows applied to surfaces by role.'],
]

async function main() {
	const tokens = JSON.parse(await readFile(join(__dirname, 'foundations-tokens.json'), 'utf8'))
	await mkdir(OUT, { recursive: true })

	// clear stale files
	for (const f of await readdir(OUT).catch(() => [])) {
		if (f.endsWith('.json')) await rm(join(OUT, f))
	}

	for (const [name, slug, order, pageNodeId, description] of REGISTRY) {
		const data = {
			name,
			slug,
			order,
			description,
			figma: { fileKey: FILE_KEY, fileName: FILE_NAME, pageNodeId },
			tokens: tokens[slug] || {},
		}
		await writeFile(join(OUT, `${slug}.json`), JSON.stringify(data, null, '\t') + '\n')
		console.log(`  ✓ ${slug} (${Object.keys(data.tokens).length} tokens)`)
	}
	console.log('Done. Rebuild with: npm run build')
}

main().catch(e => { console.error(e); process.exit(1) })
