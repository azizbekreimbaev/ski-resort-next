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
let price = 100;
const client = new apollo.ApolloClient({
	cache: new apollo.InMemoryCache(),
	link: new apollo.ApolloLink(
		(op) =>
			new apollo.Observable((observer) => {
				requests.push(op.operationName);
				const timer = setTimeout(() => {
					observer.next({
						data: {
							getEquipment: {
								_id: id,
								equipmentName: 'Fixture',
								equipmentStatus: 'AVAILABLE',
								equipmentCategory: 'SKI',
								equipmentAudience: 'ALL',
								equipmentBrand: null,
								equipmentSize: null,
								equipmentImages: [],
								equipmentDesc: null,
								equipmentRentalRates: [{ durationHours: 3, price: 100 }],
								equipmentPurchasable: true,
								equipmentPurchasePrice: price,
								equipmentQuantity: 0,
								equipmentLikes: 0,
								equipmentViews: 0,
								equipmentComments: 0,
								resortId: null,
								meLiked: [],
							},
						},
					});
					observer.complete();
				}, 5);
				return () => clearTimeout(timer);
			}),
	),
});
const cart = require(root + '/libs/demoCart.ts');
const { checkoutBusy } = require(root + '/libs/demoCheckout.ts');
const Page = require(root + '/libs/components/common/CartPage.tsx').default;
let mounted;
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
				React.createElement(I18nextProvider, { i18n }, React.createElement(Page, { checkout: true })),
			),
		),
	);
	await settle();
}
const button = (label) => Array.from(document.querySelectorAll('button')).find((node) => node.textContent === label);
const line = {
	key: 'purchase',
	resourceId: id,
	title: 'Fixture',
	image: '',
	quantity: 1,
	unitPrice: 100,
	kind: 'equipment-purchase',
};
(async () => {
	await act(async () => cart.saveCart([line]));
	await render();
	price = 120;
	await act(async () => button('Confirm demo payment').click());
	await settle(100);
	assert.ok(document.body.textContent.includes('Prices changed'));
	assert.equal(routes.length, 0);
	assert.equal(cart.cartVar()[0].unitPrice, 120);
	const before = requests.length;
	await act(async () => {
		const confirm = button('Confirm demo payment');
		confirm.click();
		confirm.click();
	});
	await settle(1000);
	assert.equal(requests.length - before, 1);
	assert.equal(cart.readReceipts(id).length, 1);
	assert.equal(cart.cartVar().length, 0);
	assert.match(routes.at(-1), /checkout\/success/);
	assert.ok(requests.every((name) => name === 'GetEquipment'));
	// A guest must be redirected to the existing login with a checkout return URL.
	await act(async () => userVar({ ...original, _id: '' }));
	await act(async () => cart.saveCart([line]));
	await render();
	await settle();
	assert.ok(routes.at(-1).includes('/account/join?referrer=%2Fcheckout'));
	assert.equal(button('Confirm demo payment'), undefined);
	await act(async () => userVar({ ...original, _id: id, memberNick: 'Fixture', memberType: 'USER' }));
	price = 100;
	await act(async () => cart.saveCart([line]));
	await render();
	// Switch the real MUI Select to the failure simulation.
	await act(async () =>
		document
			.querySelector('[aria-haspopup="listbox"]')
			.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true })),
	);
	await settle();
	const failure = Array.from(document.querySelectorAll('[role="option"]')).find(
		(node) => node.textContent === 'Failure / retry',
	);
	assert.ok(failure);
	await act(async () => failure.click());
	await settle();
	const routeCount = routes.length;
	await act(async () => button('Confirm demo payment').click());
	await settle(1000);
	assert.ok(document.body.textContent.includes('Demo payment failed'));
	assert.equal(routes.length, routeCount);
	assert.equal(cart.cartVar().length, 1);
	assert.equal(checkoutBusy(), false);
	// Replacing the account while a payment is processing must not create a receipt.
	await act(async () =>
		document
			.querySelector('[aria-haspopup="listbox"]')
			.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true })),
	);
	await settle();
	const success = Array.from(document.querySelectorAll('[role="option"]')).find(
		(node) => node.textContent === 'Success',
	);
	await act(async () => success.click());
	await settle();
	await act(async () => button('Confirm demo payment').click());
	await settle(100);
	await act(async () =>
		userVar({ ...original, _id: '000000000000000000000002', memberNick: 'Other', memberType: 'USER' }),
	);
	await settle(1000);
	assert.equal(cart.readReceipts('000000000000000000000002').length, 0);
	assert.equal(cart.cartVar().length, 1);
	await act(async () => mounted.unmount());
	client.stop();
	dom.window.close();
	console.log(
		'PASS: checkout login return, price-change reconfirmation, double-click prevention, local success receipt, query-only network operations, simulated failure retention/retry controls and account-switch protection.',
	);
	process.exit(0);
})().catch(async (error) => {
	console.error(error.stack);
	process.exitCode = 1;
	await act(async () => mounted?.unmount());
	client.stop();
	dom.window.close();
	process.exit(1);
});
