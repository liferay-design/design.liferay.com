import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

// Static JSON export of every token group, linked from the Figma Foundations
// index "Download all tokens" button (/lexicon/figma-foundations/all.json).
export const GET: APIRoute = async () => {
	const items = (await getCollection('figmaFoundations')).sort(
		(a, b) => (a.data.order ?? 999) - (b.data.order ?? 999),
	)
	const groups: Record<string, { name: string; tokens: Record<string, string> }> = {}
	for (const c of items) groups[c.data.slug] = { name: c.data.name, tokens: c.data.tokens ?? {} }
	const body = JSON.stringify(
		{ source: 'Lexicon Foundations', fileKey: items[0]?.data.figma.fileKey, groups },
		null,
		2,
	)
	return new Response(body, { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
}
