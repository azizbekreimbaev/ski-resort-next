const fs = require('fs'),
	path = require('path'),
	assert = require('node:assert/strict'),
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
	require.cache[f] = { id: f, filename: f, loaded: true, exports };
};
let calls = [],
	queries = [],
	fail = false,
	refetches = 0;
let memberFailure = false,
	summaryLoading = false;
const item = {
	_id: 'a'.repeat(24),
	memberId: 'b'.repeat(24),
	applicationStatus: 'PENDING',
	instructorExperienceYears: 3,
	instructorLanguages: ['Korean', 'English'],
	instructorLevel: 'BEGINNER',
	instructorAudience: 'ADULTS',
	instructorResortId: null,
	memberDesc: 'Teaching safely',
	createdAt: '2026-10-06T00:00:00Z',
	reviewedAt: null,
	rejectionReason: null,
};
const apollo = require('@apollo/client');
let searchReadFailure = false;
const searchCalls = [];
const other = { ...item, _id: 'c'.repeat(24), memberId: 'd'.repeat(24), applicationStatus: 'APPROVED' };
const searchClient = {
	query: async ({ query, variables }) => {
		if (searchReadFailure) throw new Error('Search unavailable');
		const name = query.definitions.find((d) => d.kind === 'OperationDefinition').name.value;
		searchCalls.push({ name, variables });
		const later = variables.input.page === 2;
		return {
			data:
				name === 'ApplicationSearchMembers'
					? {
							getAllMembersByAdmin: {
								list: [
									{
										_id: later ? other.memberId : item.memberId,
										memberFullName: later ? 'Second Coach' : 'Winter Coach',
										memberNick: later ? 'latecoach' : 'wintercoach',
										memberType: 'USER',
									},
								],
								metaCounter: [{ total: 101 }],
							},
					  }
					: {
							getAllInstructorApplicationsByAdmin: {
								list: [{ ...(later ? other : item) }],
								metaCounter: [{ total: 101 }],
							},
					  },
		};
	},
};
stub('@apollo/client', {
	...apollo,
	useApolloClient: () => searchClient,
	useQuery: (doc, opts) => {
		const name = doc.definitions.find((d) => d.kind === 'OperationDefinition').name.value;
		queries.push({ name, ...opts });
		return {
			loading: name === 'ApplicationSummary' && summaryLoading,
			error: name === 'ApplicationMember' && memberFailure ? new Error('Member unavailable') : undefined,
			refetch: async () => {
				refetches++;
			},
			data:
				name === 'ApplicationMember'
					? {
							getMember: {
								_id: item.memberId,
								memberNick: 'wintercoach',
								memberFullName: 'Winter Coach',
								memberType: 'USER',
							},
					  }
					: name === 'ApplicationSummary'
					? Object.fromEntries(
							['all', 'pending', 'approved', 'rejected'].map((k) => [
								k,
								{ metaCounter: k === 'pending' ? [] : [{ total: 1 }] },
							]),
					  )
					: name === 'GetInstructorApplicationByAdmin'
					? { getInstructorApplicationByAdmin: { ...item } }
					: { getAllInstructorApplicationsByAdmin: { list: [{ ...item }], metaCounter: [{ total: 1 }] } },
		};
	},
	useMutation: (doc) => [
		async (args) => {
			calls.push({ name: doc.definitions.find((d) => d.kind === 'OperationDefinition').name.value, ...args });
			if (fail) throw Error('Review conflict');
			item.applicationStatus = doc.definitions
				.find((d) => d.kind === 'OperationDefinition')
				.name.value.startsWith('Approve')
				? 'APPROVED'
				: 'REJECTED';
			return { data: {} };
		},
		{ loading: false },
	],
});
stub('next-i18next', { useTranslation: () => ({ t: (s) => s }) });
// Keep the interaction test focused on application logic; MUI overlays are covered by MUI.
const mui = require('@mui/material');
stub('@mui/material', {
	...mui,
	Drawer: ({ open, children }) => (open ? React.createElement('div', null, children) : null),
	Dialog: ({ open, children }) => (open ? React.createElement('div', null, children) : null),
});
const Component = require('../libs/components/admin/InstructorApplications.tsx').default;
const root = createRoot(document.getElementById('root'));
const render = async () => act(async () => root.render(React.createElement(Component)));
const click = async (text) => {
	const button = [...document.querySelectorAll('button')].filter((b) => b.textContent === text).pop();
	assert(button, text);
	await act(async () => Simulate.click(button));
};
(async () => {
	await render();
	assert.equal(document.querySelectorAll('.ia-stats strong')[1].textContent, '0');
	assert(document.querySelector('.ia-cover h2').textContent.includes('Winter Coach'));
	assert(document.querySelector('.ia-member-name').textContent.includes('@wintercoach'));
	assert(!document.body.textContent.includes('\uFFFD'));
	assert(queries.some((query) => query.name === 'ApplicationMember' && query.variables.memberId === item.memberId));
	summaryLoading = true;
	await render();
	assert.equal(document.querySelector('.ia-stats strong').textContent, '-');
	summaryLoading = false;
	memberFailure = true;
	await render();
	assert(document.querySelector('.ia-cover h2').textContent.includes(item.memberId.slice(-6)));
	memberFailure = false;
	await render();
	assert(document.body.textContent.includes('Teaching safely'));
	const changeSearch = async (value) =>
		act(async () => {
			Simulate.change(document.querySelector('.ia-filters input'), { target: { value } });
		});
	await changeSearch('  WINTER  ');
	assert.equal(document.querySelectorAll('.ia-card').length, 1);
	assert(document.querySelector('.ia-cover h2').textContent.includes('Winter Coach'));
	assert(
		searchCalls.some((call) => call.name === 'GetAllInstructorApplicationsByAdmin' && call.variables.input.page === 2),
	);
	assert(searchCalls.some((call) => call.name === 'ApplicationSearchMembers' && call.variables.input.page === 2));
	assert(searchCalls.every((call) => !('memberId' in call.variables.input.search)));
	const reads = searchCalls.length;
	await changeSearch('@LATECOACH');
	assert(document.querySelector('.ia-cover h2').textContent.includes('Second Coach'));
	assert.equal(searchCalls.length, reads);
	await changeSearch('missing name');
	assert.equal(document.querySelectorAll('.ia-card').length, 0);
	await changeSearch('');
	assert(document.querySelector('.ia-cover h2').textContent.includes('Winter Coach'));
	searchReadFailure = true;
	await changeSearch('Winter');
	assert.equal(document.querySelectorAll('.ia-card').length, 0);
	searchReadFailure = false;
	await click('Retry');
	assert(document.querySelector('.ia-cover h2').textContent.includes('Winter Coach'));
	await changeSearch('');
	refetches = 0;
	await click('View details');
	assert(document.querySelector('.ia-identity h3').textContent.includes('Winter Coach'));
	await click('Approve application');
	assert.equal(calls.length, 0);
	await click('Approve');
	assert.equal(calls[0].name, 'ApproveInstructorApplicationByAdmin');
	assert.deepEqual(calls[0].variables, { applicationId: item._id });
	assert.equal(refetches, 3);
	assert(!document.body.textContent.includes('Approve application'));
	await act(async () => root.unmount());
	const root2 = createRoot(document.getElementById('root'));
	item.applicationStatus = 'PENDING';
	await act(async () => root2.render(React.createElement(Component)));
	await click('View details');
	await click('Reject application');
	let reject = [...document.querySelectorAll('button')].find(
		(b) => b.textContent === 'Reject' && b.className.includes('contained'),
	);
	assert(reject.disabled);
	await act(async () =>
		Simulate.change(document.querySelector('textarea'), { target: { value: '  Missing experience evidence  ' } }),
	);
	fail = true;
	await act(async () => Simulate.click(reject));
	assert(document.body.textContent.includes('Review conflict'));
	assert.deepEqual(calls[1].variables, { input: { _id: item._id, rejectionReason: 'Missing experience evidence' } });
	fail = false;
	await act(async () => Simulate.click(reject));
	assert.equal(item.applicationStatus, 'REJECTED');
	assert(!document.body.textContent.includes('Approve application'));
	await act(async () => root2.unmount());
	console.log(
		'PASS: approval confirmation, exact mutation inputs, blank rejection guard, trimmed reason, conflict feedback, refreshes and reviewed-state actions',
	);
})().catch((e) => {
	console.error(e);
	process.exitCode = 1;
});
