// Chat identity is display-only, never authorization. No server IDs or timestamps exist.
export type ChatMember = { _id?: string; memberNick?: string };
export type ChatMessage = { id: number; text: string; memberData: ChatMember | null };
export type ChatFrame =
	| { event: 'message'; text: string; memberData: ChatMember | null }
	| { event: 'getMessages'; list: Array<{ text: string; memberData: ChatMember | null }> }
	| { event: 'info'; totalClients: number; action: 'joined' | 'left'; memberData: ChatMember | null };

const record = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);
const member = (value: unknown): ChatMember | null | undefined => {
	if (value === null) return null;
	if (!record(value)) return undefined;
	return {
		_id: typeof value._id === 'string' ? value._id : undefined,
		memberNick: typeof value.memberNick === 'string' ? value.memberNick : undefined,
	};
};

export function parseChatFrame(data: unknown): ChatFrame | null {
	if (typeof data !== 'string') return null;
	try {
		const value: unknown = JSON.parse(data);
		if (!record(value)) return null;
		if (value.event === 'getMessages' && Array.isArray(value.list)) {
			const list: Array<{ text: string; memberData: ChatMember | null }> = [];
			for (const entry of value.list) {
				if (!record(entry) || typeof entry.text !== 'string') return null;
				const identity = member(entry.memberData);
				if (identity === undefined) return null;
				list.push({ text: entry.text, memberData: identity });
			}
			return { event: 'getMessages', list };
		}
		const identity = member(value.memberData);
		if (identity === undefined) return null;
		if (value.event === 'message' && typeof value.text === 'string')
			return { event: 'message', text: value.text, memberData: identity };
		if (
			value.event === 'info' &&
			typeof value.totalClients === 'number' &&
			Number.isInteger(value.totalClients) &&
			value.totalClients >= 0 &&
			(value.action === 'joined' || value.action === 'left')
		)
			return { event: 'info', totalClients: value.totalClients, action: value.action, memberData: identity };
	} catch {
		/* Ignore malformed/unrelated frames without logging personal payloads. */
	}
	return null;
}

export function chatSocketUrl(origin: string | undefined, token: string): string {
	if (!origin) throw new Error('Missing API origin');
	const url = new URL('/', origin);
	if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) throw new Error('Invalid API origin');
	url.protocol = url.protocol === 'https:' || url.protocol === 'wss:' ? 'wss:' : 'ws:';
	url.username = '';
	url.password = '';
	if (token) url.searchParams.set('token', token);
	return url.toString();
}

// A frontend composer limit, not a server validation guarantee.
export const CHAT_TEXT_LIMIT = 1000;
