const fs = require('fs'),
	path = require('path'),
	assert = require('node:assert/strict'),
	ts = require('typescript');
const root = path.resolve(__dirname, '..');
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
const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: 'http://localhost/_admin/users' });
Object.assign(global, {
	window: dom.window,
	document: dom.window.document,
	navigator: dom.window.navigator,
	Image: dom.window.Image,
	HTMLElement: dom.window.HTMLElement,
	Element: dom.window.Element,
	DocumentFragment: dom.window.DocumentFragment,
	self: dom.window,
	IS_REACT_ACT_ENVIRONMENT: true,
});
window.HTMLElement.prototype.getBoundingClientRect = () => ({
	x: 0,
	y: 0,
	top: 0,
	left: 0,
	right: 100,
	bottom: 40,
	width: 100,
	height: 40,
});
const React = require('react'),
	{ createRoot } = require('react-dom/client'),
	{ act } = require('react-dom/test-utils');
const linkFile = require.resolve('next/link');
require.cache[linkFile] = {
	id: linkFile,
	filename: linkFile,
	loaded: true,
	exports: {
		__esModule: true,
		default: React.forwardRef(({ href, children, ...props }, ref) =>
			React.createElement('a', { href, ref, ...props }, children),
		),
	},
};
const { ApolloClient, ApolloLink, InMemoryCache, Observable, ApolloProvider } = require('@apollo/client');
const { I18nextProvider } = require('react-i18next');
const i18n = require('i18next').createInstance();
i18n.init({
	lng: 'en',
	initImmediate: false,
	resources: { en: { common: JSON.parse(fs.readFileSync(root + '/public/locales/en/common.json', 'utf8')) } },
	defaultNS: 'common',
});
const { default: Members, csvCell } = require(root + '/libs/components/admin/users/AdminMembers.tsx');
let member = {
	_id: '000000000000000000000001',
	memberType: 'USER',
	memberStatus: 'ACTIVE',
	memberNick: 'Snow.Rider',
	memberPhone: '01012345678',
	memberAuthType: 'PHONE',
	memberFullName: 'Snow Rider',
	memberWarnings: 2,
	memberBlocks: 1,
	memberArticles: 3,
	memberLikes: 8,
	memberViews: 20,
	createdAt: '2026-10-06T00:00:00Z',
	updatedAt: '2026-10-06T00:00:00Z',
	memberProperties: 0,
	memberRank: 0,
	memberPoints: 0,
	memberImage: null,
	memberAddress: null,
	memberDesc: null,
	deletedAt: null,
	accessToken: null,
};
let failure = false,
	mutationFailure = false;
const calls = [];
const client = new ApolloClient({
	cache: new InMemoryCache({ addTypename: false }),
	link: new ApolloLink(
		(op) =>
			new Observable((observer) => {
				calls.push({ name: op.operationName, input: op.variables.input, variables: op.variables });
				setTimeout(() => {
					if (
						(failure && op.operationName === 'GetAllMembersByAdmin') ||
						(mutationFailure && op.operationName === 'UpdateMemberByAdmin')
					) {
						observer.error(new Error('Fixture request failed'));
						return;
					}
					let data;
					if (op.operationName === 'AdminMemberSummary')
						data = Object.fromEntries(
							['all', 'active', 'instructors', 'blocked', 'archived'].map((k) => [
								k,
								{ metaCounter: [{ total: k === 'all' ? 11 : 1 }] },
							]),
						);
					else if (op.operationName === 'UpdateMemberByAdmin') {
						member = { ...member, ...op.variables.input };
						data = { updateMemberByAdmin: member };
					} else {
						const s = op.variables.input.search;
						const matches =
							(!s.memberType || s.memberType === member.memberType) &&
							(!s.memberStatus || s.memberStatus === member.memberStatus) &&
							(!s.text || new RegExp(s.text, 'i').test(member.memberNick));
						data = {
							getAllMembersByAdmin: { list: matches ? [member] : [], metaCounter: [{ total: matches ? 11 : 0 }] },
						};
					}
					observer.next({ data });
					observer.complete();
				}, 10);
			}),
	),
});
const app = createRoot(document.getElementById('root'));
const wait = () => act(() => new Promise((r) => setTimeout(r, 70)));
const click = async (el) => {
	assert(el, 'missing control');
	await act(async () => {
		el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
	});
	await wait();
};
const button = (text) =>
	[...document.querySelectorAll('button')].find((b) => b.textContent === text || b.firstChild?.textContent === text);
const setInput = async (input, value) => {
	await act(async () => {
		Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value);
		input.dispatchEvent(new window.Event('input', { bubbles: true }));
	});
};
(async () => {
	await act(async () =>
		app.render(
			React.createElement(
				I18nextProvider,
				{ i18n },
				React.createElement(ApolloProvider, { client }, React.createElement(Members)),
			),
		),
	);
	await wait();
	assert(document.body.textContent.includes('Snow Rider'));
	assert.equal(calls.filter((c) => c.name === 'GetAllMembersByAdmin').length, 1);
	assert.equal(calls.find((c) => c.name === 'AdminMemberSummary').variables.blocked.search.memberStatus, 'BLOCK');
	assert.equal(calls.find((c) => c.name === 'AdminMemberSummary').variables.archived.search.memberStatus, 'DELETE');
	assert.equal(document.querySelector('.admin-members-tab-count').textContent, '11');
	await click(document.querySelector('[aria-label="Select member Snow.Rider"]'));
	assert(document.querySelector('[aria-label="Select all members on this page"]').checked);
	assert(document.body.textContent.includes('Export selected'));
	await click(document.querySelector('[aria-label="Select all members on this page"]'));
	assert(!document.querySelector('[aria-label="Select member Snow.Rider"]').checked);
	await click(document.querySelector('[aria-label="Go to next page"]'));
	assert.equal(calls.filter((c) => c.input).at(-1).input.page, 2);
	await setInput(document.querySelector('[aria-label="Search nickname"]'), 'Snow.');
	await act(async () =>
		document
			.querySelector('.admin-members-filters')
			.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })),
	);
	await wait();
	let last = calls.filter((c) => c.name === 'GetAllMembersByAdmin').at(-1);
	assert.equal(last.input.search.text, 'Snow\\.');
	assert.equal(last.input.page, 1);
	await click(button('Blocked'));
	assert(document.body.textContent.includes('No members found'));
	last = calls.filter((c) => c.input).at(-1);
	assert.equal(last.input.search.memberStatus, 'BLOCK');
	assert.equal(last.input.search.text, 'Snow\\.');
	await click(button('Reset'));
	await click(document.querySelector('[aria-label="Manage member Snow.Rider"]'));
	assert(document.body.textContent.includes('Member details'));
	await click(button('Block member'));
	assert(document.body.textContent.includes('Confirm member change'));
	assert.equal(calls.filter((c) => c.name === 'UpdateMemberByAdmin').length, 0);
	mutationFailure = true;
	await click(button('Confirm'));
	assert(document.body.textContent.includes('Fixture request failed'));
	mutationFailure = false;
	const before = calls.filter((c) => c.name === 'UpdateMemberByAdmin').length;
	await act(async () => {
		button('Confirm').click();
		button('Confirm').click();
	});
	await wait();
	assert.equal(calls.filter((c) => c.name === 'UpdateMemberByAdmin').length, before + 1);
	assert.equal(member.memberStatus, 'BLOCK');
	assert.deepEqual(calls.filter((c) => c.name === 'UpdateMemberByAdmin').at(-1).input, {
		_id: member._id,
		memberStatus: 'BLOCK',
	});
	await click(button('Edit member information'));
	await setInput(document.querySelector('.admin-member-edit input'), 'xy');
	await act(async () =>
		document
			.querySelector('.admin-member-edit')
			.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })),
	);
	await wait();
	assert(document.body.textContent.includes('Nickname must be 3'));
	assert.equal(calls.filter((c) => c.name === 'UpdateMemberByAdmin').length, before + 1);
	await setInput(document.querySelector('.admin-member-edit input'), 'Powder');
	await act(async () =>
		document
			.querySelector('.admin-member-edit')
			.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })),
	);
	await wait();
	assert.equal(member.memberNick, 'Powder');
	for (
		let attempt = 0;
		attempt < 10 && document.querySelector('.admin-member-drawer-heading [aria-label="Close"]').disabled;
		attempt++
	)
		await wait();
	await click(document.querySelector('.admin-member-drawer-heading [aria-label="Close"]'));
	failure = true;
	await click(button('Archived'));
	assert(document.body.textContent.includes('Unable to load members'));
	failure = false;
	await click(button('Retry'));
	assert(document.body.textContent.includes('No members found'));
	await click(button('Reset'));

	const menuItem = (text) =>
		[...document.querySelectorAll('[role="menuitem"]')].find((item) => item.textContent === text);
	let mutationCount = calls.filter((c) => c.name === 'UpdateMemberByAdmin').length;
	await click(document.querySelector('[aria-label="Role Powder"]'));
	assert.equal(menuItem('User').getAttribute('aria-disabled'), 'true');
	assert(!menuItem('Instructor'));
	await click(menuItem('Admin'));
	assert.equal(calls.filter((c) => c.name === 'UpdateMemberByAdmin').length, mutationCount);
	await click(button('Cancel'));
	assert.equal(member.memberType, 'USER');
	await click(document.querySelector('[aria-label="Role Powder"]'));
	await click(menuItem('Admin'));
	await click(button('Confirm'));
	assert.equal(member.memberType, 'ADMIN');
	assert.deepEqual(calls.filter((c) => c.name === 'UpdateMemberByAdmin').at(-1).input, {
		_id: member._id,
		memberType: 'ADMIN',
	});
	await act(() => new Promise((resolve) => setTimeout(resolve, 400)));
	assert(!document.querySelector('.admin-member-drawer'));
	await click(document.querySelector('[aria-label="Status Powder"]'));
	assert.equal(menuItem('Blocked').getAttribute('aria-disabled'), 'true');
	await click(menuItem('Active'));
	await click(button('Confirm'));
	assert.equal(member.memberStatus, 'ACTIVE');
	assert.deepEqual(calls.filter((c) => c.name === 'UpdateMemberByAdmin').at(-1).input, {
		_id: member._id,
		memberStatus: 'ACTIVE',
	});
	member.memberType = 'INSTRUCTOR';
	await act(async () => client.refetchQueries({ include: ['GetAllMembersByAdmin'] }));
	await wait();
	await click(document.querySelector('[aria-label="Role Powder"]'));
	assert(!menuItem('Admin'));
	assert(!menuItem('User'));
	assert(menuItem('Instructor applications'));
	await act(async () =>
		document
			.querySelector('[role="menu"]')
			.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
	);
	await wait();
	assert.equal(csvCell('=1+1'), '"\'=1+1"');
	assert.equal(csvCell('a,"b"'), '"a,""b"""');
	await act(async () => app.unmount());
	await client.stop();
	const stub = (file, exports) => {
		const full = path.resolve(root, file);
		require.cache[full] = { id: full, filename: full, loaded: true, exports: { __esModule: true, ...exports } };
	};
	const navigation = [];
	const router = {
		pathname: '/_admin/users',
		push: async (path) => navigation.push(path),
		replace: async (path) => navigation.push(path),
	};
	stub('node_modules/next/router.js', { useRouter: () => router });
	stub('node_modules/next/head.js', { default: () => null });
	let logoutCalls = 0;
	stub('libs/auth/index.ts', { logOut: () => logoutCalls++ });
	const { userVar } = require(root + '/apollo/store.ts');
	let ready = false;
	const admin = { ...member, memberNick: 'AdminFixture', memberFullName: 'Actual Administrator', memberType: 'ADMIN' };
	userVar(admin);
	stub('libs/hooks/useMemberSession.ts', { default: () => ({ user: userVar(), ready }) });
	stub('libs/components/layout/AppLayout.tsx', {
		default: ({ children }) => React.createElement('div', { className: 'legacy-layout-fixture' }, children),
	});
	stub('libs/components/admin/AdminMenuList.tsx', {
		default: () => React.createElement('div', null, 'Legacy navigation'),
	});
	const withAdminLayout = require(root + '/libs/components/layout/LayoutAdmin.tsx').default;
	const Guarded = withAdminLayout(() => React.createElement('p', null, 'Protected member content'), {
		membersDesign: true,
	});
	const shellRoot = createRoot(document.getElementById('root'));
	const mountShell = () =>
		act(async () => shellRoot.render(React.createElement(I18nextProvider, { i18n }, React.createElement(Guarded))));
	await mountShell();
	assert(!document.querySelector('.admin-members-shell'));
	ready = true;
	userVar({ ...admin, memberType: 'USER' });
	await mountShell();
	assert(!document.querySelector('.admin-members-shell'));
	assert(navigation.includes('/'));
	userVar(admin);
	await mountShell();
	assert(document.querySelector('.admin-members-shell'));
	assert(document.body.textContent.includes('Actual Administrator'));
	assert.equal(document.querySelector('.admin-shell-profile').getAttribute('href'), '/mypage');
	assert.equal(document.querySelector('[aria-current="page"]').getAttribute('href'), '/_admin/users');
	assert(!document.querySelector('.legacy-layout-fixture'));
	await click(document.querySelector('[aria-label="Open navigation"]'));
	assert(document.querySelector('.admin-shell-sidebar.is-open'));
	await click(document.querySelector('.admin-shell-backdrop'));
	assert(!document.querySelector('.admin-shell-sidebar.is-open'));
	await setInput(document.querySelector('[aria-label="Search admin pages"]'), 'Resorts');
	await act(async () =>
		document
			.querySelector('.admin-shell-jump')
			.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })),
	);
	assert(navigation.includes('/_admin/resort'));
	await click(document.querySelector('.admin-shell-logout'));
	assert.equal(logoutCalls, 1);
	const Legacy = withAdminLayout(() => React.createElement('p', null, 'Other admin content'));
	await act(async () => shellRoot.render(React.createElement(I18nextProvider, { i18n }, React.createElement(Legacy))));
	assert(document.querySelector('.legacy-layout-fixture'));
	assert(!document.querySelector('.admin-members-shell'));
	await act(async () => shellRoot.unmount());
	dom.window.close();
	console.log(
		'PASS: Admin Members real Apollo fixture search, filters, pagination, totals, confirmation, mutation failure/retry/duplicate lock, edit validation, empty/error/retry, CSV escaping.',
	);
	process.exit(0);
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
