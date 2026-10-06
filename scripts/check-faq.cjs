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
let user = { memberType: 'ADMIN', memberStatus: 'ACTIVE' };
stub('libs/hooks/useMemberSession.ts', { default: () => ({ user, ready: true }) });
const id = '000000000000000000000001';
let routeId = id,
	redirected = '';
stub('node_modules/next/router.js', {
	useRouter: () => ({
		isReady: true,
		query: { id: routeId },
		push: async (url) => {
			redirected = url;
		},
	}),
});
const faq = {
	__typename: 'Faq',
	_id: id,
	faqQuestion: 'Rental question',
	faqAnswer: 'Safe <script>plain text</script>\nAnswer',
	faqStatus: 'PUBLISHED',
	memberId: id,
	createdAt: '2026-10-07T00:00:00Z',
	updatedAt: '2026-10-07T00:00:00Z',
};
let empty = false,
	fail = false;
const requests = [];
const client = new ApolloClient({
	cache: new InMemoryCache({ addTypename: false }),
	link: new ApolloLink(
		(op) =>
			new Observable((observer) => {
				requests.push({ name: op.operationName, variables: op.variables });
				const timer = setTimeout(() => {
					if (fail) return observer.error(new Error('FAQ fixture failure'));
					let data;
					switch (op.operationName) {
						case 'Faqs':
						case 'AdminFaqs':
							data = {
								[op.operationName === 'Faqs' ? 'getFaqs' : 'getAllFaqsByAdmin']: {
									list: empty ? [] : [faq],
									metaCounter: empty ? [] : [{ total: 1 }],
								},
							};
							break;
						case 'Faq':
						case 'AdminFaq':
							data = { [op.operationName === 'Faq' ? 'getFaq' : 'getFaqByAdmin']: faq };
							break;
						case 'CreateFaq':
							data = { createFaq: { ...faq, ...op.variables.input } };
							break;
						case 'UpdateFaq':
							data = { updateFaqByAdmin: { ...faq, ...op.variables.input } };
							break;
						case 'RemoveFaq':
							data = { removeFaqByAdmin: { _id: id } };
							break;
						default:
							throw new Error(op.operationName);
					}
					observer.next({ data });
					observer.complete();
				}, 5);
				return () => clearTimeout(timer);
			}),
	),
});
const Page = require(root + '/libs/components/faq/AdminFaqPage.tsx').default;
const List = require(root + '/libs/components/faq/FaqList.tsx').default;
const Record = require(root + '/libs/components/faq/FaqRecord.tsx').default;
const view = createRoot(document.getElementById('root'));
const settle = () =>
	act(async () => {
		await new Promise((r) => setTimeout(r, 50));
	});
const render = async (component) => {
	await act(async () => view.render(React.createElement(ApolloProvider, { client }, component)));
	await settle();
};
const click = async (text) => {
	const b = [...document.querySelectorAll('button')].find((b) => b.textContent === text);
	assert(b, 'Missing ' + text);
	await act(async () => b.click());
	await settle();
};
const change = async (el, value) => {
	assert(el);
	await act(async () => {
		Object.getOwnPropertyDescriptor(
			el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
			'value',
		).set.call(el, value);
		el.dispatchEvent(new window.Event('input', { bubbles: true }));
	});
};
(async () => {
	await render(React.createElement(List));
	assert.equal(requests[0].name, 'Faqs');
	assert(document.body.textContent.includes(faq.faqQuestion));
	assert.equal(document.querySelectorAll('script').length, 0);
	await render(null);
	await render(React.createElement(Page));
	assert(requests.some((r) => r.name === 'AdminFaqs'));
	assert(document.body.textContent.includes('Create FAQ'));
	await render(null);
	user.memberStatus = 'BLOCK';
	const count = requests.length;
	await render(React.createElement(Page));
	assert.equal(requests.length, count);
	assert(document.body.textContent.includes('Active admin access required'));
	user.memberStatus = 'ACTIVE';
	await render(null);
	await render(React.createElement(Record, { admin: true, mode: 'create' }));
	await change(document.querySelectorAll('textarea')[0], ' New question ');
	await change(
		document.querySelector('textarea[rows="8"]') ||
			[...document.querySelectorAll('textarea')].find((e) => e.value === ''),
		' New answer ',
	);
	await act(async () =>
		document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })),
	);
	await settle();
	const create = requests.find((r) => r.name === 'CreateFaq');
	assert(create);
	assert.deepEqual(create.variables.input, {
		faqQuestion: 'New question',
		faqAnswer: 'New answer',
		faqStatus: 'DRAFT',
	});
	assert(redirected.includes('/detail'));
	await render(null);
	await render(React.createElement(Record, { admin: true, mode: 'edit' }));
	const answer = [...document.querySelectorAll('textarea')].find((e) => e.value === faq.faqAnswer);
	await change(answer, 'Updated answer');
	await click('Save FAQ');
	const update = requests.find((r) => r.name === 'UpdateFaq');
	assert.deepEqual(update.variables.input, { _id: id, faqAnswer: 'Updated answer' });
	await render(null);
	await render(React.createElement(Record, { admin: true }));
	await click('Delete FAQ');
	assert(!requests.some((r) => r.name === 'RemoveFaq'));
	await click('Cancel');
	await click('Delete FAQ');
	await click('Delete');
	assert(requests.some((r) => r.name === 'RemoveFaq'));
	assert.equal(redirected, '/_admin/faq');
	await render(null);
	routeId = 'invalid';
	const before = requests.length;
	await render(React.createElement(Record));
	assert.equal(requests.length, before);
	assert(document.body.textContent.includes('FAQ not found.'));
	routeId = id;
	await render(null);
	empty = true;
	await render(React.createElement(List));
	assert(document.body.textContent.includes('No FAQs found.'));
	await render(null);
	empty = false;
	fail = true;
	await render(React.createElement(List));
	assert(document.body.textContent.includes('FAQ fixture failure'));
	fail = false;
	await click('Retry');
	assert(document.body.textContent.includes(faq.faqQuestion));
	await act(async () => view.unmount());
	client.stop();
	dom.window.close();
	console.log(
		'FAQ mounted fixtures passed: public/admin selection, access denial, plain text, create, partial update, confirmed deletion, invalid ID, empty, error/retry.',
	);
})().catch((e) => {
	console.error(e);
	process.exitCode = 1;
});
