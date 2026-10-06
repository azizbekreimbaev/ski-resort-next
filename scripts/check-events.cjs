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
const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: 'http://localhost/events' });
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
const React = require('react'),
	{ createRoot } = require('react-dom/client'),
	{ act } = require('react-dom/test-utils');
const { ApolloClient, ApolloProvider, ApolloLink, Observable, InMemoryCache } = require('@apollo/client');
function stub(file, exports) {
	const f = path.join(root, file);
	require.cache[f] = { id: f, filename: f, loaded: true, exports: { __esModule: true, ...exports } };
}
stub('node_modules/next/head.js', { default: () => null });
stub('node_modules/next/link.js', {
	default: React.forwardRef(({ href, children, ...props }, ref) =>
		React.createElement('a', { ...props, href, ref }, children),
	),
});
const t = (key, vars) => key.replace('{{count}}', vars?.count ?? '');
stub('node_modules/next-i18next/dist/commonjs/index.js', { useTranslation: () => ({ t, i18n: { language: 'en' } }) });
let user = { _id: '', memberType: 'USER', memberStatus: 'ACTIVE' };
stub('libs/hooks/useMemberSession.ts', { default: () => ({ user, ready: true }) });
const id = '000000000000000000000001';
let routeId = id,
	redirected = '';
stub('node_modules/next/router.js', {
	useRouter: () => ({
		isReady: true,
		query: { id: routeId },
		replace: async (url) => {
			redirected = url;
		},
	}),
});
const base = {
	__typename: 'Event',
	_id: id,
	eventTitle: 'Backend winter event',
	eventDesc: 'Real backend description',
	eventImages: ['uploads/events/one.jpg'],
	eventStartDate: '2090-01-10T00:00:00Z',
	eventEndDate: '2090-01-11T00:00:00Z',
	eventStatus: 'PUBLISHED',
	eventLocation: 'Gangwon',
	resortId: null,
	memberId: id,
	createdAt: '2026-01-01T00:00:00Z',
	updatedAt: '2026-01-01T00:00:00Z',
};
let records = [
	base,
	{
		...base,
		_id: '000000000000000000000002',
		eventTitle: 'Past backend event',
		eventStartDate: '2020-01-01T00:00:00Z',
		eventEndDate: '2020-01-02T00:00:00Z',
	},
];
let detailRecord = base,
	detailFail = false;
let fail = false,
	saveFail = false;
const requests = [];
const client = new ApolloClient({
	cache: new InMemoryCache({ addTypename: false }),
	link: new ApolloLink(
		(op) =>
			new Observable((observer) => {
				requests.push({ name: op.operationName, variables: op.variables, context: op.getContext() });
				const timer = setTimeout(() => {
					if (detailFail && op.operationName === 'EventDetail')
						return observer.error(new Error('detail fixture failure'));
					if (fail && /Events$/.test(op.operationName)) return observer.error(new Error('fixture list failure'));
					if (saveFail && op.operationName === 'UpdateEvent')
						return observer.error(new Error('Event changed or was removed; reload and retry'));
					let data;
					if (['Events', 'AdminEvents'].includes(op.operationName)) {
						const { input } = op.variables;
						const list = records.filter(
							(e) =>
								(!input.search.text || e.eventTitle.toLowerCase().includes(input.search.text.toLowerCase())) &&
								(!input.search.eventStatus || e.eventStatus === input.search.eventStatus),
						);
						data = {
							[op.operationName === 'Events' ? 'getEvents' : 'getAllEventsByAdmin']: {
								list: list.slice((input.page - 1) * 100, input.page * 100),
								metaCounter: list.length ? [{ total: list.length }] : [],
							},
						};
					} else if (op.operationName === 'EventDetail') data = { getEvent: detailRecord };
					else if (op.operationName === 'AdminEventDetail') data = { getEventByAdmin: detailRecord };
					else if (op.operationName === 'GetResort')
						data = {
							getResort: {
								_id: id,
								resortTitle: 'Linked resort',
								resortImages: [],
								resortStatus: 'ACTIVE',
								resortLocation: 'PYEONGCHANG',
								resortAddress: 'Base plaza',
								resortDesc: 'Host description',
								resortPricePerDay: 0,
								resortMinDays: 1,
								resortLevel: null,
								resortFacilities: [],
								resortLikes: 0,
								resortViews: 0,
								resortComments: 0,
								meLiked: [],
							},
						};
					else if (op.operationName === 'UploadEventImages') data = { uploadEventImages: ['uploads/events/new.jpg'] };
					else if (op.operationName === 'CreateEvent') {
						records.push({ ...base, ...op.variables.input });
						data = { createEvent: { ...base, ...op.variables.input } };
					} else if (op.operationName === 'UpdateEvent')
						data = { updateEventByAdmin: { ...base, ...op.variables.input } };
					else if (op.operationName === 'RemoveEvent') {
						records = records.filter((e) => e._id !== op.variables.eventId);
						data = { removeEventByAdmin: { _id: op.variables.eventId } };
					} else return observer.error(new Error('Unexpected ' + op.operationName));
					observer.next({ data });
					observer.complete();
				}, 1);
				return () => clearTimeout(timer);
			}),
	),
});
const Page = require(root + '/libs/components/events/EventPage.tsx').default;
const Editor = require(root + '/libs/components/events/EventEditor.tsx').default;
const Detail = require(root + '/libs/components/events/EventDetail.tsx').default;
const helpers = require(root + '/libs/types/event.ts');
assert.equal(helpers.eventDateISO('2026-12-05T09:00'), '2026-12-05T00:00:00.000Z');
assert.equal(helpers.koreaDateInput('2026-12-05T00:00:00Z'), '2026-12-05T09:00');
assert.equal(helpers.isPastEvent(base, Date.parse(base.eventEndDate)), true);
assert.equal(helpers.validateEventFiles([{ type: 'image/png', name: 'one.png', size: 15000000 }]), true);
assert.equal(helpers.validateEventFiles([{ type: 'image/png', name: 'one.svg', size: 10 }]), false);
assert.equal(helpers.validateEventFiles([{ type: 'image/png', name: 'one.png', size: 15000001 }]), false);
const view = createRoot(document.getElementById('root'));
const render = (component) =>
	act(async () => {
		view.render(React.createElement(ApolloProvider, { client }, component));
		await new Promise((r) => setTimeout(r, 30));
	});
const settle = () =>
	act(async () => {
		await new Promise((r) => setTimeout(r, 50));
	});
const click = async (text) => {
	const button = [...document.querySelectorAll('button')].find((b) => b.textContent === text);
	assert(button, 'Missing button ' + text);
	await act(async () => button.click());
	await settle();
};
const change = async (el, value) => {
	assert(el);
	await act(async () => {
		const setter = Object.getOwnPropertyDescriptor(
			el.tagName === 'TEXTAREA'
				? window.HTMLTextAreaElement.prototype
				: el.tagName === 'SELECT'
				? window.HTMLSelectElement.prototype
				: window.HTMLInputElement.prototype,
			'value',
		).set;
		setter.call(el, value);
		el.dispatchEvent(new window.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
	});
};
(async () => {
	await render(React.createElement(Page));
	await settle();
	assert(document.body.textContent.includes('Backend winter event'));
	assert(!document.body.textContent.includes('Past backend event'));
	assert(!document.body.textContent.includes('Manage events'));
	assert.deepEqual(requests[0].variables.input, {
		page: 1,
		limit: 100,
		sort: 'eventStartDate',
		direction: 'ASC',
		search: {},
	});
	await click('Past Events');
	assert(document.body.textContent.includes('Past backend event'));
	await click('Upcoming');
	assert.equal(
		document.querySelector('a[href="/events/detail?id=' + id + '"]').getAttribute('href'),
		'/events/detail?id=' + id,
	);
	await render(React.createElement(Detail));
	await settle();
	assert(requests.some((r) => r.name === 'EventDetail' && r.variables.eventId === id));
	assert(document.body.textContent.includes('Real backend description'));
	assert(document.body.textContent.includes('About This Event'));
	assert(!document.body.textContent.includes('Edit Event'));
	assert(document.querySelector('time').textContent.includes('KST'));
	let copied = '';
	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: {
			writeText: async (url) => {
				copied = url;
			},
		},
	});
	await click('Share');
	assert.equal(copied, window.location.href);
	assert(document.body.textContent.includes('Event link copied'));
	detailRecord = { ...base, resortId: id };
	await render(React.createElement(Detail, { key: 'resort' }));
	await settle();
	await settle();
	assert(requests.some((r) => r.name === 'GetResort' && r.variables.resortId === id));
	assert(document.body.textContent.includes('Linked resort'));
	detailRecord = { ...base, eventStatus: 'DRAFT' };
	await render(React.createElement(Detail, { key: 'draft-public' }));
	await settle();
	assert(document.body.textContent.includes('Event unavailable'));
	assert(!document.body.textContent.includes('Real backend description'));
	detailRecord = base;
	detailFail = true;
	await render(React.createElement(Detail, { key: 'detail-error' }));
	await settle();
	assert(document.body.textContent.includes('Event unavailable'));
	detailFail = false;
	await click('Retry');
	assert(document.body.textContent.includes('About This Event'));
	routeId = 'bad';
	const before = requests.length;
	await render(React.createElement(Detail));
	await settle();
	assert(document.body.textContent.includes('Event unavailable'));
	assert.equal(requests.length, before);
	routeId = id;
	user = { _id: id, memberType: 'ADMIN', memberStatus: 'ACTIVE' };
	await render(React.createElement(Detail));
	await settle();
	assert(requests.some((r) => r.name === 'AdminEventDetail'));
	await click('Edit Event');
	await click('Save');
	assert(requests.some((r) => r.name === 'UpdateEvent'));
	requests.length = 0;
	await click('Delete Event');
	await click('Cancel');
	assert(!requests.some((r) => r.name === 'RemoveEvent'));
	await click('Delete Event');
	await click('Delete');
	assert.equal(redirected, '/events');
	requests.length = 0;
	user = { _id: '', memberType: 'USER', memberStatus: 'ACTIVE' };

	records = [base, { ...base, _id: '000000000000000000000003', eventTitle: 'Draft admin event', eventStatus: 'DRAFT' }];
	user = { _id: id, memberType: 'ADMIN', memberStatus: 'ACTIVE' };
	requests.length = 0;
	await render(React.createElement(Page, { key: 'admin-direct', adminPage: true }));
	await settle();
	assert(requests.some((r) => r.name === 'AdminEvents'));
	assert(!requests.some((r) => r.name === 'Events'));
	assert(document.querySelector('.admin-events-page .events-grid'));
	assert.equal(document.querySelectorAll('.event-card').length, 2);
	assert(document.body.textContent.includes('Draft admin event'));
	await click('Create Event');
	assert(document.querySelector('[role="dialog"]'));
	await click('Cancel');
	await change(document.querySelector('select[aria-label="Status"]'), 'DRAFT');
	await settle();
	assert(requests.some((r) => r.name === 'AdminEvents' && r.variables.input.search.eventStatus === 'DRAFT'));
	assert.equal(document.querySelectorAll('.event-card').length, 1);
	await click('Edit');
	await click('Save');
	assert(requests.some((r) => r.name === 'UpdateEvent' && r.variables.input.eventStatus === 'DRAFT'));
	const beforeDenied = requests.length;
	user = { _id: id, memberType: 'ADMIN', memberStatus: 'BLOCK' };
	await render(React.createElement(Page, { key: 'denied', adminPage: true }));
	await settle();
	assert(document.body.textContent.includes('Active admin access required'));
	assert.equal(requests.length, beforeDenied);
	user = { _id: '', memberType: 'USER', memberStatus: 'ACTIVE' };
	await render(React.createElement(Page, { key: 'denied-user', adminPage: true }));
	await settle();
	assert.equal(requests.length, beforeDenied);
	assert(!document.querySelector('.event-card'));
	requests.length = 0;
	records = Array.from({ length: 101 }, (_, index) => ({
		...base,
		_id: index.toString(16).padStart(24, '0'),
		eventTitle: 'Batch event ' + index,
	}));
	await render(React.createElement(Page, { key: 'batches' }));
	await settle();
	assert(requests.some((r) => r.name === 'Events' && r.variables.input.page === 2));
	assert(document.body.textContent.includes('101 events'));
	records = [base];
	fail = true;
	await render(React.createElement(Page, { key: 'failure' }));
	await settle();
	assert(document.body.textContent.includes('fixture list failure'));
	assert(!document.body.textContent.includes('Backend winter event'));
	fail = false;
	await click('Retry');
	assert(document.body.textContent.includes('Backend winter event'));
	user = { _id: id, memberType: 'ADMIN', memberStatus: 'ACTIVE' };
	await render(React.createElement(Page));
	await settle();
	await click('Manage events');
	assert(requests.some((r) => r.name === 'AdminEvents'));
	await click('Edit');
	const titleInput = document.querySelector('input[value="Backend winter event"]');
	await change(titleInput, 'Edited title');
	await click('Save');
	const update = requests.find((r) => r.name === 'UpdateEvent');
	assert.equal(update.variables.input._id, id);
	assert.equal(update.variables.input.eventTitle, 'Edited title');
	assert.equal(update.variables.input.eventStatus, 'PUBLISHED');
	assert.equal(update.variables.input.eventStartDate, '2090-01-10T00:00:00.000Z');
	assert.equal(update.variables.input.resortId, null);
	assert(!('memberId' in update.variables.input));
	saveFail = true;
	await click('Edit');
	await click('Save');
	assert(document.body.textContent.includes('reload and retry'));
	await click('Reload Event');
	saveFail = false;
	await click('Delete');
	assert(!requests.some((r) => r.name === 'RemoveEvent'));
	await click('Cancel');
	await click('Delete');
	const confirm = [...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent === 'Delete');
	await act(async () => confirm.click());
	await settle();
	assert(requests.some((r) => r.name === 'RemoveEvent' && r.variables.eventId === id));
	let saved = 0;
	await render(
		React.createElement(Editor, {
			event: null,
			onClose() {},
			onSaved() {
				saved++;
			},
		}),
	);
	const inputs = [...document.querySelectorAll('[role="dialog"] input')];
	await change(inputs[0], 'New winter event');
	await change(document.querySelector('[role="dialog"] textarea'), 'New description');
	await change(document.querySelectorAll('input[type="datetime-local"]')[0], '2026-12-05T09:00');
	await change(document.querySelectorAll('input[type="datetime-local"]')[1], '2026-12-06T09:00');
	await click('Save');
	assert.equal(saved, 0);
	assert(document.body.textContent.includes('End must follow start'));
	const file = new window.File(['image'], 'cover.png', { type: 'image/png' });
	const uploadInput = document.querySelector('input[type="file"]');
	Object.defineProperty(uploadInput, 'files', { value: [file], configurable: true });
	await act(async () => uploadInput.dispatchEvent(new window.Event('change', { bubbles: true })));
	await settle();
	const upload = requests.find((r) => r.name === 'UploadEventImages');
	assert.equal(upload.context.headers['Apollo-Require-Preflight'], 'true');
	await click('Save');
	assert.equal(saved, 1);
	const create = requests.find((r) => r.name === 'CreateEvent');
	assert.deepEqual(create.variables.input.eventImages, ['uploads/events/new.jpg']);
	assert.equal(create.variables.input.eventStatus, 'DRAFT');
	assert.equal(create.variables.input.eventStartDate, '2026-12-05T00:00:00.000Z');
	await act(async () => view.unmount());
	client.stop();
	dom.window.close();
	console.log('PASS Event listing/detail, admin CRUD, upload, validation and Korea-time fixtures');
})().catch((e) => {
	console.error(e);
	process.exitCode = 1;
	client.stop();
	dom.window.close();
});
