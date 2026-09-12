// Helpers for the Figma Components docs. Turn the raw Figma variable map
// (flat "Group/Subgroup/name" -> value) into categorised, render-ready lists.

export interface TokenItem {
	name: string
	value: string
}
export interface TypographyToken {
	name: string
	family?: string
	size?: string
	weight?: string
	lineHeight?: string
	style?: string
}
export interface CategorisedTokens {
	colors: TokenItem[]
	spacing: TokenItem[]
	radius: TokenItem[]
	shadow: TokenItem[]
	opacity: TokenItem[]
	typography: TypographyToken[]
}

// Figma serialises font variables as: Font(family: "SF Pro Text", style: Regular,
// size: 14, weight: 400, lineHeight: 1.5, letterSpacing: 0)
function parseFont(value: string): Omit<TypographyToken, 'name'> {
	const grab = (k: string) => {
		const m = value.match(new RegExp(`${k}:\\s*"?([^,")]+)"?`))
		return m ? m[1].trim() : undefined
	}
	return {
		family: grab('family'),
		style: grab('style'),
		size: grab('size'),
		weight: grab('weight'),
		lineHeight: grab('lineHeight'),
	}
}

const isHex = (v: string) => /^#([0-9a-f]{3,8})$/i.test(v.trim())

export function categoriseTokens(tokens?: Record<string, string>): CategorisedTokens {
	const out: CategorisedTokens = {
		colors: [],
		spacing: [],
		radius: [],
		shadow: [],
		opacity: [],
		typography: [],
	}
	if (!tokens) return out
	for (const [name, value] of Object.entries(tokens)) {
		const key = name.toLowerCase()
		if (value.startsWith('Font(')) {
			out.typography.push({ name, ...parseFont(value) })
		} else if (value.startsWith('Effect(') || key.startsWith('shadow')) {
			out.shadow.push({ name, value })
		} else if (isHex(value) || key.startsWith('color') || key.includes('/$') || /\$/.test(name)) {
			out.colors.push({ name, value })
		} else if (key.startsWith('opacity')) {
			out.opacity.push({ name, value })
		} else if (key.startsWith('border radius') || key.includes('radius') || key.includes('rounded')) {
			out.radius.push({ name, value })
		} else if (key.startsWith('spacing') || key.includes('spacing')) {
			out.spacing.push({ name, value })
		} else {
			// unknown numeric → treat as spacing-ish so nothing is silently dropped
			out.spacing.push({ name, value })
		}
	}
	// de-dupe colors by value+name (a few Figma vars alias the same hex)
	const seen = new Set<string>()
	out.colors = out.colors.filter(c => {
		const k = c.name + c.value
		if (seen.has(k)) return false
		seen.add(k)
		return true
	})
	return out
}

// "92:1961" -> URL on the new Lexicon Components file
export function figmaNodeUrl(figma: {
	fileKey: string
	fileName?: string
	componentSetNodeId?: string
	pageNodeId?: string
}): string {
	const node = figma.componentSetNodeId || figma.pageNodeId
	const file = (figma.fileName || 'Lexicon-Components').replace(/\s+/g, '-')
	const base = `https://www.figma.com/design/${figma.fileKey}/${file}`
	return node ? `${base}?node-id=${node.replace(':', '-')}` : base
}

// Total number of variant permutations across all property axes.
export function variantPermutations(
	properties?: { name: string; values: string[] }[],
): number {
	if (!properties || !properties.length) return 0
	return properties.reduce((n, p) => n * (p.values.length || 1), 1)
}
