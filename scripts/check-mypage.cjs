const fs = require('fs'),
	path = require('path'),
	assert = require('node:assert/strict'),
	ts = require('typescript');
require.extensions['.ts'] = require.extensions['.tsx'] = (m, f) =>
	m._compile(
		ts.transpileModule(fs.readFileSync(f, 'utf8'), {
			compilerOptions: { module: 1, target: 7, jsx: 2, esModuleInterop: true },
		}).outputText,
		f,
	);
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: 'http://localhost' });
Object.assign(global, {
	window: dom.window,
	document: dom.window.document,
	navigator: dom.window.navigator,
	HTMLElement: dom.window.HTMLElement,
	DocumentFragment: dom.window.DocumentFragment,
	IS_REACT_ACT_ENVIRONMENT: true,
});
const React = require('react'),
	{ createRoot } = require('react-dom/client'),
	{ act, Simulate } = require('react-dom/test-utils');
const stub = (name, exports) => {
	const f = require.resolve(name);
	require.cache[f] = { id: f, filename: f, loaded: true, exports: { __esModule: true, ...exports } };
};
const router = { query: {}, locale: 'kr', isReady: true, replace: async () => {}, push: async () => {} };
stub('next/router', { useRouter: () => router });
stub('next/link', {
	default: React.forwardRef(({ href, children, passHref, ...props }, ref) =>
		React.createElement('a', { ...props, href, ref }, children),
	),
});
stub('next-i18next', { useTranslation: () => ({ t: (k) => k, i18n: { language: 'en' } }) });
stub('../libs/components/layout/LayoutBasic.tsx', { default: (C) => C });
stub('../libs/sweetAlert.ts', { sweetErrorHandling: async () => {} });
stub('../libs/pageTranslations.ts', { getStaticProps: async () => ({ props: {} }) });
let user = {
	_id: 'a'.repeat(24),
	memberType: 'USER',
	memberNick: 'rider',
	memberPhone: '01012345678',
	memberFullName: 'Winter Rider',
	memberDesc: 'Snowboard enthusiast',
};
stub('../libs/hooks/useMemberSession.ts', { default: () => ({ user, ready: true }) });
let summaryError = false,
	summaryLoading = false,
	applicationError = false,
	applicationStatus = null,
	calls = [],
	uploads = [],
	saved = [],
	fail = false,
	resolveMutation;
const counter = (n) => ({ metaCounter: [{ total: n }] });
const summary = {
	getMember: { _id: user._id, createdAt: '2026-10-01T00:00:00Z', memberComments: 3 },
	getMemberFollowers: counter(12),
	getMemberFollowings: counter(4),
	getFavoriteResorts: counter(2),
	getFavoriteEquipments: counter(1),
	getBoardArticles: counter(5),
};
const apollo = require('@apollo/client');
stub('@apollo/client', {
	...apollo,
	useReactiveVar: () => user,
	useQuery: (doc, options) => {
		const name = doc.definitions.find((d) => d.kind === 'OperationDefinition').name.value;
		if (name === 'GetMyPageSummary') {
			assert.equal(options.variables.memberId, user._id);
			assert.equal(options.variables.followers.search.followingId, user._id);
			return {
				data: summary,
				error: summaryError ? new Error('network') : undefined,
				loading: summaryLoading,
				refetch: async () => {},
			};
		}
		return {
			data: { getMyInstructorApplication: applicationStatus ? { applicationStatus } : null },
			error: applicationError ? new Error('offline') : undefined,
			loading: false,
			refetch: async () => {},
		};
	},
	useMutation: (doc) => [
		async (input) => {
			calls.push({ name: doc.definitions.find((d) => d.kind === 'OperationDefinition').name.value, ...input });
			if (fail) throw new Error('save failed');
			if (resolveMutation === null)
				await new Promise((resolve) => {
					resolveMutation = resolve;
				});
			return { data: { updateMember: { accessToken: 'fixture-token' } } };
		},
		{ loading: false },
	],
});
stub('../libs/auth/index.ts', {
	logOut: () => {},
	updateStorage: (input) => saved.push(input),
	updateUserInfo: (token) => saved.push(token),
});
stub('../libs/uploadImages.ts', {
	uploadImages: async (files, target) => {
		uploads.push({ files, target });
		return ['uploads/member/avatar.png'];
	},
});
stub('../libs/components/homepage/homeUtils.ts', { homeImageUrl: (v) => v || '' });
for (const name of ['MyFavorites', 'RecentlyVisited', 'MyArticles', 'WriteArticle'])
	stub('../libs/components/mypage/' + name + '.tsx', { default: () => React.createElement('div', null, name) });
stub('../libs/components/common/DemoOrders.tsx', { default: () => React.createElement('div', null, 'Demo orders') });
stub('../libs/components/common/ResortSelect.tsx', {
	default: () => React.createElement('div', null, 'Resort selector'),
});
stub('../libs/components/homepage/HomeCollectionState.tsx', {
	default: ({ error }) => (error ? React.createElement('div', null, 'Query failed') : null),
});
stub('../libs/components/member/MemberFollows.tsx', {
	default: (props) => {
		assert.equal(props.ownerId, user._id);
		return React.createElement('div', null, props.following ? 'Own followings' : 'Own followers');
	},
});
console.log('Loaded fixture modules');
const Page = require('../pages/mypage/index.tsx').default,
	Profile = require('../libs/components/mypage/MyProfile.tsx').default;
const root = createRoot(document.getElementById('root'));
const render = async (C) => {
	await act(async () => root.render(React.createElement(C)));
};
(async () => {
	console.log('Rendering dashboard');
	router.query.memberId = 'b'.repeat(24);
	await render(Page);
	assert(document.body.textContent.includes('Winter Rider'));
	assert.equal(document.querySelectorAll('.account-stat').length, 5);
	assert.equal(document.querySelectorAll('.account-stat strong')[2].textContent, '3');
	assert(document.body.textContent.includes('Own followers'));
	assert(document.body.textContent.includes('Upcoming Gear Booking'));
	assert(document.body.textContent.includes('Instructor application'));
	assert(!document.body.textContent.includes('Role & View Simulator'));
	router.query.category = 'myFavorites';
	await render(Page);
	assert(!document.querySelector('.account-profile-form'));
	assert.equal(document.querySelector('a[aria-current="page"]').getAttribute('href'), '/mypage?category=myFavorites');
	user = { ...user, memberType: 'ADMIN' };
	router.query.category = 'overview';
	await render(Page);
	assert(!document.querySelector('.account-instructor'));
	assert(document.querySelector('a[href="/_admin/users"]'));
	summaryError = true;
	await render(Page);
	assert.equal(document.querySelector('.account-stat strong').textContent, '—');
	assert(document.body.textContent.includes('Unable to load account summary'));
	summaryError = false;
	user = { ...user, memberType: 'USER' };
	router.query.category = 'instructor';
	applicationError = true;
	await render(Page);
	assert(!document.querySelector('.account-instructor form'));
	applicationError = false;
	applicationStatus = 'PENDING';
	await render(Page);
	assert(!document.querySelector('.account-instructor form'));
	applicationStatus = null;
	console.log('Checking profile interactions');
	await render(Profile);
	const fileInput = () => document.querySelector('input[type=file]');
	await act(async () =>
		Simulate.change(fileInput(), {
			target: { files: [new window.File(['x'], 'bad.webp', { type: 'image/webp' })], value: 'x' },
		}),
	);
	assert.equal(uploads.length, 0);
	assert(document.body.textContent.includes('Choose a JPG or PNG'));
	await act(async () =>
		Simulate.change(fileInput(), {
			target: { files: [new window.File(['x'], 'avatar.png', { type: 'image/png' })], value: 'x' },
		}),
	);
	assert.equal(uploads[0].target, 'member');
	calls = [];
	fail = true;
	await act(async () => Simulate.submit(document.querySelector('form')));
	assert(document.body.textContent.includes('save failed'));
	assert.equal(document.querySelector('input[type=text]').value, 'rider');
	console.log('Checking locked retry');
	fail = false;
	resolveMutation = null;
	await act(async () => {
		Simulate.submit(document.querySelector('form'));
		Simulate.submit(document.querySelector('form'));
		await Promise.resolve();
	});
	assert.equal(calls.length, 2); // One failed attempt plus one locked retry.
	await act(async () => {
		resolveMutation();
		await Promise.resolve();
	});
	const input = calls.at(-1).variables.input;
	assert.equal(input._id, user._id);
	assert.equal(input.memberImage, 'uploads/member/avatar.png');
	assert(!('memberType' in input));
	assert.deepEqual(saved, [{ jwtToken: 'fixture-token' }, 'fixture-token']);
	assert(document.body.textContent.includes('Saved successfully'));
	await act(async () => root.unmount());
	console.log(
		'PASS: My Page live summary variables/counts, Korean date, own social lists, navigation, admin gating, unavailable states, summary errors, application query failure/pending guards, profile upload validation, exact save payload, failure/retry and duplicate-submit lock.',
	);
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
