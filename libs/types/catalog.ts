import { ResortSearchResult } from './resort/resort';
import { EquipmentPreview } from './equipment/equipment';
import { InstructorPreview } from './member/instructor';

export type CatalogDomain = 'resort' | 'equipment' | 'instructor';
export interface CatalogInquiry {
	page: number;
	limit: number;
	sort: string;
	direction: 'ASC' | 'DESC';
	search: Record<string, string | number | boolean | string[] | { start: number; end: number }>;
}
export interface CatalogMember extends InstructorPreview {
	memberType: 'USER' | 'ADMIN' | 'INSTRUCTOR';
	memberStatus: string;
	memberLikes: number;
	memberViews: number;
	instructorResortId: string | null;
	meLiked: { myFavorite: boolean }[] | null;
	meFollowed: { myFollowing: boolean }[] | null;
}
export type CatalogResource = ResortSearchResult | EquipmentPreview | CatalogMember;
export interface CatalogList<T> {
	list: T[];
	metaCounter: { total: number }[] | null;
}
export interface CatalogData {
	getResorts?: CatalogList<ResortSearchResult>;
	getEquipments?: CatalogList<EquipmentPreview>;
	getInstructors?: CatalogList<CatalogMember>;
	getFavoriteResorts?: CatalogList<ResortSearchResult>;
	getVisitedResorts?: CatalogList<ResortSearchResult>;
	getFavoriteEquipments?: CatalogList<EquipmentPreview>;
	getVisitedEquipments?: CatalogList<EquipmentPreview>;
}
export interface Application {
	_id: string;
	memberId: string;
	applicationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
	instructorExperienceYears: number;
	instructorLanguages: string[];
	instructorLevel: string;
	instructorAudience: string;
	instructorResortId: string | null;
	memberDesc: string | null;
	rejectionReason: string | null;
	reviewedAt: string | null;
	createdAt: string;
}
