import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { Button, Pagination, Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { GET_MEMBER_FOLLOWERS, GET_MEMBER_FOLLOWINGS } from '../../../apollo/user/query';
import { FollowInquiry } from '../../types/follow/follow.input';
import { Followers, Followings } from '../../types/follow/follow';
import { validId } from '../../catalogSearch';
import useMemberSession from '../../hooks/useMemberSession';
import HomeCollectionState from '../homepage/HomeCollectionState';
import { homeImageUrl } from '../homepage/homeUtils';

type Interaction = (
	id: string,
	refetch: (variables?: { input: FollowInquiry }) => Promise<unknown>,
	input: FollowInquiry,
) => Promise<void>;
export interface MemberFollowsProps {
	initialInput?: FollowInquiry;
	subscribeHandler: Interaction;
	unsubscribeHandler: Interaction;
	likeMemberHandler: Interaction;
	redirectToMemberPageHandler: (id: string) => Promise<void>;
}
export default function MemberFollows({
	following = false,
	initialInput,
	subscribeHandler,
	unsubscribeHandler,
	likeMemberHandler,
	redirectToMemberPageHandler,
}: MemberFollowsProps & { following?: boolean }) {
	const router = useRouter();
	const { t } = useTranslation('common');
	const { user } = useMemberSession();
	const [page, setPage] = useState(1);
	const [pending, setPending] = useState('');
	const lock = useRef(false);
	const memberId = typeof router.query.memberId === 'string' ? router.query.memberId : user._id;
	const limit = initialInput?.limit ?? 5;
	const input: FollowInquiry = {
		page,
		limit,
		search: following ? { followerId: memberId } : { followingId: memberId },
	};
	useEffect(() => setPage(1), [memberId, following]);
	const { data, loading, error, refetch } = useQuery<
		{ getMemberFollowers?: Followers; getMemberFollowings?: Followings },
		{ input: FollowInquiry }
	>(following ? GET_MEMBER_FOLLOWINGS : GET_MEMBER_FOLLOWERS, {
		variables: { input },
		skip: !router.isReady || !validId(memberId),
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	const rows = following
		? data?.getMemberFollowings?.list.map((row) => ({
				id: row._id,
				member: row.followingData,
				liked: row.meLiked,
				followed: row.meFollowed,
		  }))
		: data?.getMemberFollowers?.list.map((row) => ({
				id: row._id,
				member: row.followerData,
				liked: row.meLiked,
				followed: row.meFollowed,
		  }));
	const total = (following ? data?.getMemberFollowings : data?.getMemberFollowers)?.metaCounter?.[0]?.total ?? 0;
	useEffect(() => {
		if (!loading && data && page > 1 && !rows?.length) setPage(page - 1);
	}, [loading, data, page, rows?.length]);
	const interact = async (id: string, handler: Interaction) => {
		if (lock.current) return;
		lock.current = true;
		setPending(id);
		try {
			await handler(id, refetch, input);
		} finally {
			lock.current = false;
			setPending('');
		}
	};
	return (
		<Stack id="member-follows-page" spacing={3}>
			<Typography component="h1" variant="h4">
				{t(following ? 'Followings' : 'Followers')}
			</Typography>
			<HomeCollectionState
				loading={loading}
				error={Boolean(error) || !validId(memberId)}
				empty={!rows?.length}
				retry={refetch}
			/>
			<Stack className="follows-list-box" spacing={2}>
				{rows?.map((row) => {
					const member = row.member;
					if (!member) return null;
					const followed = row.followed?.some((value) => value.myFollowing);
					const liked = row.liked?.some((value) => value.myFavorite);
					return (
						<Stack className="follows-card-box" key={row.id}>
							<div className="info">
								<img
									className="profile-avatar"
									src={homeImageUrl(member.memberImage) || '/img/profile/defaultUser.svg'}
									alt=""
									onError={(event) => {
										event.currentTarget.src = '/img/profile/defaultUser.svg';
									}}
								/>
								<div>
									<Button onClick={() => void redirectToMemberPageHandler(member._id)}>
										{member.memberFullName || member.memberNick}
									</Button>
									<Typography variant="caption">{t(member.memberType)}</Typography>
								</div>
							</div>
							<div className="details-box">
								<Button
									aria-pressed={Boolean(liked)}
									disabled={Boolean(pending)}
									onClick={() => void interact(member._id, likeMemberHandler)}
								>
									{t(liked ? 'Unlike' : 'Like')} ({member.memberLikes})
								</Button>
							</div>
							{user._id !== member._id && (
								<div className="action-box">
									<Button
										disabled={Boolean(pending)}
										variant={followed ? 'outlined' : 'contained'}
										onClick={() => void interact(member._id, followed ? unsubscribeHandler : subscribeHandler)}
									>
										{t(followed ? 'Unfollow' : 'Follow')}
									</Button>
								</div>
							)}
						</Stack>
					);
				})}
			</Stack>
			{total > limit && (
				<Pagination page={page} count={Math.ceil(total / limit)} onChange={(_, value) => setPage(value)} />
			)}
		</Stack>
	);
}
