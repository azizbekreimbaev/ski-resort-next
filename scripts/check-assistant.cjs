const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const compile = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
	compilerOptions: { module: 1, target: 7, jsx: 2, esModuleInterop: true },
}).outputText, file);
require.extensions['.ts'] = compile;
require.extensions['.tsx'] = compile;
const { assistantHistory, assistantSourceHref } = require('../libs/types/assistant.ts');
const long = Array.from({ length: 16 }, (_, n) => ({ role: n % 2 ? 'ASSISTANT' : 'USER', message: String(n).padEnd(3000, 'x') }));
const bounded = assistantHistory(long, 'q'.repeat(2000));
assert.equal(bounded.length, 5);
assert.equal(bounded[4].message.slice(0, 2), '15');
assert.equal(bounded.reduce((total, entry) => total + entry.message.length, 2000), 12000);
assert.equal(assistantHistory(long.map(e => ({ ...e, message: 'short' })), 'question').length, 10);
assert.equal(assistantSourceHref({ type: 'FAQ', id: 'abc', title: '' }), '/cs/faq?id=abc');
assert.equal(assistantSourceHref({ type: 'RESORT', id: 'a&b', title: '' }), '/resort/detail?id=a%26b');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><head></head><body><div id="root"></div></body></html>', { url: 'http://localhost/' });
Object.assign(global, { window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
	HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, DocumentFragment: dom.window.DocumentFragment,
	Event: dom.window.Event, sessionStorage: dom.window.sessionStorage, IS_REACT_ACT_ENVIRONMENT: true });
window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = require('react-dom/test-utils');
function stub(file, exports) {
	const filename = require.resolve(file, { paths: [root] });
	require.cache[filename] = { id: filename, filename, loaded: true, exports: { __esModule: true, ...exports } };
}
const copy = JSON.parse(fs.readFileSync(path.join(root, 'public/locales/en/common.json'), 'utf8')).assistant;
for (const locale of ['kr', 'ru']) assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(path.join(root, `public/locales/${locale}/common.json`), 'utf8')).assistant), Object.keys(copy));
stub('next-i18next', { useTranslation: () => ({ t: (key, values = {}) => (copy[key.replace('assistant.', '')] || key).replace('{{name}}', values.name || '') }) });
let user = { _id: 'member-one', memberNick: 'Snow Explorer' };
let pathname = '/';
stub('next/router', { useRouter: () => ({ pathname }) });
stub('next/link', { default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) });
let resolve, reject;
const requests = [];
const client = { mutate: input => { requests.push(input); return new Promise((yes, no) => { resolve = yes; reject = no; }); } };
const apollo = require('@apollo/client');
stub('@apollo/client', { ...apollo, useReactiveVar: () => user, useApolloClient: () => client });
const realTimeout = window.setTimeout;
let welcome;
window.setTimeout = (callback, ms) => { if (ms === 5000) { welcome = callback; return 777; } return realTimeout(callback, ms); };
const Component = require('../libs/components/AssistantChat.tsx').default;
const app = createRoot(document.getElementById('root'));
const render = () => act(() => app.render(React.createElement(Component)));
const button = text => Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes(text) || el.getAttribute('aria-label') === text);
const click = el => act(() => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })));
(async () => {
	await render();
	assert.equal(document.querySelector('[role="dialog"]'), null);
	assert.equal(typeof welcome, 'function');
	await act(() => welcome());
	assert.ok(document.querySelector('[role="dialog"]'));
	assert.equal(sessionStorage.getItem('snoway.assistant.welcomed.member-one'), '1');
	// Optional static fixture preview uses the actual rendered component and Sass.
	if (process.env.ASSISTANT_PREVIEW_FILE) {
		const css = require('sass').compile(path.join(root, 'scss/assistant.scss')).css;
		fs.writeFileSync(process.env.ASSISTANT_PREVIEW_FILE, '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;background:#edf3f8;font-family:Arial}' + css + '@media(max-width:599px){.snoway-assistant__panel{top:0;left:0;right:0;bottom:0;width:100%;max-width:none;height:100dvh;max-height:none;border-radius:0}.snoway-assistant__launcher{display:none!important}}</style>' + document.head.innerHTML + '</head><body>' + document.body.innerHTML + '</body></html>');
	}
	await click(button('Find a resort'));
	assert.equal(requests.length, 1);
	assert.equal(requests[0].fetchPolicy, 'no-cache');
	assert.deepEqual(requests[0].variables.input.history, []);
	await click(button('Send message'));
	assert.equal(requests.length, 1, 'Must not submit duplicate in-flight requests');
	await act(async () => resolve({ data: { askAssistant: { answer: '<script>unsafe()</script>\nTry this resort.', sources: [{ type: 'RESORT', id: 'abc', title: 'Winter Resort' }] } } }));
	assert.equal(document.querySelector('script'), null, 'Answers render as text');
	assert.equal(document.querySelector('a').getAttribute('href'), '/resort/detail?id=abc');
	await click(button('Start a new chat'));
	await click(button('Choose your equipment'));
	await act(async () => reject(new Error('Fixture quota error')));
	assert.ok(document.querySelector('[role="alert"]'));
	await click(button('Try again'));
	assert.deepEqual(requests[2].variables.input, requests[1].variables.input, 'Retry must not duplicate failed message in history');
	await act(async () => resolve({ data: { askAssistant: { answer: 'Helmet advice', sources: [] } } }));
	assert.equal(document.querySelector('[role="alert"]'), null);
	await act(() => window.dispatchEvent(new Event('snoway:community-open')));
	assert.equal(document.querySelector('[role="dialog"]'), null);
	await click(button('Open AI assistant'));
	assert.ok(document.querySelector('[role="dialog"]'));
	await click(button('Close assistant'));
	user = { _id: '', memberNick: '' }; await render();
	assert.equal(document.querySelector('button'), null, 'Logged-out users have no assistant');
	user = { _id: 'member-two', memberNick: 'Other User' }; await render();
	await click(button('Open AI assistant'));
	assert.equal(document.querySelector('.snoway-assistant__message'), null, 'Account switch clears chat');
	await click(button('Find a resort'));
	user = { _id: '', memberNick: '' }; await render();
	await act(async () => resolve({ data: { askAssistant: { answer: 'Late response must be discarded', sources: [] } } }));
	assert.equal(document.querySelector('[role="dialog"]'), null);
	user = { _id: 'member-two', memberNick: 'Other User' };
	welcome = null;
	await render();
	assert.equal(welcome, null, 'Auto welcome must not repeat within the same tab session');
	pathname = '/_admin'; await render();
	assert.equal(document.querySelector('button'), null);
	await act(() => app.unmount());
	console.log('PASS: backend history bounds, source routes, translations, welcome delay, mutation, pending guard, safe rendering, retry, panel coordination and account isolation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
