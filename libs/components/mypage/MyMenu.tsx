import React from 'react';
import Link from 'next/link';
import { Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import useMemberSession from '../../hooks/useMemberSession';
import { logOut } from '../../auth';
export default function MyMenu() {
	const { user } = useMemberSession();
	const { t } = useTranslation('common');
	const links = [
		['myProfile', 'My Profile'],
		['myFavorites', 'My Favorites'],
		['recentlyVisited', 'Recently Visited'],
		['demoOrders', 'Demo orders'],
		['followers', 'My Followers'],
		['followings', 'My Followings'],
		['myArticles', 'Articles'],
		['writeArticle', 'Write Article'],
		...(user.memberType === 'USER' || user.memberType === 'INSTRUCTOR'
			? [['instructor', user.memberType === 'INSTRUCTOR' ? 'Instructor profile' : 'Instructor application']]
			: []),
	];
	return (
		<Stack spacing={2}>
			<Typography variant="h5">{user.memberFullName || user.memberNick}</Typography>
			<Typography>{t(user.memberType)}</Typography>
			{links.map(([category, label]) => (
				<Button key={category} component={Link} href={`/mypage?category=${encodeURIComponent(category)}`}>
					{t(label)}
				</Button>
			))}
			{user.memberType === 'ADMIN' && (
				<Button component={Link} href="/_admin/users">
					{t('Administration')}
				</Button>
			)}
			<Button onClick={() => logOut()}>{t('Logout')}</Button>
		</Stack>
	);
}
