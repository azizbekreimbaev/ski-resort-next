import { useEffect, useState } from 'react';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { getJwtToken, updateUserInfo } from '../auth';
export default function useMemberSession() {
	const user = useReactiveVar(userVar);
	const [ready, setReady] = useState(false);
	useEffect(() => {
		const token = getJwtToken();
		if (token) {
			try {
				updateUserInfo(token);
			} catch {
				localStorage.removeItem('accessToken');
			}
		}
		setReady(true);
	}, []);
	return { user, ready };
}
