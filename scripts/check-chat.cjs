const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const compile = (module, file) =>
	module._compile(
		ts.transpileModule(fs.readFileSync(file, 'utf8'), {
			compilerOptions: { module: 1, target: 7, jsx: 2, esModuleInterop: true },
		}).outputText,
		file,
	);
require.extensions['.ts'] = compile;
require.extensions['.tsx'] = compile;
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: 'http://localhost/' });
const avatarImages = [];
Object.assign(global, {
	window: dom.window,
	document: dom.window.document,
	navigator: dom.window.navigator,
	HTMLElement: dom.window.HTMLElement,
	Element: dom.window.Element,
	DocumentFragment: dom.window.DocumentFragment,
	Image: function () {
		const image = new dom.window.Image();
		avatarImages.push(image);
		return image;
	},
	self: dom.window,
	IS_REACT_ACT_ENVIRONMENT: true,
});
let mobile = false;
window.matchMedia = () => ({ matches: mobile, addListener() {}, removeListener() {} });
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = require('react-dom/test-utils');
function stub(file, exports) {
	const filename = path.join(root, file);
	require.cache[filename] = { id: filename, filename, loaded: true, exports: { __esModule: true, ...exports } };
}
const en = JSON.parse(fs.readFileSync(path.join(root, 'public/locales/en/common.json'), 'utf8')).chat;
const t = (key, vars = {}) => {
	const name = key.replace('chat.', '');
	let value = en[name] ?? en[`${name}_${vars.count === 1 ? 'one' : 'other'}`] ?? key;
	for (const [name, replacement] of Object.entries(vars)) value = value.replace(`{{${name}}}`, replacement);
	return value;
};
stub('node_modules/next-i18next/dist/commonjs/index.js', { useTranslation: () => ({ t }) });
let ready = false;
let user = { _id: '' };
stub('libs/hooks/useMemberSession.ts', { default: () => ({ ready, user }) });
stub('libs/auth/index.ts', { getJwtToken: () => window.localStorage.getItem('accessToken') ?? '' });
process.env.REACT_APP_API_URL = 'https://api.example.test/graphql';

// Isolated gateway fixture: server echo, five-entry history, connection-captured identity.
// No test messages are sent to the real community server.
const clients = [];
let history = [];
let handshakeMember;
class Socket {
	static OPEN = 1;
	static CLOSING = 2;
	constructor(url) {
		this.url = url;
		this.readyState = 0;
		this.sent = [];
		clients.push(this);
	}
	frame(frame) {
		this.onmessage?.({ data: JSON.stringify(frame) });
	}
	connect(member = null) {
		this.identity = member;
		this.readyState = 1;
		this.frame({ event: 'info', action: 'joined', totalClients: 1, memberData: member });
		this.frame({ event: 'getMessages', list: history });
	}
	send(data) {
		if (this.fail) throw Error('Fixture transport error');
		this.sent.push(JSON.parse(data));
		const message = { event: 'message', text: JSON.parse(data).data, memberData: this.identity };
		history = [...history, message].slice(-5);
		this.pending = message;
	}
	echo() {
		this.frame(this.pending);
	}
	close() {
		this.readyState = 3;
		this.onclose?.();
	}
}
global.WebSocket = Socket;
const { parseChatFrame, chatSocketUrl } = require('../libs/types/chat.ts');
assert.equal(chatSocketUrl('https://api.test/graphql?old=value', 'a+b'), 'wss://api.test/?token=a%2Bb');
assert.equal(chatSocketUrl('http://localhost:3007/api', ''), 'ws://localhost:3007/');
assert.throws(() => chatSocketUrl(undefined, ''));
assert.throws(() => chatSocketUrl('file:///test', ''));
for (const frame of [
	'{',
	'{}',
	'{"event":"info","totalClients":-1,"memberData":null,"action":"joined"}',
	'{"event":"message","text":42,"memberData":null}',
	'{"event":"getMessages","list":[{}]}',
])
	assert.equal(parseChatFrame(frame), null);
assert.deepEqual(
	parseChatFrame(
		JSON.stringify({
			event: 'message',
			text: 'safe',
			memberData: { _id: 'member', memberNick: 'Mina', memberPhone: 'private', accessToken: 'secret' },
		}),
	),
	{ event: 'message', text: 'safe', memberData: { _id: 'member', memberNick: 'Mina' } },
);

const Chat = require('../libs/components/Chat.tsx').default;
let app;
const render = async () =>
	act(async () => {
		if (!app) app = createRoot(document.getElementById('root'));
		app.render(React.createElement(Chat));
	});
const pause = async () =>
	act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 10));
	});
const click = async (element) =>
	act(async () => element.dispatchEvent(new window.MouseEvent('click', { bubbles: true })));
const button = (label) =>
	[...document.querySelectorAll('button')].find(
		(element) => element.getAttribute('aria-label') === label || element.textContent === label,
	);
const input = () => document.querySelector('textarea[aria-label]');
const type = async (value) =>
	act(async () => {
		Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(input(), value);
		input().dispatchEvent(new window.Event('input', { bubbles: true }));
	});
const key = async (options) =>
	act(async () =>
		input().dispatchEvent(new window.KeyboardEvent('keydown', { bubbles: true, key: 'Enter', ...options })),
	);
const rows = () => [...document.querySelectorAll('.snowkr-chat__message')];

(async () => {
	await render();
	assert.equal(clients.length, 0, 'session hydration must precede connecting');
	assert.ok(button('Open chat'));
	assert.equal(document.querySelector('[role="dialog"]'), null);
	await click(button('Open chat'));
	await pause();
	assert.match(document.body.textContent, /Preparing chat/);
	assert.ok(button('Send message').disabled);
	ready = true;
	await render();
	const guest = clients.at(-1);
	assert.equal(guest.url, 'wss://api.example.test/');
	assert.ok(button('Send message').disabled, 'OPEN without handshake is not sufficient');
	await act(async () => guest.connect());
	assert.match(document.body.textContent, /1 online connection/);
	await type('   ');
	assert.ok(button('Send message').disabled);
	await type('x'.repeat(1001));
	assert.ok(button('Send message').disabled);
	await type('한글');
	await key({ isComposing: true });
	await key({ shiftKey: true });
	assert.equal(guest.sent.length, 0, 'IME and Shift+Enter never send');
	await type('  Hello <script>alert(1)</script>\nslopes  ');
	await key({});
	assert.deepEqual(guest.sent[0], { event: 'message', data: 'Hello <script>alert(1)</script>\nslopes' });
	assert.equal(rows().length, 0, 'wait for echo rather than optimistic duplicate');
	await act(async () => guest.echo());
	assert.equal(rows().length, 1);
	assert.ok(!rows()[0].classList.contains('snowkr-chat__message--own'), 'anonymous frames remain left');
	assert.equal(document.querySelector('script'), null, 'message is plain text');
	await act(async () =>
		guest.frame({ event: 'message', text: 'Member answer', memberData: { _id: 'other', memberNick: 'Mina' } }),
	);
	assert.ok(!rows()[1].classList.contains('snowkr-chat__message--own'), 'another member is on left');
	await type('saved draft');
	await click(button('Close chat'));
	await click(button('Open chat'));
	assert.equal(input().value, 'saved draft');
	assert.equal(rows().length, 2);

	// A token-only replacement triggers a reconnect, even without a new Apollo user object.
	await act(async () => {
		window.localStorage.setItem('accessToken', 'replacement');
		window.dispatchEvent(new window.Event('storage'));
	});
	const member = clients.at(-1);
	assert.notEqual(member, guest);
	assert.equal(guest.readyState, 3);
	assert.match(member.url, /token=replacement/);
	await act(async () => {
		// Another join may arrive before our asynchronous authentication finishes.
		member.frame({
			event: 'info',
			action: 'joined',
			totalClients: 2,
			memberData: { _id: 'other', memberNick: 'Other' },
		});
		member.connect({ _id: 'self', memberNick: 'Snow rider' });
	});
	assert.match(document.body.textContent, /Chatting as Snow rider/);
	assert.equal(rows().length, 1, 'reconnect replaces history rather than duplicating');
	assert.ok(!rows()[0].classList.contains('snowkr-chat__message--own'), 'previous guest keeps its alignment');
	await key({});
	await act(async () => member.echo());
	assert.ok(rows().at(-1).classList.contains('snowkr-chat__message--own'), 'own authenticated echo is on right');
	assert.match(rows().at(-1).textContent, /Snow rider \(You\)/);
	member.fail = true;
	await type('keep on failure');
	await click(button('Send message'));
	assert.equal(input().value, 'keep on failure');
	assert.match(document.body.textContent, /Could not send/);
	member.fail = false;
	await act(async () => member.close());
	assert.match(document.body.textContent, /Disconnected/);
	assert.match(document.body.textContent, /Online count unavailable/);
	assert.ok(button('Send message').disabled);
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 1050));
	});
	assert.notEqual(clients.at(-1), member, 'automatic reconnect');
	const retrySocket = clients.at(-1);
	history = Array.from({ length: 5 }, (_, index) => ({ event: 'message', text: `history ${index}`, memberData: null }));
	await act(async () => retrySocket.connect());
	assert.equal(rows().length, 5);
	assert.match(document.body.textContent, /Chatting as Guest/, 'invalid token guest fallback comes from server');
	await act(async () => retrySocket.frame({ event: 'info', action: 'left', totalClients: 0, memberData: null }));
	assert.match(document.body.textContent, /0 online connections/);
	await act(async () =>
		document
			.querySelector('[role="dialog"]')
			.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
	);
	await pause();
	assert.ok(button('Open chat'));
	assert.equal(document.activeElement, button('Open chat'));
	await act(async () => app.unmount());
	assert.equal(retrySocket.readyState, 3, 'unmount closes socket');
	assert.equal(retrySocket.onmessage, null, 'late frames are detached');

	// Mobile MUI modal: one dialog, hidden external launcher, scroll lock and close control.
	app = null;
	mobile = true;
	await render();
	await click(button('Open chat'));
	await pause();
	assert.equal(document.querySelectorAll('[role="dialog"]').length, 1);
	assert.equal(button('Open chat'), undefined);
	assert.equal(document.body.style.overflow, 'hidden');
	assert.equal(document.activeElement, button('Close chat'));
	await click(button('Close chat'));
	await pause();
	assert.equal(document.body.style.overflow, '');
	await act(async () => app.unmount());

	// The same conversation must align differently for Kevin and Kim.
	console.log('Checking Kevin/Kim message alignment');
	mobile = false;
	history = [
		{ event: 'message', text: 'Kevin says hello', memberData: { _id: 'kevin', memberNick: 'Kevin' } },
		{ event: 'message', text: 'Kim replies', memberData: { _id: 'kim', memberNick: 'Kim' } },
	];
	for (const identity of [
		{ _id: 'kevin', memberNick: 'Kevin' },
		{ _id: 'kim', memberNick: 'Kim' },
	]) {
		app = null;
		await render();
		await act(async () => clients.at(-1).connect(identity));
		await click(button('Open chat'));
		assert.equal(rows()[0].classList.contains('snowkr-chat__message--own'), identity._id === 'kevin');
		assert.equal(rows()[1].classList.contains('snowkr-chat__message--own'), identity._id === 'kim');
		await act(async () => app.unmount());
	}

	// Navbar reacts to the same userVar refreshed by existing profile saves.
	console.log('Checking reactive navbar avatar');
	stub('node_modules/next/router.js', {
		useRouter: () => ({ pathname: '/', query: {}, locale: 'en', asPath: '/', push: async () => {} }),
	});
	stub('node_modules/next/link.js', {
		default: React.forwardRef(({ href, children, ...props }, ref) =>
			React.createElement('a', { ...props, href, ref }, children),
		),
	});
	stub('libs/components/common/CartDrawer.tsx', { default: () => null });
	// Mirror Next's icon import optimization rather than loading the entire icon barrel in Node.
	stub(
		'node_modules/@mui/icons-material/index.js',
		Object.fromEntries(
			[
				'FavoriteBorderRounded',
				'ShoppingBagOutlined',
				'AccountCircleOutlined',
				'MenuRounded',
				'CloseRounded',
				'DownhillSkiing',
			].map((name) => [name, require(`@mui/icons-material/${name}`).default]),
		),
	);
	const Top = require('../libs/components/Top.tsx').default;
	const { userVar } = require('../apollo/store.ts');
	app = createRoot(document.getElementById('root'));
	await act(async () => app.render(React.createElement(Top)));
	const account = () => button('Account');
	assert.equal(account().querySelector('img'), null, 'no photo uses the account icon');
	await act(async () =>
		userVar({ ...userVar(), _id: 'kevin', memberNick: 'Kevin', memberImage: 'uploads/member/kevin.png' }),
	);
	assert.equal(
		account().querySelector('img').getAttribute('src'),
		'https://api.example.test/graphql/uploads/member/kevin.png',
	);
	await act(async () => userVar({ ...userVar(), memberImage: 'https://images.example.test/new-photo.png' }));
	assert.equal(
		account().querySelector('img').getAttribute('src'),
		'https://images.example.test/new-photo.png',
		'saved photo updates without reload',
	);
	await act(async () => avatarImages.at(-1).dispatchEvent(new window.Event('error')));
	assert.equal(account().querySelector('img'), null, 'broken photo falls back to account icon');
	await act(async () => userVar({ ...userVar(), memberImage: '/img/profile/defaultUser.svg' }));
	assert.equal(account().querySelector('.MuiAvatar-root'), null, 'removed photo restores icon');
	await act(async () => app.unmount());
	console.log(
		'PASS chat wire/echo/reconnect, Kevin/Kim alignment, composer/mobile behavior and reactive navbar avatar',
	);
})().catch(async (error) => {
	console.error(error);
	if (app) await act(async () => app.unmount());
	process.exitCode = 1;
});
