// Lexicon Docs Sync — Figma plugin (sandbox side).
//
// Runs with the designer's session, so it reads variables / component variants
// / images natively — no REST token, no Enterprise scope. It builds the docs
// data files and hands them to the UI, which POSTs them to the figma-sync
// Netlify function (the only side that can do network requests). The function
// opens a PR; Netlify then rebuilds the site.

figma.showUI(__html__, { width: 540, height: 760, themeColors: true })

const FOUNDATIONS_KEY = 'uJmaBABXsx9voFQEdn20Di'

// One foundation sub-page per token group. `match` picks the group's variables
// out of the full local-variable set (the page chrome reuses other tokens).
const FOUNDATIONS = [
	{ name: 'Colors', slug: 'colors', order: 10, pageNodeId: '1:14', match: n => n.startsWith('Color/'), description: 'The Lexicon color palette: brand, neutral and state colors, plus the chart ramps.' },
	{ name: 'Typography', slug: 'typography', order: 20, pageNodeId: '1:15', match: n => /^\d+\//.test(n), description: 'The type scale — every size/weight pairing used across the system.' },
	{ name: 'Spacing', slug: 'spacing', order: 30, pageNodeId: '1:16', match: n => n.startsWith('Spacing/'), description: 'The spacing scale used for padding, gaps and layout rhythm.' },
	{ name: 'Border Radius', slug: 'border-radius', order: 40, pageNodeId: '18:176', match: n => n.startsWith('Border Radius/'), description: 'Corner radius tokens, from subtle rounding to fully pill-shaped.' },
	{ name: 'Opacity', slug: 'opacity', order: 50, pageNodeId: '245:3', match: n => n.startsWith('Opacity/'), description: 'Translucency tokens for overlays, disabled states and scrims.' },
	{ name: 'Shadow', slug: 'shadow', order: 60, pageNodeId: '1:17', match: n => n.startsWith('Shadow/'), description: 'Elevation tokens — the drop shadows applied to surfaces by role.' },
]

const hex2 = n => Math.round(n * 255).toString(16).padStart(2, '0')
const rgbaToHex = c => `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}` + (c.a === undefined || c.a === 1 ? '' : hex2(c.a))

async function resolveValue(variable, byId) {
	const col = byId[variable.variableCollectionId]
	const modeId = col ? col.defaultModeId : Object.keys(variable.valuesByMode)[0]
	let val = variable.valuesByMode[modeId]
	if (val && typeof val === 'object' && val.type === 'VARIABLE_ALIAS') {
		const ref = await figma.variables.getVariableByIdAsync(val.id)
		if (ref) return resolveValue(ref, byId)
	}
	if (variable.resolvedType === 'COLOR' && val && typeof val === 'object') return rgbaToHex(val)
	if (variable.resolvedType === 'FLOAT') return String(val)
	return String(val)
}

async function extractTokens() {
	const [vars, collections] = await Promise.all([
		figma.variables.getLocalVariablesAsync(),
		figma.variables.getLocalVariableCollectionsAsync(),
	])
	const byId = Object.fromEntries(collections.map(c => [c.id, c]))
	const tokens = {}
	for (const v of vars) tokens[v.name] = await resolveValue(v, byId)
	return tokens
}

function groupsPreview(tokens) {
	const groups = {}
	for (const [name, value] of Object.entries(tokens)) {
		const g = name.split('/')[0] || 'Other'
		;(groups[g] = groups[g] || []).push({ name, value })
	}
	return { count: Object.keys(tokens).length, groups }
}

function extractComponentSets() {
	return figma.currentPage.findAllWithCriteria({ types: ['COMPONENT_SET'] }).map(set => {
		const variants = set.children.filter(c => c.type === 'COMPONENT')
		const axes = {}
		for (const c of variants) {
			for (const part of c.name.split(',')) {
				const i = part.indexOf('=')
				if (i === -1) continue
				const key = part.slice(0, i).trim()
				const value = part.slice(i + 1).trim()
				if (!key || !value) continue
				;(axes[key] = axes[key] || new Set()).add(value)
			}
		}
		return { name: set.name, nodeId: set.id, variantCount: variants.length, properties: Object.entries(axes).map(([name, values]) => ({ name, values: [...values] })) }
	})
}

// Build the 6 foundation data files from the local variables.
async function buildFoundationFiles() {
	const tokens = await extractTokens()
	const fileKey = figma.fileKey || FOUNDATIONS_KEY
	const fileName = figma.root.name
	const files = FOUNDATIONS.map(f => {
		const groupTokens = {}
		for (const [name, value] of Object.entries(tokens)) if (f.match(name)) groupTokens[name] = value
		const data = {
			name: f.name,
			slug: f.slug,
			order: f.order,
			description: f.description,
			figma: { fileKey, fileName, pageNodeId: f.pageNodeId },
			tokens: groupTokens,
		}
		return {
			path: `astro/src/data/figma-foundations/${f.slug}.json`,
			content: JSON.stringify(data, null, '\t') + '\n',
			tokenCount: Object.keys(groupTokens).length,
		}
	})
	return { files, fileName }
}

async function loadConfig() {
	const endpoint = (await figma.clientStorage.getAsync('endpoint')) || ''
	const secret = (await figma.clientStorage.getAsync('secret')) || ''
	figma.ui.postMessage({ type: 'config', endpoint, secret })
}

figma.ui.onmessage = async msg => {
	try {
		if (msg.type === 'init') {
			await loadConfig()
		} else if (msg.type === 'save-config') {
			await figma.clientStorage.setAsync('endpoint', msg.endpoint || '')
			await figma.clientStorage.setAsync('secret', msg.secret || '')
			figma.ui.postMessage({ type: 'saved' })
		} else if (msg.type === 'extract') {
			const tokens = await extractTokens()
			figma.ui.postMessage({
				type: 'preview',
				fileName: figma.root.name,
				page: figma.currentPage.name,
				tokens: groupsPreview(tokens),
				componentSets: extractComponentSets(),
			})
		} else if (msg.type === 'build-foundations') {
			const { files, fileName } = await buildFoundationFiles()
			figma.ui.postMessage({ type: 'foundation-files', files, fileName })
		}
	} catch (e) {
		figma.ui.postMessage({ type: 'error', message: String((e && e.message) || e) })
	}
}

loadConfig()
