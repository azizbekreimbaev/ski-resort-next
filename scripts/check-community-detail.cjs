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
const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: 'http://localhost/community/detail' });
Object.assign(global, {
	window: dom.window,
	document: dom.window.document,
	navigator: dom.window.navigator,
	HTMLElement: dom.window.HTMLElement,
	Element: dom.window.Element,
	DocumentFragment: dom.window.DocumentFragment,
	self: dom.window,
	IS_REACT_ACT_ENVIRONMENT: true,
});
window.confirm = () => true;
window.HTMLElement.prototype.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, right: 100, bottom: 40, width: 100, height: 40 });
const React = require('react'),
	{ createRoot } = require('react-dom/client'),
	{ act } = require('react-dom/test-utils');
const { ApolloClient, ApolloLink, InMemoryCache, Observable, ApolloProvider } = require('@apollo/client');
const stub = (file, exports) => {
	const full = path.join(root, file);
	require.cache[full] = { id: full, filename: full, loaded: true, exports: { __esModule: true, ...exports } };
};
const id = '000000000000000000000001',
	memberId = '000000000000000000000002';
const navigation = [];
const router = { isReady: true, query: { id }, push: async (url) => navigation.push(url) };
stub('node_modules/next/router.js', { useRouter: () => router });
stub('node_modules/next/link.js', {
	default: React.forwardRef(({ href, children, passHref, ...props }, ref) =>
		React.createElement('a', { href, ref, ...props }, children),
	),
});
stub('node_modules/next/dynamic.js', {
	default:
		() =>
		({ markdown }) =>
			React.createElement('div', { className: 'viewer-fixture' }, markdown),
});
stub('libs/components/layout/LayoutBasic.tsx', { default: (Component) => Component });
const i18n = require('i18next').createInstance();
i18n.init({
	lng: 'en',
	initImmediate: false,
	defaultNS: 'common',
	resources: { en: { common: JSON.parse(fs.readFileSync(root + '/public/locales/en/common.json', 'utf8')) } },
});
const { I18nextProvider } = require('react-i18next'),
	{ userVar } = require(root + '/apollo/store.ts');
const article = {
	_id: id,
	articleCategory: 'TIPS_GUIDES',
	articleStatus: 'ACTIVE',
	articleTitle: 'Preparing for your first ski day',
	articleContent: '<p>Backend snow guide</p>',
	articleImage: 'https://example.com/cover.jpg',
	articleViews: 12,
	articleLikes: 3,
	articleComments: 99,
	memberId,
	createdAt: '2026-10-06T00:00:00Z',
	updatedAt: '2026-10-06T00:00:00Z',
	memberData: { memberNick: 'Snow Author' },
	meLiked: [],
};
let comments = [],
	fail = false,
	mutationFail = false;
const requests = [];
const client = new ApolloClient({
	cache: new InMemoryCache({ addTypename: false }),
	link: new ApolloLink(
		(op) =>
			new Observable((observer) => {
				requests.push({ name: op.operationName, variables: JSON.parse(JSON.stringify(op.variables)) });
				const timer = setTimeout(() => {
					const input = op.variables.input;
					if (
						(fail && op.operationName === 'GetBoardArticle') ||
						(mutationFail && op.operationName === 'CreateComment')
					) {
						observer.error(new Error('Fixture failure'));
						return;
					}
					let data;
					switch (op.operationName) {
						case 'GetBoardArticle':
							assert.equal(input, id);
							data = { getBoardArticle: article };
							break;
						case 'GetComments':
							assert.equal(input.search.commentGroup, 'ARTICLE');
							assert.equal(input.search.commentRefId, id);
							data = {
								getComments: {
									list: comments.slice((input.page - 1) * 5, input.page * 5),
									metaCounter: [{ total: comments.length }],
								},
							};
							break;
						case 'LikeTargetBoardArticle':
							assert.equal(input, id);
							article.articleLikes++;
							article.meLiked = [{ memberId, likeRefId: id, myFavorite: true }];
							data = { likeTargetBoardArticle: article };
							break;
						case 'CreateComment':
							assert.deepEqual(input, { commentRefId: id, commentGroup: 'ARTICLE', commentContent: 'Snow advice' });
							comments = [
								{
									_id: '000000000000000000000003',
									memberId,
									commentContent: input.commentContent,
									createdAt: article.createdAt,
									memberData: { memberNick: 'Snow Author' },
								},
							];
							data = { createComment: comments[0] };
							break;
						case 'UpdateComment':
							if (input.commentStatus === 'DELETE') comments = [];
							else comments[0].commentContent = input.commentContent;
							data = { updateComment: { _id: input._id } };
							break;
						case 'UpdateBoardArticle':
							assert.deepEqual(input, { _id: id, articleStatus: 'DELETE' });
							data = { updateBoardArticle: article };
							break;
						default:
							observer.error(new Error('Unexpected operation ' + op.operationName));
							return;
					}
					const fill = (value, selection) => {
						if (!value || !selection) return;
						if (Array.isArray(value)) {
							value.forEach((item) => fill(item, selection));
							return;
						}
						for (const field of selection.selections) {
							const key = field.name.value;
							if (!(key in value)) value[key] = null;
							fill(value[key], field.selectionSet);
						}
					};
					fill(data, op.query.definitions[0].selectionSet);
					observer.next({ data: JSON.parse(JSON.stringify(data)) });
					observer.complete();
				}, 10);
				return () => clearTimeout(timer);
			}),
	),
});
const Detail = require(root + '/pages/community/detail.tsx').default,
	mounted = createRoot(document.getElementById('root'));
const flush = () =>
	act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 100));
	});
const render = async () => {
	await act(async () =>
		mounted.render(
			React.createElement(
				ApolloProvider,
				{ client },
				React.createElement(I18nextProvider, { i18n }, React.createElement(Detail)),
			),
		),
	);
	await flush();
	await flush();
};
const button = (text) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === text);
const click = async (el) => {
	assert(el, 'Missing control');
	await act(async () => el.click());
	await flush();
	await flush();
};
const type = async (value) => {
	const el = document.querySelector('textarea');
	await act(async () => {
		Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(el, value);
		el.dispatchEvent(new window.Event('input', { bubbles: true }));
	});
};
(async () => {
	await act(async () => userVar({ _id: '', memberNick: '' }));
	await render();
	assert(document.body.textContent.includes(article.articleTitle));
	assert(document.body.textContent.includes('Tips & Guides'));
	assert(document.querySelector('.detail-cover img'));
	assert(document.body.textContent.includes('Comments (0)'));
	assert.equal(document.querySelector('[aria-label="Post options"]'), null);
	await click(document.querySelector('.detail-like'));
	assert(document.body.textContent.includes('Please login first!'));
	assert(!requests.some((r) => r.name === 'LikeTargetBoardArticle'));
	await act(async () => userVar({ _id: memberId, memberNick: 'Snow Author', memberType: 'USER' }));
	await render();
	await act(async () => {
		document.querySelector('.detail-like').click();
		document.querySelector('.detail-like').click();
	});
	await flush();
	await flush();
	assert.equal(requests.filter((r) => r.name === 'LikeTargetBoardArticle').length, 1);
	assert.equal(document.querySelector('.detail-like').getAttribute('aria-pressed'), 'true');
	await type('Snow advice');
	mutationFail = true;
	await click(button('Post comment'));
	assert.equal(document.querySelector('textarea').value, 'Snow advice');
	assert(document.body.textContent.includes('Unable to save comment'));
	mutationFail = false;
	await click(button('Post comment'));
	await flush();
	assert(document.body.textContent.includes('Comments (1)'));
	assert(document.body.textContent.includes('Snow advice'));
	assert(
		document.querySelector('.resource-comment').compareDocumentPosition(document.querySelector('.detail-comment-composer')) & window.Node.DOCUMENT_POSITION_FOLLOWING,
		'Published comments appear above the comment input',
	);
	await click(button('Edit'));
	await type('Updated advice');
	await click(button('Save'));
	await flush();
	assert(document.body.textContent.includes('Updated advice'));
	await click(button('Delete'));
	await flush();
	assert(document.body.textContent.includes('Comments (0)'));
	assert.equal(article.articleComments, 99);
	await click(document.querySelector('[aria-label="Post options"]'));
	assert(document.querySelector('a[href="/mypage?category=writeArticle&articleId=' + id + '"]'));
	await click([...document.querySelectorAll('[role="menuitem"]')].find((el) => el.textContent.includes('Delete')));
	assert(navigation.includes('/community'));
	fail = true;
	await act(async () => client.refetchQueries({ include: ['GetBoardArticle'] }).catch(() => {}));
	await flush();
	assert(document.body.textContent.includes('This resource is unavailable'));
	fail = false;
	await click(button('Retry'));
	await flush();
	assert(document.querySelector('.detail-body'));
	const before = requests.length;
	router.query.id = 'invalid';
	await render();
	assert.equal(requests.length, before);
	assert(document.body.textContent.includes('This resource is unavailable'));
	await act(async () => mounted.unmount());
	client.stop();
	dom.window.close();
	console.log(
		'PASS: Community detail backend reads, categories, cover, guest/owner permissions, like duplicate lock, comment CRUD/retry/active totals, article delete, error retry and invalid IDs.',
	);
})().catch((error) => {
	console.error(error);
	client.stop();
	dom.window.close();
	process.exitCode = 1;
});
