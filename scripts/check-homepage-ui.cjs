const fs = require('fs'),
	path = require('path'),
	assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const ts = require(root + '/node_modules/typescript');
const compile = (m, f) =>
	m._compile(
		ts.transpileModule(fs.readFileSync(f, 'utf8'), {
			compilerOptions: { module: 1, target: 7, jsx: 2, esModuleInterop: true },
		}).outputText,
		f,
	);
require.extensions['.ts'] = compile;
require.extensions['.tsx'] = compile;
const { JSDOM } = require(root + '/node_modules/jsdom');
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
	url: 'http://localhost:3012',
});
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
global.ResizeObserver = class {
	observe() {}
	disconnect() {}
};
HTMLElement.prototype.scrollIntoView = function () {};
const React = require('react'),
	{ createRoot } = require('react-dom/client'),
	{ act } = require('react-dom/test-utils');
const apollo = require('@apollo/client');
function stub(file, exports) {
	const full = path.join(root, file);
	require.cache[full] = { id: full, filename: full, loaded: true, exports: { __esModule: true, ...exports } };
}
const navigations = [];
stub('node_modules/next/router.js', {
	useRouter: () => ({
		query: { arrival: '2026-12-20', departure: '2026-12-23' },
		push: async (url) => navigations.push(url),
	}),
});
stub('node_modules/next/link.js', {
	default: React.forwardRef(({ href, children, ...props }, ref) =>
		React.createElement(
			'a',
			{ ...props, ref, href: typeof href === 'string' ? href : href.pathname + '?' + new URLSearchParams(href.query) },
			children,
		),
	),
});
stub('libs/components/layout/LayoutHome.tsx', { default: (Component) => Component });
stub('libs/sweetAlert.ts', { sweetMixinErrorAlert: async () => {} });
const i18n = require('i18next').createInstance();
i18n.init({
	lng: 'en',
	initImmediate: false,
	defaultNS: 'common',
	resources: { en: { common: JSON.parse(fs.readFileSync(root + '/public/locales/en/common.json', 'utf8')) } },
	interpolation: { escapeValue: false },
});
const { I18nextProvider } = require('react-i18next');
const requests = [];
let failEquipment = false;
let instructorVisible = false,
	instructorLiked = false,
	instructorFollowed = false;
const { userVar } = require(root + '/apollo/store.ts');
const instructor = {
	...userVar(),
	_id: '000000000000000000000003',
	memberNick: 'Winter Teacher',
	memberFullName: 'Winter Teacher',
	memberType: 'INSTRUCTOR',
	memberStatus: 'ACTIVE',
	memberViews: 1400,
	memberArticles: 0,
	memberPoints: 0,
	createdAt: '2026-01-01',
	updatedAt: '2026-01-01',
	deletedAt: null,
	accessToken: '',
	instructorResortId: null,
	instructorExperienceYears: 4,
	instructorLanguages: ['English'],
	instructorLevel: 'ALL',
	instructorAudience: 'ADULTS',
	instructorPrice1Week: 0,
	instructorPrice2Weeks: null,
	instructorPrice3Weeks: null,
	instructorPrice4Weeks: null,
};
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
	resortLikes: 2,
	resortViews: 4,
	resortComments: 0,
	meLiked: [],
};
const equipment = {
	_id: '000000000000000000000002',
	resortId: null,
	equipmentStatus: 'AVAILABLE',
	equipmentQuantity: 2,
	equipmentLikes: 0,
	equipmentViews: 0,
	equipmentComments: 0,
	meLiked: [],
	equipmentName: 'Backend Snowboard',
	equipmentCategory: 'SNOWBOARD',
	equipmentAudience: 'ALL',
	equipmentBrand: null,
	equipmentSize: null,
	equipmentImages: [],
	equipmentDesc: null,
	equipmentRentalRates: [
		{ durationHours: 4, price: 10000 },
		{ durationHours: 2, price: 0 },
	],
	equipmentPurchasable: true,
	equipmentPurchasePrice: 0,
};
const client = new apollo.ApolloClient({
	cache: new apollo.InMemoryCache({ addTypename: false }),
	link: new apollo.ApolloLink(
		(op) =>
			new apollo.Observable((observer) => {
				requests.push({ name: op.operationName, input: op.variables.input });
				const timer = setTimeout(() => {
					if (op.operationName === 'GetEquipments' && failEquipment) {
						failEquipment = false;
						observer.error(new Error('Test network failure'));
						return;
					}
					const field = {
						GetResorts: 'getResorts',
						GetEquipments: 'getEquipments',
						GetInstructors: 'getInstructors',
						GetBoardArticles: 'getBoardArticles',
					}[op.operationName];
					if (['Subscribe', 'Unsubscribe', 'LikeTargetMember'].includes(op.operationName)) {
						if (op.operationName === 'LikeTargetMember') instructorLiked = !instructorLiked;
						else instructorFollowed = op.operationName === 'Subscribe';
						observer.next({
							data:
								op.operationName === 'LikeTargetMember'
									? { likeTargetMember: instructor }
									: {
											[op.operationName === 'Subscribe' ? 'subscribe' : 'unsubscribe']: {
												_id: 'follow-fixture',
												followingId: instructor._id,
												followerId: userVar()._id,
												createdAt: '2026-01-01',
												updatedAt: '2026-01-01',
											},
									  },
						});
						observer.complete();
						return;
					}
					const list =
						op.operationName === 'GetResorts'
							? [resort]
							: op.operationName === 'GetEquipments'
							? [equipment]
							: op.operationName === 'GetInstructors' && instructorVisible
							? [
									{
										...instructor,
										meLiked: [{ myFavorite: instructorLiked }],
										meFollowed: [{ myFollowing: instructorFollowed }],
									},
							  ]
							: [];
					observer.next({ data: { [field]: { list, metaCounter: [{ total: list.length }] } } });
					observer.complete();
				}, 5);
				return () => clearTimeout(timer);
			}),
	),
});
const Page = require(root + '/pages/index.tsx').default;
const mounted = createRoot(document.getElementById('root'));
const flush = async () => {
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 60));
	});
};
const click = async (element) => {
	assert(element);
	await act(async () => element.click());
	await flush();
};
(async () => {
	try {
		await act(async () =>
			mounted.render(
				React.createElement(
					apollo.ApolloProvider,
					{ client },
					React.createElement(I18nextProvider, { i18n }, React.createElement(Page)),
				),
			),
		);
		await flush();
		assert.equal(document.querySelectorAll('h1').length, 1);
		assert(document.body.textContent.includes('Backend Mountain'));
		assert.deepEqual([...document.querySelector('.home-resort-social').children].map((item) => item.textContent.trim()), ['4 views', '2 Likes', '0 Comments']);
		assert(document.body.textContent.includes('Backend Snowboard'));
		assert(!document.body.textContent.includes('Upcoming Events'));
		assert(requests.some((r) => r.name === 'GetBoardArticles' && r.input.search.articleCategory === 'NEWS'));
		assert.equal(
			document.querySelectorAll('.home-instructor-preview').length,
			0,
			'Do not pad empty instructors with fictional profiles',
		);
		assert(
			document.querySelector('.home-equipment-rates').textContent.includes('₩0'),
			'Zero-price configured packages must remain visible',
		);
		const quick = document.querySelector('.home-quick-filters');
		const regionSelect = document.getElementById(document.querySelector('.home-search-field label').htmlFor);
		regionSelect.getBoundingClientRect = () => ({ top: 0, left: 0, right: 200, bottom: 44, width: 200, height: 44 });
		await act(async () => {
			regionSelect.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, button: 0 }));
		});
		await click([...document.querySelectorAll('[role="option"]')].find((e) => e.textContent === 'Gangwon-do'));
		await click([...quick.querySelectorAll('[role="button"]')].find((e) => e.textContent.includes('Beginner')));
		await click(
			[...quick.querySelectorAll('[role="button"]')].find((e) => e.textContent.includes('Instructor Available')),
		);
		await act(async () =>
			document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })),
		);
		await flush();
		assert.equal(navigations.length, 1, 'Search must navigate to the resort catalog');
		assert.equal(navigations[0].pathname, '/resort');
		assert.equal(navigations[0].query.arrival, '2026-12-20');
		assert.equal(navigations[0].query.departure, '2026-12-23');
		const search = JSON.parse(navigations[0].query.input).search;
		assert.deepEqual(search.levelList, ['BEGINNER']);
		assert.deepEqual(search.facilities, ['SKI_SCHOOL']);
		assert.deepEqual(search.locationList, [
			'PYEONGCHANG',
			'JEONGSEON',
			'HONGCHEON',
			'CHUNCHEON',
			'WONJU',
			'HOENGSEONG',
			'YANGYANG',
		]);
		assert(!('arrival' in search), 'Travel dates must not become unsupported backend filters');
		const { parseResortCatalogInput } = require(root + '/libs/components/resort/ResortCatalog.tsx');
		assert.deepEqual(parseResortCatalogInput(navigations[0].query.input).search, search);
		const headingLink = document.querySelector('#popular-resorts-title a');
		assert.equal(
			headingLink.getAttribute('href'),
			document.querySelector('.home-collection-link a').getAttribute('href'),
		);
		const headingUrl = new URL(headingLink.href);
		assert.equal(headingUrl.pathname, '/resort');
		assert.equal(JSON.parse(headingUrl.searchParams.get('input')).sort, 'resortLikes');
		const detailUrl = new URL(document.querySelector('.home-details-button').href);
		assert.equal(detailUrl.pathname, '/resort/detail');
		assert.equal(detailUrl.searchParams.get('id'), resort._id);
		await click(document.querySelector('.home-resort-preview .home-save-button'));
		assert.equal(navigations.length, 1, 'A favorite click must not navigate to the resort detail');
		assert(document.querySelector('.home-resort-photo-link').getAttribute('href').includes('arrival=2026-12-20'));
		assert(document.querySelector('.home-resort-photo-link').getAttribute('href').includes('departure=2026-12-23'));
		await click([...quick.querySelectorAll('[role="button"]')].find((e) => e.textContent.includes('All Levels')));
		assert.equal(
			[...quick.querySelectorAll('[role="button"]')]
				.find((e) => e.textContent.includes('Beginner'))
				.getAttribute('aria-pressed'),
			'false',
		);
		failEquipment = true;
		await click(
			[...document.querySelectorAll('.home-category-controls [role="button"]')].find((e) =>
				e.textContent.includes('Snowboard'),
			),
		);
		assert.deepEqual(requests.filter((r) => r.name === 'GetEquipments').at(-1).input.search.categoryList, [
			'SNOWBOARD',
		]);
		assert(document.querySelector('#equipment-preview [role="alert"]').textContent.includes('Unable to load'));
		await click(
			[...document.querySelectorAll('#equipment-preview button')].find((e) => e.textContent.includes('Retry')),
		);
		assert(document.querySelector('#equipment-preview').textContent.includes('Backend Snowboard'));
		assert.equal(document.querySelectorAll('.home-equipment-actions a').length, 3);
		assert.equal(document.querySelector('.home-equipment-badge').textContent, 'Rent & Buy');
		instructorVisible = true;
		await act(async () => {
			await client.refetchQueries({ include: ['GetInstructors'] });
		});
		await flush();
		assert(document.querySelector('.home-instructor-photo .home-instructor-image'));
		assert(document.querySelector('.home-instructor-price').textContent.includes('₩0'));
		assert(document.querySelector('.home-instructor-price').textContent.includes('week'));
		const mutationCount = requests.filter((r) => r.name === 'Subscribe').length;
		await click(document.querySelector('.home-follow-button'));
		assert.equal(requests.filter((r) => r.name === 'Subscribe').length, mutationCount, 'Guest follows must not mutate');
		await act(async () => userVar({ ...userVar(), _id: '000000000000000000000004' }));
		await flush();
		await act(async () => {
			const button = document.querySelector('.home-follow-button');
			button.click();
			button.click();
		});
		await flush();
		assert.equal(
			requests.filter((r) => r.name === 'Subscribe').length,
			mutationCount + 1,
			'Double-click must submit once',
		);
		assert.equal(requests.find((r) => r.name === 'Subscribe').input, instructor._id);
		assert(document.querySelector('.home-follow-button').textContent.includes('Unfollow'));
		await click(document.querySelector('.home-follow-button'));
		assert.equal(requests.filter((r) => r.name === 'Unsubscribe').length, 1);
		await click(document.querySelector('.home-instructor-photo .home-save-button'));
		assert.equal(requests.find((r) => r.name === 'LikeTargetMember').input, instructor._id);
		assert.equal(
			document.querySelector('.home-instructor-photo .home-save-button').getAttribute('aria-pressed'),
			'true',
		);
		await act(async () => userVar({ ...userVar(), _id: instructor._id }));
		await flush();
		assert(document.querySelector('.home-follow-button').disabled, 'Self-follow must be disabled');
		console.log(
			'PASS: homepage search navigation and catalog filter parsing, popular heading/detail links, trip dates, retry/empty states, zero prices, equipment actions, instructor follow/unfollow/like, guest/self guards and duplicate-click prevention.',
		);
	} finally {
		await act(async () => mounted.unmount());
		client.stop();
		dom.window.close();
	}
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
