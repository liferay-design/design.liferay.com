// Receives a payload from the Lexicon Docs Sync Figma plugin and opens a PR
// with the generated docs files. The GitHub token never leaves the server.
//
// Required Netlify environment variables:
//   GITHUB_TOKEN  — a token (or GitHub App installation token) with `repo`
//                   (contents + pull_requests) on the target repository
//   SYNC_SECRET   — shared secret the plugin must send as `Authorization:
//                   Bearer <secret>`; rotate freely
// Optional:
//   GITHUB_REPO   — "owner/repo" (default "liferay-design/liferay.design")
//   GITHUB_BASE   — base branch for the PR (default "master")
//
// Only paths under these prefixes may be written (so a leaked secret can't
// commit arbitrary files):
const ALLOWED_PREFIXES = [
	'astro/src/data/figma-foundations/',
	'astro/src/data/figma-components/',
	'static/images/lexicon/figma/',
]

const REPO = process.env.GITHUB_REPO || 'liferay-design/liferay.design'
const BASE = process.env.GITHUB_BASE || 'master'
const GH = 'https://api.github.com'

const cors = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
const json = (statusCode, body) => ({
	statusCode,
	headers: { 'Content-Type': 'application/json', ...cors },
	body: JSON.stringify(body),
})

async function gh(path, token, method = 'GET', body) {
	const res = await fetch(`${GH}${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'Content-Type': 'application/json',
			'User-Agent': 'lexicon-docs-sync',
		},
		body: body ? JSON.stringify(body) : undefined,
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) throw new Error(`GitHub ${res.status} on ${method} ${path}: ${data.message || ''}`)
	return data
}

exports.handler = async event => {
	if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' }
	if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

	const token = process.env.GITHUB_TOKEN
	const secret = process.env.SYNC_SECRET
	if (!token || !secret) return json(500, { error: 'Server not configured (GITHUB_TOKEN / SYNC_SECRET)' })

	const auth = event.headers.authorization || event.headers.Authorization || ''
	if (auth !== `Bearer ${secret}`) return json(401, { error: 'Unauthorized' })

	let payload
	try {
		payload = JSON.parse(event.body || '{}')
	} catch {
		return json(400, { error: 'Invalid JSON body' })
	}
	const files = Array.isArray(payload.files) ? payload.files : []
	if (!files.length) return json(400, { error: 'No files in payload' })
	for (const f of files) {
		if (!f.path || !ALLOWED_PREFIXES.some(p => f.path.startsWith(p))) {
			return json(400, { error: `Path not allowed: ${f.path}` })
		}
	}

	try {
		const [owner, repo] = REPO.split('/')
		const base = `/repos/${owner}/${repo}`

		// 1. base ref → commit → tree
		const ref = await gh(`${base}/git/ref/heads/${BASE}`, token)
		const baseSha = ref.object.sha
		const baseCommit = await gh(`${base}/git/commits/${baseSha}`, token)
		const baseTree = baseCommit.tree.sha

		// 2. blobs for every file (binary as base64, text as utf-8)
		const tree = []
		for (const f of files) {
			const blob = await gh(`${base}/git/blobs`, token, 'POST', {
				content: f.contentBase64 != null ? f.contentBase64 : f.content,
				encoding: f.contentBase64 != null ? 'base64' : 'utf-8',
			})
			tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha })
		}

		// 3. tree → commit → branch ref
		const newTree = await gh(`${base}/git/trees`, token, 'POST', { base_tree: baseTree, tree })
		const stamp = new Date().toISOString().replace(/[:.]/g, '-')
		const branch = `${(payload.branchPrefix || 'figma-sync').replace(/[^a-zA-Z0-9/_-]/g, '')}-${stamp}`
		const commit = await gh(`${base}/git/commits`, token, 'POST', {
			message: payload.title || 'Sync docs from Figma',
			tree: newTree.sha,
			parents: [baseSha],
		})
		await gh(`${base}/git/refs`, token, 'POST', {
			ref: `refs/heads/${branch}`,
			sha: commit.sha,
		})

		// 4. open the PR
		const pr = await gh(`${base}/pulls`, token, 'POST', {
			title: payload.title || 'Sync docs from Figma',
			head: branch,
			base: BASE,
			body:
				(payload.body || 'Generated from Figma by the Lexicon Docs Sync plugin.') +
				`\n\n${files.length} file(s) updated.`,
		})

		return json(200, { ok: true, prUrl: pr.html_url, branch, files: files.length })
	} catch (e) {
		return json(502, { error: String((e && e.message) || e) })
	}
}
