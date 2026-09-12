// Inline the existing SVG icon set (../static/images/icons/*.svg) at build
// time. The Gatsby site generated React components from these via SVGR; here we
// just read the raw markup and inject it, preserving `fill="currentColor"` so
// CSS `color` still tints them.
const raw = import.meta.glob('../../../static/images/icons/*.svg', {
	query: '?raw',
	import: 'default',
	eager: true,
}) as Record<string, string>

const icons: Record<string, string> = {}
for (const [path, svg] of Object.entries(raw)) {
	const name = path.split('/').pop()!.replace('.svg', '')
	icons[name] = svg
}

export function getIcon(name: string): string | null {
	return icons[name] ?? null
}
