import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { Direction } from '../../enums/common.enum';

export interface MemberInput {
	memberNick: string;
	memberPassword: string;
	memberPhone: string;
	memberType?: MemberType;
	memberAuthType?: MemberAuthType;
}

export interface LoginInput {
	memberNick: string;
	memberPassword: string;
}

interface MISearch {
	memberStatus?: MemberStatus;
	memberType?: MemberType;
	text?: string;
}

export interface MembersInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: MISearch;
}
