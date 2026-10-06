const fs = require('fs'),
	path = require('path'),
	assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'),
	ts = require('typescript');
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
const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: 'http://localhost/equipment' });
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
window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
HTMLElement.prototype.scrollIntoView = () => {};
const React = require('react'),
	{ createRoot } = require('react-dom/client'),
	{ act } = require('react-dom/test-utils');
const apollo = require('@apollo/client');
function stub(file, exports) {
	const full = path.join(root, file);
	require.cache[full] = { id: full, filename: full, loaded: true, exports: { __esModule: true, ...exports } };
}
const requests = [],
	pushes = [];
let redraw,
	fail = false,
	alerts = 0,
	liked = false;
const router = {
	isReady: true,
	query: {},
	push: async (url) => {
		pushes.push(url);
		router.query = url.query;
		redraw();
	},
};
stub('node_modules/next/router.js', { useRouter: () => router });
stub('node_modules/next/head.js', { default: () => null });
stub('node_modules/next/link.js', {
	default: React.forwardRef(({ href, children, ...props }, ref) =>
		React.createElement('a', { ...props, ref, href }, children),
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
const { I18nextProvider } = require('react-i18next'),
	{ userVar } = require(root + '/apollo/store.ts');
const { collectEquipmentPrices, parseEquipmentInput, equipmentSortOptions } = require(root +
	'/libs/equipmentSearch.ts');
const fixtures = Array.from({ length: 102 }, (_, index) => ({
	_id: (index + 1).toString(16).padStart(24, '0'),
	resortId: null,
	equipmentStatus: 'AVAILABLE',
	equipmentQuantity: 0,
	equipmentName: 'Backend Gear ' + (index + 1),
	equipmentCategory: 'BOOTS',
	equipmentAudience: 'ADULTS',
	equipmentBrand: 'Salomon',
	equipmentSize: '24.0',
	equipmentImages: [],
	equipmentDesc: null,
	equipmentRentalRates: [
		{ durationHours: 3, price: 0 },
		{ durationHours: 6, price: 18000 },
	],
	equipmentPurchasable: index !== 0,
	equipmentPurchasePrice: index === 0 ? null : index === 101 ? 0 : 100000 + index,
	equipmentViews: 1200,
	equipmentLikes: 8,
	equipmentComments: 0,
	meLiked: [],
}));
const client = new apollo.ApolloClient({
	cache: new apollo.InMemoryCache(),
	link: new apollo.ApolloLink(
		(op) =>
			new apollo.Observable((observer) => {
				requests.push({ name: op.operationName, input: op.variables.input, variables: op.variables });
				const timer = setTimeout(() => {
					if (op.operationName === 'GetResorts') observer.next({ data: { getResorts: { list: [], metaCounter: [] } } });
					else if (op.operationName === 'LikeTargetEquipment') {
						liked = !liked;
						observer.next({
							data: {
								likeTargetEquipment: {
									_id: fixtures[0]._id,
									equipmentLikes: liked ? 9 : 8,
									meLiked: [{ myFavorite: liked }],
								},
							},
						});
					} else {
						if (fail) {
							fail = false;
							observer.error(new Error('fixture failure'));
							return;
						}
						const input = op.variables.input;
						assert.notEqual(input.sort, 'purchasePrice', 'Unsupported sorts must never reach GraphQL');
						const all =
							input.search.text === 'missing'
								? []
								: fixtures.map((item) => ({ ...item, meLiked: [{ myFavorite: liked }] }));
						observer.next({
							data: {
								getEquipments: {
									list: all.slice((input.page - 1) * input.limit, input.page * input.limit),
									metaCounter: all.length ? [{ total: all.length }] : [],
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
const Page = require(root + '/libs/components/equipment/EquipmentCatalog.tsx').default;
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
const flush = async () => {
	for (let i = 0; i < 3; i++) await act(async () => new Promise((resolve) => setTimeout(resolve, 40)));
};
const click = async (element) => {
	assert(element);
	await act(async () => element.click());
	await flush();
};
const setValue = async (element, value) => {
	assert(element);
	await act(async () => {
		const proto = element.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
		Object.getOwnPropertyDescriptor(proto, 'value').set.call(element, value);
		element.dispatchEvent(new window.Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
	});
	await flush();
};
const submit = async (form) => {
	await act(async () => form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
	await flush();
};
const inquiry = () => JSON.parse(router.query.input);
const lastRequest = () => requests.filter((request) => request.name === 'GetEquipments').at(-1).input;
const filter = (legend) =>
	Array.from(document.querySelectorAll('.equipment-desktop-filters fieldset')).find(
		(element) => element.querySelector('legend').textContent === legend,
	);
const sort = () => document.querySelector('select[aria-label="Sort equipment"]');
(async () => {
	assert.deepEqual(
		equipmentSortOptions.map((option) => option.label),
		['Newest', 'Popular', 'Most viewed', 'Price high to low', 'Price low to high'],
	);
	assert.equal(parseEquipmentInput().sort, 'createdAt');
	assert.equal(parseEquipmentInput('{"sort":"invented"}').sort, 'createdAt');
	assert.equal(parseEquipmentInput('{"sort":"purchasePrice","direction":"ASC"}').sort, 'purchasePrice');
	assert.equal(parseEquipmentInput('{"search":{"sizeList":["XL"]}}').search.sizeList, undefined);
	let calls = [];
	const request = async (input) => {
		calls.push(input);
		return {
			getEquipments: { list: fixtures.slice((input.page - 1) * 100, input.page * 100), metaCounter: [{ total: 102 }] },
		};
	};
	const ascending = await collectEquipmentPrices(request, {
		...parseEquipmentInput(),
		sort: 'purchasePrice',
		direction: 'ASC',
	});
	assert.equal(ascending[0]._id, fixtures[101]._id, 'Zero price on the second API page sorts first');
	assert.equal(ascending.at(-1)._id, fixtures[0]._id, 'Rental-only items sort last');
	assert.deepEqual(
		calls.map((input) => input.page),
		[1, 2],
	);
	assert(calls.every((input) => input.sort === 'createdAt' && input.limit === 100));
	const descending = await collectEquipmentPrices(request, { ...parseEquipmentInput(), direction: 'DESC' });
	assert.equal(descending[0]._id, fixtures[100]._id);
	assert.equal(descending.at(-1)._id, fixtures[0]._id);
	await assert.rejects(
		collectEquipmentPrices(async () => {
			throw new Error('failed batch');
		}, parseEquipmentInput()),
	);
	assert.deepEqual(await collectEquipmentPrices(request, parseEquipmentInput(), () => true), []);
	await act(async () => redraw());
	await flush();
	assert.equal(document.querySelectorAll('.equipment-card').length, 9);
	assert(document.querySelector('.equipment-card').textContent.includes('Rent from ₩0'));
	assert(document.querySelector('.equipment-card').textContent.includes('3 h package'));
	assert(document.querySelector('.equipment-social').textContent.includes('1,200 Views'));
	assert.equal(
		document.querySelector('.equipment-card h2 a').getAttribute('href'),
		'/equipment/detail?id=' + fixtures[0]._id,
	);
	assert(!sort().textContent.includes('createdAt'));
	await setValue(sort(), 'equipmentLikes:DESC');
	assert.equal(lastRequest().sort, 'equipmentLikes');
	await setValue(sort(), 'equipmentViews:DESC');
	assert.equal(lastRequest().sort, 'equipmentViews');
	await setValue(sort(), 'purchasePrice:ASC');
	assert(document.querySelector('.equipment-card h2').textContent.includes('Backend Gear 102'));
	assert(document.querySelector('.equipment-card-footer').textContent.includes('Buy ₩0'));
	const priceRequests = requests.length;
	await click(document.querySelector('button[aria-label="Go to page 2"]'));
	assert.equal(inquiry().page, 2);
	assert.equal(requests.length, priceRequests, 'Local pagination does not reload the entire catalog');
	await setValue(sort(), 'purchasePrice:DESC');
	assert.equal(inquiry().page, 1);
	assert(document.querySelector('.equipment-card h2').textContent.includes('Backend Gear 101'));
	await setValue(sort(), 'createdAt:DESC');
	await click(filter('Category').querySelector('input'));
	assert.deepEqual(inquiry().search.categoryList, ['SKI']);
	await click(filter('Size').querySelector('button'));
	assert.deepEqual(inquiry().search.sizeList, ['140 CM']);
	await click(filter('Category').querySelectorAll('input')[1]);
	assert.equal(inquiry().search.sizeList, undefined);
	await setValue(filter('Brand').querySelector('input'), 'Burton');
	await submit(filter('Brand').querySelector('form'));
	assert.equal(lastRequest().search.equipmentBrand, 'Burton');
	await click(filter('Audience').querySelectorAll('input')[2]);
	assert.deepEqual(lastRequest().search.audienceList, ['KIDS']);
	const priceForm = filter('Price filter').querySelector('form');
	await setValue(priceForm.querySelectorAll('input')[1], '0');
	await setValue(priceForm.querySelectorAll('input')[2], '20000');
	await submit(priceForm);
	assert(document.querySelector('[role="alert"]').textContent.includes('whole-hour'));
	await setValue(priceForm.querySelectorAll('input')[0], '6');
	await submit(priceForm);
	assert.equal(lastRequest().search.rentalDurationHours, 6);
	assert.deepEqual(lastRequest().search.rentalPricesRange, { start: 0, end: 20000 });
	await click(filter('Price filter').querySelectorAll('.equipment-price-tabs button')[1]);
	await setValue(priceForm.querySelectorAll('input')[0], '0');
	await setValue(priceForm.querySelectorAll('input')[1], '300000');
	await submit(priceForm);
	assert.equal(lastRequest().search.equipmentPurchasable, true);
	assert.equal(lastRequest().search.rentalPricesRange, undefined);
	await click(filter('Availability mode').querySelectorAll('input')[1]);
	assert.equal(lastRequest().search.equipmentPurchasable, false);
	assert.equal(lastRequest().search.purchasePricesRange, undefined);
	await click(document.querySelector('.equipment-filter-heading button'));
	assert.deepEqual(lastRequest().search, {});
	await click(document.querySelector('.equipment-card-photo button'));
	assert.equal(alerts, 1);
	assert(!requests.some((request) => request.name === 'LikeTargetEquipment'));
	await act(async () => userVar({ ...userVar(), _id: '000000000000000000000999' }));
	await flush();
	await click(document.querySelector('.equipment-card-photo button'));
	assert.equal(
		requests.find((request) => request.name === 'LikeTargetEquipment').variables.equipmentId,
		fixtures[0]._id,
	);
	assert.equal(document.querySelector('.equipment-card-photo button').getAttribute('aria-pressed'), 'true');
	await setValue(document.querySelector('input[aria-label="Search equipment"]'), 'missing');
	await submit(document.querySelector('.equipment-search'));
	assert(document.body.textContent.includes('No items to show yet.'));
	fail = true;
	await setValue(document.querySelector('input[aria-label="Search equipment"]'), 'retry-fixture');
	await submit(document.querySelector('.equipment-search'));
	assert(document.body.textContent.includes('Unable to load this collection.'));
	await click(Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Retry'));
	assert.equal(document.querySelectorAll('.equipment-card').length, 9);
	fail = true;
	await setValue(sort(), 'purchasePrice:ASC');
	assert(document.body.textContent.includes('Unable to load this collection.'));
	assert.equal(document.querySelectorAll('.equipment-card').length, 0, 'Failed price collections never display partial results');
	await click(Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Retry'));
	assert(document.querySelector('.equipment-card h2').textContent.includes('Backend Gear 102'));
	await click(document.querySelector('.equipment-mobile-filters'));
	assert(document.querySelector('.equipment-filter-drawer'));
	await click(document.querySelector('button[aria-label="Close filters"]'));
	for (const locale of ['kr', 'ru']) {
		const translations = JSON.parse(fs.readFileSync(root + '/public/locales/' + locale + '/common.json', 'utf8'));
		assert(!translations.Newest.includes('?'));
	}
	await act(async () => mounted.unmount());
	client.stop();
	dom.window.close();
	console.log(
		'PASS: Equipment sort contracts, global price order/pagination, zero prices, filters, package validation, favorites, empty/error/retry and mobile drawer.',
	);
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
	client.stop();
	dom.window.close();
});
