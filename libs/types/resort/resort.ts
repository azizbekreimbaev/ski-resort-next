import { ResortFacilities, ResortLevel, ResortLocation } from '../../enums/resort.enum';

export interface ResortSearchResult {
	_id: string;
	resortTitle: string;
	resortLocation: ResortLocation;
	resortAddress: string;
	resortStatus: 'ACTIVE' | 'SOLD_OUT' | 'DELETE';
	resortPricePerDay: number;
	resortMinDays: number;
	resortLevel: ResortLevel | null;
	resortImages: string[];
	resortDesc: string | null;
	resortFacilities: ResortFacilities[] | null;
	resortLikes: number;
	resortViews: number;
	resortComments: number;
	meLiked: { myFavorite: boolean }[] | null;
}

export interface ResortSearchData {
	getResorts: {
		list: ResortSearchResult[];
		metaCounter: { total: number }[] | null;
	};
}
