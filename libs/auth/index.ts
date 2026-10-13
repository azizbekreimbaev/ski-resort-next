import decodeJWT from 'jwt-decode';
import { initializeApollo } from '../../apollo/client';
import { userVar } from '../../apollo/store';
import { CustomJwtPayload } from '../types/customJwtPayload';
import { sweetMixinErrorAlert } from '../sweetAlert';
import { GOOGLE_LOGIN, LOGIN, SIGN_UP } from '../../apollo/user/mutation';
import {
	clearSession,
	configureSession,
	getSessionToken,
	saveSessionToken,
	getSessionGeneration,
	sessionRequest,
	withSessionLock,
} from './session';

export const googleLogIn = async (input: {
	idToken: string;
	memberNick?: string;
	memberPhone?: string;
}): Promise<void> => {
	const client = initializeApollo();
	setupSession();
	await withSessionLock(async () => {
		const epoch = getSessionGeneration();
		const result = await client.mutate<{ googleLogin: { accessToken: string } }>({
			mutation: GOOGLE_LOGIN,
			variables: { input },
			fetchPolicy: 'no-cache',
		});
		const token = result.data?.googleLogin?.accessToken;
		if (epoch !== getSessionGeneration()) throw new Error('SESSION_CANCELLED');
		if (!token) throw new Error('Authentication failed');
		updateUserInfo(token);
		updateStorage({ jwtToken: token });
		await client.clearStore();
	});
};

export function getJwtToken(): string | undefined {
	return getSessionToken();
}

export function setJwtToken(token: string) {
	saveSessionToken(token);
}

const authenticate = async (
	signup: boolean,
	input: { memberNick: string; memberPassword: string; memberPhone?: string; memberType?: 'USER' },
): Promise<void> => {
	const client = initializeApollo();
	setupSession();
	await withSessionLock(async () => {
		const epoch = getSessionGeneration();
		const result = await client.mutate<{ login?: { accessToken: string }; signup?: { accessToken: string } }>({
			mutation: signup ? SIGN_UP : LOGIN,
			variables: { input },
			fetchPolicy: 'no-cache',
		});
		const token = (signup ? result.data?.signup : result.data?.login)?.accessToken;
		if (epoch !== getSessionGeneration()) throw new Error('SESSION_CANCELLED');
		if (!token) throw new Error('Authentication failed');
		updateUserInfo(token);
		updateStorage({ jwtToken: token });
		await client.clearStore();
	});
};
export const logIn = (nick: string, password: string): Promise<void> =>
	authenticate(false, { memberNick: nick, memberPassword: password });
export const signUp = (nick: string, password: string, phone: string, _type: string): Promise<void> =>
	authenticate(true, { memberNick: nick, memberPassword: password, memberPhone: phone, memberType: 'USER' });
export const updateStorage = ({ jwtToken }: { jwtToken: string }) => {
	setJwtToken(jwtToken);
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

export const logOut = async () => {
	clearSession();
	try {
		await withSessionLock(async () => {
			await sessionRequest('logout');
		});
	} catch {
		await sweetMixinErrorAlert('Signed out locally. Server session revocation could not be confirmed.');
	} finally {
		await initializeApollo().clearStore();
	}
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

export function setupSession() {
	configureSession(
		updateUserInfo,
		() => {
			deleteUserInfo();
			// Session restoration can fail while public queries are waiting for it.
			// Clear cached member data without cancelling those pending operations.
			// The auth link rejects responses from the previous session generation.
			void initializeApollo().cache.reset();
		},
		(code) => {
			void sweetMixinErrorAlert(
				code === 'CSRF_FAILED'
					? 'Session configuration error. Check the API origin and CSRF settings.'
					: code === 'SESSION_COORDINATION_UNAVAILABLE'
					? 'This browser cannot safely coordinate sessions. Use a browser with Web Locks and BroadcastChannel support.'
					: 'Session recovery failed. Please sign in again.',
			);
		},
	);
}
