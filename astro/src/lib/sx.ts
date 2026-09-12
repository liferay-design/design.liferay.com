// Minimal sx-object -> inline-style converter for the handful of theme-ui
// props authored directly inside Lexicon MDX (gridTemplateColumns, gridGap,
// textAlign, gap…). Values there are already CSS-ready strings.
const SCALE = ['0', '0.4rem', '1rem', '2rem', '3rem', '8rem', '16rem', '32rem']

function camelToKebab(key: string): string {
	return key.replace(/[A-Z]/g, m => '-' + m.toLowerCase())
}

function resolveValue(key: string, value: unknown): string {
	// theme-ui spacing props given as a scale index
	if (typeof value === 'number' && /gap|margin|padding|^m[trblxy]?$|^p[trblxy]?$/i.test(key)) {
		return SCALE[value] ?? `${value}`
	}
	return String(value)
}

export function sxToStyle(sx: unknown): string | undefined {
	if (!sx || typeof sx !== 'object') return undefined
	const out: string[] = []
	for (const [key, value] of Object.entries(sx as Record<string, unknown>)) {
		if (value == null || typeof value === 'object') continue
		out.push(`${camelToKebab(key)}:${resolveValue(key, value)}`)
	}
	return out.length ? out.join(';') : undefined
}
