import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { Alert, Button, Skeleton } from '@mui/material';
import { useTranslation } from 'next-i18next';
import PeopleOutline from '@mui/icons-material/PeopleOutline';
import ArticleOutlined from '@mui/icons-material/ArticleOutlined';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MemberArticles from '../../libs/components/member/MemberArticles';
import MemberFollows, { MemberFollowsProps } from '../../libs/components/member/MemberFollows';
import useMemberSession from '../../libs/hooks/useMemberSession';
import { GET_MEMBER } from '../../apollo/user/query';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE } from '../../apollo/user/mutation';
import { Member } from '../../libs/types/member/member';
import { validId } from '../../libs/catalogSearch';
import { homeImageUrl } from '../../libs/components/homepage/homeUtils';
import { sweetErrorHandling } from '../../libs/sweetAlert';
export { getStaticProps } from '../../libs/pageTranslations';

const MemberPage: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const { user, ready } = useMemberSession();
	const id = typeof router.query.memberId === 'string' ? router.query.memberId : '';
	const raw = router.query.category;
	const category = typeof raw === 'string' && ['articles', 'followers', 'followings'].includes(raw) ? raw : 'articles';
	const profile = useQuery<{ getMember: Member }, { input: string }>(GET_MEMBER, {
		variables: { input: id },
		skip: !router.isReady || !ready || !validId(id),
		fetchPolicy: 'network-only',
	});
	const [subscribe] = useMutation(SUBSCRIBE);
	const [unsubscribe] = useMutation(UNSUBSCRIBE);
	const [like] = useMutation(LIKE_TARGET_MEMBER);
	const [pending, setPending] = useState(false);
	const lock = useRef(false);
	const member = profile.data?.getMember;
	const followed = Boolean(member?.meFollowed?.some((item) => item.myFollowing));
	const authorize = async () => {
		if (user._id) return true;
		await router.push({ pathname: '/account/join', query: { referrer: router.asPath } });
		return false;
	};
	const interaction =
		(mutation: typeof subscribe): MemberFollowsProps['subscribeHandler'] =>
		async (target, refetch, input) => {
			try {
				if (!(await authorize())) return;
				await mutation({ variables: { input: target } });
				await refetch({ input });
				await profile.refetch();
			} catch (error) {
				await sweetErrorHandling(error);
			}
		};
	const toggleFollow = async () => {
		if (lock.current) return;
		lock.current = true;
		setPending(true);
		try {
			if (!(await authorize())) return;
			await (followed ? unsubscribe : subscribe)({
				variables: { input: id },
				refetchQueries: ['GetMemberFollowers', 'GetMemberFollowings'],
				awaitRefetchQueries: true,
			});
			await profile.refetch();
		} catch (error) {
			await sweetErrorHandling(error);
		} finally {
			lock.current = false;
			setPending(false);
		}
	};
	const follows: MemberFollowsProps = {
		ownerId: id,
		initialInput: { page: 1, limit: 6, search: {} },
		subscribeHandler: interaction(subscribe),
		unsubscribeHandler: interaction(unsubscribe),
		likeMemberHandler: interaction(like),
		redirectToMemberPageHandler: async (target) => {
			await router.push(target === user._id ? '/mypage' : `/member?memberId=${target}`);
		},
	};
	const href = (section: string) => `/member?memberId=${encodeURIComponent(id)}&category=${section}`;
	const stats = [
		{ id: 'followers', label: 'Followers', value: member?.memberFollowers ?? 0, icon: PeopleOutline },
		{ id: 'followings', label: 'Following', value: member?.memberFollowings ?? 0, icon: PeopleOutline },
		{ id: 'articles', label: 'Articles', value: member?.memberArticles ?? 0, icon: ArticleOutlined },
	];
	if (!router.isReady || !ready || (profile.loading && !member))
		return (
			<div className="account-dashboard snowkr-container">
				<Skeleton variant="rounded" height={160} />
				<Skeleton height={320} />
			</div>
		);
	if (!validId(id) || profile.error || !member)
		return (
			<div className="account-dashboard snowkr-container">
				<Alert
					severity="error"
					action={validId(id) ? <Button onClick={() => void profile.refetch()}>{t('Retry')}</Button> : undefined}
				>
					{t('This resource is unavailable')}
				</Alert>
			</div>
		);
	return (
		<div className="account-dashboard public-member-dashboard snowkr-container">
			<header className="account-identity">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={homeImageUrl(member.memberImage) || '/img/profile/defaultUser.svg'}
					alt={member.memberNick}
					onError={(event) => {
						event.currentTarget.onerror = null;
						event.currentTarget.src = '/img/profile/defaultUser.svg';
					}}
				/>
				<div className="account-identity-copy">
					<div className="account-name">
						<h1>{member.memberFullName || member.memberNick}</h1>
						<span>@{member.memberNick}</span>
						<b>{t(member.memberType)}</b>
					</div>
					{member.memberDesc && <p>{member.memberDesc}</p>}
					<div className="account-meta">
						<Link href={href('followers')}>
							{member.memberFollowers ?? 0} {t('Followers')}
						</Link>
						<Link href={href('followings')}>
							{member.memberFollowings ?? 0} {t('Following')}
						</Link>
						<span>
							{t('Joined')}{' '}
							{new Date(member.createdAt).toLocaleDateString(router.locale === 'kr' ? 'ko-KR' : router.locale, {
								month: 'short',
								year: 'numeric',
							})}
						</span>
					</div>
				</div>
				<div className="public-member-actions">
					{member.memberType === 'INSTRUCTOR' && (
						<Button component={Link} href={`/instructor/detail?instructorId=${id}`} variant="outlined">
							{t('Instructor profile')}
						</Button>
					)}
					{user._id === id ? (
						<Button component={Link} href="/mypage" variant="outlined">
							{t('My Page')}
						</Button>
					) : (
						<Button
							variant={followed ? 'outlined' : 'contained'}
							disabled={pending}
							aria-pressed={followed}
							onClick={() => void toggleFollow()}
						>
							{t(followed ? 'Unfollow' : 'Follow')}
						</Button>
					)}
				</div>
			</header>
			<div className="account-layout">
				<aside className="account-navigation">
					<nav aria-label={t('Profile')}>
						{stats.map(({ id: section, label, value, icon: Icon }) => (
							<Link
								passHref
								key={section}
								href={href(section)}
								className={category === section ? 'active' : ''}
								aria-current={category === section ? 'page' : undefined}
							>
								<Icon />
								<span>{t(label)}</span>
								<small>{value}</small>
							</Link>
						))}
					</nav>
				</aside>
				<main className="account-content">
					<div className="account-stats">
						{stats.map(({ id: section, label, value, icon: Icon }) => (
							<Link passHref href={href(section)} key={section} className="account-stat">
								<div>
									{t(label)}
									<Icon />
								</div>
								<strong>{value}</strong>
							</Link>
						))}
					</div>
					<section className="account-section" key={`${id}-${category}`}>
						{category === 'articles' ? (
							<MemberArticles />
						) : (
							<MemberFollows {...follows} following={category === 'followings'} />
						)}
					</section>
				</main>
			</div>
		</div>
	);
};
export default withLayoutBasic(MemberPage);
