import { Direction } from './enums/common.enum';
import { ResortLevel, ResortLocation } from './enums/resort.enum';
import { ResortsInquiry, ResortSort, resortSorts } from './types/resort/resort.input';

// Trip preferences stay in the URL, outside the backend ResortsInquiry contract.
export const parseTravelDates = (arrival: string | string[] | undefined, departure: string | string[] | undefined) => {
	const validDate = (value: string | string[] | undefined): value is string => {
		if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
		const date = new Date(`${value}T00:00:00Z`);
		return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
	};
	return validDate(arrival) && validDate(departure) && departure > arrival
		? { arrival, departure }
		: { arrival: '', departure: '' };
};

export const defaultResortInquiry = (): ResortsInquiry => ({
	page: 1,
	limit: 9,
	sort: 'createdAt',
	direction: Direction.DESC,
	search: {},
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseResortInquiry = (raw: string | string[] | undefined): ResortsInquiry => {
	const inquiry = defaultResortInquiry();
	if (typeof raw !== 'string') return inquiry;
	try {
		const input: unknown = JSON.parse(raw);
		if (!isRecord(input)) return inquiry;
		if (typeof input.sort === 'string' && resortSorts.includes(input.sort as ResortSort))
			inquiry.sort = input.sort as ResortSort;
		if (input.direction === Direction.ASC || input.direction === Direction.DESC) inquiry.direction = input.direction;
		if (
			typeof input.page === 'number' &&
			Number.isSafeInteger(input.page) &&
			input.page >= 1 &&
			input.page <= 2147483647
		)
			inquiry.page = input.page;
		if (!isRecord(input.search)) return inquiry;
		const search = input.search;
		if (typeof search.text === 'string' && search.text.trim()) inquiry.search.text = search.text.trim();
		if (Array.isArray(search.locationList)) {
			const locations = search.locationList.filter(
				(value: unknown): value is ResortLocation =>
					typeof value === 'string' && Object.values(ResortLocation).includes(value as ResortLocation),
			);
			if (locations.length) inquiry.search.locationList = locations;
		}
		if (Array.isArray(search.levelList)) {
			const levels = search.levelList.filter(
				(value: unknown): value is ResortLevel =>
					typeof value === 'string' && Object.values(ResortLevel).includes(value as ResortLevel),
			);
			if (levels.length) inquiry.search.levelList = levels;
		}
		return inquiry;
	} catch {
		return inquiry;
	}
};
