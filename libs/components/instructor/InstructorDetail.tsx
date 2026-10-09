import React, { useEffect, useRef, useState } from 'react';
import Seo from '../common/Seo';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Button } from '@mui/material';
import Badge from '@mui/icons-material/Badge';
import ChevronRight from '@mui/icons-material/ChevronRight';
import DownhillSkiing from '@mui/icons-material/DownhillSkiing';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import LocationOn from '@mui/icons-material/LocationOn';
import Schedule from '@mui/icons-material/Schedule';
import Translate from '@mui/icons-material/Translate';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import Visibility from '@mui/icons-material/Visibility';
import { useTranslation } from 'next-i18next';
import { GET_INSTRUCTOR, GET_RESORT } from '../../../apollo/user/query';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { CatalogMember } from '../../types/catalog';
import { ResortSearchResult } from '../../types/resort/resort';
import { validId } from '../../catalogSearch';
import { InstructorImage } from '../homepage/InstructorCard';
import { homeImageUrl } from '../homepage/homeUtils';
import HomeCollectionState from '../homepage/HomeCollectionState';
import ResourceComments from '../common/ResourceComments';
import InstructorPackagePanel from './InstructorPackagePanel';

function InstructorResort({ id }: { id: string }) {
	const { t } = useTranslation('common');
	const { data, loading, error, refetch } = useQuery<{ getResort: ResortSearchResult }>(GET_RESORT, {
		variables: { resortId: id },
		skip: !validId(id),
	});
	const resort = data?.getResort;
	return (
		<section className="instructor-detail-card">
			<h2>
				<DownhillSkiing />
				{t('Instructor Resort')}
			</h2>
			{loading ? (
				<HomeCollectionState loading error={false} empty={false} retry={refetch} />
			) : error || !resort ? (
				<Alert severity="info">
					{t('Associated resort is unavailable')}{' '}
					<Button onClick={() => void refetch().catch(() => undefined)}>{t('Retry')}</Button>
				</Alert>
			) : (
				<div className="instructor-resort-row">
					<Image
						width={80}
						height={80}
						unoptimized
						src={homeImageUrl(resort.resortImages[0]) || '/img/hero/winter-2.jpg'}
						alt={resort.resortTitle}
						onError={(event) => {
							event.currentTarget.onerror = null;
							event.currentTarget.src = '/img/hero/winter-2.jpg';
						}}
					/>
					<div>
						<h3>{resort.resortTitle}</h3>
						<p>
							<LocationOn />
							{t(resort.resortLocation)} · {resort.resortAddress}
						</p>
						<small>{t('Primary base resort')}</small>
					</div>
					<Link href={'/resort/detail?id=' + encodeURIComponent(resort._id)} passHref>
						{t('View Resort')} <ChevronRight />
					</Link>
				</div>
			)}
		</section>
	);
}

export default function InstructorDetail() {
	const router = useRouter();
	const { t, i18n } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const id = router.query.instructorId;
	const valid = validId(id);
	const { data, loading, error, refetch } = useQuery<{ getMember: CatalogMember }>(GET_INSTRUCTOR, {
		variables: { memberId: id },
		skip: !router.isReady || !valid,
		fetchPolicy: 'network-only',
	});
	const previousUser = useRef(user._id);
	useEffect(() => {
		if (previousUser.current !== user._id) {
			previousUser.current = user._id;
			if (valid) void refetch().catch(() => undefined);
		}
	}, [user._id, valid, refetch]);
	const [like, likeState] = useMutation(LIKE_TARGET_MEMBER);
	const [follow, followState] = useMutation(SUBSCRIBE);
	const [unfollow, unfollowState] = useMutation(UNSUBSCRIBE);
	const [failure, setFailure] = useState('');
	const lock = useRef(false);
	const instructor = data?.getMember;
	const pending = likeState.loading || followState.loading || unfollowState.loading;
	const social = async (following: boolean) => {
		if (!user._id || !instructor || pending || lock.current) return;
		lock.current = true;
		try {
			const mutate = following ? (instructor.meFollowed?.some((item) => item.myFollowing) ? unfollow : follow) : like;
			await mutate({ variables: { input: instructor._id } });
			await refetch();
			setFailure('');
		} catch {
			setFailure(t('Unable to update profile interaction'));
		} finally {
			lock.current = false;
		}
	};
	if (!router.isReady || (loading && !data))
		return (
			<div className="instructor-detail">
				<HomeCollectionState loading error={false} empty={false} retry={refetch} />
			</div>
		);
	if (!valid || error || !instructor || instructor.memberType !== 'INSTRUCTOR' || instructor.memberStatus !== 'ACTIVE')
		return (
			<div className="instructor-detail">
				<Alert severity="error">{t('This resource is unavailable')}</Alert>
				{valid && <Button onClick={() => void refetch().catch(() => undefined)}>{t('Retry')}</Button>}
				<Button component={Link} href="/instructor">
					{t('Back to catalog')}
				</Button>
			</div>
		);
	const name = instructor.memberFullName || instructor.memberNick;
	const liked = instructor.meLiked?.some((item) => item.myFavorite) ?? false;
	const level = instructor.instructorLevel ? t(`Instructor level ${instructor.instructorLevel}`) : t('Not specified');
	const audience = instructor.instructorAudience ? t(`Audience ${instructor.instructorAudience}`) : t('Not specified');
	const experience =
		instructor.instructorExperienceYears == null
			? t('Not specified')
			: t('Instructor experience', { count: instructor.instructorExperienceYears });
	const languages = instructor.instructorLanguages?.join(' · ') || t('Not specified');
	return (
		<div className="instructor-detail">
			<Seo title={name + ' | SNOWAY'} summary={undefined} />
			<nav className="instructor-breadcrumb" aria-label={t('Breadcrumb')}>
				<Link href="/">{t('Home')}</Link>
				<ChevronRight />
				<Link href="/instructor">{t('Instructors')}</Link>
				<ChevronRight />
				<span>{name}</span>
			</nav>
			<section className="instructor-detail-hero instructor-detail-card">
				<div className="instructor-detail-portrait">
					<InstructorImage instructor={instructor} />
					<button
						className="instructor-like"
						aria-label={t(liked ? 'Unlike' : 'Like')}
						aria-pressed={liked}
						disabled={!user._id || pending}
						title={!user._id ? t('Sign in to like') : undefined}
						onClick={() => void social(false)}
					>
						{liked ? <Favorite /> : <FavoriteBorder />}
					</button>
					<span className="instructor-portrait-label">
						<DownhillSkiing />
						{t('Registered SNOWAY Coach')}
					</span>
				</div>
				<div className="instructor-detail-intro">
					<div>
						<div className="instructor-detail-tags">
							<span>{level}</span>
							<span>{audience}</span>
						</div>
						<h1>{name}</h1>
						<div className="instructor-detail-meta">
							<span>
								<Schedule />
								{experience}
							</span>
							<span>
								<Translate />
								{languages}
							</span>
						</div>
						<p className="instructor-detail-bio">
							{instructor.memberDesc || t('This instructor has not added a bio yet.')}
						</p>
						{user._id !== instructor._id && (
							<Button
								className="instructor-follow"
								variant="outlined"
								disabled={!user._id || pending}
								onClick={() => void social(true)}
							>
								{t(instructor.meFollowed?.some((item) => item.myFollowing) ? 'Unfollow' : 'Follow')}
							</Button>
						)}
					</div>
					<div className="instructor-detail-stats">
						<span>
							<Visibility />
							{instructor.memberViews.toLocaleString(i18n.language === 'kr' ? 'ko-KR' : i18n.language)} {t('Views')}
						</span>
						<span>
							<Favorite />
							{instructor.memberLikes.toLocaleString(i18n.language === 'kr' ? 'ko-KR' : i18n.language)} {t('Likes')}
						</span>
						<small>
							<VerifiedUser />
							{t('Registered SNOWAY Coach')}
						</small>
					</div>
				</div>
			</section>
			{failure && <Alert severity="error">{failure}</Alert>}
			<div className="instructor-detail-grid">
				<div className="instructor-detail-content">
					<section className="instructor-detail-card">
						<h2>
							<Badge />
							{t('Instructor Information')}
						</h2>
						<dl className="instructor-detail-facts">
							{[
								[t('Level'), level],
								[t('Audience'), audience],
								[t('Experience'), experience],
								[t('Languages'), languages],
							].map(([label, value]) => (
								<div key={label}>
									<dt>{label}</dt>
									<dd>{value}</dd>
								</div>
							))}
						</dl>
						<h3>
							{t('About')} {name}
						</h3>
						<p className="instructor-about">{instructor.memberDesc || t('This instructor has not added a bio yet.')}</p>
					</section>
					{instructor.instructorResortId ? (
						<InstructorResort key={instructor.instructorResortId} id={instructor.instructorResortId} />
					) : (
						<section className="instructor-detail-card">
							<h2>
								<DownhillSkiing />
								{t('Instructor Resort')}
							</h2>
							<p>{t('No base resort specified.')}</p>
						</section>
					)}
					<section className="instructor-detail-card instructor-detail-comments">
						<ResourceComments key={instructor._id} id={instructor._id} group="MEMBER" variant="instructor" />
					</section>
				</div>
				<InstructorPackagePanel key={instructor._id} instructor={instructor} />
			</div>
		</div>
	);
}
