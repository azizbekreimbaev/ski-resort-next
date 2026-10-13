const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('libs/auth/session.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText;
const jwt = () => 'e30.' + Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + 900 })).toString('base64url') + '.signature';
let queue = Promise.resolve();
const channels = [];
let requests = 0;
let transport = async () => ({ ok: true, json: async () => ({ data: { refreshToken: { accessToken: jwt() } } }) });
class Channel {
  constructor() { channels.push(this); }
  postMessage(data) { for (const peer of channels) if (peer !== this) queueMicrotask(() => peer.onmessage?.({ data })); }
}
function tab() {
  const exports = {};
  vm.runInNewContext(source, {
    exports, require, process: { env: {} }, Date, setTimeout, BroadcastChannel: Channel,
    window: { dispatchEvent() {} }, Event: class {}, localStorage: { removeItem() {} },
    navigator: { locks: { request(name, action) { const result = queue.then(action); queue = result.catch(() => {}); return result; } } },
    fetch: (...args) => { requests++; return transport(...args); },
  });
  exports.configureSession(() => {}, () => {});
  return exports;
}
(async () => {
  const first = tab();
  const second = tab();
  await Promise.all([first.restoreSession(), first.restoreSession(), second.restoreSession()]);
  assert.equal(requests, 1, 'startup shares one rotation across tabs');
  const old = first.getSessionToken();
  await Promise.all([first.refreshSession(old), first.refreshSession(old), second.refreshSession(old)]);
  assert.equal(requests, 2, 'expired operations share one renewal');
  assert.equal(first.getSessionToken(), second.getSessionToken());
  const identical = first.getSessionToken();
  const previousRevision = first.getSessionRevision();
  transport = async () => ({ ok: true, json: async () => ({ data: { refreshToken: { accessToken: identical } } }) });
  await first.refreshSession(identical, previousRevision);
  await second.refreshSession(identical, previousRevision);
  assert.equal(requests, 3, 'session revision prevents duplicate rotation for identical JWTs');
  let release;
  transport = () => new Promise(resolve => { release = resolve; });
  const pending = first.refreshSession(first.getSessionToken());
  while (!release) await new Promise(resolve => setTimeout(resolve, 10));
  first.clearSession();
  release({ ok: true, json: async () => ({ data: { refreshToken: { accessToken: jwt() } } }) });
  await assert.rejects(pending, /SESSION_CANCELLED/);
  assert.equal(first.getSessionToken(), '');
  assert.equal(second.getSessionToken(), '');
  const calls = requests;
  await assert.rejects(second.refreshSession(), /SESSION_CANCELLED/);
  assert.equal(requests, calls, 'logout prevents queued renewal');
  first.saveSessionToken(jwt());
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(second.getSessionToken(), first.getSessionToken(), 'new login reaches signed-out peers');
  transport = async () => { throw new Error('network failure'); };
  await assert.rejects(first.refreshSession(first.getSessionToken()), /network failure/);
  assert.equal(requests, calls + 1, 'network failure is never replayed');
  assert.equal(first.getSessionToken(), '');
  console.log('Session coordination tests passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
