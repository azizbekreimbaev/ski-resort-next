const fs = require('fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
	compilerOptions: { module: 1, target: 7, esModuleInterop: true },
}).outputText, file);
const stub = (file, exports) => {
	const id = require.resolve(file);
	require.cache[id] = { id, filename: id, loaded: true, exports };
};
let stored = {}, user, calls = [], response, clears = 0;
global.window = { dispatchEvent() {}, localStorage: {
	setItem: (key, value) => { stored[key] = value; },
	removeItem: (key) => { delete stored[key]; },
} };
global.navigator = { locks: { request: async (_name, action) => action() } };
global.BroadcastChannel = class { postMessage() {} };
global.localStorage = window.localStorage;
stub('../apollo/client.ts', { initializeApollo: () => ({
	mutate: async (request) => { calls.push(request); if (response instanceof Error) throw response; return response; },
	clearStore: async () => { clears++; },
}) });
stub('../apollo/store.ts', { userVar: (value) => { user = value; } });
stub('../libs/sweetAlert.ts', {});
const { googleLogIn, getJwtToken } = require('../libs/auth/index.ts');
let popupFailure, signedOut = 0, persistence;
process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = 'true';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'fixture-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'fixture.example';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'fixture-project';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'fixture-app';
stub('firebase/app', { getApps: () => [], initializeApp: () => ({}) });
stub('firebase/auth', {
	GoogleAuthProvider: class { setCustomParameters() {} },
	inMemoryPersistence: 'memory', browserPopupRedirectResolver: {},
	initializeAuth: (_, options) => { persistence = options.persistence; return {}; },
	signInWithPopup: async () => { if (popupFailure) throw popupFailure; return { user: { getIdToken: async () => 'firebase-token' } }; },
	signOut: async () => { signedOut++; },
});
const { getGoogleIdToken } = require('../libs/auth/firebase.ts');
(async () => {
	assert.equal(await getGoogleIdToken(), 'firebase-token');
	assert.equal(persistence, 'memory');
	assert.equal(signedOut, 1);
	popupFailure = new Error('popup cancelled');
	await assert.rejects(getGoogleIdToken(), /popup cancelled/);
	assert.equal(signedOut, 2);
	response = new Error('BLOCKED_USER');
	await assert.rejects(googleLogIn({ idToken: 'firebase-token' }), /BLOCKED_USER/);
	assert.deepEqual(stored, {});
	assert.equal(user, undefined);
	response = { data: {} };
	await assert.rejects(googleLogIn({ idToken: 'firebase-token' }), /Authentication failed/);
	assert.deepEqual(stored, {});
	const claims = { _id: 'member', memberNick: 'skier', memberType: 'USER' };
	const token = `e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;
	response = { data: { googleLogin: { accessToken: token } } };
	await googleLogIn({ idToken: 'firebase-token' });
	assert.equal(getJwtToken(), token);
	assert.deepEqual(stored, {}, 'access token must not be persisted');
	assert.equal(user._id, 'member');
	assert.equal(clears, 1);
	assert.equal(calls.at(-1).fetchPolicy, 'no-cache');
	assert.deepEqual(calls.at(-1).variables.input, { idToken: 'firebase-token' });
	assert.equal(user.memberPhone, '');
	delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
	delete require.cache[require.resolve('../libs/auth/firebase.ts')];
	await assert.rejects(require('../libs/auth/firebase.ts').getGoogleIdToken(), /configuration is incomplete/);
	console.log('PASS: Google token cleanup, cancellation, backend failure isolation, token-only input and JWT session without phone.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
