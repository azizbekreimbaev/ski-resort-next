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
const dom = new JSDOM('<html><body><div id="root"></div></body></html>', {
	url: 'http://localhost/equipment/detail?id=000000000000000000000001',
});
Object.assign(global, {
	window: dom.window,
	document: dom.window.document,
	navigator: dom.window.navigator,
	HTMLElement: dom.window.HTMLElement,
	Element: dom.window.Element,
	DocumentFragment: dom.window.DocumentFragment,
	self: dom.window,
	localStorage: dom.window.localStorage,
	IS_REACT_ACT_ENVIRONMENT: true,
});
window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
window.confirm = () => true;
const React = require('react'),
	{ createRoot } = require('react-dom/client'),
	{ act } = require('react-dom/test-utils');
const { ApolloClient, ApolloLink, InMemoryCache, Observable, ApolloProvider } = require('@apollo/client');
function stub(file, exports) {
	const full = path.join(root, file);
	require.cache[full] = { id: full, filename: full, loaded: true, exports: { __esModule: true, ...exports } };
}
const router = { isReady: true, query: { id: '000000000000000000000001' } };
stub('node_modules/next/router.js', { useRouter: () => router });
stub('node_modules/next/head.js', { default: () => null });
stub('node_modules/next/link.js', {
	default: React.forwardRef(({ href, children, ...props }, ref) =>
		React.createElement('a', { ...props, href, ref }, children),
	),
});
let alerts = 0,
	copied = '';
stub('libs/sweetAlert.ts', {
	sweetMixinErrorAlert: async () => {
		alerts++;
	},
});
Object.defineProperty(navigator, 'clipboard', {
	value: {
		writeText: async (value) => {
			copied = value;
		},
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
const { userVar } = require(root + '/apollo/store.ts'),
	{ cartVar } = require(root + '/libs/demoCart.ts');
const fixture = {
	_id: router.query.id,
	resortId: '000000000000000000000002',
	equipmentStatus: 'AVAILABLE',
	equipmentName: 'Backend Snow Boots',
	equipmentCategory: 'BOOTS',
	equipmentAudience: 'ADULTS',
	equipmentBrand: 'Backend Brand',
	equipmentSize: '24.0',
	equipmentImages: ['https://example.test/front.jpg', 'https://example.test/side.jpg', 'https://example.test/back.jpg'],
	equipmentDesc: 'Backend description\nIndependent rental packages.',
	equipmentRentalRates: [
		{ durationHours: 3, price: 0 },
		{ durationHours: 6, price: 18000 },
		{ durationHours: 24, price: 12000 },
	],
	equipmentPurchasable: true,
	equipmentPurchasePrice: 0,
	equipmentQuantity: 0,
	equipmentLikes: 2,
	equipmentViews: 9,
	equipmentComments: 7,
	meLiked: [],
};
const resort = {
	_id: fixture.resortId,
	resortTitle: 'Associated Backend Resort',
	resortLocation: 'PYEONGCHANG',
	resortAddress: 'Backend road',
	resortStatus: 'ACTIVE',
	resortImages: [],
	resortLevel: null,
	resortFacilities: null,
	resortDesc: null,
	resortPricePerDay: 10000,
	resortMinDays: 2,
	resortLikes: 0,
	resortViews: 0,
	resortComments: 0,
	meLiked: [],
};
let liked = false,
	fail = false,
	resortFail = false,
	comments = [],
	slow = false;
const requests = [];
const client = new ApolloClient({
	cache: new InMemoryCache({ addTypename: false }),
	link: new ApolloLink(
		(op) =>
			new Observable((observer) => {
				requests.push({ name: op.operationName, variables: op.variables });
				const timer = setTimeout(
					() => {
						let data;
						switch (op.operationName) {
							case 'GetEquipment':
								if (fail) {
									observer.error(new Error('Equipment fixture failure'));
									return;
								}
								data = { getEquipment: { ...fixture, meLiked: [{ myFavorite: liked }] } };
								break;
							case 'GetResort':
								if (resortFail) {
									observer.error(new Error('Resort fixture failure'));
									return;
								}
								data = { getResort: resort };
								break;
							case 'LikeTargetEquipment':
								liked = !liked;
								data = {
									likeTargetEquipment: { ...fixture, equipmentLikes: liked ? 3 : 2, meLiked: [{ myFavorite: liked }] },
								};
								fixture.equipmentLikes = liked ? 3 : 2;
								break;
							case 'GetComments':
								data = { getComments: { list: comments, metaCounter: [{ total: comments.length }] } };
								break;
							case 'CreateComment': {
								const input = op.variables.input;
								comments = [
									{
										_id: '000000000000000000000009',
										memberId: userVar()._id,
										...input,
										commentStatus: 'ACTIVE',
										createdAt: '2026-10-05T00:00:00Z',
										updatedAt: '2026-10-05T00:00:00Z',
										memberData: null,
									},
								];
								fixture.equipmentComments = 8;
								data = { createComment: comments[0] };
								break;
							}
							case 'UpdateComment': {
								const comment = comments.find((item) => item._id === op.variables.input._id);
								assert(comment);
								const changed = { ...comment, ...op.variables.input };
								data = { updateComment: changed };
								comments = changed.commentStatus === 'DELETE' ? [] : [changed];
								break;
							}
							default:
								observer.error(new Error('Unexpected operation: ' + op.operationName));
								return;
						}
						observer.next({ data });
						observer.complete();
					},
					slow ? 100 : 5,
				);
				return () => clearTimeout(timer);
			}),
	),
});
const Page = require(root + '/libs/components/equipment/EquipmentDetail.tsx').default;
const mounted = createRoot(document.getElementById('root'));
const render = async () =>
	act(async () =>
		mounted.render(
			React.createElement(
				'div',
				{ id: 'pc-wrap', className: 'snowkr-app' },
				React.createElement(
					ApolloProvider,
					{ client },
					React.createElement(I18nextProvider, { i18n }, React.createElement(Page)),
				),
			),
		),
	);
const flush = async () => {
	for (let i = 0; i < 3; i++) await act(async () => new Promise((resolve) => setTimeout(resolve, 55)));
};
const button = (text) =>
	Array.from(document.querySelectorAll('button')).find((element) => element.textContent.trim() === text);
const click = async (element) => {
	assert(element);
	await act(async () => element.click());
	await flush();
};
const value = async (element, text) => {
	assert(element);
	await act(async () => {
		Object.getOwnPropertyDescriptor(
			element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
			'value',
		).set.call(element, text);
		element.dispatchEvent(new window.Event('input', { bubbles: true }));
	});
};
const reload = async () => {
	await act(async () => client.refetchQueries({ include: ['GetEquipment'] }).catch(() => undefined));
	await flush();
};
(async () => {
	await render();
	await flush();
	assert.equal(document.querySelector('h1').textContent, fixture.equipmentName);
	assert.equal(requests.find((op) => op.name === 'GetEquipment').variables.equipmentId, fixture._id);
	assert.deepEqual(requests.find((op) => op.name === 'GetComments').variables.input.search, {
		commentRefId: fixture._id,
		commentGroup: 'EQUIPMENT',
	});
	assert.equal(requests.find((op) => op.name === 'GetResort').variables.resortId, fixture.resortId);
	assert(document.querySelector('.equipment-specifications').textContent.includes('Size (Mondopoint / CM)24.0'));
	assert(document.querySelector('.equipment-specifications').textContent.includes('Catalog quantity0'));
	assert(document.querySelector('.equipment-description').textContent.includes('Backend description'));
	assert.equal(
		document.querySelector('.equipment-comment-count').textContent,
		'0',
		'Active comments override stale persisted counters',
	);
	assert.equal(
		document.querySelector('.equipment-resort-card a').getAttribute('href'),
		'/resort/detail?id=' + fixture.resortId,
	);
	assert.equal(document.querySelectorAll('.equipment-thumbnails button').length, 3);
	await click(document.querySelector('.equipment-thumbnails button[aria-label="Image 2"]'));
	assert(document.querySelector('.equipment-open-photo img').src.endsWith('/side.jpg'));
	await click(document.querySelector('.equipment-open-photo'));
	assert(document.querySelector('[role="dialog"]'));
	await click(button('Next'));
	assert(document.querySelector('.equipment-photo-dialog img').src.endsWith('/back.jpg'));
	await click(button('Close'));
	await click(document.querySelector('button[aria-label="Share"]'));
	assert.equal(copied, window.location.href);
	assert(document.querySelector('.equipment-share-message').textContent.includes('Equipment link copied'));
	assert(button('Add to demo cart').disabled, 'Rental requires a date');
	await value(document.querySelector('input[type="date"]'), '2027-01-15');
	assert(!button('Add to demo cart').disabled);
	await click(button('Add to demo cart'));
	assert.equal(cartVar()[0].unitPrice, 0);
	assert.equal(cartVar()[0].durationHours, 3);
	assert.equal(cartVar()[0].kind, 'equipment-rental');
	await click(document.querySelector('.equipment-rate-grid button:nth-child(3)'));
	await click(document.querySelector('button[aria-label="Increase quantity"]'));
	assert(
		document.querySelector('.equipment-summary-total').textContent.includes('₩24,000'),
		'24-hour package price is independent, multiplied only by quantity',
	);
	await click(button('Add to demo cart'));
	assert.equal(cartVar().at(-1).unitPrice, 12000);
	assert.equal(cartVar().at(-1).durationHours, 24);
	assert.equal(cartVar().at(-1).quantity, 2);
	await click(button('Buy Outright'));
	assert.equal(document.querySelector('input[type="date"]'), null);
	await click(button('Add to demo cart'));
	assert.equal(cartVar().at(-1).kind, 'equipment-purchase');
	assert.equal(cartVar().at(-1).unitPrice, 0);
	await value(document.querySelector('#equipment-detail-quantity'), '1.5');
	assert(button('Add to demo cart').disabled);
	await value(document.querySelector('#equipment-detail-quantity'), '100');
	assert(button('Add to demo cart').disabled);
	await value(document.querySelector('#equipment-detail-quantity'), '1');
	await click(document.querySelector('.equipment-detail-favorite'));
	assert.equal(alerts, 1);
	assert(!requests.some((op) => op.name === 'LikeTargetEquipment'));
	await act(async () => userVar({ ...userVar(), _id: '000000000000000000000099' }));
	await flush();
	slow = true;
	await act(async () => {
		document.querySelector('.equipment-detail-favorite').click();
		document.querySelector('.equipment-detail-favorite').click();
	});
	await flush();
	await flush();
	slow = false;
	assert.equal(
		requests.filter((op) => op.name === 'LikeTargetEquipment').length,
		1,
		'Shared favorite lock prevents duplicates',
	);
	assert.equal(requests.find((op) => op.name === 'LikeTargetEquipment').variables.equipmentId, fixture._id);
	assert.equal(document.querySelector('.equipment-detail-favorite').getAttribute('aria-pressed'), 'true');
	assert(document.querySelector('.equipment-detail-social').textContent.includes('3 Likes'));
	await value(document.querySelector('textarea'), 'Real equipment comment');
	await click(button('Post comment'));
	assert.deepEqual(requests.find((op) => op.name === 'CreateComment').variables.input, {
		commentRefId: fixture._id,
		commentGroup: 'EQUIPMENT',
		commentContent: 'Real equipment comment',
	});
	assert.equal(document.querySelector('.equipment-comment-count').textContent, '1');
	await click(button('Edit'));
	await value(document.querySelector('textarea'), 'Edited equipment comment');
	await click(button('Save'));
	assert(document.querySelector('.resource-comment').textContent.includes('Edited equipment comment'));
	await click(button('Delete'));
	assert.equal(document.querySelector('.equipment-comment-count').textContent, '0');
	assert.equal(fixture.equipmentComments, 8, 'Backend persisted counter remains unchanged on owner deletion');
	fixture.equipmentPurchasable = false;
	fixture.equipmentPurchasePrice = null;
	fixture.equipmentImages = [];
	fixture.equipmentDesc = null;
	fixture.resortId = null;
	await reload();
	assert(button('Buy Outright').disabled);
	assert(document.body.textContent.includes('Equipment photos unavailable'));
	assert(document.body.textContent.includes('Equipment description unavailable'));
	assert(document.body.textContent.includes('This equipment has no associated resort.'));
	assert.equal(document.querySelectorAll('.equipment-thumbnails button').length, 0);
	fixture.equipmentStatus = 'MAINTENANCE';
	await reload();
	assert(document.body.textContent.includes('This resource is unavailable'));
	assert.equal(document.querySelector('.equipment-action-desk'), null);
	fixture.equipmentStatus = 'AVAILABLE';
	fail = true;
	await reload();
	assert(document.body.textContent.includes('This resource is unavailable'));
	fail = false;
	await click(button('Retry'));
	assert(document.querySelector('.equipment-action-desk'));
	const before = requests.length;
	router.query.id = 'invalid';
	await render();
	await flush();
	assert.equal(requests.length, before);
	assert(document.body.textContent.includes('This resource is unavailable'));
	router.query.id = fixture._id;
	await render();
	await flush();
	fixture.resortId = resort._id;
	resortFail = true;
	await reload();
	assert(document.body.textContent.includes('Associated resort is unavailable'));
	assert(document.querySelector('.equipment-action-desk'), 'A missing resort never hides valid equipment');
	resortFail = false;
	await click(button('Retry'));
	assert(document.querySelector('.equipment-resort-card'));
	assert(!requests.some((op) => /booking|payment|order/i.test(op.name)), 'Cart is local only');
	await act(async () => mounted.unmount());
	client.stop();
	dom.window.close();
	console.log(
		'PASS: Equipment detail contracts, gallery, exact package/zero prices, demo cart modes/validation, favorites, comment CRUD/active totals, nullable data, invalid IDs, hidden records and retries.',
	);
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
	client.stop();
	dom.window.close();
});
