import { Direction } from '../../enums/common.enum';
import { ResortFacilities, ResortLevel, ResortLocation } from '../../enums/resort.enum';

export interface ResortSearch {
	memberId?: string;
	facilities?: ResortFacilities[];
	pricesRange?: { start: number; end: number };
	text?: string;
	locationList?: ResortLocation[];
	levelList?: ResortLevel[];
}

export interface ResortsInquiry {
	page: number;
	limit: number;
	sort: ResortSort;
	direction: Direction;
	search: ResortSearch;
}

export const resortSorts = [
	'createdAt',
	'updatedAt',
	'resortTitle',
	'resortPricePerDay',
	'resortLikes',
	'resortViews',
	'resortComments',
] as const;
export type ResortSort = typeof resortSorts[number];
