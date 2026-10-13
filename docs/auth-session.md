# Frontend authentication sessions

The frontend implements the backend AUTH_SESSION_HANDOFF.md contract. Login, signup and Google login keep the access token in memory. Reload restores the HttpOnly refresh-cookie session once before HTTP GraphQL requests proceed. Legacy localStorage access tokens are removed.

The existing GraphQL URL must point to the API /graphql endpoint. HTTP GraphQL uses credentials: include, X-CSRF-Protection: 1 and the existing multipart preflight header. Production frontend/API must be HTTPS and same-site, with the exact frontend origin configured in AUTH_ALLOWED_ORIGINS.

Refresh is serialized by Web Locks (skiresort-session) and BroadcastChannel. A session revision distinguishes rotations even if the signed JWT is identical. Expired protected requests retry once; permission failures do not refresh. Refresh transport failures never replay the request. Browsers lacking either coordination API fail closed and display a compatibility message.

Logout stops local pending renewals immediately, waits for the same lock, revokes the cookie session, clears member/cache state and informs other tabs. A network failure reports that server revocation was not confirmed. Already-issued access JWTs retain their backend lifetime.

Run node scripts/check-auth-session.cjs and node scripts/check-google-auth.cjs for isolated regressions. Before deployment, test against a development API and test member: local and Google login, reload restoration, concurrent expired requests in two tabs, logout during refresh, peer logout, and terminal refresh errors. No live provider or cookie smoke test is claimed by the isolated tests.
