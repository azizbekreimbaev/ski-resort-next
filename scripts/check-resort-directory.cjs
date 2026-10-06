const fs = require('fs'),
	path = require('path'),
	assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'),
	ts = require('typescript');
const compile = (m, f) =>
	m._compile(
		ts.transpileModule(fs.readFileSync(f, 'utf8'), {
			compilerOptions: { module: 1, target: 7, jsx: 2, esModuleInterop: true },
		}).outputText,
		f,
	);
require.extensions['.ts'] = compile;
require.extensions['.tsx'] = compile;
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: 'http://localhost:3012/resort' });
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
window.matchMedia = () => ({ matches: true, addEventListener() { }, removeEventListener() { } });
HTMLElement.prototype.getBoundingClientRect = () => ({
	x: 0,
	y: 0,
	top: 0,
	left: 0,
	right: 200,
	bottom: 40,
	width: 200,
	height: 40,
});
const React = require('react'),
	{ createRoot } = require('react-dom/client'),
	{ act } = require('react-dom/test-utils');
const apollo = require('@apollo/client');
const styles = document.createElement('style');
// Reproduce the legacy reset so the font and input fixes are checked against it.
styles.textContent = require('sass')
	.renderSync({
		data: "@import 'variables'; @import 'reset'; @import 'resort-directory';",
		includePaths: [root + '/scss'],
	})
	.css.toString();
document.head.appendChild(styles);
function stub(file, exports) {
	const full = path.join(root, file);
	require.cache[full] = { id: full, filename: full, loaded: true, exports: { __esModule: true, ...exports } };
}
const pushes = [],
	requests = [];
let redraw,
	fail = false,
	liked = false,
	alerts = 0;
const router = {
	isReady: true,
	query: { arrival: '2026-12-20', departure: '2026-12-23' },
	push: async (url) => {
		pushes.push(url);
		router.query = url.query;
		redraw();
	},
};
stub('node_modules/next/router.js', { useRouter: () => router });
stub('node_modules/next/link.js', {
	default: React.forwardRef(({ href, children, ...props }, ref) =>
		React.createElement(
			'a',
			{ ...props, ref, href: typeof href === 'string' ? href : href.pathname + '?' + new URLSearchParams(href.query) },
			children,
		),
	),
});
stub('libs/sweetAlert.ts', {
	sweetMixinErrorAlert: async () => {
		alerts++;
	},
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
const { userVar } = require(root + '/apollo/store.ts');
const resort = {
	_id: '000000000000000000000001',
	resortTitle: 'Backend Mountain',
	resortLocation: 'PYEONGCHANG',
	resortAddress: 'Mountain road',
	resortStatus: 'ACTIVE',
	resortPricePerDay: 0,
	resortMinDays: 2,
	resortLevel: 'BEGINNER',
	resortImages: [],
	resortDesc: null,
	resortFacilities: ['SKI_SCHOOL'],
	resortLikes: 9,
	resortViews: 1500,
	resortComments: 0,
	meLiked: [],
};
const client = new apollo.ApolloClient({
	cache: new apollo.InMemoryCache(),
	link: new apollo.ApolloLink(
		(op) =>
			new apollo.Observable((observer) => {
				requests.push({ name: op.operationName, variables: JSON.parse(JSON.stringify(op.variables)) });
				const timer = setTimeout(() => {
					if (fail) {
						fail = false;
						observer.error(new Error('fixture network error'));
						return;
					}
					if (op.operationName === 'LikeTargetResort') {
						liked = !liked;
						observer.next({ data: { likeTargetResort: { ...resort, meLiked: [{ myFavorite: liked }] } } });
					} else {
						const empty = op.variables.input.search.text === 'missing';
						const { page, limit } = op.variables.input;
						const first = (page - 1) * limit;
						const list = Array.from({ length: Math.max(0, Math.min(limit, 11 - first)) }, (_, index) => ({
							...resort,
							_id: (first + index + 1).toString(16).padStart(24, '0'),
							meLiked: [{ myFavorite: liked }],
						}));
						observer.next({
							data: {
								getResorts: {
									list: empty ? [] : list,
									metaCounter: empty ? [] : [{ total: 11 }],
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
const { default: Page, parseResortCatalogInput } = require(root + '/libs/components/resort/ResortCatalog.tsx');
const mounted = createRoot(document.getElementById('root'));
const tree = () =>
	React.createElement(
		'div',
		{ id: 'pc-wrap', className: 'snowkr-app' },
		React.createElement(
			apollo.ApolloProvider,
			{ client },
			React.createElement(I18nextProvider, { i18n }, React.createElement(Page)),
		),
	);
redraw = () => mounted.render(tree());
const flush = async () =>
	act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 70));
	});
const click = async (e) => {
	assert(e);
	await act(async () => e.click());
	await flush();
};
const setValue = async (e, value) => {
	await act(async () => {
		Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(e, value);
		e.dispatchEvent(new window.Event('input', { bubbles: true }));
	});
};
const submit = async (form) => {
	await act(async () => form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
	await flush();
};
const lastInput = () => requests.filter((r) => r.name === 'GetResorts').at(-1).variables.input;
const checkbox = (group) =>
	[...document.querySelectorAll('.resort-desktop-filters fieldset.resort-filter-group')][group]
		? [...document.querySelectorAll('.resort-desktop-filters fieldset.resort-filter-group')][group].querySelectorAll(
			'label',
		)
		: [];
const choice = (group, text) => {
	const labels = [...checkbox(group)];
	const label = labels.find((e) => e.textContent === text);
	assert(label, `Missing ${text} in group ${group}: ${labels.map((e) => e.textContent).join(', ')}`);
	return label.querySelector('input');
};
const button = (text) => [...document.querySelectorAll('button')].find((e) => e.textContent === text);
(async () => {
	try {
		assert.equal(parseResortCatalogInput(undefined).sort, 'resortViews');
		assert.deepEqual(parseResortCatalogInput('{"search":{"locationList":["FAKE","MUJU"]}}').search.locationList, [
			'MUJU',
		]);
		await act(async () => redraw());
		await flush();
		// JSDOM's cascade requires the stylesheet after Emotion's injected styles.
		document.head.appendChild(styles);
		assert.equal(lastInput().limit, 8);
		assert.equal(lastInput().sort, 'resortViews');
		assert.equal(document.querySelectorAll('h1').length, 1);
		assert.deepEqual([...document.querySelector('.resort-social').children].map((item) => item.textContent.trim()), ['1,500 Views', '9 Likes', '0 Comments']);
		assert.equal(document.querySelector('.resort-directory-toolbar strong').textContent, 'Showing 1 to 8 of 11 resorts');
		const bounds = document.querySelectorAll('.resort-desktop-filters .resort-price-bound');
		assert.deepEqual(
			[...bounds].map((bound) => bound.querySelector('span').textContent),
			['Min', 'Max'],
		);
		assert(bounds[0].querySelector('input[aria-label="Daily price minimum"]'));
		assert(bounds[1].querySelector('input[aria-label="Daily price maximum"]'));
		assert.equal(document.querySelectorAll('.resort-price-filter .MuiInputLabel-root').length, 0);
		const computed = (node) => window.getComputedStyle(node);
		assert.equal(computed(document.querySelector('.resort-directory-toolbar strong')).fontFamily, 'Inter, sans-serif');
		assert(computed(document.querySelector('h1')).fontFamily.includes('Plus Jakarta Sans'));
		assert.equal(computed(bounds[0].querySelector('span')).fontFamily, 'Inter, sans-serif');
		const outline = bounds[0].querySelector('.MuiOutlinedInput-root');
		assert.equal(computed(outline).height, '44px');
		assert.equal(computed(outline).borderRadius, '8px');
		assert.notEqual(
			computed(outline.querySelector('legend')).float,
			'left',
			'Sidebar legend styles must not affect MUI input notches',
		);
		for (const locale of ['en', 'kr', 'ru']) {
			const messages = JSON.parse(fs.readFileSync(`${root}/public/locales/${locale}/common.json`, 'utf8'));
			for (const key of Object.keys(messages).slice(Object.keys(messages).indexOf('Most viewed'))) {
				assert(!messages[key].includes('?'), `${locale} ${key} contains damaged text`);
			}
			const translated = i18n.getFixedT(locale);
			i18n.addResourceBundle(locale, 'common', messages);
			const rangeText = translated('Showing resorts range', { start: 9, end: 11, total: 11 });
			assert(rangeText.includes('9') && rangeText.includes('11') && !rangeText.includes('?'));
		}
		assert.equal(checkbox(0).length, 12, 'All Korea plus eleven backend cities');
		assert(document.querySelector('.resort-directory-card-footer strong').textContent.includes('₩0'));
		assert(document.querySelector('.resort-directory-card a').href.includes('arrival=2026-12-20'));
		await click(choice(0, 'Pyeongchang'));
		await click(choice(0, 'Muju'));
		assert.deepEqual(lastInput().search.locationList, ['PYEONGCHANG', 'MUJU']);
		await click(choice(1, 'Beginner'));
		await click(choice(2, 'Ski school'));
		assert.deepEqual(lastInput().search.levelList, ['BEGINNER']);
		assert.deepEqual(lastInput().search.facilities, ['SKI_SCHOOL']);
		assert(!('arrival' in lastInput().search));
		for (const [label, sort, direction] of [
			['Popular (most likes)', 'resortLikes', 'DESC'],
			['Price high to low', 'resortPricePerDay', 'DESC'],
			['Price low to high', 'resortPricePerDay', 'ASC'],
			['Most viewed', 'resortViews', 'DESC'],
		]) {
			await act(async () =>
				document
					.querySelector('.resort-directory-toolbar .MuiSelect-select')
					.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true })),
			);
			await click([...document.querySelectorAll('[role="option"]')].find((e) => e.textContent === label));
			assert.equal(lastInput().sort, sort);
			assert.equal(lastInput().direction, direction);
			assert.equal(lastInput().page, 1);
		}
		await click(document.querySelector('[aria-label="Go to page 2"]'));
		assert.equal(lastInput().page, 2);
		assert.equal(document.querySelector('.resort-directory-toolbar strong').textContent, 'Showing 9 to 11 of 11 resorts');
		assert.equal(
			document.querySelector('.resort-directory-pagination > span').textContent,
			'Showing 9 to 11 of 11 resorts',
		);
		assert.equal(lastInput().search.locationList.length, 2);
		await click(choice(0, 'All Korea'));
		assert(!lastInput().search.locationList);
		assert.equal(lastInput().page, 1);
		const inputs = document.querySelectorAll('.resort-desktop-filters .resort-price-filter input');
		await setValue(inputs[0], '100');
		await setValue(inputs[1], '50');
		const before = requests.length;
		await submit(document.querySelector('.resort-desktop-filters .resort-price-filter'));
		assert.equal(requests.length, before);
		assert(document.querySelector('.resort-price-filter [role="alert"]').textContent.includes('valid price range'));
		await setValue(inputs[0], '0');
		await setValue(inputs[1], '100000');
		await submit(document.querySelector('.resort-desktop-filters .resort-price-filter'));
		assert.deepEqual(lastInput().search.pricesRange, { start: 0, end: 100000 });
		await click(button('Clear all'));
		assert.deepEqual(lastInput().search, {});
		await click(document.querySelector('.resort-save'));
		assert.equal(alerts, 1);
		assert(!requests.some((r) => r.name === 'LikeTargetResort'));
		await act(async () => userVar({ ...userVar(), _id: '000000000000000000000002' }));
		await flush();
		await act(async () => {
			document.querySelector('.resort-save').click();
			document.querySelector('.resort-save').click();
		});
		await flush();
		assert.equal(requests.filter((r) => r.name === 'LikeTargetResort').length, 1);
		assert.equal(requests.find((r) => r.name === 'LikeTargetResort').variables.resortId, resort._id);
		assert.equal(document.querySelector('.resort-save').getAttribute('aria-pressed'), 'true');
		await setValue(document.querySelector('.resort-directory-search input'), 'missing');
		await submit(document.querySelector('.resort-directory-search'));
		assert.equal(lastInput().search.text, 'missing');
		assert(document.querySelector('.resort-directory-empty'));
		assert.equal(document.querySelectorAll('.resort-directory-card').length, 0);
		fail = true;
		await click(button('Clear all'));
		assert(document.querySelector('.resort-directory-results [role="alert"]').textContent.includes('Unable to load'));
		await click(button('Retry'));
		assert.equal(document.querySelectorAll('.resort-directory-card').length, 8);
		await click(document.querySelector('.resort-mobile-filters'));
		assert(document.querySelector('.resort-filter-drawer'));
		await click(button('Show results'));
		assert(pushes.every((p) => p.query.arrival === '2026-12-20'));
		console.log(
			'PASS: resort cities/levels/facilities, all four sorts, pagination, price validation, reset, trip URLs, zero prices, favorite guards/duplicate lock, empty/retry states and mobile drawer.',
		);
	} finally {
		await act(async () => mounted.unmount());
		client.stop();
		dom.window.close();
	}
})().catch((e) => {
	console.error(e);
	process.exitCode = 1;
});
