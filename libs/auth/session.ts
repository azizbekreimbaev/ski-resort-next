import decodeJWT, { JwtPayload } from 'jwt-decode';
// Access tokens live only in memory. The refresh cookie is owned by the API.
let token = '';
let generation = 0;
let revision = '';
let stopped = false;
let renewal: Promise<string> | undefined;
let startup: Promise<void> | undefined;
let channel: BroadcastChannel | undefined;
let onToken: (value: string) => void = () => undefined;
let onClear: () => void = () => undefined;
let onFailure: (code: string) => void = () => undefined;

function usable(value: string) {
	try {
		return (decodeJWT<JwtPayload>(value).exp ?? 0) * 1000 > Date.now();
	} catch {
		return false;
	}
}

export const getSessionToken = () => token;
export const getSessionGeneration = () => generation;
export const getSessionRevision = () => revision;
export const sessionStopped = () => stopped;

export function configureSession(
	apply: typeof onToken,
	clear: typeof onClear,
	failure: typeof onFailure = () => undefined,
) {
	onToken = apply;
	onClear = clear;
	onFailure = failure;
	if (typeof window === 'undefined') return;
	try {
		localStorage.removeItem('accessToken');
	} catch {
		/* Storage may be disabled. */
	}
	if (typeof window === 'undefined' || channel || typeof BroadcastChannel === 'undefined') return;
	channel = new BroadcastChannel('skiresort-session');
	channel.onmessage = ({ data }: MessageEvent<unknown>) => {
		if (!data || typeof data !== 'object') return;
		const message = data as { type?: string; token?: string; revision?: string };
		if (message.type === 'request') {
			if (usable(token) && !stopped) channel?.postMessage({ type: 'token', token, revision });
		} else if (
			(message.type === 'login' || (message.type === 'token' && !stopped)) &&
			typeof message.token === 'string'
		) {
			if (message.type === 'login') {
				stopped = false;
				generation++;
			}
			token = message.token;
			revision = message.revision ?? '';
			onToken(token);
			window.dispatchEvent(new Event('skiresort-auth'));
		} else if (message.type === 'logout') {
			clearSession(false);
		}
	};
}

export function saveSessionToken(value: string) {
	stopped = false;
	generation++;
	token = value;
	revision = `${Date.now()}-${Math.random()}`;
	onToken(value);
	channel?.postMessage({ type: 'login', token, revision });
	window.dispatchEvent(new Event('skiresort-auth'));
}

export function clearSession(broadcast = true) {
	stopped = true;
	generation++;
	token = '';
	onClear();
	if (broadcast) channel?.postMessage({ type: 'logout' });
	window.dispatchEvent(new Event('skiresort-auth'));
}

export async function withSessionLock<T>(action: () => Promise<T>): Promise<T> {
	// Fail closed rather than race rotation in browsers without coordination APIs.
	const locks = (
		navigator as Navigator & {
			locks?: { request<R>(name: string, callback: () => Promise<R>): Promise<R> };
		}
	).locks;
	if (!locks || !channel) throw new Error('SESSION_COORDINATION_UNAVAILABLE');
	return locks.request('skiresort-session', action);
}

export async function sessionRequest(operation: 'refreshToken' | 'logout'): Promise<string | boolean> {
	const response = await fetch(process.env.REACT_APP_API_GRAPHQL_URL ?? 'http://localhost:3007/graphql', {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
		body: JSON.stringify({
			query:
				operation === 'logout'
					? 'mutation LogoutSession { logout }'
					: 'mutation RefreshSession { refreshToken { accessToken } }',
		}),
	});
	const result: {
		data?: { refreshToken?: { accessToken?: string }; logout?: boolean };
		errors?: { extensions?: { code?: string } }[];
	} = await response.json();
	if (!response.ok || result.errors?.length)
		throw new Error(result.errors?.[0]?.extensions?.code ?? 'SESSION_TRANSPORT_FAILED');
	const value = operation === 'logout' ? result.data?.logout : result.data?.refreshToken?.accessToken;
	if (!value) throw new Error('SESSION_TRANSPORT_FAILED');
	return value;
}

export function refreshSession(failedToken = token, failedRevision = revision): Promise<string> {
	if (renewal) return renewal;
	const epoch = generation;
	renewal = withSessionLock(async () => {
		if (stopped || epoch !== generation) throw new Error('SESSION_CANCELLED');
		channel?.postMessage({ type: 'request' });
		await new Promise((resolve) => setTimeout(resolve, 100));
		if (stopped || epoch !== generation) throw new Error('SESSION_CANCELLED');
		if (usable(token) && (token !== failedToken || revision !== failedRevision)) return token;
		const value = await sessionRequest('refreshToken');
		if (stopped || epoch !== generation) throw new Error('SESSION_CANCELLED');
		if (typeof value !== 'string') throw new Error('SESSION_TRANSPORT_FAILED');
		token = value;
		revision = `${Date.now()}-${Math.random()}`;
		onToken(value);
		channel?.postMessage({ type: 'token', token, revision });
		window.dispatchEvent(new Event('skiresort-auth'));
		return value;
	})
		.catch((error: unknown) => {
			if (epoch === generation) {
				clearSession();
				const code = error instanceof Error ? error.message : 'SESSION_TRANSPORT_FAILED';
				if (
					![
						'REFRESH_TOKEN_INVALID',
						'REFRESH_TOKEN_EXPIRED',
						'REFRESH_TOKEN_REVOKED',
						'REFRESH_TOKEN_REUSED',
						'MEMBER_BLOCKED',
						'SESSION_CANCELLED',
					].includes(code)
				)
					onFailure(code);
			}
			throw error;
		})
		.finally(() => {
			renewal = undefined;
		});
	return renewal;
}

export function restoreSession(): Promise<void> {
	if (!startup)
		startup = refreshSession('')
			.then(() => undefined)
			.catch(() => undefined);
	return startup;
}
