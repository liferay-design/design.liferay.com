import type { APIRoute, GetStaticPaths } from 'astro'
import { getCollection } from 'astro:content'

// Static JSON export of a single token group, linked from the foundation page's
// "Download tokens" button (e.g. /lexicon/figma-foundations/colors.json).
export const getStaticPaths: GetStaticPaths = async () => {
	const items = await getCollection('figmaFoundations')
	return items.map(entry => ({ params: { slug: entry.data.slug }, props: { entry } }))
}

export const GET: APIRoute = ({ props }) => {
	const c = (props as { entry: { data: any } }).entry.data
	const body = JSON.stringify(
		{ name: c.name, slug: c.slug, source: c.figma, tokens: c.tokens ?? {} },
		null,
		2,
	)
	return new Response(body, { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
}
