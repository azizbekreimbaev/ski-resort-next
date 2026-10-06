const fs = require('fs'), path = require('path'), assert = require('node:assert/strict'), ts = require('typescript');
const compile = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {
	compilerOptions: { module: 1, target: 7, jsx: 2, esModuleInterop: true },
}).outputText, f);
require.extensions['.ts'] = compile;
require.extensions['.tsx'] = compile;
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: 'http://localhost' });
Object.assign(global, { window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement,
	DocumentFragment: dom.window.DocumentFragment, IS_REACT_ACT_ENVIRONMENT: true });
const React = require('react'), { createRoot } = require('react-dom/client'), { act, Simulate } = require('react-dom/test-utils');
const stub = (name, exports) => { const f = require.resolve(name); require.cache[f] = { id: f, filename: f, loaded: true, exports }; };
const translate = (key, values) => key.replace(/\{\{(\w+)\}\}/g, (_, name) => values?.[name] ?? name);
stub('next-i18next', { useTranslation: () => ({ t: translate, i18n: { language: 'en' } }) });
stub('next/link', { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', {
	...props, href: typeof href === 'string' ? href : href.pathname + '?' + new URLSearchParams(href.query),
}, children) });
const catalog = require('../libs/components/admin/community/communityCatalog.ts');
const make = (index) => ({ _id: index.toString(16).padStart(24, '0'), memberId: 'b'.repeat(24), articleTitle: `Ski guide ${index}`,
	articleContent: '<p>Safe skiing tips</p>', articleCategory: index % 2 ? 'TIPS_GUIDES' : 'NEWS',
	articleStatus: index === 101 ? 'DELETE' : 'ACTIVE', articleImage: index === 1 ? 'articles/ski.jpg' : null,
	articleViews: index, articleLikes: index * 2, articleComments: 3, createdAt: new Date(2026, 0, index).toISOString(),
	updatedAt: '2026-10-06T00:00:00Z', memberData: { memberNick: index === 101 ? 'UniqueAuthor' : 'Skier', memberFullName: '' } });
let articles = Array.from({ length: 101 }, (_, i) => make(i + 1));
let requests = [], mutations = [], failQuery = false, failMutation = false, confirm = true, pendingResolve;
window.confirm = () => confirm;
const client = { query: async (options) => {
	requests.push(options);
	if (failQuery) throw new Error('Read failed');
	const page = options.variables.input.page;
	return { data: { getAllBoardArticlesByAdmin: { list: articles.slice((page - 1) * 100, page * 100), metaCounter: [{ total: articles.length }] } } };
} };
const apollo = require('@apollo/client');
stub('@apollo/client', { ...apollo, useApolloClient: () => client,
	useMutation: () => [async (options) => {
		mutations.push(options);
		if (failMutation) throw new Error('Write failed');
		if (pendingResolve) await new Promise((resolve) => { pendingResolve = resolve; });
		const input = options.variables.input;
		articles = articles.map((a) => a._id === input._id ? { ...a, ...input } : a);
		return { data: { updateBoardArticleByAdmin: input } };
	}, {}],
});
const Component = require('../libs/components/admin/community/AdminCommunity.tsx').default;
const root = createRoot(document.getElementById('root'));
const settle = async () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
const render = async () => { await act(async () => root.render(React.createElement(Component))); await settle(); };
const find = (text) => Array.from(document.querySelectorAll('button')).find((b) => b.textContent === text);
const click = async (node) => { assert.ok(node, 'Expected button'); await act(async () => Simulate.click(node)); await settle(); };
const change = async (selector, value) => { const node = document.querySelector(selector); assert.ok(node, selector);
	await act(async () => { node.value = value; Simulate.change(node, { target: { value } }); }); await settle(); };
const cards = () => Array.from(document.querySelectorAll('.ac-card'));
(async () => {
	let pages = [];
	const loaded = await catalog.loadCommunityCatalog(async (page) => { pages.push(page); return { list: page === 1 ? articles.slice(0, 100) : articles.slice(100), metaCounter: [{ total: 101 }] }; });
	assert.equal(loaded.length, 101); assert.deepEqual(pages, [1, 2]);
	assert.deepEqual(await catalog.loadCommunityCatalog(async () => ({ list: [make(1)], metaCounter: [{ total: 1000 }] }), () => false), []);
	await assert.rejects(() => catalog.loadCommunityCatalog(async () => { throw new Error('Incomplete'); }), /Incomplete/);
	const csv = catalog.communityCsv([{ ...make(1), articleTitle: ' =SUM(1,2)', memberData: { memberNick: '"Quoted"' } }]);
	assert.ok(csv.includes('"\' =SUM(1,2)"')); assert.ok(csv.includes('""Quoted""'));
	await render();
	assert.equal(cards().length, 4); assert.equal(document.querySelectorAll('.ac-summary strong')[0].textContent, '101');
	assert.equal(document.querySelectorAll('.ac-summary strong')[3].textContent, '303');
	assert.deepEqual(requests.map((r) => r.variables.input.page), [1, 2]);
	assert.ok(requests.every((r) => r.variables.input.limit === 100 && !('text' in r.variables.input.search)));
	assert.equal(document.querySelector('.ac-heading-actions a').getAttribute('href'), '/community/create');
	await change('.ac-search input', 'UniqueAuthor'); assert.equal(cards().length, 1); assert.ok(cards()[0].textContent.includes('Ski guide 101'));
	assert.ok(find('Restore Post').disabled); await click(find('View Details'));
	assert.ok(document.querySelector('.ac-details').textContent.includes('does not support restoring'));
	assert.ok(!document.querySelector('.ac-details a')); await click(document.querySelector('.ac-details button'));
	await click(find('Reset')); await change('select[aria-label="Category"]', 'NEWS');
	assert.ok(cards().every((c) => c.textContent.includes('News')));
	await change('select[aria-label="Status"]', 'DELETE'); assert.equal(cards().length, 0);
	await click(find('Reset')); await change('select[aria-label="Sort posts"]', 'oldest'); assert.ok(cards()[0].textContent.includes('Ski guide 1'));
	confirm = false; await click(find('Delete')); assert.equal(mutations.length, 0);
	await click(find('Edit')); await change('#admin-community-edit input', 'x');
	await act(async () => Simulate.submit(document.querySelector('#admin-community-edit'))); await settle();
	assert.equal(mutations.length, 0); assert.ok(document.body.textContent.includes('3–50'));
	await change('#admin-community-edit input', 'Updated ski guide'); failMutation = true;
	await act(async () => Simulate.submit(document.querySelector('#admin-community-edit'))); await settle();
	assert.ok(document.body.textContent.includes('Write failed')); assert.equal(document.querySelector('#admin-community-edit input').value, 'Updated ski guide');
	failMutation = false; pendingResolve = true;
	const form = document.querySelector('#admin-community-edit');
	await act(async () => { Simulate.submit(form); Simulate.submit(form); });
	assert.equal(mutations.length, 2, 'One failed write plus one pending write');
	await act(async () => { pendingResolve(); pendingResolve = null; }); await settle();
	assert.deepEqual(mutations[1].variables.input, { _id: make(1)._id, articleTitle: 'Updated ski guide', articleContent: '<p>Safe skiing tips</p>' });
	confirm = true; await click(find('Delete'));
	assert.deepEqual(mutations[2].variables.input, { _id: make(1)._id, articleStatus: 'DELETE' });
	assert.equal(document.querySelectorAll('.ac-summary strong')[2].textContent, '2');
	await act(async () => root.unmount());
	const secondRoot = createRoot(document.getElementById('root'));
	failQuery = true;
	await act(async () => secondRoot.render(React.createElement(Component))); await settle();
	assert.ok(document.body.textContent.includes('Read failed')); assert.equal(cards().length, 0);
	failQuery = false; await click(find('Retry')); assert.equal(cards().length, 4);
	await change('.ac-search input', 'nonexistent post'); assert.equal(cards().length, 0);
	assert.ok(document.body.textContent.includes('No community posts match'));
	await act(async () => secondRoot.unmount());
	console.log('PASS: complete catalog loading, global counters/search, enums, deleted details, edit validation/retry/duplicate lock, exact soft-delete input and CSV escaping.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
