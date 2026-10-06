import { makeVar } from '@apollo/client';
interface BaseLine {
	key: string;
	resourceId: string;
	title: string;
	image: string;
	quantity: number;
	unitPrice: number;
}
export type CartLine = BaseLine &
	(
		| { kind: 'resort'; start: string; end: string; days: number }
		| { kind: 'instructor'; start: string; weeks: 1 | 2 | 3 | 4 }
		| { kind: 'equipment-rental'; start: string; durationHours: number }
		| { kind: 'equipment-purchase' }
	);
export interface DemoReceipt {
	id: string;
	memberId: string;
	createdAt: string;
	lines: CartLine[];
	total: number;
	status: 'DEMO_COMPLETED';
}
export const cartVar = makeVar<CartLine[]>([]);
export const cartStorageError = makeVar(false);
const cartKey = 'snowkr.demo.cart.v1';
export const validPrice = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value) && value >= 0;
export const validDate = (value: unknown): value is string =>
	typeof value === 'string' &&
	/^\d{4}-\d{2}-\d{2}$/.test(value) &&
	!Number.isNaN(Date.parse(value)) &&
	new Date(value).toISOString().slice(0, 10) === value;
export const dateDays = (start: string, end: string) =>
	validDate(start) && validDate(end) ? (Date.parse(end) - Date.parse(start)) / 86400000 : 0;
export const lineTotal = (line: CartLine) => line.unitPrice * line.quantity * (line.kind === 'resort' ? line.days : 1);
export const cartTotal = (lines: CartLine[]) => lines.reduce((sum, line) => sum + lineTotal(line), 0);
export function isCartLine(value: unknown): value is CartLine {
	if (!value || typeof value !== 'object') return false;
	const line = value as Record<string, unknown>;
	if (
		typeof line.key !== 'string' ||
		typeof line.resourceId !== 'string' ||
		!/^[a-f\d]{24}$/i.test(line.resourceId) ||
		typeof line.title !== 'string' ||
		typeof line.image !== 'string' ||
		!Number.isInteger(line.quantity) ||
		Number(line.quantity) < 1 ||
		Number(line.quantity) > 99 ||
		!validPrice(line.unitPrice)
	)
		return false;
	if (line.kind === 'equipment-purchase') return true;
	if (!validDate(line.start)) return false;
	if (line.kind === 'resort')
		return (
			validDate(line.end) &&
			Number.isInteger(line.days) &&
			Number(line.days) > 0 &&
			dateDays(line.start, line.end) === line.days
		);
	if (line.kind === 'instructor') return typeof line.weeks === 'number' && [1, 2, 3, 4].includes(line.weeks);
	return line.kind === 'equipment-rental' && Number.isInteger(line.durationHours) && Number(line.durationHours) > 0;
}
export function saveCart(lines: CartLine[]) {
	cartVar(lines);
	try {
		localStorage.setItem(cartKey, JSON.stringify(lines));
		cartStorageError(false);
	} catch {
		cartStorageError(true);
	}
}
export function hydrateCart() {
	try {
		const stored: unknown = JSON.parse(localStorage.getItem(cartKey) ?? '[]');
		cartVar(Array.isArray(stored) ? stored.filter(isCartLine) : []);
	} catch {
		cartVar([]);
		cartStorageError(true);
	}
}
export function addCartLine(line: CartLine) {
	if (!isCartLine(line)) throw new Error('Invalid cart selection');
	const existing = cartVar().find((item) => item.key === line.key);
	saveCart(
		existing
			? cartVar().map((item) =>
					item.key === line.key ? { ...line, quantity: Math.min(99, item.quantity + line.quantity) } : item,
			  )
			: [...cartVar(), line],
	);
}
export function readReceipts(memberId: string): DemoReceipt[] {
	try {
		const stored: unknown = JSON.parse(localStorage.getItem('snowkr.demo.receipts.v1.' + memberId) ?? '[]');
		return Array.isArray(stored)
			? stored.filter((value: unknown): value is DemoReceipt => {
					if (!value || typeof value !== 'object') return false;
					const receipt = value as DemoReceipt;
					return (
						receipt.memberId === memberId &&
						typeof receipt.id === 'string' &&
						typeof receipt.createdAt === 'string' &&
						receipt.status === 'DEMO_COMPLETED' &&
						Array.isArray(receipt.lines) &&
						receipt.lines.every(isCartLine) &&
						receipt.total === cartTotal(receipt.lines)
					);
			  })
			: [];
	} catch {
		return [];
	}
}
export function saveReceipt(receipt: DemoReceipt) {
	localStorage.setItem(
		'snowkr.demo.receipts.v1.' + receipt.memberId,
		JSON.stringify([receipt, ...readReceipts(receipt.memberId).filter((item) => item.id !== receipt.id)]),
	);
}

export function todayInKorea() {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: 'Asia/Seoul',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(new Date());
	return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type)?.value).join('-');
}
