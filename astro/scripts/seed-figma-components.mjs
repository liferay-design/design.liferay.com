// Seed / bootstrap for the Figma Components docs.
//
// Emits one JSON file per component under src/data/figma-components/.
// The five "deep" entries carry data extracted live from the Figma desktop MCP
// (component-set node id, variant property axes, bound design tokens, anatomy).
// The rest are well-formed stubs (name + Figma node id + description) ready to be
// enriched the same way. See .claude/skills/lexicon-figma-import for how to refresh
// these from Figma (MCP locally, or the REST API in CI).
//
//   node scripts/seed-figma-components.mjs
import { mkdir, writeFile, readdir, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'src', 'data', 'figma-components')

const FILE = { fileKey: 'YNNkt9Xd6ImDtEvIz4tETF', fileName: 'Lexicon Components' }

// ---- font token helper (matches Figma's Font(...) serialisation) ----
const font = (size, weight, style = weight >= 600 ? 'Semibold' : 'Regular') =>
	`Font(family: "SF Pro Text", style: ${style}, size: ${size}, weight: ${weight}, lineHeight: 1.5, letterSpacing: 0)`

// ---- the five components documented in depth (from Figma MCP) ----
const deep = [
	{
		name: 'Alert',
		slug: 'alert',
		pageNodeId: '1:4',
		componentSetNodeId: '92:1961',
		description: 'Alerts capture the attention of the user in an intrusive way to communicate a status or feedback message.',
		clay: 'https://clayui.com/docs/components/alert',
		guidelines: '/lexicon/core-components/alerts',
		screenshot: '/images/lexicon/AlertColors.png',
		variantCount: 28,
		properties: [
			{ name: 'Variant', values: ['Vertical', 'Inline', 'Feedback'] },
			{ name: 'Type', values: ['Toast', 'Embedded', 'Stripe', 'Simple'] },
			{ name: 'Validation', values: ['Info', 'Warning', 'Success', 'Danger'] },
		],
		anatomy: [
			{ part: 'Status icon', description: 'Identifies the message type at a glance.' },
			{ part: 'Type text', description: 'Semi-bold keyword naming the message type.' },
			{ part: 'Description text', description: 'The message body; can span multiple lines and contain links.' },
			{ part: 'Close button', description: 'Dismisses the alert. Optional depending on the use.' },
		],
		tokens: {
			'Color/Info/info': '#2e5aac', 'Color/Info/info-l1': '#89a7e0', 'Color/Info/info-l2': '#eef2fa',
			'Color/Warning/warning': '#b95000', 'Color/Warning/warning-l1': '#ff8f39', 'Color/Warning/warning-l2': '#fff4ec',
			'Color/Success/success': '#287d3c', 'Color/Success/success-l1': '#5aca75', 'Color/Success/success-l2': '#edf9f0',
			'Color/Danger/danger': '#da1414', 'Color/Danger/danger-l1': '#f48989', 'Color/Danger/danger-l2': '#feefef',
			'Color/Light/white': '#ffffff', 'Color/Light/light-l1': '#f7f8f9', 'Color/Primary/primary-l1': '#80acff',
			'Spacing/spacing-1': '2', 'Spacing/spacing-2': '4', 'Spacing/spacing-3': '8', 'Spacing/spacing-4': '12', 'Spacing/spacing-5': '16', 'Spacing/spacing-8': '32',
			'Border Radius/rounded-lg': '8',
			'Shadow/Alert': 'Effect(type: DROP_SHADOW, color: #27283333, offset: (0, 8), radius: 16, spread: 0)',
			'14/Regular': font(14, 400),
		},
	},
	{
		name: 'Badge',
		slug: 'badge',
		pageNodeId: '1:6',
		componentSetNodeId: '63:5098',
		description: 'Badges highlight important information such as notifications, counts or new and unread messages.',
		clay: 'https://clayui.com/docs/components/badge.html',
		guidelines: '/lexicon/core-components/badges',
		screenshot: '/images/lexicon/badges-2.png',
		variantCount: 24,
		properties: [
			{ name: 'Type', values: ['Primary', 'Secondary', 'Info', 'Success', 'Warning', 'Danger'] },
			{ name: 'Translucent', values: ['Off', 'On'] },
			{ name: 'Dark Mode', values: ['False', 'True'] },
		],
		anatomy: [
			{ part: 'Container', description: 'Rounded shape sized to its content.' },
			{ part: 'Value', description: 'Number or short text label, semi-bold.' },
		],
		tokens: {
			'Color/Primary/primary': '#0b5fff', 'Color/Primary/primary-d1': '#0053f0', 'Color/Primary/primary-l1': '#80acff',
			'Color/Secondary/secondary': '#6b6c7e', 'Color/Secondary/secondary-l1': '#a7a9bc', 'Color/Secondary/secondary-l3': '#e7e7ed',
			'Color/Info/info': '#2e5aac', 'Color/Info/info-d1': '#294f98', 'Color/Info/info-l1': '#89a7e0',
			'Color/Success/success': '#287d3c', 'Color/Success/success-d1': '#226a33', 'Color/Success/success-l1': '#5aca75',
			'Color/Warning/warning': '#b95000', 'Color/Warning/warning-d1': '#9f4500', 'Color/Warning/warning-l1': '#ff8f39',
			'Color/Danger/danger': '#da1414', 'Color/Danger/danger-d1': '#c31212', 'Color/Danger/danger-l1': '#f48989',
			'Color/Light/white': '#ffffff',
			'Spacing/spacing-2': '4', 'Border Radius/rounded-full': '999',
			'10/Semibold': font(10, 600),
		},
	},
	{
		name: 'Button',
		slug: 'button',
		pageNodeId: '1:5',
		componentSetNodeId: '145:26649',
		description: 'Buttons communicate an action that happens on user interaction.',
		clay: 'https://clayui.com/docs/components/button',
		guidelines: '/lexicon/core-components/buttons',
		screenshot: '/images/lexicon/buttons-10.png',
		variantCount: 730,
		properties: [
			{ name: 'Type', values: ['Primary', 'Secondary', 'Action', 'Action Outline', 'Borderless', 'Link', 'Localizable'] },
			{ name: 'Size', values: ['Regular', 'Small', 'XS'] },
			{ name: 'Validation', values: ['-', 'Info', 'Success', 'Warning', 'Danger'] },
			{ name: 'State', values: ['Default', 'Hover', 'Focus', 'Active', 'Disabled'] },
			{ name: 'Rounded', values: ['False', 'True'] },
			{ name: 'Icon Only', values: ['False', 'True'] },
		],
		anatomy: [
			{ part: 'Container', description: 'Background and border that define the button type and state.' },
			{ part: 'Label', description: 'Action text. Hidden when Icon Only is true.' },
			{ part: 'Icon', description: 'Optional leading icon, or the only content when Icon Only is true.' },
		],
		tokens: {
			'Color/Primary/primary': '#0b5fff', 'Color/Primary/primary-d1': '#0053f0', 'Color/Primary/primary-d2': '#004ad7', 'Color/Primary/primary-l1': '#80acff',
			'Color/Secondary/secondary': '#6b6c7e', 'Color/Secondary/secondary-l0': '#9393a4',
			'Color/Info/info': '#2e5aac', 'Color/Info/info-d1': '#294f98', 'Color/Info/info-d2': '#234584',
			'Color/Success/success': '#287d3c', 'Color/Success/success-d1': '#226a33', 'Color/Success/success-d2': '#1c5629',
			'Color/Warning/warning': '#b95000', 'Color/Warning/warning-d1': '#9f4500', 'Color/Warning/warning-d2': '#863a00',
			'Color/Danger/danger': '#da1414', 'Color/Danger/danger-d1': '#c31212', 'Color/Danger/danger-d2': '#ab1010',
			'Color/Dark/dark': '#272833', 'Color/Light/white': '#ffffff', 'Color/Light/light': '#f1f2f5', 'Color/Light/light-l1': '#f7f8f9',
			'Spacing/spacing-3': '8', 'Spacing/spacing-4': '12', 'Spacing/spacing-5': '16',
			'Border Radius/rounded-md': '4', 'Border Radius/rounded-lg': '8', 'Border Radius/rounded-full': '999',
			'Opacity/translucent-1': '40',
			'16/Semibold': font(16, 600), '14/Semibold': font(14, 600), '12/Semibold': font(12, 600),
			'16/Regular': font(16, 400), '14/Regular': font(14, 400), '12/Regular': font(12, 400),
		},
	},
	{
		name: 'Label',
		slug: 'label',
		pageNodeId: '1:14',
		componentSetNodeId: '210:3634',
		description: 'Labels are a visual pattern used to categorise information, providing quick and easy recognition.',
		clay: 'https://clayui.com/docs/components/label.html',
		guidelines: '/lexicon/core-components/labels',
		screenshot: '/images/lexicon/labels-11.png',
		variantCount: 20,
		properties: [
			{ name: 'Type', values: ['Secondary', 'Info', 'Success', 'Warning', 'Danger'] },
			{ name: 'Size', values: ['Regular', 'Small'] },
			{ name: 'Bold', values: ['No', 'Yes'] },
		],
		anatomy: [
			{ part: 'Container', description: 'Rounded chip whose colour conveys the category.' },
			{ part: 'Text', description: 'Short categorising label.' },
		],
		tokens: {
			'Color/Info/info-d1': '#294f98', 'Color/Info/info-d2': '#234584', 'Color/Info/info-l1': '#89a7e0', 'Color/Info/info-l2': '#eef2fa',
			'Color/Success/success-d1': '#226a33', 'Color/Success/success-d2': '#1c5629', 'Color/Success/success-l1': '#5aca75', 'Color/Success/success-l2': '#edf9f0',
			'Color/Warning/warning-d1': '#9f4500', 'Color/Warning/warning-d2': '#863a00', 'Color/Warning/warning-l1': '#ff8f39', 'Color/Warning/warning-l2': '#fff4ec',
			'Color/Danger/danger-d1': '#c31212', 'Color/Danger/danger-d2': '#ab1010', 'Color/Danger/danger-l1': '#f48989', 'Color/Danger/danger-l2': '#feefef',
			'Color/Secondary/secondary-l2': '#cdced9', 'Color/Secondary/secondary-l3': '#e7e7ed',
			'Color/Dark/dark-d2': '#111116', 'Color/Light/white': '#ffffff', 'Color/Light/light-l1': '#f7f8f9', 'Color/Primary/primary-l1': '#80acff',
			'Spacing/spacing-1': '2', 'Spacing/spacing-2': '4', 'Spacing/spacing-3': '8',
			'Border Radius/rounded-md': '4',
			'14/Semibold': font(14, 600),
		},
	},
	{
		name: 'Checkbox',
		slug: 'checkbox',
		pageNodeId: '85:2297',
		componentSetNodeId: '159:2711',
		description: 'Checkboxes let users select one or more options from a set, or toggle a single option on and off.',
		clay: 'https://clayui.com/docs/components/checkbox.html',
		screenshot: '/images/lexicon/Checkbox.jpg',
		variantCount: 12,
		properties: [
			{ name: 'State', values: ['Default', 'Focus', 'Disabled', 'Not Localizable'] },
			{ name: 'Checked', values: ['Off', 'On'] },
			{ name: 'Indeterminate', values: ['Off', 'On'] },
		],
		anatomy: [
			{ part: 'Selection control', description: 'The square box that holds the selection state.' },
			{ part: 'Indicator', description: 'Check mark when on, dash when indeterminate.' },
			{ part: 'Label', description: 'Text describing the option.' },
		],
		tokens: {
			'Color/Primary/_primary': '#0b5fff', 'Color/Primary/primary-l1': '#80acff',
			'Color/Secondary/secondary-l0': '#9393a4', 'Color/Dark/dark': '#272833',
			'Color/Light/white': '#ffffff', 'Color/Light/light-l1': '#f7f8f9', 'Light/$light': '#F1F2F5',
			'Spacing/spacing-3': '8', 'Spacing/spacing-4': '12',
			'Border Radius/rounded-md': '4', 'Border Radius/rounded-full': '999',
			'14/Regular': font(14, 400),
		},
	},
]

// ---- the full Lexicon Components library (page node ids from Figma) ----
// name | slug | pageNodeId  (+ optional clay / guidelines / description for stubs)
const registry = [
	['Alert', 'alert', '1:4'],
	['Arrows', 'arrows', '8711:12'],
	['Autocomplete', 'autocomplete', '5906:605'],
	['Badge', 'badge', '1:6'],
	['Breadcrumb', 'breadcrumb', '1:29', { clay: 'https://clayui.com/docs/components/breadcrumb.html' }],
	['Button', 'button', '1:5'],
	['Button Group', 'button-group', '69:1480'],
	['Button Translucent', 'button-translucent', '199:2448'],
	['Card', 'card', '1:7', { clay: 'https://clayui.com/docs/components/card.html', guidelines: '/lexicon/core-components/cards', description: 'Cards are a form of data visualisation focused mainly on displaying images.' }],
	['Checkbox', 'checkbox', '85:2297'],
	['Color Picker', 'color-picker', '1:30', { clay: 'https://clayui.com/docs/components/color-picker.html' }],
	['Date Picker', 'date-picker', '1:32', { clay: 'https://clayui.com/docs/components/date-picker.html' }],
	['Dropdown', 'dropdown', '1:9', { clay: 'https://clayui.com/docs/components/drop-down.html', guidelines: '/lexicon/core-components/dropdowns', description: 'A dropdown menu displays a list of options for the element that triggers it.' }],
	['Dual Listbox', 'dual-listbox', '1:10', { clay: 'https://clayui.com/docs/components/dual-list-box.html' }],
	['Empty State', 'empty-state', '1:11', { clay: 'https://clayui.com/docs/components/empty-state.html', guidelines: '/lexicon/core-components/empty-state' }],
	['Form Sheet', 'form-sheet', '329:8940'],
	['Input: Group', 'input-group', '804:14478'],
	['Input: Search', 'input-search', '332:1404'],
	['Input: Text', 'input-text', '1:12', { clay: 'https://clayui.com/docs/components/form.html' }],
	['Keys', 'keys', '1:13', { guidelines: '/lexicon/core-components/keys' }],
	['Label', 'label', '1:14'],
	['Language Picker', 'language-picker', '5034:12'],
	['List', 'list', '1:15', { clay: 'https://clayui.com/docs/components/list.html', description: 'Lists are a vertical representation of a dataset, grouped by related content.' }],
	['Loading Indicator', 'loading-indicator', '1:16', { clay: 'https://clayui.com/docs/components/loading-indicator.html', guidelines: '/lexicon/core-components/loading-indicator' }],
	['Modal', 'modal', '1:17', { clay: 'https://clayui.com/docs/components/modal.html', guidelines: '/lexicon/core-components/modal', description: 'Modals focus the user on a single task or piece of information in a layer above the page.' }],
	['Multi Select', 'multi-select', '329:8935', { clay: 'https://clayui.com/docs/components/multi-select.html' }],
	['Multi Step Navigation', 'multi-step-navigation', '329:8933', { clay: 'https://clayui.com/docs/components/multi-step-nav.html' }],
	['Navigation Bar', 'navigation-bar', '1:18', { clay: 'https://clayui.com/docs/components/navigation-bar.html', guidelines: '/lexicon/core-components/navigation' }],
	['Pagination', 'pagination', '1:19', { clay: 'https://clayui.com/docs/components/pagination.html', guidelines: '/lexicon/core-components/pagination' }],
	['Picker', 'picker', '5982:700'],
	['Popover', 'popover', '800:20558', { clay: 'https://clayui.com/docs/components/popover.html', guidelines: '/lexicon/core-components/popovers-tooltips' }],
	['Progress Bar', 'progress-bar', '1:20', { clay: 'https://clayui.com/docs/components/progress-bar.html', guidelines: '/lexicon/core-components/progress-bars', description: 'Progress bar indicates the percentage completed of a task.' }],
	['Radio Button', 'radio-button', '85:2298', { clay: 'https://clayui.com/docs/components/radio.html' }],
	['Resize Handle', 'resize-handle', '8763:111'],
	['Section', 'section', '1:22', { guidelines: '/lexicon/core-components/section' }],
	['Side Panel', 'side-panel', '4664:238'],
	['Slider', 'slider', '329:8939', { clay: 'https://clayui.com/docs/components/slider.html', guidelines: '/lexicon/core-components/slider' }],
	['Sticker', 'sticker', '1:23', { clay: 'https://clayui.com/docs/components/sticker.html', guidelines: '/lexicon/core-components/stickers' }],
	['Tab', 'tab', '1:25', { clay: 'https://clayui.com/docs/components/tabs.html', guidelines: '/lexicon/core-components/tabs' }],
	['Table', 'table', '1:24', { clay: 'https://clayui.com/docs/components/table.html', description: 'A table compares datasets in a direct, analytical way.' }],
	['Time Picker', 'time-picker', '288:896', { clay: 'https://clayui.com/docs/components/time-picker.html' }],
	['Toggle Switch', 'toggle-switch', '85:2299', { clay: 'https://clayui.com/docs/components/toggle-switch.html' }],
	['Tooltip', 'tooltip', '1:21', { clay: 'https://clayui.com/docs/components/tooltip.html', guidelines: '/lexicon/core-components/popovers-tooltips' }],
	['Tree View', 'tree-view', '1:27', { guidelines: '/lexicon/core-components/tree-view', description: 'A tree view shows nodes in a hierarchical, expandable structure.' }],
	['Vertical Navigation', 'vertical-navigation', '478:8539', { clay: 'https://clayui.com/docs/components/vertical-nav.html' }],
	['Vertical Bar', 'vertical-bar', '1:28', { guidelines: '/lexicon/core-components/vertical-bar' }],
]

const deepBySlug = new Map(deep.map(d => [d.slug, d]))

function build(name, slug, pageNodeId, order, extra = {}) {
	const d = deepBySlug.get(slug)
	if (d) {
		const links = {}
		if (d.clay) links.clay = d.clay
		if (d.guidelines) links.guidelines = d.guidelines
		if (d.doc) links.doc = d.doc
		return {
			name: d.name,
			slug: d.slug,
			order,
			description: d.description,
			status: 'documented',
			figma: { ...FILE, pageNodeId: d.pageNodeId, componentSetNodeId: d.componentSetNodeId },
			links: Object.keys(links).length ? links : undefined,
			screenshot: d.screenshot,
			properties: d.properties,
			variantCount: d.variantCount,
			anatomy: d.anatomy,
			tokens: d.tokens,
		}
	}
	const links = {}
	if (extra.clay) links.clay = extra.clay
	if (extra.guidelines) links.guidelines = extra.guidelines
	return {
		name,
		slug,
		order,
		description: extra.description ?? `${name} component from the Lexicon design system.`,
		status: 'stub',
		figma: { ...FILE, pageNodeId },
		links: Object.keys(links).length ? links : undefined,
	}
}

// alphabetical order, step 10 so manual ones can be slotted between
const sorted = [...registry].sort((a, b) => a[0].localeCompare(b[0]))

await mkdir(OUT, { recursive: true })
// clear previously generated files (keep the dir)
for (const f of await readdir(OUT).catch(() => [])) {
	if (f.endsWith('.json')) await rm(join(OUT, f))
}

let n = 0
for (let i = 0; i < sorted.length; i++) {
	const [name, slug, pageNodeId, extra] = sorted[i]
	const data = build(name, slug, pageNodeId, (i + 1) * 10, extra)
	await writeFile(join(OUT, `${slug}.json`), JSON.stringify(data, null, '\t') + '\n')
	n++
}
console.log(`Wrote ${n} component files to ${OUT} (${deep.length} documented).`)
