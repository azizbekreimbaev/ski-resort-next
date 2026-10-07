import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import { useMutation, useQuery } from '@apollo/client';
import { Alert, Button } from '@mui/material';
import { useTranslation } from 'next-i18next';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import PeopleOutline from '@mui/icons-material/PeopleOutline';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import ArticleOutlined from '@mui/icons-material/ArticleOutlined';
import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline';
import SchoolOutlined from '@mui/icons-material/SchoolOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import Logout from '@mui/icons-material/Logout';
import EditOutlined from '@mui/icons-material/EditOutlined';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MyFavorites from '../../libs/components/mypage/MyFavorites';
import RecentlyVisited from '../../libs/components/mypage/RecentlyVisited';
import useMemberSession from '../../libs/hooks/useMemberSession';
import InstructorWorkflow from '../../libs/components/mypage/InstructorWorkflow';
import MyProfile from '../../libs/components/mypage/MyProfile';
import DemoOrders from '../../libs/components/common/DemoOrders';
import MyArticles from '../../libs/components/mypage/MyArticles';
import WriteArticle from '../../libs/components/mypage/WriteArticle';
import MemberFollows, { MemberFollowsProps } from '../../libs/components/member/MemberFollows';
import { sweetErrorHandling } from '../../libs/sweetAlert';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE } from '../../apollo/user/mutation';
import { GET_MY_PAGE_SUMMARY } from '../../apollo/user/mypage';
import { logOut } from '../../libs/auth';
import { homeImageUrl } from '../../libs/components/homepage/homeUtils';
export { getStaticProps } from '../../libs/pageTranslations';

type Counter = { metaCounter: { total: number }[] | null };
interface Summary {
	getMember: { _id: string; createdAt: string; memberComments: number };
	getMemberFollowers: Counter;
	getMemberFollowings: Counter;
	getFavoriteResorts: Counter;
	getFavoriteEquipments: Counter;
	getBoardArticles: Counter;
}
const MyPage: NextPage = () => {
	const { t } = useTranslation('common');
	const { user, ready } = useMemberSession();
	const router = useRouter();
	const categories = [
		'overview',
		'myProfile',
		'myFavorites',
		'recentlyVisited',
		'myArticles',
		'writeArticle',
		'followers',
		'followings',
		'instructor',
		'demoOrders',
		'myComments',
	];
	const raw = router.query.category;
	const category = typeof raw === 'string' && categories.includes(raw) ? raw : 'overview';
	const overview = category === 'overview';
	const summary = useQuery<Summary>(GET_MY_PAGE_SUMMARY, {
		skip: !ready || !user._id,
		variables: {
			memberId: user._id,
			followers: { page: 1, limit: 1, search: { followingId: user._id } },
			followings: { page: 1, limit: 1, search: { followerId: user._id } },
			resorts: { page: 1, limit: 1 },
			equipment: { page: 1, limit: 1 },
			articles: { page: 1, limit: 1, search: { memberId: user._id } },
		},
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	const [subscribe] = useMutation(SUBSCRIBE);
	const [unsubscribe] = useMutation(UNSUBSCRIBE);
	const [like] = useMutation(LIKE_TARGET_MEMBER);
	useEffect(() => {
		if (ready && !user._id) void router.replace('/account/join?referrer=/mypage');
	}, [ready, user._id, router]);
	const interaction =
		(mutation: typeof subscribe): MemberFollowsProps['subscribeHandler'] =>
		async (id, refetch, input) => {
			try {
				await mutation({ variables: { input: id } });
				await refetch({ input });
				await summary.refetch();
			} catch (error) {
				await sweetErrorHandling(error);
			}
		};
	const follows: MemberFollowsProps = {
		ownerId: user._id,
		initialInput: { page: 1, limit: 6, search: {} },
		subscribeHandler: interaction(subscribe),
		unsubscribeHandler: interaction(unsubscribe),
		likeMemberHandler: interaction(like),
		redirectToMemberPageHandler: async (id) => {
			await router.push(id === user._id ? '/mypage' : `/member?memberId=${id}`);
		},
	};
	const count = (value?: Counter) => (summary.error || !value ? '\u2014' : value.metaCounter?.[0]?.total ?? 0);
	const stats = [
		{
			id: 'followers',
			label: 'Followers',
			value: count(summary.data?.getMemberFollowers),
			icon: PeopleOutline,
			caption: 'Your mountain community',
		},
		{
			id: 'followings',
			label: 'Following',
			value: count(summary.data?.getMemberFollowings),
			icon: PeopleOutline,
			caption: 'Coaches & riders',
		},
		{
			id: 'myFavorites',
			label: 'Favorites',
			value:
				summary.data && !summary.error
					? Number(count(summary.data.getFavoriteResorts)) + Number(count(summary.data.getFavoriteEquipments))
					: '\u2014',
			icon: FavoriteBorder,
			caption: 'Saved resorts & equipment',
		},
		{
			id: 'myArticles',
			label: 'My Articles',
			value: count(summary.data?.getBoardArticles),
			icon: ArticleOutlined,
			caption: 'Community guides',
		},
		{
			id: 'myComments',
			label: 'My Comments',
			value: summary.error ? '\u2014' : summary.data?.getMember.memberComments ?? '\u2014',
			icon: ChatBubbleOutline,
			caption: 'Recorded contributions',
		},
	];
	const nav = [
		{ id: 'overview', label: 'Overview', icon: DashboardOutlined },
		{ id: 'myProfile', label: 'Profile', icon: PersonOutline },
		...stats.map(({ id, label, icon }) => ({ id, label, icon })),
		{ id: 'recentlyVisited', label: 'Recently Visited', icon: HistoryOutlined },
		...(user.memberType === 'USER' || user.memberType === 'INSTRUCTOR'
			? [
					{
						id: 'instructor',
						label: user.memberType === 'INSTRUCTOR' ? 'Instructor profile' : 'Apply as Instructor',
						icon: SchoolOutlined,
					},
			  ]
			: []),
	];
	const href = (id: string) => `/mypage?category=${id}`;
	if (!ready || !user._id) return null;
	const section = (id: string, content: React.ReactNode) =>
		(overview || category === id) && (
			<section id={`account-${id}`} className={`account-section account-${id}`}>
				{content}
			</section>
		);
	return (
		<div className="account-dashboard snowkr-container">
			<header className="account-identity">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={homeImageUrl(user.memberImage) || '/img/profile/defaultUser.svg'}
					alt={user.memberNick}
					onError={(event) => {
						event.currentTarget.onerror = null;
						event.currentTarget.src = '/img/profile/defaultUser.svg';
					}}
				/>
				<div className="account-identity-copy">
					<div className="account-name">
						<h1>{user.memberFullName || user.memberNick}</h1>
						<span>@{user.memberNick}</span>
						<b>{t(user.memberType)}</b>
					</div>
					<p>{user.memberDesc || t('Your next winter adventure starts here.')}</p>
					<div className="account-meta">
						<span>
							<PeopleOutline /> {stats[0].value} {t('Followers')}
						</span>
						<span>
							{stats[1].value} {t('Following')}
						</span>
						{summary.data && (
							<span>
								<CalendarTodayOutlined /> {t('Joined')}{' '}
								{new Date(summary.data.getMember.createdAt).toLocaleDateString(
									router.locale === 'kr' ? 'ko-KR' : router.locale,
									{ month: 'short', year: 'numeric' },
								)}
							</span>
						)}
					</div>
				</div>
				<Button component={Link} href={href('myProfile')} variant="outlined" startIcon={<EditOutlined />}>
					{t('Edit Profile')}
				</Button>
			</header>
			<div className="account-layout">
				<aside className="account-navigation">
					<p>{t('Account navigation')}</p>
					<nav aria-label={t('Account navigation')}>
						{nav.map(({ id, label, icon: Icon }) => (
							<Link
								passHref
								key={id}
								href={href(id)}
								className={category === id ? 'active' : ''}
								aria-current={category === id ? 'page' : undefined}
							>
								<Icon />
								<span>{t(label)}</span>
								{stats.find((stat) => stat.id === id) && <small>{stats.find((stat) => stat.id === id)?.value}</small>}
							</Link>
						))}
						{user.memberType === 'ADMIN' && (
							<Link passHref href="/_admin/users">
								<DashboardOutlined />
								{t('Administration')}
							</Link>
						)}
					</nav>
					<button className="account-logout" onClick={logOut}>
						<Logout />
						{t('Sign Out')}
					</button>
				</aside>
				<main className="account-content">
					{summary.error && (
						<Alert severity="error" action={<Button onClick={() => void summary.refetch()}>{t('Retry')}</Button>}>
							{t('Unable to load account summary')}
						</Alert>
					)}
					<div className="account-stats" aria-busy={summary.loading}>
						{stats.map(({ id, label, value, icon: Icon, caption }) => (
							<Link passHref href={href(id)} key={id} className="account-stat">
								<div>
									{t(label)}
									<Icon />
								</div>
								<strong>{value}</strong>
								<small>{t(caption)}</small>
							</Link>
						))}
					</div>
					{overview && (
						<>
							{user.memberType === 'USER' && (
								<div className="account-instructor-banner">
									<div>
										<small>{t('SHARE YOUR PASSION FOR WINTER')}</small>
										<h2>{t('Become an Accredited SNOWAY Instructor')}</h2>
										<p>{t('Guide fellow riders across Korea’s slopes. Apply to join our instructor community.')}</p>
									</div>
									<Button component={Link} href={href('instructor')} variant="contained" startIcon={<SchoolOutlined />}>
										{t('Apply Now')}
									</Button>
								</div>
							)}
							<div className="account-highlights">
								<section className="account-section">
									<h2>
										<HistoryOutlined />
										{t('Your Winter Activity')}
									</h2>
									<Link passHref href={href('recentlyVisited')}>
										{t('Recently visited resorts & equipment')}
										<span>→</span>
									</Link>
									<Link passHref href={href('myArticles')}>
										{t('Your published community guides')}
										<span>→</span>
									</Link>
									<Link passHref href={href('myFavorites')}>
										{t('Your saved winter favorites')}
										<span>→</span>
									</Link>
								</section>
								<section className="account-section">
									<h2>
										<CalendarTodayOutlined />
										{t('Upcoming Gear Booking')}
									</h2>
									<p>
										{t(
											'Gear booking is not available yet. Explore equipment and save your favorites for your next trip.',
										)}
									</p>
									<Button component={Link} href="/equipment" variant="outlined">
										{t('Explore Equipment')}
									</Button>
								</section>
							</div>
						</>
					)}
					{section('myProfile', <MyProfile />)}
					{section('followers', <MemberFollows {...follows} />)}
					{section('followings', <MemberFollows {...follows} following />)}
					{section('myFavorites', <MyFavorites />)}
					{section('myArticles', <MyArticles onChanged={() => summary.refetch()} />)}
					{section(
						'myComments',
						<>
							<h2>{t('My Comments')}</h2>
							<p>
								{t(
									'Comments are available on the resort, equipment, instructor, and community pages where you posted them. A personal comment history is not available yet.',
								)}
							</p>
							<Button component={Link} href="/community">
								{t('Explore Community')}
							</Button>
						</>,
					)}
					{(user.memberType === 'USER' || user.memberType === 'INSTRUCTOR') &&
						section('instructor', <InstructorWorkflow />)}
					{category === 'recentlyVisited' && (
						<section className="account-section">
							<RecentlyVisited />
						</section>
					)}
					{category === 'writeArticle' && (
						<section className="account-section">
							<WriteArticle />
						</section>
					)}
					{category === 'demoOrders' && (
						<section className="account-section">
							<DemoOrders />
						</section>
					)}
				</main>
			</div>
		</div>
	);
};
export default withLayoutBasic(MyPage);
