const fs = require('fs'),
	path = require('path'),
	assert = require('node:assert/strict'),
	ts = require('typescript');
const root = path.resolve(__dirname, '..');
const compile = (m, file) =>
	m._compile(
		ts.transpileModule(fs.readFileSync(file, 'utf8'), {
			compilerOptions: { module: 1, target: 7, jsx: 2, esModuleInterop: true },
		}).outputText,
		file,
	);
require.extensions['.ts'] = compile;
require.extensions['.tsx'] = compile;
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: 'http://localhost/community' });
Object.assign(global, {
	window: dom.window,
	document: dom.window.document,
	navigator: dom.window.navigator,
	HTMLElement: dom.window.HTMLElement,
	Element: dom.window.Element,
	self: dom.window,
	IS_REACT_ACT_ENVIRONMENT: true,
});
const React = require('react'),
	{ createRoot } = require('react-dom/client'),
	{ act } = require('react-dom/test-utils'),
	apollo = require('@apollo/client');
const stub = (file, exports) => {
	const full = path.join(root, file);
	require.cache[full] = { id: full, filename: full, loaded: true, exports: { __esModule: true, ...exports } };
};
let redraw,
	fail = false,
	liked = false;
const requests = [];
const router = {
	isReady: true,
	query: {},
	push: async (url) => {
		router.query = url.query;
		redraw();
	},
};
stub('node_modules/next/router.js', { useRouter: () => router });
stub('node_modules/next/head.js', { default: () => null });
stub('node_modules/next/link.js', {
	default: React.forwardRef(({ href, children, passHref, ...props }, ref) =>
		React.createElement('a', { ...props, ref, href }, children),
	),
});
stub('libs/components/layout/LayoutBasic.tsx', { default: (Page) => Page });
const i18n = require('i18next').createInstance();
i18n.init({
	lng: 'en',
	initImmediate: false,
	defaultNS: 'common',
	resources: { en: { common: JSON.parse(fs.readFileSync(root + '/public/locales/en/common.json', 'utf8')) } },
	interpolation: { escapeValue: false },
});
const { I18nextProvider } = require('react-i18next'),
	{ userVar } = require(root + '/apollo/store.ts');
const fixture = (index) => ({
	_id: String(index).padStart(24, '0'),
	articleCategory: index % 2 ? 'NEWS' : 'GENERAL',
	articleStatus: 'ACTIVE',
	articleTitle: 'Backend snow story ' + index,
	articleContent: '<p>Fresh snow and mountain adventures.</p>',
	articleImage: index === 1 ? 'https://example.com/snow.jpg' : null,
	articleViews: index * 100,
	articleLikes: liked ? 2 : 1,
	articleComments: 3,
	memberId: 'a'.repeat(24),
	createdAt: '2026-10-05T01:00:00.000Z',
	updatedAt: '2026-10-05T01:00:00.000Z',
	memberData: null,
	meLiked: [{ memberId: 'a'.repeat(24), likeRefId: String(index).padStart(24, '0'), myFavorite: liked }],
});
const client = new apollo.ApolloClient({
	cache: new apollo.InMemoryCache(),
	link: new apollo.ApolloLink(
		(op) =>
			new apollo.Observable((observer) => {
				requests.push({ name: op.operationName, variables: op.variables });
				const timer = setTimeout(() => {
					if (op.operationName === 'LikeTargetBoardArticle') {
						liked = !liked;
						observer.next({
							data: { likeTargetBoardArticle: fixture(Number(op.variables.input)) },
						});
					} else {
						if (fail) {
							fail = false;
							observer.error(new Error('Fixture network error'));
							return;
						}
						const input = op.variables.input;
						let list = Array.from({ length: 13 }, (_, i) => fixture(i + 1));
						if (input.search.articleCategory)
							list = list.filter((item) => item.articleCategory === input.search.articleCategory);
						if (input.search.text === 'missing') list = [];
						observer.next({
							data: {
								getBoardArticles: {
									list: list.slice((input.page - 1) * input.limit, input.page * input.limit),
									metaCounter: list.length ? [{ total: list.length }] : [],
								},
							},
						});
					}
					observer.complete();
				}, 5);
				return () => clearTimeout(timer);
			}),
	),
});
const Page = require(root + '/pages/community/index.tsx').default,
	mounted = createRoot(document.getElementById('root'));
redraw = () =>
	mounted.render(
		React.createElement(
			apollo.ApolloProvider,
			{ client },
			React.createElement(I18nextProvider, { i18n }, React.createElement(Page)),
		),
	);
const flush = async () => {
	for (let i = 0; i < 3; i++) await act(async () => new Promise((resolve) => setTimeout(resolve, 30)));
};
const click = async (el) => {
	assert(el);
	await act(async () => el.click());
	await flush();
};
const button = (text) => [...document.querySelectorAll('button')].find((el) => el.textContent === text);
const navigate = async (query) => {
	router.query = query;
	await act(async () => redraw());
	await flush();
};
(async () => {
	await act(async () => redraw());
	await flush();
	assert.equal(document.querySelectorAll('.community-post').length, 6);
	assert(document.body.textContent.includes('Showing 1–6 of 13 posts'));
	assert(requests.some((r) => r.variables.input.limit === 4 && r.variables.input.sort === 'articleViews'));
	assert.equal(document.querySelector('.community-hero a').getAttribute('href'), '/community/create');
	assert.equal(
		document.querySelector('.community-post-image').getAttribute('href'),
		'/community/detail?id=' + fixture(1)._id + '&articleCategory=NEWS',
	);
	await click(document.querySelector('button[aria-label="Like"]'));
	assert(document.body.textContent.includes('Please login first!'));
	assert.equal(requests.filter((r) => r.name === 'LikeTargetBoardArticle').length, 0);
	await act(async () => userVar({ ...userVar(), _id: 'a'.repeat(24) }));
	const likeButton = document.querySelector('button[aria-label="Like"]');
	await act(async () => {
		likeButton.click();
		likeButton.click();
	});
	await flush();
	assert.equal(requests.filter((r) => r.name === 'LikeTargetBoardArticle').length, 1);
	assert.equal(requests.find((r) => r.name === 'LikeTargetBoardArticle').variables.input, fixture(1)._id);
	assert(document.querySelector('button[aria-label="Unlike"]'));
	await click(button('News'));
	assert.equal(router.query.page, 1);
	assert.equal(router.query.articleCategory, 'NEWS');
	assert.equal(document.querySelectorAll('.community-post').length, 6);
	await click(button('All Posts'));
	await navigate({ page: '3' });
	assert(document.body.textContent.includes('Showing 13–13 of 13 posts'));
	await click(button('#Gear'));
	assert.equal(router.query.text, 'Gear');
	assert.equal(router.query.page, 1);
	await navigate({ text: 'missing' });
	assert(document.body.textContent.includes('No items to show yet.'));
	assert.equal(document.querySelectorAll('.community-post').length, 0);
	fail = true;
	await navigate({ text: 'retry' });
	assert(document.body.textContent.includes('Unable to load this collection. Please try again.'));
	await click(button('Retry'));
	assert.equal(document.querySelectorAll('.community-post').length, 6);
	await navigate({ page: '-1', sort: 'invented', articleCategory: 'Equipment' });
	const latest = requests.filter((r) => r.name === 'GetBoardArticles' && r.variables.input.limit === 6).at(-1)
		.variables.input;
	assert.equal(latest.page, 1);
	assert.equal(latest.sort, 'createdAt');
	assert.equal(latest.search.articleCategory, undefined);
	window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true }));
	assert.equal(document.activeElement.getAttribute('aria-label'), 'Search post titles');
	await act(async () => mounted.unmount());
	console.log(
		'PASS Community: backend inquiries, popular posts, pagination, categories, topics, invalid URL fallbacks, likes/auth/duplicate lock, empty/retry, editor/detail routes, keyboard search.',
	);
})().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
