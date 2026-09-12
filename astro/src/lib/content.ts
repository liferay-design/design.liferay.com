import { getCollection, type CollectionEntry } from 'astro:content'

export type Author = CollectionEntry<'authors'>['data']
export type Office = CollectionEntry<'offices'>['data']

let _authors: Map<string, Author> | null = null
let _offices: Map<string, Office> | null = null

/** Map authors by their `id` (the full name used as a foreign key in frontmatter). */
export async function authorsMap(): Promise<Map<string, Author>> {
	if (_authors) return _authors
	const entries = await getCollection('authors')
	_authors = new Map(entries.map(e => [e.data.id, e.data]))
	return _authors
}

export async function getAuthor(name?: string): Promise<Author | undefined> {
	if (!name) return undefined
	return (await authorsMap()).get(name)
}

export async function officesMap(): Promise<Map<string, Office>> {
	if (_offices) return _offices
	const entries = await getCollection('offices')
	_offices = new Map(entries.map(e => [e.data.id, e.data]))
	return _offices
}

export async function getOffice(name?: string): Promise<Office | undefined> {
	if (!name) return undefined
	return (await officesMap()).get(name)
}
