import { useMemo } from 'react';
import {
	ApolloClient,
	ApolloLink,
	InMemoryCache,
	split,
	from,
	NormalizedCacheObject,
	Observable,
} from '@apollo/client';
import createUploadLink from 'apollo-upload-client/public/createUploadLink.js';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';
import { getJwtToken, setupSession } from '../libs/auth';
import {
	clearSession,
	getSessionGeneration,
	getSessionRevision,
	refreshSession,
	restoreSession,
	sessionStopped,
} from '../libs/auth/session';
import { sweetErrorAlert } from '../libs/sweetAlert';
import { createApolloCache } from './cache';
let apolloClient: ApolloClient<NormalizedCacheObject>;

function getHeaders(): Record<string, string> {
	const token = getJwtToken();
	return { 'X-CSRF-Protection': '1', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
function createIsomorphicLink() {
	if (typeof window !== 'undefined') {
		const authLink = new ApolloLink(
			(operation, forward) =>
				new Observable((observer) => {
					let subscription: { unsubscribe(): void } | undefined;
					let cancelled = false;
					const authOperation = ['Login', 'Signup', 'GoogleLogin'].includes(operation.operationName);
					setupSession();
					void (authOperation ? Promise.resolve() : restoreSession())
						.then(() => {
							if (cancelled) return;
							const epoch = getSessionGeneration();
							operation.setContext(({ headers = {} }) => {
								const next: Record<string, string> = { ...headers };
								delete next.Authorization;
								delete next.authorization;
								return {
									headers: { ...next, ...getHeaders() },
									sessionToken: getJwtToken(),
									sessionRevision: getSessionRevision(),
								};
							});
							subscription = forward(operation).subscribe({
								next: (value) => {
									if (!authOperation && epoch !== getSessionGeneration())
										observer.error(new Error('SESSION_CANCELLED'));
									else observer.next(value);
								},
								error: (error) => observer.error(error),
								complete: () => observer.complete(),
							});
						})
						.catch((error: unknown) => observer.error(error));
					return () => {
						cancelled = true;
						subscription?.unsubscribe();
					};
				}),
		);

		// @ts-ignore
		const link = new createUploadLink({
			uri: process.env.REACT_APP_API_GRAPHQL_URL,
			credentials: 'include',
			headers: { 'Apollo-Require-Preflight': 'true', 'X-CSRF-Protection': '1' },
		});

		//CUSTOM WEB SOCKET client

		class LoggingWebSocket {
			private socket: WebSocket;

			constructor(url: string) {
				this.socket = new WebSocket(url);

				this.socket.onopen = () => {
					console.log('WEbsocket connected!!!');
				};

				this.socket.onmessage = (msg) => {
					// Authenticated payloads must not be logged.
				};

				this.socket.onerror = (error) => {
					console.log('WebSocket error:', error);
				};
			}

			send(data: string | ArrayBuffer | Blob | ArrayBufferView): void {
				this.socket.send(data);
			}

			close() {
				this.socket.close();
			}
		}

		/* WEBSOCKET SUBSCRIPTION LINK */
		const wsLink = new WebSocketLink({
			uri: process.env.REACT_APP_API_WS ?? 'ws://127.0.0.1:3007',
			options: {
				// Queries/mutations use HTTP; do not open an unused socket in the shared chat gateway.
				lazy: true,
				reconnect: false,
				timeout: 30000,
				connectionParams: () => {
					return { headers: getHeaders() };
				},
			},

			webSocketImpl: LoggingWebSocket,
		});

		const errorLink = onError(({ graphQLErrors, networkError, response, operation, forward }) => {
			const codes = graphQLErrors?.map((error) => error.extensions?.code);
			if (codes?.includes('ACCESS_TOKEN_INVALID') || codes?.includes('MEMBER_BLOCKED')) clearSession();
			if (codes?.includes('ACCESS_TOKEN_EXPIRED') && !operation.getContext().sessionRetried && !sessionStopped()) {
				operation.setContext({ sessionRetried: true });
				return new Observable((observer) => {
					let subscription: { unsubscribe(): void } | undefined;
					let cancelled = false;
					void refreshSession(operation.getContext().sessionToken, operation.getContext().sessionRevision)
						.then(() => {
							if (!cancelled && !sessionStopped()) subscription = forward(operation).subscribe(observer);
							else observer.error(new Error('SESSION_CANCELLED'));
						})
						.catch((error: unknown) => observer.error(error));
					return () => {
						cancelled = true;
						subscription?.unsubscribe();
					};
				});
			}
			// Assistant failures are shown inline, with retry controls, in its conversation.
			if (operation.operationName === 'AskAssistant' || operation.operationName === 'GoogleLogin') return;
			if (graphQLErrors) {
				graphQLErrors.map(({ message, locations, path, extensions }) => {
					console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
					if (!message.includes('input')) sweetErrorAlert(message);
				});
			}
			if (networkError) console.log(`[Network error]: ${networkError}`);
			// @ts-ignore
			if (networkError?.statusCode === 401) {
			}
		});

		const splitLink = split(
			({ query }) => {
				const definition = getMainDefinition(query);
				return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
			},
			wsLink,
			authLink.concat(link),
		);

		return from([errorLink, splitLink]);
	}
}

function createApolloClient() {
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		link: createIsomorphicLink(),
		cache: createApolloCache(),
		resolvers: {},
	});
}

export function initializeApollo(initialState = null) {
	const _apolloClient = apolloClient ?? createApolloClient();
	if (initialState) _apolloClient.cache.restore(initialState);
	if (typeof window === 'undefined') return _apolloClient;
	if (!apolloClient) apolloClient = _apolloClient;

	return _apolloClient;
}

export function useApollo(initialState: any) {
	return useMemo(() => initializeApollo(initialState), [initialState]);
}

/**
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

// No Subscription required for develop process

const httpLink = createHttpLink({
  uri: "http://localhost:3007/graphql",
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default client;
*/
