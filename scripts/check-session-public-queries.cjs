const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { ApolloClient, ApolloLink, InMemoryCache, Observable, gql } = require('@apollo/client');

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, file);
const stub = (file, exports) => {
	const id = require.resolve(file);
	require.cache[id] = { id, filename: id, loaded: true, exports };
};
global.window = { dispatchEvent() {} };
global.localStorage = { removeItem() {} };
Object.defineProperty(global, 'navigator', { configurable: true, value: {
	locks: { request: async (_name, action) => action() },
} });
global.BroadcastChannel = class { postMessage() {} };
let refreshes = 0;
global.fetch = async () => {
	refreshes++;
	return { ok: true, json: async () => ({ errors: [{ extensions: { code: 'REFRESH_TOKEN_INVALID' } }] }) };
};
const session = require('../libs/auth/session.ts');
let cancelled = 0;
let completed = 0;
const client = new ApolloClient({
	cache: new InMemoryCache(),
	link: new ApolloLink(() => new Observable(observer => {
		let active = true;
		void session.restoreSession().then(() => {
			if (!active) return;
			completed++;
			observer.next({ data: { catalog: 'loaded' } });
			observer.complete();
		});
		return () => { if (!completed) cancelled++; active = false; };
	})),
});
stub('../apollo/client.ts', { initializeApollo: () => client });
let member;
stub('../apollo/store.ts', { userVar: value => { member = value; } });
stub('../libs/sweetAlert.ts', { sweetMixinErrorAlert: async () => {} });
require('../libs/auth/index.ts').setupSession();

(async () => {
	const privateQuery = gql`query CachedMember { privateMember }`;
	client.writeQuery({ query: privateQuery, data: { privateMember: 'previous member' } });
	const result = await client.query({ query: gql`query PublicCatalog { catalog }`, fetchPolicy: 'network-only' });
	assert.equal(result.data.catalog, 'loaded', 'public queries finish after failed startup restoration');
	assert.equal(cancelled, 0, 'session cleanup does not cancel pending public queries');
	assert.equal(client.readQuery({ query: privateQuery }), null, 'previous member cache is removed');
	assert.equal(member._id, '', 'member state is signed out');
	assert.equal(session.getSessionToken(), '');
	await session.restoreSession();
	assert.equal(refreshes, 1, 'invalid startup refresh is not retried');
	client.stop();
	console.log('Public query session recovery regression passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
