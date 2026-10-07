import { useCallback, useEffect, useRef, useState } from 'react';
import { getJwtToken } from '../auth';
import useMemberSession from './useMemberSession';
import { ChatMember, ChatMessage, chatSocketUrl, parseChatFrame, CHAT_TEXT_LIMIT } from '../types/chat';

export type ChatConnection = 'preparing' | 'connecting' | 'connected' | 'disconnected' | 'unconfigured';

export default function useSocketChat() {
	const { user, ready } = useMemberSession();
	const [token, setToken] = useState<string | null>(null);
	const [connection, setConnection] = useState<ChatConnection>('preparing');
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [online, setOnline] = useState<number | null>(null);
	const [selfMember, setSelfMember] = useState<ChatMember | null>(null);
	const [historyVersion, setHistoryVersion] = useState(0);
	const [retryVersion, setRetryVersion] = useState(0);
	const socketRef = useRef<WebSocket | null>(null);
	const authenticatedToken = useRef<string | null>(null);
	const handshake = useRef(false);
	const nextId = useRef(0);

	useEffect(() => {
		if (!ready) return;
		const sync = () => setToken(getJwtToken() ?? '');
		sync();
		// Existing auth updates localStorage and Apollo separately; detect token-only replacement too.
		const timer = window.setInterval(sync, 1000);
		window.addEventListener('storage', sync);
		window.addEventListener('focus', sync);
		return () => {
			window.clearInterval(timer);
			window.removeEventListener('storage', sync);
			window.removeEventListener('focus', sync);
		};
	}, [ready, user]);

	useEffect(() => {
		if (!ready || token === null) return;
		let url: string;
		try {
			url = chatSocketUrl(
				process.env.REACT_APP_API_URL || process.env.REACT_APP_API_GRAPHQL_URL || process.env.REACT_APP_API_WS,
				token,
			);
		} catch {
			setConnection('unconfigured');
			return;
		}
		let disposed = false;
		let attempts = 0;
		let retryTimer: number | undefined;
		let connectTimer: number | undefined;
		let current: WebSocket | null = null;
		const disconnect = () => {
			handshake.current = false;
			setConnection('disconnected');
			setOnline(null);
		};
		const schedule = () => {
			if (disposed || retryTimer !== undefined) return;
			retryTimer = window.setTimeout(() => {
				retryTimer = undefined;
				connect();
			}, Math.min(1000 * Math.pow(2, attempts++), 30000));
		};
		const connect = () => {
			if (disposed) return;
			if (!navigator.onLine) {
				disconnect();
				schedule();
				return;
			}
			handshake.current = false;
			setConnection('connecting');
			setOnline(null);
			let socket: WebSocket;
			try {
				socket = new WebSocket(url);
			} catch {
				disconnect();
				schedule();
				return;
			}
			current = socket;
			socketRef.current = socket;
			authenticatedToken.current = token;
			let joiningMember: ChatMember | null = null;
			connectTimer = window.setTimeout(() => socket.close(), 10000);
			socket.onmessage = ({ data }) => {
				if (disposed || current !== socket) return;
				const frame = parseChatFrame(data);
				if (!frame) return;
				if (frame.event === 'info') {
					setOnline(frame.totalClients);
					if (!handshake.current && frame.action === 'joined') joiningMember = frame.memberData;
				} else if (frame.event === 'getMessages') {
					window.clearTimeout(connectTimer);
					attempts = 0;
					handshake.current = true;
					// The gateway synchronously sends our joined event immediately before our history.
					// Earlier joins can belong to others while our token verification is still pending.
					setSelfMember(joiningMember);
					setConnection('connected');
					setMessages(frame.list.map((message) => ({ ...message, id: ++nextId.current })));
					setHistoryVersion((version) => version + 1);
				} else {
					const message = { ...frame, id: ++nextId.current };
					setMessages((list) => [...list.slice(-199), message]);
				}
			};
			socket.onerror = () => {
				if (disposed || current !== socket) return;
				disconnect();
				socket.close();
			};
			socket.onclose = () => {
				if (disposed || current !== socket) return;
				window.clearTimeout(connectTimer);
				socketRef.current = null;
				disconnect();
				schedule();
			};
		};
		const resume = () => {
			if (current && current.readyState < WebSocket.CLOSING) return;
			window.clearTimeout(retryTimer);
			retryTimer = undefined;
			connect();
		};
		connect();
		window.addEventListener('online', resume);
		return () => {
			disposed = true;
			handshake.current = false;
			window.clearTimeout(retryTimer);
			window.clearTimeout(connectTimer);
			window.removeEventListener('online', resume);
			if (current) {
				current.onmessage = null;
				current.onerror = null;
				current.onclose = null;
				current.close();
			}
			socketRef.current = null;
		};
	}, [ready, token, retryVersion]);

	const send = useCallback((draft: string): boolean => {
		const text = draft.trim();
		const socket = socketRef.current;
		if (!text || text.length > CHAT_TEXT_LIMIT || !handshake.current || !socket || socket.readyState !== WebSocket.OPEN)
			return false;
		// Never send through a connection that still has the previous login identity.
		if ((getJwtToken() ?? '') !== authenticatedToken.current) {
			setToken(getJwtToken() ?? '');
			return false;
		}
		try {
			socket.send(JSON.stringify({ event: 'message', data: text }));
			return true; // Rendering waits for the server echo; no delivery receipts are inferred.
		} catch {
			return false;
		}
	}, []);
	const retry = useCallback(() => setRetryVersion((version) => version + 1), []);
	return { connection, messages, online, selfMember, historyVersion, send, retry };
}
