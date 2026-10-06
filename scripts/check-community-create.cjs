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
require.extensions['.css'] = () => {};
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: 'http://localhost/community/create' });
Object.assign(global, {
	window: dom.window,
	document: dom.window.document,
	navigator: dom.window.navigator,
	HTMLElement: dom.window.HTMLElement,
	Element: dom.window.Element,
	self: dom.window,
	File: dom.window.File,
	FormData: dom.window.FormData,
	IS_REACT_ACT_ENVIRONMENT: true,
	requestAnimationFrame: (fn) => setTimeout(fn, 0),
});
const revoked = [];
global.URL.createObjectURL = () => 'blob:fixture';
global.URL.revokeObjectURL = (url) => revoked.push(url);
const React = require('react'),
	{ createRoot } = require('react-dom/client'),
	{ act } = require('react-dom/test-utils'),
	apollo = require('@apollo/client');
const stub = (file, exports) => {
	const full = path.join(root, file);
	require.cache[full] = { id: full, filename: full, loaded: true, exports: { __esModule: true, ...exports } };
};
stub('node_modules/next/dynamic.js', {
	default: (loader) =>
		function Dynamic(props) {
			const [Component, setComponent] = React.useState(null);
			React.useEffect(() => {
				let active = true;
				loader().then((module) => {
					if (active) setComponent(() => module.default || module);
				});
				return () => {
					active = false;
				};
			}, []);
			return Component ? React.createElement(Component, props) : null;
		},
});
const editorOptions = [];
const editorModule = require.resolve('@toast-ui/react-editor');
require.cache[editorModule] = {
	id: editorModule,
	filename: editorModule,
	loaded: true,
	exports: {
		Editor: React.forwardRef((props, ref) => {
			const value = React.useRef(props.initialValue || '');
			const [, redraw] = React.useState(0);
			const area = React.useRef(null);
			editorOptions.push(props);
			React.useImperativeHandle(ref, () => ({
				getInstance: () => ({
					getHTML: () => value.current,
					focus: () => area.current.focus(),
					setHTML: (html) => {
						value.current = html;
						redraw((x) => x + 1);
					},
				}),
			}));
			return React.createElement(
				'div',
				null,
				React.createElement(
					'button',
					{
						type: 'button',
						'aria-label': 'Bold',
						onClick: () => {
							value.current = '<p><strong>Snow</strong></p>';
							redraw((x) => x + 1);
							props.onChange();
						},
					},
					'Bold',
				),
				React.createElement('textarea', {
					id: 'fixture-content',
					ref: area,
					value: value.current,
					onChange: (e) => {
						value.current = e.target.value;
						redraw((x) => x + 1);
						props.onChange();
					},
				}),
			);
		}),
		Viewer: React.forwardRef((props, ref) => {
			const [value, setValue] = React.useState(props.initialValue);
			React.useImperativeHandle(ref, () => ({ getInstance: () => ({ setMarkdown: setValue }) }));
			return React.createElement('div', { 'data-testid': 'tviewer' }, value);
		}),
	},
};
const redirects = [],
	navigation = [];
const router = {
	replace: async (url) => redirects.push(url),
	push: async (url) => {
		navigation.push(url);
		return true;
	},
};
stub('node_modules/next/router.js', { useRouter: () => router });
stub('node_modules/next/head.js', { default: () => null });
stub('node_modules/next/link.js', {
	default: React.forwardRef(({ href, children, passHref, ...props }, ref) =>
		React.createElement('a', { ...props, ref, href }, children),
	),
});
stub('libs/components/community/CommunityPost.tsx', {
	communityCategories: {
		GENERAL: 'General',
		NEWS: 'News',
		REVIEWS: 'Reviews',
		TIPS_GUIDES: 'Tips & Guides',
		QUESTIONS: 'Questions',
	},
});
const session = apollo.makeVar({ _id: '', memberNick: 'Snow Rider' });
let ready = false;
stub('libs/hooks/useMemberSession.ts', { default: () => ({ user: apollo.useReactiveVar(session), ready }) });
stub('libs/auth/index.ts', { getJwtToken: () => 'fixture-token' });
const uploads = [];
let uploadFails = false,
	mutationFails = false;
stub('node_modules/axios/index.js', {
	default: {
		post: async (url, form, config) => {
			uploads.push({ url, form, config });
			if (uploadFails) throw new Error('Upload fixture failure');
			return { data: { data: { imageUploader: 'uploads/articles/snow.png' } } };
		},
	},
});
const requests = [];
const id = 'a'.repeat(24);
const client = new apollo.ApolloClient({
	cache: new apollo.InMemoryCache(),
	link: new apollo.ApolloLink(
		(op) =>
			new apollo.Observable((observer) => {
				requests.push({ name: op.operationName, variables: op.variables });
				const timer = setTimeout(() => {
					if (mutationFails) {
						observer.error(new Error('Create fixture failure'));
						return;
					}
					observer.next({
						data: {
							createBoardArticle: {
								_id: id,
								...op.variables.input,
								articleStatus: 'ACTIVE',
								articleViews: 0,
								articleLikes: 0,
								memberId: id,
								createdAt: '2026-10-06T00:00:00.000Z',
								updatedAt: '2026-10-06T00:00:00.000Z',
							},
						},
					});
					observer.complete();
				}, 10);
				return () => clearTimeout(timer);
			}),
	),
});
const i18n = require('i18next').createInstance();
i18n.init({
	lng: 'en',
	initImmediate: false,
	defaultNS: 'common',
	resources: { en: { common: JSON.parse(fs.readFileSync(root + '/public/locales/en/common.json', 'utf8')) } },
	interpolation: { escapeValue: false },
});
const { I18nextProvider } = require('react-i18next');
const Page = require(root + '/libs/components/community/CreatePost.tsx').default;
let mounted;
const render = () =>
	mounted.render(
		React.createElement(
			apollo.ApolloProvider,
			{ client },
			React.createElement(I18nextProvider, { i18n }, React.createElement(Page)),
		),
	);
const flush = async () => {
	for (let i = 0; i < 3; i++) await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
};
const mount = async () => {
	mounted = createRoot(document.getElementById('root'));
	await act(async () => render());
	await flush();
};
const unmount = async () => {
	await act(async () => mounted.unmount());
};
const input = async (selector, value) => {
	const el = document.querySelector(selector);
	assert(el);
	const proto =
		el.tagName === 'TEXTAREA'
			? window.HTMLTextAreaElement.prototype
			: el.tagName === 'SELECT'
			? window.HTMLSelectElement.prototype
			: window.HTMLInputElement.prototype;
	await act(async () => {
		Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
		el.dispatchEvent(new window.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
	});
};
const submit = async () => {
	await act(async () =>
		document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })),
	);
	await flush();
};
const fill = async () => {
	await input('#post-category', 'TIPS_GUIDES');
	await input('#post-title', '  Winter tips  ');
	await input('#fixture-content', '<p>Check the snow forecast.</p>');
};
const choose = async (file) => {
	const el = document.querySelector('#post-image');
	Object.defineProperty(el, 'files', { value: [file], configurable: true });
	await act(async () => el.dispatchEvent(new window.Event('change', { bubbles: true })));
};
(async () => {
	await mount();
	assert(document.body.textContent.includes('Loading'));
	assert.equal(redirects.length, 0);
	ready = true;
	await act(async () => render());
	await flush();
	assert.equal(redirects.at(-1), '/account/join?referrer=%2Fcommunity%2Fcreate');
	assert.equal(document.querySelector('form'), null);
	await act(async () => session({ _id: id, memberNick: 'Snow Rider' }));
	await flush();
	assert(document.querySelector('.create-author').textContent.includes('Snow Rider'));
	assert.deepEqual(
		[...document.querySelector('#post-category').options].slice(1).map((x) => x.value),
		['GENERAL', 'NEWS', 'REVIEWS', 'TIPS_GUIDES', 'QUESTIONS'],
	);
	assert.equal(document.querySelector('.create-actions a').getAttribute('href'), '/community');
	await submit();
	assert.equal(requests.length, 0);
	assert.equal(document.activeElement.id, 'post-category');
	await input('#post-category', 'GENERAL');
	await input('#post-title', 'ab');
	await input('#fixture-content', 'snow');
	await submit();
	assert.equal(requests.length, 0);
	assert.equal(document.activeElement.id, 'post-title');
	await input('#post-title', 'a'.repeat(51));
	await submit();
	assert.equal(requests.length, 0);
	await input('#post-title', 'Title');
	await input('#fixture-content', 'x'.repeat(251));
	await submit();
	assert.equal(requests.length, 0);
	assert.equal(document.activeElement.id, 'fixture-content');
	await input('#fixture-content', 'Snow');
	const area = document.querySelector('#fixture-content');
	area.setSelectionRange(0, 4);
	await act(async () => document.querySelector('[aria-label="Bold"]').click());
	await flush();
	assert.equal(area.value, '<p><strong>Snow</strong></p>');
	assert(editorOptions.at(-1).toolbarItems.flat().includes('bold'));
	assert.equal(editorOptions.at(-1).usageStatistics, false);
	await act(async () =>
		[...document.querySelectorAll('button')].find((el) => el.textContent === 'Preview post').click(),
	);
	await flush();
	assert.equal(document.querySelector('[data-testid="tviewer"]').textContent, '<p><strong>Snow</strong></p>');
	await input('#fixture-content', '<p>Updated preview</p>');
	await flush();
	assert.equal(document.querySelector('[data-testid="tviewer"]').textContent, '<p>Updated preview</p>');
	await input('#fixture-content', '<p><br></p>');
	await submit();
	assert.equal(requests.length, 0);

	await choose(new File(['x'], 'bad.webp', { type: 'image/webp' }));
	assert(document.body.textContent.includes('Choose a JPG or PNG image.'));
	assert.equal(uploads.length, 0);
	await choose(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' }));
	assert(document.body.textContent.includes('Choose an image up to 10 MB.'));
	const file = new File(['fixture'], 'snow.png', { type: 'image/png' });
	await choose(file);
	assert.equal(document.querySelector('.create-image-preview img').getAttribute('src'), 'blob:fixture');
	await act(async () => document.querySelector('[aria-label="Remove image"]').click());
	await flush();
	assert.equal(document.querySelector('.create-image-preview'), null);
	assert(revoked.includes('blob:fixture'));
	await fill();
	await choose(file);
	uploadFails = true;
	await submit();
	assert.equal(requests.length, 0);
	assert(document.body.textContent.includes('Upload fixture failure'));
	uploadFails = false;
	mutationFails = true;
	await submit();
	assert.equal(requests.length, 1);
	assert(document.body.textContent.includes('Create fixture failure'));
	const upload = uploads.at(-1);
	assert.equal(upload.config.headers.Authorization, 'Bearer fixture-token');
	assert.equal(upload.config.headers['apollo-require-preflight'], 'true');
	assert.deepEqual(JSON.parse(upload.form.get('operations')).variables, { file: null, target: 'articles' });
	assert.deepEqual(JSON.parse(upload.form.get('map')), { 0: ['variables.file'] });
	mutationFails = false;
	await act(async () => {
		const form = document.querySelector('form');
		form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
		form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
	});
	await flush();
	assert.equal(requests.length, 2);
	assert.equal(uploads.length, 2, 'Successful upload must be reused after mutation failure');
	assert.deepEqual(requests.at(-1), {
		name: 'CreateBoardArticle',
		variables: {
			input: {
				articleCategory: 'TIPS_GUIDES',
				articleTitle: 'Winter tips',
				articleContent: '<p>Check the snow forecast.</p>',
				articleImage: 'uploads/articles/snow.png',
			},
		},
	});
	assert.equal(navigation.at(-1), '/community/detail?id=' + id);
	assert(document.body.textContent.includes('Post published.'));
	await submit();
	assert.equal(requests.length, 2, 'Published forms cannot create a second post');
	await unmount();
	await mount();
	await fill();
	await submit();
	assert.equal(requests.at(-1).variables.input.articleImage, '');
	assert.equal(uploads.length, 2, 'Optional cover image makes no upload request');
	await unmount();
	for (const locale of ['en', 'kr', 'ru']) {
		const dict = JSON.parse(fs.readFileSync(`${root}/public/locales/${locale}/common.json`, 'utf8'));
		assert(dict['Create a Post']);
		assert(dict['Publish Post']);
	}
	console.log(
		'PASS Community Create: updated backend categories, shared Toast UI editor HTML, live TViewer preview, blank/length validation, guest redirect, author, image format/size/preview/removal, authenticated multipart upload, upload/create failures and retry, exact mutation, duplicate lock, optional image, success routing, translations.',
	);
	client.stop();
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
