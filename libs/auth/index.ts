import decodeJWT from 'jwt-decode';
import { initializeApollo } from '../../apollo/client';
import { userVar } from '../../apollo/store';
import { CustomJwtPayload } from '../types/customJwtPayload';
import { sweetMixinErrorAlert } from '../sweetAlert';
import { LOGIN, SIGN_UP } from '../../apollo/user/mutation';

export function getJwtToken(): string | undefined {
	if (typeof window !== 'undefined') {
		return localStorage.getItem('accessToken') ?? '';
	}
}

export function setJwtToken(token: string) {
	localStorage.setItem('accessToken', token);
}

const authenticate = async (
	signup: boolean,
	input: { memberNick: string; memberPassword: string; memberPhone?: string; memberType?: 'USER' },
): Promise<void> => {
	const client = initializeApollo();
	const result = await client.mutate<{ login?: { accessToken: string }; signup?: { accessToken: string } }>({
		mutation: signup ? SIGN_UP : LOGIN,
		variables: { input },
		fetchPolicy: 'network-only',
	});
	const token = (signup ? result.data?.signup : result.data?.login)?.accessToken;
	if (!token) throw new Error('Authentication failed');
	updateUserInfo(token);
	updateStorage({ jwtToken: token });
	await client.clearStore();
};
export const logIn = (nick: string, password: string): Promise<void> =>
	authenticate(false, { memberNick: nick, memberPassword: password });
export const signUp = (nick: string, password: string, phone: string, _type: string): Promise<void> =>
	authenticate(true, { memberNick: nick, memberPassword: password, memberPhone: phone, memberType: 'USER' });
export const updateStorage = ({ jwtToken }: { jwtToken: string }) => {
	setJwtToken(jwtToken);
	window.localStorage.setItem('login', Date.now().toString());
};

export const updateUserInfo = (jwtToken: string) => {
	if (!jwtToken) return false;

	const claims = decodeJWT<CustomJwtPayload>(jwtToken);
	userVar({
		instructorResortId: claims.instructorResortId,
		instructorExperienceYears: claims.instructorExperienceYears,
		instructorLanguages: claims.instructorLanguages,
		instructorLevel: claims.instructorLevel,
		instructorAudience: claims.instructorAudience,
		instructorPrice1Week: claims.instructorPrice1Week,
		instructorPrice2Weeks: claims.instructorPrice2Weeks,
		instructorPrice3Weeks: claims.instructorPrice3Weeks,
		instructorPrice4Weeks: claims.instructorPrice4Weeks,
		_id: claims._id ?? '',
		memberType: claims.memberType ?? '',
		memberStatus: claims.memberStatus ?? '',
		memberAuthType: claims.memberAuthType,
		memberPhone: claims.memberPhone ?? '',
		memberNick: claims.memberNick ?? '',
		memberFullName: claims.memberFullName ?? '',
		memberImage:
			claims.memberImage === null || claims.memberImage === undefined
				? '/img/profile/defaultUser.svg'
				: `${claims.memberImage}`,
		memberAddress: claims.memberAddress ?? '',
		memberDesc: claims.memberDesc ?? '',
		memberProperties: claims.memberProperties,
		memberRank: claims.memberRank,
		memberArticles: claims.memberArticles,
		memberPoints: claims.memberPoints,
		memberLikes: claims.memberLikes,
		memberViews: claims.memberViews,
		memberWarnings: claims.memberWarnings,
		memberBlocks: claims.memberBlocks,
	});
};

export const logOut = () => {
	deleteStorage();
	deleteUserInfo();
	window.location.reload();
};

const deleteStorage = () => {
	localStorage.removeItem('accessToken');
	window.localStorage.setItem('logout', Date.now().toString());
};

const deleteUserInfo = () => {
	userVar({
		_id: '',
		memberType: '',
		memberStatus: '',
		memberAuthType: '',
		memberPhone: '',
		memberNick: '',
		memberFullName: '',
		memberImage: '',
		memberAddress: '',
		memberDesc: '',
		memberProperties: 0,
		memberRank: 0,
		memberArticles: 0,
		memberPoints: 0,
		memberLikes: 0,
		memberViews: 0,
		memberWarnings: 0,
		memberBlocks: 0,
	});
};
