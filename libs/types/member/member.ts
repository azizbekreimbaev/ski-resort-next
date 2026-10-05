import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { MeLiked, TotalCounter } from '../interaction';
import { MeFollowed } from '../follow/follow';

export interface Member {
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
	memberType: MemberType;
	memberStatus: MemberStatus;
	memberAuthType: MemberAuthType;
	memberPhone: string;
	memberNick: string;
	memberPassword?: string;
	memberFullName?: string;
	memberImage?: string;
	memberAddress?: string;
	memberDesc?: string;
	memberProperties: number;
	memberRank: number;
	memberArticles: number;
	memberPoints: number;
	memberLikes: number;
	memberFollowers?: number;
	memberFollowings?: number;
	memberViews: number;
	memberComments: number;
	memberWarnings: number;
	memberBlocks: number;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
	// Enable for authentications
	meLiked?: MeLiked[];
	meFollowed?: MeFollowed[];
	accessToken?: string;
}

export interface Members {
	list: Member[];
	metaCounter: TotalCounter[];
}
