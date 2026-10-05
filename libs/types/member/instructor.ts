import { InstructorAudience, InstructorLevel } from '../../enums/instructor.enum';
import { Direction } from '../../enums/common.enum';

export interface InstructorPreview {
	_id: string;
	memberNick: string;
	memberFullName: string | null;
	memberImage: string;
	memberDesc: string | null;
	instructorExperienceYears: number | null;
	instructorLanguages: string[] | null;
	instructorLevel: InstructorLevel | null;
	instructorAudience: InstructorAudience | null;
	instructorPrice1Week: number | null;
	instructorPrice2Weeks: number | null;
	instructorPrice3Weeks: number | null;
	instructorPrice4Weeks: number | null;
}

export interface InstructorPreviewData {
	getInstructors: { list: InstructorPreview[]; metaCounter: { total: number | null }[] | null };
}

export interface InstructorsInquiry {
	page: number;
	limit: number;
	sort: 'memberRank' | 'createdAt' | 'updatedAt' | 'memberLikes' | 'memberViews';
	direction: Direction;
	search: { text?: string };
}
