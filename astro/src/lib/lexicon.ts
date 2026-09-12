import { getCollection } from 'astro:content'
import { cleanId } from './helpers'

export interface SidebarNode {
	key: string
	title: string
	slug?: string
	order: number | string
	firstLevel?: boolean
	children: SidebarNode[]
}

function startCase(s: string): string {
	return s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/** Port of the Lexicon template buildSidebarTree (slug-segment nesting). */
export async function buildSidebarTree(): Promise<SidebarNode[]> {
	const entries = await getCollection('lexicon', ({ data }) => data.draft !== true)
	const root: SidebarNode = { key: '', title: '', order: 0, children: [] }

	for (const entry of entries) {
		const id = cleanId(entry.id)
		const segs = id.split('/').filter(Boolean)
		let node = root
		segs.forEach((seg, i) => {
			let child = node.children.find(c => c.key === seg)
			if (!child) {
				child = { key: seg, title: startCase(seg), order: startCase(seg), children: [] }
				node.children.push(child)
			}
			if (i === segs.length - 1) {
				child.title = entry.data.title || startCase(seg)
				child.slug = `/lexicon/${id}`
				child.order = entry.data.order ?? child.title
				child.firstLevel = segs.length === 1
			}
			node = child
		})
	}

	const sortTree = (nodes: SidebarNode[]): SidebarNode[] =>
		nodes
			.sort((a, b) => {
				if (typeof a.order === 'number' && typeof b.order === 'number') return a.order - b.order
				return String(a.order).localeCompare(String(b.order))
			})
			.map(n => ({ ...n, children: sortTree(n.children) }))

	const tree = sortTree(root.children)

	// Inject the generated "Foundations" + "Figma Components" branches at the
	// same top level (orders 200 / 205, beside "Components").
	const foundations = await buildFoundationsNode()
	if (foundations) tree.push(foundations)

	const figma = await buildFigmaComponentsNode()
	if (figma) tree.push(figma)

	return sortTree(tree)
}

/** Top-level "Foundations" sidebar branch built from the foundations collection. */
export async function buildFoundationsNode(): Promise<SidebarNode | undefined> {
	const items = await getCollection('figmaFoundations')
	if (!items.length) return undefined
	const children: SidebarNode[] = items
		.map(c => ({
			key: c.data.slug,
			title: c.data.name,
			slug: `/lexicon/figma-foundations/${c.data.slug}`,
			order: c.data.order ?? c.data.name,
			children: [],
		}))
		.sort((a, b) => {
			if (typeof a.order === 'number' && typeof b.order === 'number') return a.order - b.order
			return String(a.order).localeCompare(String(b.order))
		})
	return {
		key: 'figma-foundations',
		title: 'Figma Foundations',
		slug: '/lexicon/figma-foundations',
		order: 198,
		firstLevel: true,
		children,
	}
}

/** Top-level "Figma Components" sidebar branch built from the figmaComponents collection. */
export async function buildFigmaComponentsNode(): Promise<SidebarNode | undefined> {
	const comps = await getCollection('figmaComponents')
	if (!comps.length) return undefined
	const children: SidebarNode[] = comps
		.map(c => ({
			key: c.data.slug,
			title: c.data.name,
			slug: `/lexicon/figma-components/${c.data.slug}`,
			order: c.data.order ?? c.data.name,
			children: [],
		}))
		.sort((a, b) => {
			if (typeof a.order === 'number' && typeof b.order === 'number') return a.order - b.order
			return String(a.order).localeCompare(String(b.order))
		})
	return {
		key: 'figma-components',
		title: 'Figma Components',
		slug: '/lexicon/figma-components',
		order: 205,
		firstLevel: true,
		children,
	}
}
