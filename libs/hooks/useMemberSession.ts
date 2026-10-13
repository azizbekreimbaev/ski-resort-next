import { useEffect, useState } from 'react';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { setupSession } from '../auth';
import { restoreSession } from '../auth/session';
export default function useMemberSession() {
	const user = useReactiveVar(userVar);
	const [ready, setReady] = useState(false);
	useEffect(() => {
		let active = true;
		setupSession();
		void restoreSession().then(() => {
			if (active) setReady(true);
		});
		return () => {
			active = false;
		};
	}, []);
	return { user, ready };
}
