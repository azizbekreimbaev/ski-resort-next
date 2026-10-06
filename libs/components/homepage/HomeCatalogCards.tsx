import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Chip, IconButton } from '@mui/material';
import { useApolloClient, useMutation, useReactiveVar } from '@apollo/client';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import { useTranslation } from 'next-i18next';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { ResortSearchResult } from '../../types/resort/resort';
import { CatalogMember } from '../../types/catalog';
import { EquipmentPreview } from '../../types/equipment/equipment';
import useCatalogFavorite from '../../hooks/useCatalogFavorite';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import { EquipmentImage } from './EquipmentCard';
import { InstructorImage } from './InstructorCard';
import { homeImageUrl, homePrice } from './homeUtils';
import { homeRegionLabel } from './homeSearchOptions';
import { parseTravelDates } from '../../resortSearch';

function HomeViews({ count, compact = false, suffix = false }: { count: number; compact?: boolean; suffix?: boolean }) {
	const { t, i18n } = useTranslation('common');
	const locale = i18n.language === 'kr' ? 'ko-KR' : i18n.language;
	const formatted = new Intl.NumberFormat(
		locale,
		compact ? { notation: 'compact', maximumFractionDigits: 1 } : {},
	).format(count);
	return (
		<span className="home-card-views" aria-label={`${formatted} ${t('Views')}`}>
			<VisibilityOutlinedIcon />
			{formatted}
			{suffix ? ` ${t('views')}` : ''}
		</span>
	);
}

export function HomeResortCard({
	resort,
	pending,
	onFavorite,
	tripDates,
}: {
	resort: ResortSearchResult;
	pending: boolean;
	onFavorite: (id: string) => Promise<void>;
	tripDates?: ReturnType<typeof parseTravelDates>;
}) {
	const { t, i18n } = useTranslation('common');
	const href = `/resort/detail?${new URLSearchParams({ id: resort._id, ...(tripDates?.arrival ? tripDates : {}) })}`;
	const liked = resort.meLiked?.some((item) => item.myFavorite) ?? false;
	return (
		<article className="home-preview-card home-resort-preview">
			<div className="home-preview-photo">
				<Link href={href} className="home-resort-photo-link">
					<img
						src={homeImageUrl(resort.resortImages[0]) || '/img/hero/winter-1.jpg'}
						alt={resort.resortTitle}
						loading="lazy"
						onError={(event) => {
							if (!event.currentTarget.src.endsWith('/img/hero/winter-1.jpg'))
								event.currentTarget.src = '/img/hero/winter-1.jpg';
						}}
					/>
					<div className="home-photo-caption">
						<span title={t(resort.resortLocation)}>{t(homeRegionLabel(resort.resortLocation))}</span>
						<h3>{resort.resortTitle}</h3>
					</div>
				</Link>
				<IconButton
					className="home-save-button"
					aria-label={`${t(liked ? 'Remove favorite' : 'Save favorite')}: ${resort.resortTitle}`}
					aria-pressed={liked}
					disabled={pending}
					onClick={() => void onFavorite(resort._id)}
				>
					{liked ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
				</IconButton>
				{resort.resortStatus === 'SOLD_OUT' && (
					<Chip className="home-sold-out" size="small" color="warning" label={t('Sold out')} />
				)}
			</div>
			<div className="home-preview-body">
				<div className="home-preview-facts">
					<span>{t('Minimum stay', { count: resort.resortMinDays })}</span>
				</div>
				<div className="home-resort-social">
					<HomeViews count={resort.resortViews} suffix />
					<span aria-label={`${resort.resortLikes.toLocaleString()} ${t('Likes')}`}>
						<FavoriteBorderRoundedIcon />
						{resort.resortLikes.toLocaleString()} {t('Likes')}
					</span>
					<span aria-label={`${(resort.resortComments ?? 0).toLocaleString()} ${t('Comments')}`}>
						<ChatBubbleOutlineRoundedIcon />
						{(resort.resortComments ?? 0).toLocaleString()} {t('Comments')}
					</span>
				</div>
				<div className="home-preview-tags">
					{resort.resortLevel && (
						<Chip
							className="home-level-tag"
							size="small"
							label={t(
								resort.resortLevel === 'BEGINNER'
									? 'Beginner Friendly'
									: resort.resortLevel === 'MIXED'
									? 'All Levels'
									: resort.resortLevel,
							)}
						/>
					)}
					{resort.resortFacilities?.slice(0, 2).map((facility) => (
						<Chip key={facility} size="small" label={t(facility)} />
					))}
				</div>
				<div className="home-preview-bottom">
					<div>
						<small>{t('Resort price per day')}</small>
						<strong>{homePrice(resort.resortPricePerDay, i18n.language)}</strong>
					</div>
					<Button className="home-details-button" component={Link} href={href}>
						{t('Details')}
					</Button>
				</div>
			</div>
		</article>
	);
}

export function HomeInstructorCard({ instructor }: { instructor: CatalogMember }) {
	const { t, i18n } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const client = useApolloClient();
	const [likeMember] = useMutation(LIKE_TARGET_MEMBER);
	const [followMember] = useMutation(SUBSCRIBE);
	const [unfollowMember] = useMutation(UNSUBSCRIBE);
	const lock = useRef(false);
	const [pending, setPending] = useState(false);
	const [failure, setFailure] = useState('');
	const href = `/instructor/detail?instructorId=${encodeURIComponent(instructor._id)}`;
	const liked = instructor.meLiked?.some((item) => item.myFavorite) ?? false;
	const followed = instructor.meFollowed?.some((item) => item.myFollowing) ?? false;
	const own = user._id === instructor._id;
	const social = async (follow: boolean) => {
		if (lock.current || own) return;
		if (!user._id) {
			await sweetMixinErrorAlert(t('Please login first!'));
			return;
		}
		lock.current = true;
		setPending(true);
		try {
			await (follow ? (followed ? unfollowMember : followMember) : likeMember)({
				variables: { input: instructor._id },
			});
			const names = ['GetInstructors', 'GetInstructor', 'GetMember', 'GetMemberFollowers', 'GetMemberFollowings'];
			const active = Array.from(client.getObservableQueries('active').values())
				.map((query) => query.queryName)
				.filter((name): name is string => Boolean(name && names.includes(name)));
			await client.refetchQueries({ include: Array.from(new Set(active)) });
			setFailure('');
		} catch {
			setFailure(t('Unable to update profile interaction'));
		} finally {
			lock.current = false;
			setPending(false);
		}
	};
	const prices = [
		instructor.instructorPrice1Week,
		instructor.instructorPrice2Weeks,
		instructor.instructorPrice3Weeks,
		instructor.instructorPrice4Weeks,
	];
	const priceIndex = prices.findIndex((price) => price != null);
	const price = prices[priceIndex];
	return (
		<article className="home-preview-card home-instructor-preview">
			<div className="home-instructor-photo">
				<Link href={href}>
					<InstructorImage instructor={instructor} />
				</Link>
				<span className="home-instructor-badge">{t('Instructor')}</span>
				<IconButton
					className="home-save-button"
					aria-label={`${t(liked ? 'Unlike' : 'Like')}: ${instructor.memberNick}`}
					aria-pressed={liked}
					disabled={pending || own}
					onClick={() => void social(false)}
				>
					{liked ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
				</IconButton>
			</div>
			<div className="home-instructor-name-row">
				<h3>
					<Link href={href}>{instructor.memberFullName || instructor.memberNick}</Link>
				</h3>
				<Button
					className="home-follow-button"
					variant="outlined"
					startIcon={<PersonAddAltOutlinedIcon />}
					aria-pressed={followed}
					disabled={pending || own}
					onClick={() => void social(true)}
				>
					{t(followed ? 'Unfollow' : 'Follow')}
				</Button>
			</div>
			<p className="home-instructor-specialty">
				{instructor.instructorLevel ? t(`Instructor level ${instructor.instructorLevel}`) : t('Instructor')}
			</p>
			<div className="home-instructor-price">
				<div>
					{price != null ? (
						<>
							<strong>{homePrice(price, i18n.language)}</strong>
							<span> / {t('Card weeks', { count: priceIndex + 1 })}</span>
						</>
					) : (
						<span>{t('Price not specified')}</span>
					)}
				</div>
				<HomeViews count={instructor.memberViews} compact />
			</div>
			<Button className="home-instructor-view" component={Link} href={href} fullWidth>
				{t('View Instructor')}
			</Button>
			{failure && <Alert severity="error">{failure}</Alert>}
		</article>
	);
}

export function HomeEquipmentCard({ equipment }: { equipment: EquipmentPreview }) {
	const { t, i18n } = useTranslation('common');
	const favorite = useCatalogFavorite('equipment');
	const href = `/equipment/detail?id=${encodeURIComponent(equipment._id)}`;
	const liked = equipment.meLiked?.some((item) => item.myFavorite) ?? false;
	const rate = equipment.equipmentRentalRates.reduce<EquipmentPreview['equipmentRentalRates'][number] | undefined>(
		(lowest, item) => (!lowest || item.price < lowest.price ? item : lowest),
		undefined,
	);
	return (
		<article className="home-preview-card home-equipment-preview">
			<div className="home-preview-photo">
				<Link href={href}>
					<EquipmentImage equipment={equipment} />
				</Link>
				<span className={`home-equipment-badge${equipment.equipmentPurchasable ? ' can-buy' : ''}`}>
					{t(equipment.equipmentPurchasable ? 'Rent & Buy' : 'Rent')}
				</span>
				<IconButton
					className="home-save-button"
					aria-label={`${t(liked ? 'Remove favorite' : 'Save favorite')}: ${equipment.equipmentName}`}
					aria-pressed={liked}
					disabled={favorite.pending.has(equipment._id)}
					onClick={() => void favorite.toggle(equipment._id)}
				>
					{liked ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
				</IconButton>
			</div>
			<div className="home-preview-body">
				<div className="home-equipment-category">
					<span>{t(equipment.equipmentCategory)}</span>
					<HomeViews count={equipment.equipmentViews ?? 0} />
				</div>
				<h3>
					<Link href={href}>{equipment.equipmentName}</Link>
				</h3>
				<div className="home-equipment-rates">
					<p>
						<span>{t('Rent')}:</span>{' '}
						{rate ? (
							<>
								<strong>{homePrice(rate.price, i18n.language)}</strong>
								<small> / {t('Card hours', { count: rate.durationHours })}</small>
							</>
						) : (
							t('No rental packages listed')
						)}
					</p>
					{equipment.equipmentPurchasable ? (
						<p>
							<span>{t('Buy')}:</span>{' '}
							{equipment.equipmentPurchasePrice != null ? (
								<b>{homePrice(equipment.equipmentPurchasePrice, i18n.language)}</b>
							) : (
								t('Price not specified')
							)}
						</p>
					) : (
						<p className="home-rental-only">{t('Rental only')}</p>
					)}
				</div>
				<div className={`home-equipment-actions${!equipment.equipmentPurchasable ? ' rental-only' : ''}`}>
					<Button className="home-equipment-details" component={Link} href={href} variant="outlined">
						{t('Details')}
					</Button>
					<Button className="home-equipment-rent" component={Link} href={href} title={t('View rental packages')}>
						{t('Rent')}
					</Button>
					{equipment.equipmentPurchasable && (
						<Button
							className="home-equipment-buy"
							component={Link}
							href={href}
							variant="contained"
							title={t('View purchase option')}
						>
							{t('Buy')}
						</Button>
					)}
				</div>
			</div>
		</article>
	);
}
