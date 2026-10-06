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
	localStorage: dom.window.localStorage,
	self: dom.window,
});
global.IS_REACT_ACT_ENVIRONMENT = true;
HTMLElement.prototype.getBoundingClientRect = () => ({
	x: 0,
	y: 0,
	top: 0,
	left: 0,
	right: 200,
	bottom: 50,
	width: 200,
	height: 50,
});
const React = require(root + '/node_modules/react'),
	{ createRoot } = require(root + '/node_modules/react-dom/client'),
	{ act } = require(root + '/node_modules/react-dom/test-utils');
const apollo = require(root + '/node_modules/@apollo/client');
const routes = [];
let router = {
	pathname: '/checkout',
	query: {},
	isReady: true,
	push: async (value) => routes.push(value),
	replace: async (value) => routes.push(value),
};
function stub(file, exports) {
	const full = path.join(root, file);
	require.cache[full] = { id: full, filename: full, loaded: true, exports: { __esModule: true, ...exports } };
}
stub('node_modules/next/router.js', { useRouter: () => router });
stub('libs/auth/index.ts', { getJwtToken: () => '', updateUserInfo: () => {} });
const { userVar } = require(root + '/apollo/store.ts');
let original = userVar();
const id = '000000000000000000000001';
userVar({ ...original, _id: id, memberNick: 'Fixture', memberType: 'USER' });
stub('libs/hooks/useMemberSession.ts', { default: () => ({ user: apollo.useReactiveVar(userVar), ready: true }) });
const i18n = require(root + '/node_modules/i18next').createInstance();
i18n.init({
	lng: 'en',
	initImmediate: false,
	defaultNS: 'common',
	resources: { en: { common: JSON.parse(fs.readFileSync(root + '/public/locales/en/common.json', 'utf8')) } },
	interpolation: { escapeValue: false },
});
const { I18nextProvider } = require(root + '/node_modules/react-i18next');
const requests = [];
let fail = false;
const client = new apollo.ApolloClient({
	cache: new apollo.InMemoryCache(),
	link: new apollo.ApolloLink(
		(op) =>
			new apollo.Observable((observer) => {
				requests.push(op.variables.input);
				const timer = setTimeout(() => {
					if (fail) {
						observer.error(new Error('Fixture network unavailable'));
						return;
					}
					const list = Array.from({ length: op.variables.input.page === 1 ? 5 : 1 }, (_, index) => ({
						_id: 'row-' + index,
						followingId: id,
						followerId: '000000000000000000000003',
						createdAt: '2026-01-01',
						updatedAt: '2026-01-01',
						followerData: {
							...original,
							memberStatus: 'ACTIVE',
							memberComments: 0,
							memberFollowings: 0,
							memberFollowers: 0,
							deletedAt: null,
							createdAt: '2026-01-01',
							updatedAt: '2026-01-01',
							_id: '000000000000000000000003',
							memberNick: 'Winter member',
							memberType: 'USER',
							memberImage: '',
							memberFullName: null,
							memberLikes: 0,
						},
						meLiked: [],
						meFollowed: [],
					}));
					observer.next({ data: { getMemberFollowers: { list, metaCounter: [{ total: 6 }] } } });
					observer.complete();
				}, 20);
				return () => clearTimeout(timer);
			}),
	),
});
const Page = require(root + '/libs/components/member/MemberFollowers.tsx').default;
router = { ...router, pathname: '/member', query: { memberId: id }, isReady: true };
let mounted;
const actions = [];
const props = {
	subscribeHandler: async (target, refetch, input) => {
		actions.push(['follow', target]);
		await refetch({ input });
	},
	unsubscribeHandler: async () => {},
	likeMemberHandler: async (target, refetch, input) => {
		actions.push(['like', target]);
		await refetch({ input });
	},
	redirectToMemberPageHandler: async (target) => actions.push(['profile', target]),
};
async function settle(ms = 100) {
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, ms));
	});
}
async function render() {
	if (mounted) await act(async () => mounted.unmount());
	mounted = createRoot(document.getElementById('root'));
	await act(async () =>
		mounted.render(
			React.createElement(
				apollo.ApolloProvider,
				{ client },
				React.createElement(I18nextProvider, { i18n }, React.createElement(Page, props)),
			),
		),
	);
	await settle();
}
(async () => {
	await render();
	assert.equal(document.querySelectorAll('.follows-card-box').length, 5);
	const follow = Array.from(document.querySelectorAll('button')).find((node) => node.textContent === 'Follow');
	await act(async () => follow.click());
	await settle();
	assert.deepEqual(actions[0], ['follow', '000000000000000000000003']);
	const next = document.querySelector('[aria-label="Go to page 2"]');
	assert.ok(next);
	await act(async () => next.click());
	await settle();
	assert.equal(requests.at(-1).page, 2);
	assert.equal(document.querySelectorAll('.follows-card-box').length, 1);
	fail = true;
	await act(async () => document.querySelector('[aria-label="Go to page 1"]').click());
	await settle();
	assert.ok(document.body.textContent.includes('Unable to load this collection'));
	fail = false;
	await act(async () =>
		Array.from(document.querySelectorAll('button'))
			.find((node) => node.textContent === 'Retry')
			.click(),
	);
	await settle();
	assert.equal(document.querySelectorAll('.follows-card-box').length, 5);
	router = { ...router, query: { memberId: 'invalid' } };
	const before = requests.length;
	await render();
	assert.equal(requests.length, before);
	await act(async () => mounted.unmount());
	client.stop();
	dom.window.close();
	console.log(
		'PASS: typed backend follow rows, correct follow target/refetch, pagination, network error/retry, invalid-ID query guard.',
	);
	process.exit(0);
})().catch((error) => {
	console.error(error);
	client.stop();
	dom.window.close();
	process.exit(1);
});
