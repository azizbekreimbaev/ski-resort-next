import React, { ComponentType, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Alert } from '@mui/material';
import AppLayout from './AppLayout';
import MenuList from '../admin/AdminMenuList';
import useMemberSession from '../../hooks/useMemberSession';
import { useTranslation } from 'next-i18next';
export default function withAdminLayout<P extends object>(Component: ComponentType<P>) {
	return function LayoutAdmin(props: P) {
		const router = useRouter();
		const { t } = useTranslation('common');
		const { user, ready } = useMemberSession();
		const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
		const [, setTitle] = useState('Admin');
		useEffect(() => {
			if (ready && user.memberType !== 'ADMIN') void router.replace('/');
		}, [ready, user.memberType, router]);
		if (!ready || user.memberType !== 'ADMIN') return null;
		return (
			<AppLayout>
				<div className="snowkr-container snowkr-admin">
					<aside>
						<h2>{t('Administration')}</h2>
						<MenuList />
					</aside>
					<section>
						{snackbar.open && (
							<Alert
								severity={snackbar.severity === 'error' ? 'error' : 'success'}
								onClose={() => setSnackbar({ ...snackbar, open: false })}
							>
								{snackbar.message}
							</Alert>
						)}
						<Component {...props} {...{ setSnackbar, setTitle }} />
					</section>
				</div>
			</AppLayout>
		);
	};
}
