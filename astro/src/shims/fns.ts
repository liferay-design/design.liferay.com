// Non-component exports that content imports from 'gatsby' / 'theme-ui'.
export function withPrefix(path: string): string {
	if (!path) return path
	return path.startsWith('/') || /^https?:/.test(path) ? path : '/' + path
}
export const graphql = (..._a: unknown[]) => undefined
export const useStaticQuery = (..._a: unknown[]) => ({})
export const jsx = (..._a: unknown[]) => null
