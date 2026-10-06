import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { GET_MEMBER } from '../../../apollo/user/query';
import { Member } from '../../types/member/member';
import { validId } from '../../catalogSearch';
import { homeImageUrl } from '../homepage/homeUtils';
import useMemberSession from '../../hooks/useMemberSession';
type Interaction = (
	id: string,
	refetch: (variables?: { input: string }) => Promise<unknown>,
	query: string,
) => Promise<void>;
export default function MemberMenu({
	subscribeHandler,
	unsubscribeHandler,
}: {
	subscribeHandler: Interaction;
	unsubscribeHandler: Interaction;
}) {
	const router = useRouter();
	const { t } = useTranslation('common');
	const { user } = useMemberSession();
	const id = typeof router.query.memberId === 'string' ? router.query.memberId : '';
	const { data, loading, error, refetch } = useQuery<{ getMember: Member }, { input: string }>(GET_MEMBER, {
		variables: { input: id },
		skip: !router.isReady || !validId(id),
		fetchPolicy: 'network-only',
	});
	const member = data?.getMember;
	const category = typeof router.query.category === 'string' ? router.query.category : 'articles';
	if (loading) return <Typography>{t('Loading')}</Typography>;
	if (error || !member) return <Alert severity="error">{t('This resource is unavailable')}</Alert>;
	return (
		<Stack spacing={2}>
			<img
				className="profile-avatar"
				src={homeImageUrl(member.memberImage) || '/img/profile/defaultUser.svg'}
				alt={member.memberNick}
			/>
			<Typography component="h1" variant="h5">
				{member.memberFullName || member.memberNick}
			</Typography>
			<Typography color="text.secondary">{member.memberDesc}</Typography>
			<Typography>{t(member.memberType)}</Typography>
			{member.memberType === 'INSTRUCTOR' && (
				<Button component={Link} href={'/instructor/detail?instructorId=' + member._id}>
					{t('Instructor profile')}
				</Button>
			)}
			{user._id !== member._id && (
				<Button
					variant="contained"
					onClick={() =>
						void (member.meFollowed?.some((item) => item.myFollowing) ? unsubscribeHandler : subscribeHandler)(
							member._id,
							refetch,
							id,
						)
					}
				>
					{t(member.meFollowed?.some((item) => item.myFollowing) ? 'Unfollow' : 'Follow')}
				</Button>
			)}
			{[
				['articles', 'Articles'],
				['followers', 'Followers'],
				['followings', 'Followings'],
			].map(([value, label]) => (
				<Button
					key={value}
					component={Link}
					href={'/member?memberId=' + encodeURIComponent(id) + '&category=' + value}
					variant={category === value ? 'contained' : 'text'}
				>
					{t(label)}{' '}
					{value === 'followers'
						? member.memberFollowers
						: value === 'followings'
						? member.memberFollowings
						: member.memberArticles}
				</Button>
			))}
		</Stack>
	);
}
