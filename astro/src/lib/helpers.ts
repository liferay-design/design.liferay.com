// Ported from src/utils/index.js (Gatsby) — minus the Firebase auth hooks,
// which were client-only and are reintroduced later as an island if needed.

/** Strip diacritics: "David Aragonés" -> "david aragones" */
function deburr(input: string): string {
	return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** "Daniela de la Garza" -> "de-la-garza-daniela" (lastnames + firstname) */
export function makeAuthorSlug(input: string): string {
	const normalized = deburr(input.toLowerCase())
	const parts = normalized.split(' ')
	const firstName = parts.shift() as string
	const lastName = parts.slice()
	return lastName.concat([firstName]).join('-')
}

const IMAGE_PATH = '/images/headshots/'

export function headshotPath(name: string): string {
	return IMAGE_PATH + makeAuthorSlug(name) + '.jpg'
}

export function avatarPath(name: string): string {
	return IMAGE_PATH + makeAuthorSlug(name) + '-h.jpg'
}

export function firstWord(input: string): string {
	return input.split(' ')[0]
}

/** Strip a trailing `/index` and surrounding slashes from a glob-loader id. */
export function cleanId(id: string): string {
	return id.replace(/\/index$/i, '').replace(/^\/+|\/+$/g, '')
}

/** kebab-case a tag the way lodash.kebabCase did for the old /tags/<x>/ URLs. */
export function kebab(input: string): string {
	return deburr(input)
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

/** Re-implements Gatsby's removed timeToRead: ~200 wpm, min 1. */
export function minRead(body?: string): number {
	if (!body) return 1
	const words = (body.match(/\S+/g) || []).length
	return Math.max(1, Math.ceil(words / 200))
}

/** Articles date -> "April 25, 2026" */
export function formatLongDate(date: Date): string {
	return new Intl.DateTimeFormat('en-US', {
		month: 'long',
		day: '2-digit',
		year: 'numeric',
	}).format(date)
}

const MONTHS = [
	'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
	'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * Parse the events' naive "YYYY-MM-DDThh:mm" timestamp without timezone shift.
 * Returns the calendar parts the Events template needs.
 */
export function parseEventDate(value?: string) {
	if (!value) return null
	const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/)
	if (!m) return null
	const [, y, mo, d, hh, mm] = m
	const year = Number(y)
	const month = Number(mo) - 1
	const day = Number(d)
	const hours = hh != null ? Number(hh) : 0
	const minutes = mm != null ? Number(mm) : 0
	const hasTime = hh != null
	const date = new Date(year, month, day, hours, minutes)
	return { date, year, month, day, hours, minutes, hasTime }
}

export function eventMonthShort(value?: string): string {
	const p = parseEventDate(value)
	return p ? MONTHS[p.month] : ''
}

export function eventDay(value?: string): string {
	const p = parseEventDate(value)
	return p ? String(p.day).padStart(2, '0') : ''
}

/** "19:00" -> "7:00pm"; returns '' for midnight (matches the old 12:00am skip) */
export function eventTime(value?: string): string {
	const p = parseEventDate(value)
	if (!p || !p.hasTime) return ''
	let h = p.hours
	const ampm = h >= 12 ? 'pm' : 'am'
	h = h % 12
	if (h === 0) h = 12
	const mm = String(p.minutes).padStart(2, '0')
	const formatted = `${h}:${mm}${ampm}`
	return formatted === '12:00am' ? '' : formatted
}

/** Builds the SocialIcons list from an author's `links` map (port of Team template). */
const SOCIAL_URLS: Record<string, (handle: string) => string> = {
	behance: h => 'https://www.behance.net/' + h,
	discord: h => 'https://www.discord.com/' + h,
	dribbble: h => 'https://dribbble.com/' + h,
	figma: h => 'https://figma.com/@' + h,
	github: h => 'https://github.com/' + h,
	linkedin: h => 'https://linkedin.com/in/' + h,
	instagram: h => 'https://www.instagram.com/' + h,
	medium: h => 'https://medium.com/@' + h,
	twitter: h => 'https://twitter.com/' + h,
	unsplash: h => 'https://unsplash.com/@' + h,
	webflow: h => 'https://webflow.com/' + h,
}

export interface Social {
	url: string
	name: string
}

export function buildSocials(
	links: Record<string, string> | undefined,
	fallbackIcon?: string,
): Social[] {
	if (!links) return []
	const socials: Social[] = []
	for (const [name, handle] of Object.entries(links)) {
		if (name === 'website') {
			socials.push({ url: handle, name: fallbackIcon || 'website' })
		} else if (SOCIAL_URLS[name]) {
			socials.push({ url: SOCIAL_URLS[name](handle), name })
		}
	}
	return socials
}
