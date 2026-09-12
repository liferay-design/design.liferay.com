// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import { fileURLToPath } from 'url'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

const shim = name => fileURLToPath(new URL(`./src/shims/${name}`, import.meta.url))

/**
 * The content uses gatsby-remark-image-attributes syntax: `![](img.jpg#width=49%;)`.
 * Astro's image collector runs decodeURI on the URL and the literal `%;` crashes
 * it. Strip the `#…` fragment (so relative co-located images resolve natively)
 * and carry `width=` over as an inline style to preserve side-by-side layouts.
 */
function fixContentImages() {
	const walk = node => {
		if (node.type === 'image' && typeof node.url === 'string') {
			const hash = node.url.indexOf('#')
			if (hash !== -1) {
				const frag = node.url.slice(hash + 1)
				node.url = node.url.slice(0, hash)
				const m = frag.match(/width=([\d.]+%?)/)
				if (m) {
					node.data = node.data || {}
					node.data.hProperties = {
						...(node.data.hProperties || {}),
						style: `width:${m[1]}`,
					}
				}
			}
		}
		if (node.children) node.children.forEach(walk)
	}
	return tree => walk(tree)
}

// https://astro.build
export default defineConfig({
	site: 'https://design.liferay.com',
	// Reuse the existing repo assets (images, icons, files, videos) untouched —
	// content frontmatter references them as absolute `/images/…` paths.
	publicDir: '../static',
	trailingSlash: 'ignore',
	markdown: {
		remarkPlugins: [remarkGfm, fixContentImages],
		rehypePlugins: [
			rehypeSlug,
			[rehypeAutolinkHeadings, { behavior: 'wrap', properties: { className: 'nice-anchor' } }],
		],
	},
	integrations: [
		mdx(),
		react(),
		sitemap(),
	],
	vite: {
		resolve: {
			// Map the Gatsby-era bare specifiers that content MDX imports to
			// local static shims (no theme-ui/emotion/gatsby runtime).
			alias: {
				'theme-ui': shim('themeui.ts'),
				'components/atoms': shim('atoms.ts'),
				'components/molecules': shim('molecules.ts'),
				gatsby: shim('gatsby.ts'),
			},
		},
	},
})
