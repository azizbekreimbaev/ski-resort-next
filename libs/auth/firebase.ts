import { getApp, getApps, initializeApp } from 'firebase/app';
import {
	GoogleAuthProvider,
	initializeAuth,
	inMemoryPersistence,
	browserPopupRedirectResolver,
	signInWithPopup,
	signOut,
} from 'firebase/auth';

export const googleLoginEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';

// Supply web configuration through the deployment environment.
const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const getGoogleIdToken = async (): Promise<string> => {
	if (!googleLoginEnabled) throw new Error('Google login is not available yet');
	if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.appId)
		throw new Error('Google login configuration is incomplete');
	const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
	const auth = initializeAuth(app, {
		persistence: inMemoryPersistence,
		popupRedirectResolver: browserPopupRedirectResolver,
	});
	const provider = new GoogleAuthProvider();
	provider.setCustomParameters({ prompt: 'select_account' });
	try {
		const result = await signInWithPopup(auth, provider);
		return await result.user.getIdToken();
	} finally {
		await signOut(auth);
	}
};
