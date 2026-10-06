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
const dom = new JSDOM('<html><head></head><body><div id="root"></div></body></html>', {
	url: 'http://localhost/resort/detail',
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
const React = require('react'),
	{ createRoot } = require('react-dom/client'),
	{ act } = require('react-dom/test-utils');
function stub(file, exports) {
	const f = path.join(root, file);
	require.cache[f] = { id: f, filename: f, loaded: true, exports: { __esModule: true, ...exports } };
}
const router = {
	isReady: true,
	query: { id: '000000000000000000000001', arrival: '2026-12-20', departure: '2026-12-23' },
};
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
		writeText: async (text) => {
			copied = text;
		},
	},
	configurable: true,
});
const i18n = require('i18next').createInstance();
i18n.init({
	lng: 'en',
	initImmediate: false,
	defaultNS: 'common',
	interpolation: { escapeValue: false },
	resources: { en: { common: JSON.parse(fs.readFileSync(root + '/public/locales/en/common.json', 'utf8')) } },
});
const { I18nextProvider } = require('react-i18next');
const { ApolloClient, ApolloProvider, ApolloLink, Observable, InMemoryCache } = require('@apollo/client');
const { userVar } = require(root + '/apollo/store.ts');
const { cartVar } = require(root + '/libs/demoCart.ts');
const ResortDetail = require(root + '/libs/components/resort/ResortDetail.tsx').default;
const resort = {
	_id: router.query.id,
	resortTitle: 'Backend Mountain',
	resortLocation: 'PYEONGCHANG',
	resortAddress: 'Backend mountain road',
	resortStatus: 'ACTIVE',
	resortPricePerDay: 0,
	resortMinDays: 2,
	resortLevel: 'ADVANCED',
	resortImages: [
		'https://example.test/one.jpg',
		'https://example.test/two.jpg',
		'https://example.test/three.jpg',
		'https://example.test/four.jpg',
	],
	resortDesc: 'Backend description\nSecond line',
	resortFacilities: ['SKI_LIFT', 'FIRST_AID'],
	resortLikes: 2,
	resortViews: 9,
	resortComments: 0,
	meLiked: [],
};
let fail = false,
	liked = false,
	comments = [],
	delay = false;
const requests = [];
const client = new ApolloClient({
	cache: new InMemoryCache({ addTypename: false }),
	link: new ApolloLink(
		(operation) =>
			new Observable((observer) => {
				requests.push({ name: operation.operationName, variables: operation.variables });
				const timer = setTimeout(
					() => {
						if (operation.operationName === 'GetResort' && fail) {
							observer.error(new Error('network fixture'));
							return;
						}
						let data;
						switch (operation.operationName) {
							case 'GetResort':
								data = { getResort: { ...resort, meLiked: [{ myFavorite: liked }] } };
								break;
							case 'GetInstructors':
								data = { getInstructors: { list: [], metaCounter: [] } };
								break;
							case 'GetComments':
								data = { getComments: { list: comments, metaCounter: [{ total: comments.length }] } };
								break;
							case 'LikeTargetResort':
								liked = !liked;
								data = { likeTargetResort: { ...resort, meLiked: [{ myFavorite: liked }] } };
								break;
							case 'CreateComment': {
								const input = operation.variables.input;
								comments = [
									{
										_id: '000000000000000000000009',
										memberId: userVar()._id,
										commentContent: input.commentContent,
										commentStatus: 'ACTIVE',
										commentGroup: 'RESORT',
										commentRefId: resort._id,
										createdAt: '2026-10-05T00:00:00Z',
										updatedAt: '2026-10-05T00:00:00Z',
										memberData: null,
									},
								];
								resort.resortComments = comments.length;
								data = { createComment: comments[0] };
								break;
							}
							case 'UpdateComment': {
								const comment = comments.find((item) => item._id === operation.variables.input._id);
								assert(comment);
								data = { updateComment: { ...comment, ...operation.variables.input } };
								comments = comments.filter((item) => item._id !== comment._id);
								// Mirror backend owner deletion: the stored Resort counter stays unchanged.
								break;
							}
							default:
								observer.error(new Error('Unexpected operation: ' + operation.operationName));
								return;
						}
						observer.next({ data });
						observer.complete();
					},
					delay ? 100 : 5,
				);
				return () => clearTimeout(timer);
			}),
	),
});
const mounted = createRoot(document.getElementById('root'));
const render = async () =>
	act(async () =>
		mounted.render(
			React.createElement(
				ApolloProvider,
				{ client },
				React.createElement(I18nextProvider, { i18n }, React.createElement(ResortDetail)),
			),
		),
	);
const flush = async () =>
	act(async () => {
		await new Promise((r) => setTimeout(r, 160));
	});
const button = (text) => Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === text);
const click = async (element) => {
	assert(element, 'button exists');
	await act(async () => element.click());
	await flush();
};
const value = async (element, text) =>
	act(async () => {
		Object.getOwnPropertyDescriptor(
			element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
			'value',
		).set.call(element, text);
		element.dispatchEvent(new window.Event('input', { bubbles: true }));
	});
(async () => {
	try {
		userVar({ ...userVar(), _id: '' });
		await render();
		assert(document.querySelector('[role="status"]'));
		await flush();
		await flush();
		assert.equal(document.querySelector('h1').textContent, 'Backend Mountain');
		assert.deepEqual(requests.find((r) => r.name === 'GetResort').variables, { resortId: resort._id });
		assert(document.querySelector('.resort-detail-description').textContent.includes('Backend description'));
		assert.equal(document.querySelectorAll('.resort-detail-facility').length, 2);
		assert(document.querySelector('.resort-detail-facilities').textContent.includes('First aid'));
		assert(!document.querySelector('.resort-detail-facilities').textContent.includes('Night Skiing'));
		assert.equal(document.querySelector('input[type="date"]').value, '2026-12-20');
		assert.equal(document.querySelectorAll('input[type="date"]')[1].value, '2026-12-23');
		assert(document.querySelector('.resort-booking-rate').textContent.includes('0'));
		assert(document.querySelector('.demo-booking-panel').textContent.includes('Demo booking only'));
		assert(document.querySelector('#resort-comments').textContent.includes('Sign in to comment'));
		assert.deepEqual(requests.find((r) => r.name === 'GetComments').variables.input.search, {
			commentRefId: resort._id,
			commentGroup: 'RESORT',
		});
		assert.deepEqual(requests.find((r) => r.name === 'GetInstructors').variables.input.search, {});
		assert(document.querySelector('nav a').href.includes('arrival=2026-12-20'));
		await click(button('Share'));
		assert.equal(copied, window.location.href);
		assert(document.body.textContent.includes('Resort link copied'));
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 1800));
		});
		await click(button('Share'));
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 1600));
		});
		assert(document.body.textContent.includes('Resort link copied'), 'Repeated share restarts dismissal timer');
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 1600));
		});
		assert(!document.body.textContent.includes('Resort link copied'), 'Share notice automatically disappears');
		await click(button('View All Photos (4)'));
		assert.equal(document.querySelector('.resort-photo-dialog img').getAttribute('src'), resort.resortImages[0]);
		await click(button('Next'));
		assert.equal(document.querySelector('.resort-photo-dialog img').getAttribute('src'), resort.resortImages[1]);
		await click(button('Close'));
		await flush();
		assert(!document.querySelector('.resort-photo-dialog'));
		await click(document.querySelector('.resort-detail-favorite'));
		assert.equal(alerts, 1);
		assert.equal(requests.filter((r) => r.name === 'LikeTargetResort').length, 0);
		await act(async () => userVar({ ...userVar(), _id: '000000000000000000000002' }));
		await flush();
		await flush();
		delay = true;
		await act(async () => {
			document.querySelector('.resort-detail-favorite').click();
			document.querySelector('.resort-detail-favorite').click();
		});
		await flush();
		await flush();
		delay = false;
		assert.equal(requests.filter((r) => r.name === 'LikeTargetResort').length, 1);
		assert.equal(requests.find((r) => r.name === 'LikeTargetResort').variables.resortId, resort._id);
		assert.equal(document.querySelector('.resort-detail-favorite').getAttribute('aria-pressed'), 'true');
		await value(document.querySelector('#resort-comments textarea'), 'Great mountain');
		await click(button('Post comment'));
		assert.deepEqual(requests.find((r) => r.name === 'CreateComment').variables.input, {
			commentRefId: resort._id,
			commentGroup: 'RESORT',
			commentContent: 'Great mountain',
		});
		assert(document.querySelector('#resort-comments').textContent.includes('Great mountain'));
		assert(document.querySelector('.resort-detail-counters a').textContent.includes('1'));
		window.confirm = () => true;
		await click(button('Delete'));
		assert.equal(resort.resortComments, 1, 'Fixture reproduces stale backend counter');
		assert.equal(document.querySelector('.resort-detail-counters a strong').textContent, '0');
		assert(!document.querySelector('#resort-comments').textContent.includes('Great mountain'));
		await act(async () => client.refetchQueries({ include: ['GetResort', 'GetComments'] }));
		await flush();
		assert.equal(
			document.querySelector('.resort-detail-counters a strong').textContent,
			'0',
			'Active total persists through refetch',
		);
		await click(button('Add to Cart'));
		assert.equal(cartVar()[0].days, 3);
		assert.equal(cartVar()[0].unitPrice, 0);
		resort.resortStatus = 'SOLD_OUT';
		await act(async () => client.refetchQueries({ include: ['GetResort'] }));
		await flush();
		assert(button('Add to Cart').disabled);
		assert(document.body.textContent.includes('Sold out'));
		resort.resortImages = [];
		resort.resortFacilities = null;
		resort.resortDesc = null;
		await act(async () => client.refetchQueries({ include: ['GetResort'] }));
		await flush();
		assert(document.querySelector('.resort-detail-no-photo'));
		assert(!button('View All Photos (4)'));
		assert(document.body.textContent.includes('A description has not been provided'));
		assert(document.body.textContent.includes('Facilities have not been listed'));
		fail = true;
		await act(async () => {
			await client.refetchQueries({ include: ['GetResort'] }).catch(() => undefined);
		});
		await flush();
		assert(document.body.textContent.includes('This resource is unavailable'));
		assert(!document.querySelector('h1'));
		fail = false;
		await click(button('Retry'));
		assert(document.querySelector('h1'));
		router.query.id = 'invalid';
		await render();
		await flush();
		const before = requests.length;
		await render();
		await flush();
		assert.equal(requests.length, before);
		assert(!document.querySelector('h1'));
		assert(!button('Retry'));
		for (const locale of ['en', 'kr', 'ru']) {
			const translations = JSON.parse(fs.readFileSync(root + '/public/locales/' + locale + '/common.json', 'utf8'));
			assert(translations['About this resort']);
			assert(translations['View all resort photos'].includes('{{count}}'));
		}
		console.log(
			'PASS: resort detail query/guards, backend content, gallery, real clipboard, travel dates, zero-price demo cart, sold-out, favorite login/duplicate locks, comment target, missing data and retry. Fixture mutations only.',
		);
	} finally {
		await act(async () => mounted.unmount());
		client.stop();
		dom.window.close();
	}
})().then(
	() => process.exit(0),
	(error) => {
		console.error(error);
		process.exit(1);
	},
);
