# Socket chat frontend handoff

Implemented 2026-10-07. `socket.gateway.ts` and `socket.module.ts` are byte-for-byte copies of the user's previous Nestar socket files. Relative imports resolve to SkiResort's existing AuthService and Member DTO. No dependencies or bootstrap changes were needed: AppModule already imports SocketModule and main.ts installs WsAdapter.

## Connection and authentication

Use the browser's native `WebSocket`, on the API origin's root `/`, sharing the API port (`PORT_API`, otherwise 3000). This is a native WebSocket JSON protocol. Configure the actual deployed API origin; this checkout does not establish a deployment URL. Use `ws:` for local HTTP and `wss:` for HTTPS with WebSocket upgrade support in the proxy.

Pass the existing signup/login `accessToken` as the URL query parameter `token`, without a `Bearer ` prefix. Missing, expired or invalid tokens connect as guests (`memberData: null`); guests can send messages. Authentication is captured when connecting. Close and reconnect after login, logout or token replacement.

```ts
// apiOrigin and accessToken come from the frontend's existing configuration/auth.
const url = new URL('/', apiOrigin);
url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
if (accessToken) url.searchParams.set('token', accessToken);
const socket = new WebSocket(url.toString());

socket.onmessage = ({ data }) => {
  const frame = JSON.parse(data);
  switch (frame.event) {
    case 'info':
      // Set the connected socket count to frame.totalClients.
      // frame.action is 'joined' or 'left'; memberData identifies that participant.
      break;
    case 'getMessages':
      // Replace initial chat state with frame.list, already oldest-first.
      break;
    case 'message':
      // Append this frame, including your own messages echoed by the server.
      break;
  }
};

function sendMessage(text: string) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ event: 'message', data: text }));
  }
}
// On component teardown or auth change: socket.close().
```

Attach message listeners immediately after construction. Disable send until OPEN, show disconnected/error state and reconnect according to the frontend's existing policy. Append messages when the server echoes them to avoid displaying your own message twice. Reconnecting receives the current five-message history; replace the initial history rather than duplicating it. Render text as plain text and use `memberData?.memberNick ?? 'Guest'` for display.

## Wire contract

Client-to-server frames use `data` for the text; server-to-client frames use `text`.

| Direction / event | JSON shape | Recipients / behavior |
|---|---|---|
| Client → server `message` | `{ "event": "message", "data": "Hello" }` | Sends text to the shared chat |
| Server → client `info` | `{ "event": "info", "totalClients": 2, "memberData": null, "action": "joined" }` | All open clients, including the newcomer |
| Server → client `info` | `{ "event": "info", "totalClients": 1, "memberData": null, "action": "left" }` | Remaining open clients |
| Server → client `getMessages` | `{ "event": "getMessages", "list": [] }` | New client only, after its joined event |
| Server → client `message` | `{ "event": "message", "text": "Hello", "memberData": null }` | All open clients, including sender |

History entries have the same shape as `message` frames. `memberData` is the verified JWT payload returned by the existing AuthService, or null. It is not a freshly loaded public Member projection or a complete GraphQL response. Authenticated payloads include identity/profile claims and JWT metadata; clients should consume only needed display fields. Current role values are USER/ADMIN/INSTRUCTOR. Treat fields beyond display identity as optional; never derive authorization from chat frames.

## Preserved implementation limits

- One global chat per API process. No rooms, private messages, Resort channels, IDs, timestamps, receipts, moderation or GraphQL chat operations.
- The last five messages live in memory; restart clears them. Separate API instances do not share history, presence or broadcasts. Client count measures sockets, including multiple tabs and guests, rather than unique members.
- No persistence, message text validation, length/rate limits or current database role/status checks. Tokens are verified at connection only; expiry/account changes do not recheck an established socket.
- The original gateway logs authenticated member data and message text and broadcasts the decoded member payload directly. Query-token URLs can appear in proxy/access logs. These behaviors are retained by the requested exact copy; payload minimization/logging changes would require a separate change.
- Async connection authentication has no disconnect-race protection. A socket closing during authentication can leave count/state inconsistent or cause a history send after close. Frontend presence is informational.

## Verification and frontend smoke test

Focused Jest coverage uses fixture authentication, open/closed mock clients and an isolated Nest SocketModule with the real WsAdapter on an ephemeral loopback port. It exercises event/data routing, sender echo, guest fallback, five-message history, departure and module injection. See [completed tasks](COMPLETED_TASKS.md) for executed results and limits.

In the actual frontend checkout, test two tabs: a logged-in client and a guest. Both receive join count changes and messages; sender messages appear once. Send seven messages, then open a third tab and confirm it receives only the latest five in order. Close a tab and verify the count/left event. Reconnect after auth changes and verify displayed identity. Confirm the configured production proxy supports root-path WebSocket upgrades. No frontend files, live MongoDB, deployment or full API bootstrap were changed/tested in this task.
