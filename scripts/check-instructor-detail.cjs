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
const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: 'http://localhost/instructor/detail' });
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
const React = require('react'),
	{ createRoot } = require('react-dom/client'),
	{ act } = require('react-dom/test-utils');
function stub(file, exports) {
	const f = path.join(root, file);
	require.cache[f] = { id: f, filename: f, loaded: true, exports: { __esModule: true, ...exports } };
}
const id = '000000000000000000000001';
const router = { isReady: true, query: { instructorId: id } };
stub('node_modules/next/router.js', { useRouter: () => router });
stub('node_modules/next/head.js', { default: () => null });
stub('node_modules/next/link.js', {
	default: React.forwardRef(({ href, children, passHref, ...props }, ref) =>
		React.createElement('a', { ...props, href, ref }, children),
	),
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
const { cartVar, todayInKorea } = require(root + '/libs/demoCart.ts');
const Page = require(root + '/libs/components/instructor/InstructorDetail.tsx').default;
const instructor = {
	_id: id,
	memberType: 'INSTRUCTOR',
	memberStatus: 'ACTIVE',
	memberNick: 'Coach',
	memberFullName: 'Backend Coach',
	memberImage: '',
	memberDesc: 'Backend biography',
	memberLikes: 2,
	memberViews: 9,
	instructorResortId: null,
	instructorExperienceYears: 5,
	instructorLanguages: ['Korean', 'English'],
	instructorLevel: 'INTERMEDIATE',
	instructorAudience: 'ADULTS',
	instructorPrice1Week: 0,
	instructorPrice2Weeks: null,
	instructorPrice3Weeks: 920000,
	instructorPrice4Weeks: 1180000,
	meLiked: [],
	meFollowed: [],
};
let liked = false,
	followed = false,
	fail = false,
	comments = [];
const requests = [];
const client = new ApolloClient({
	cache: new InMemoryCache({ addTypename: false }),
	link: new ApolloLink(
		(op) =>
			new Observable((observer) => {
				requests.push({ name: op.operationName, variables: op.variables });
				const timer = setTimeout(() => {
					if (fail && op.operationName === 'GetInstructor') {
						observer.error(new Error('fixture network failure'));
						return;
					}
					let data;
					const member = () => ({
						...instructor,
						meLiked: [{ myFavorite: liked }],
						meFollowed: [{ myFollowing: followed }],
					});
					switch (op.operationName) {
						case 'GetResort':
							data = {
								getResort: {
									_id: op.variables.resortId,
									resortTitle: 'Backend Base Resort',
									resortLocation: 'PYEONGCHANG',
									resortAddress: 'Base road',
									resortStatus: 'ACTIVE',
									resortPricePerDay: 100,
									resortMinDays: 1,
									resortLevel: 'ALL',
									resortImages: [],
									resortDesc: '',
									resortFacilities: [],
									resortLikes: 0,
									resortViews: 0,
									resortComments: 0,
									meLiked: [],
								},
							};
							break;
						case 'GetInstructor':
							data = { getMember: member() };
							break;
						case 'LikeTargetMember':
							liked = !liked;
							data = {
								likeTargetMember: {
									...userVar(),
									...member(),
									memberProperties: 0,
									memberArticles: 0,
									memberPoints: 0,
									memberRank: 0,
									memberWarnings: 0,
									memberBlocks: 0,
									deletedAt: null,
									createdAt: '2026-10-06',
									updatedAt: '2026-10-06',
									accessToken: null,
								},
							};
							break;
						case 'Subscribe':
						case 'Unsubscribe':
							followed = op.operationName === 'Subscribe';
							data = {
								[followed ? 'subscribe' : 'unsubscribe']: {
									_id: '000000000000000000000007',
									followingId: id,
									followerId: userVar()._id,
									createdAt: '2026-10-06',
									updatedAt: '2026-10-06',
								},
							};
							break;
						case 'GetComments':
							data = { getComments: { list: comments, metaCounter: [{ total: comments.length }] } };
							break;
						case 'CreateComment':
							comments = [
								{
									_id: '000000000000000000000009',
									memberId: userVar()._id,
									...op.variables.input,
									commentStatus: 'ACTIVE',
									createdAt: '2026-10-06',
									updatedAt: '2026-10-06',
									memberData: null,
								},
							];
							data = { createComment: comments[0] };
							break;
						case 'UpdateComment': {
							const comment = comments.find((c) => c._id === op.variables.input._id);
							assert(comment);
							const updated = { ...comment, ...op.variables.input };
							comments = updated.commentStatus === 'DELETE' ? [] : [updated];
							data = { updateComment: updated };
							break;
						}
						default:
							observer.error(new Error('Unexpected operation ' + op.operationName));
							return;
					}
					observer.next({ data });
					observer.complete();
				}, 5);
				return () => clearTimeout(timer);
			}),
	),
});
let mounted;
const render = async () => {
	if (mounted) await act(async () => mounted.unmount());
	mounted = createRoot(document.getElementById('root'));
	await act(async () =>
		mounted.render(
			React.createElement(
				ApolloProvider,
				{ client },
				React.createElement(I18nextProvider, { i18n }, React.createElement(Page)),
			),
		),
	);
	await flush();
	await flush();
};
const flush = async () =>
	act(async () => {
		await new Promise((r) => setTimeout(r, 100));
	});
const button = (text) => Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === text);
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
		element.dispatchEvent(new window.Event('change', { bubbles: true }));
	});
};
(async () => {
	try {
		userVar({ ...userVar(), _id: '' });
		await render();
		assert.equal(document.querySelector('h1').textContent, 'Backend Coach');
		assert.deepEqual(requests.find((r) => r.name === 'GetInstructor').variables, { memberId: id });
		assert.deepEqual(requests.find((r) => r.name === 'GetComments').variables.input.search, {
			commentRefId: id,
			commentGroup: 'MEMBER',
		});
		assert(document.querySelector('.instructor-like').disabled);
		const options = document.querySelectorAll('.instructor-package-options button');
		assert.equal(options.length, 4);
		assert(options[1].disabled);
		assert.equal(options[0].getAttribute('aria-pressed'), 'true');
		await value(document.querySelector('input[type=date]'), todayInKorea());
		await click(button('Add to Cart'));
		assert.equal(cartVar()[0].unitPrice, 0);
		assert.equal(cartVar()[0].weeks, 1);
		assert(document.body.textContent.includes('Demo booking only'));
		await click(document.querySelectorAll('.instructor-package-options button')[2]);
		await click(button('Add to Cart'));
		assert.equal(cartVar()[1].weeks, 3);
		assert.equal(cartVar()[1].unitPrice, 920000);
		await act(async () => userVar({ ...userVar(), _id: '000000000000000000000002', memberNick: 'Fixture' }));
		await flush();
		await flush();
		await click(document.querySelector('.instructor-like'));
		assert.equal(document.querySelector('.instructor-like').getAttribute('aria-pressed'), 'true');
		assert.deepEqual(requests.find((r) => r.name === 'LikeTargetMember').variables, { input: id });
		await click(button('Follow'));
		assert(button('Unfollow'));
		await click(button('Unfollow'));
		assert(button('Follow'));
		await value(document.querySelector('textarea'), 'Great coach');
		await click(button('Post comment'));
		assert.equal(comments[0].commentGroup, 'MEMBER');
		assert(document.querySelector('.resource-comment').textContent.includes('Great coach'));
		await click(button('Edit'));
		await value(document.querySelector('textarea'), 'Updated experience');
		await click(button('Save'));
		assert.equal(comments[0].commentContent, 'Updated experience');
		window.confirm = () => true;
		await click(button('Delete'));
		assert.equal(comments.length, 0);
		assert.equal(requests.filter((r) => r.name === 'UpdateComment').at(-1).variables.input.commentStatus, 'DELETE');
		instructor.memberStatus = 'BLOCK';
		await render();
		assert(document.body.textContent.includes('This resource is unavailable'));
		instructor.memberStatus = 'ACTIVE';
		router.query.instructorId = 'invalid';
		const before = requests.length;
		await render();
		assert.equal(requests.length, before);
		router.query.instructorId = id;
		fail = true;
		await render();
		assert(document.body.textContent.includes('This resource is unavailable'));
		fail = false;
		await click(button('Retry'));
		await flush();
		assert(document.querySelector('h1'));
		instructor.instructorPrice1Week = null;
		instructor.instructorPrice3Weeks = null;
		instructor.instructorPrice4Weeks = null;
		instructor.memberFullName = null;
		instructor.memberDesc = null;
		await render();
		assert.equal(document.querySelector('h1').textContent, 'Coach');
		assert(button('Add to Cart').disabled);
		assert(document.body.textContent.includes('Price not configured'));
		instructor.instructorResortId = '000000000000000000000003';
		await render();
		await flush();
		assert(document.querySelector('.instructor-resort-row').textContent.includes('Backend Base Resort'));
		assert.equal(
			document.querySelector('.instructor-resort-row a').getAttribute('href'),
			'/resort/detail?id=' + instructor.instructorResortId,
		);
		assert.deepEqual(requests.find((r) => r.name === 'GetResort').variables, {
			resortId: instructor.instructorResortId,
		});
		console.log(
			'PASS: backend detail and comment payloads, auth refresh, persisted likes/follows, comment create/edit/delete, exact package prices including zero/missing prices, demo cart, invalid IDs, hidden profiles, error/retry and nullable fallbacks.',
		);
	} finally {
		if (mounted) await act(async () => mounted.unmount());
		client.stop();
		dom.window.close();
	}
})()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
