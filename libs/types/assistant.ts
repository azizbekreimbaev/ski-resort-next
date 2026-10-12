export type AssistantRole = 'USER' | 'ASSISTANT';
export interface AssistantHistory {
	role: AssistantRole;
	message: string;
}
export interface AssistantSource {
	type: 'FAQ' | 'RESORT' | 'EQUIPMENT' | 'EVENT';
	id: string;
	title: string;
}
export interface AssistantResponse {
	answer: string;
	sources: AssistantSource[];
}
export interface AssistantMessage extends AssistantHistory {
	id: number;
	sources?: AssistantSource[];
}

// Keep the newest context within the backend's per-entry and total limits.
export function assistantHistory(messages: AssistantHistory[], message: string): AssistantHistory[] {
	let remaining = 12000 - message.trim().length;
	const history: AssistantHistory[] = [];
	for (const entry of messages.slice(-10).reverse()) {
		const text = entry.message.trim().slice(0, 2000);
		if (!text) continue;
		if (text.length > remaining) break;
		history.unshift({ role: entry.role, message: text });
		remaining -= text.length;
	}
	return history;
}

export function assistantSourceHref(source: AssistantSource): string {
	const paths = { FAQ: '/cs/faq', RESORT: '/resort/detail', EQUIPMENT: '/equipment/detail', EVENT: '/events/detail' };
	return `${paths[source.type]}?id=${encodeURIComponent(source.id)}`;
}
