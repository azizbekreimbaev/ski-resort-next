import { JwtPayload } from 'jwt-decode';

export interface CustomJwtPayload extends JwtPayload {
	instructorResortId?: string | null;
	instructorExperienceYears?: number | null;
	instructorLanguages?: string[] | null;
	instructorLevel?: string | null;
	instructorAudience?: string | null;
	instructorPrice1Week?: number | null;
	instructorPrice2Weeks?: number | null;
	instructorPrice3Weeks?: number | null;
	instructorPrice4Weeks?: number | null;
	_id: string;
	memberType: string;
	memberStatus: string;
	memberAuthType: string;
	memberPhone: string;
	memberNick: string;
	memberFullName?: string;
	memberImage?: string;
	memberAddress?: string;
	memberDesc?: string;
	memberProperties: number;
	memberRank: number;
	memberArticles: number;
	memberPoints: number;
	memberLikes: number;
	memberViews: number;
	memberWarnings: number;
	memberBlocks: number;
}
