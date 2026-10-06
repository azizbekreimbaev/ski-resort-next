export type EventStatus = 'DRAFT' | 'PUBLISHED';
export interface SkiEvent {
	_id: string;
	eventTitle: string;
	eventDesc: string;
	eventImages: string[];
	eventStartDate: string;
	eventEndDate: string;
	eventStatus: EventStatus;
	eventLocation: string | null;
	resortId: string | null;
	memberId: string;
	createdAt: string;
	updatedAt: string;
}
export type EventInput = Pick<
	SkiEvent,
	| 'eventTitle'
	| 'eventDesc'
	| 'eventImages'
	| 'eventStartDate'
	| 'eventEndDate'
	| 'eventStatus'
	| 'eventLocation'
	| 'resortId'
>;
export interface EventList {
	list: SkiEvent[];
	metaCounter: { total: number }[];
}

// Inputs explicitly use Korea time regardless of the browser's timezone.
export const koreaDateInput = (value: string) =>
	new Date(new Date(value).getTime() + 9 * 3600000).toISOString().slice(0, 16);
export const eventDateISO = (value: string) => new Date(value + ':00+09:00').toISOString();
export const isPastEvent = (event: SkiEvent, now: number) => new Date(event.eventEndDate).getTime() <= now;
export const validateEventFiles = (files: File[]) =>
	files.length > 0 &&
	files.length <= 5 &&
	files.every(
		(file) =>
			['image/png', 'image/jpeg'].includes(file.type) &&
			/\.(png|jpe?g)$/i.test(file.name) &&
			file.size > 0 &&
			file.size <= 15000000,
	);
