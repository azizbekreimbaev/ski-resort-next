import React, { useCallback, useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Button, Chip, Dialog, IconButton, Skeleton, Stack } from '@mui/material';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import DownhillSkiingRoundedIcon from '@mui/icons-material/DownhillSkiingRounded';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import LocalCafeOutlinedIcon from '@mui/icons-material/LocalCafeOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import LocalParkingOutlinedIcon from '@mui/icons-material/LocalParkingOutlined';
import DirectionsBusOutlinedIcon from '@mui/icons-material/DirectionsBusOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import TerrainOutlinedIcon from '@mui/icons-material/TerrainOutlined';
import { useTranslation } from 'next-i18next';
import { GET_RESORT } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { ResortSearchResult } from '../../types/resort/resort';
import { ResortFacilities } from '../../enums/resort.enum';
import { validId } from '../../catalogSearch';
import { parseTravelDates } from '../../resortSearch';
import useCatalogFavorite from '../../hooks/useCatalogFavorite';
import { homeImageUrl } from '../homepage/homeUtils';
import TopInstructors from '../homepage/TopInstructors';
import ResourceComments from '../common/ResourceComments';
import DemoBookingPanel from '../common/DemoBookingPanel';

const facilityIcons = {
	SKI_LIFT: TerrainOutlinedIcon,
	EQUIPMENT_RENTAL: DownhillSkiingRoundedIcon,
	SKI_SCHOOL: SchoolOutlinedIcon,
	RESTAURANT: RestaurantOutlinedIcon,
	CAFE: LocalCafeOutlinedIcon,
	ACCOMMODATION: HotelOutlinedIcon,
	PARKING: LocalParkingOutlinedIcon,
	SHUTTLE_BUS: DirectionsBusOutlinedIcon,
	LOCKER: LockOutlinedIcon,
	FIRST_AID: MedicalServicesOutlinedIcon,
	SLED_PARK: DownhillSkiingRoundedIcon,
};

function ResortPhotos({ resort }: { resort: ResortSearchResult }) {
	const { t } = useTranslation('common');
	const favorite = useCatalogFavorite('resort');
	const [photo, setPhoto] = useState<number | null>(null);
	const sources = resort.resortImages.filter(Boolean);
	const liked = resort.meLiked?.some((item) => item.myFavorite) ?? false;
	const image = (index: number) => (
		<img
			src={homeImageUrl(sources[index])}
			alt={`${resort.resortTitle} — ${t('Image')} ${index + 1}`}
			onError={(event) => {
				event.currentTarget.style.visibility = 'hidden';
			}}
		/>
	);
	return (
		<>
			<div className={`resort-detail-gallery photos-${Math.min(sources.length, 3)}`}>
				{sources.length ? (
					sources.slice(0, 3).map((_source, index) => (
						<button
							type="button"
							className={`resort-detail-photo photo-${index}`}
							key={index}
							onClick={() => setPhoto(index)}
							aria-label={`${t('Open gallery')}: ${t('Image')} ${index + 1}`}
						>
							{image(index)}
						</button>
					))
				) : (
					<div className="resort-detail-no-photo">
						<PhotoLibraryOutlinedIcon />
						<span>{t('Resort photos unavailable')}</span>
					</div>
				)}
				<IconButton
					className="resort-detail-favorite"
					aria-label={t(liked ? 'Remove favorite' : 'Save favorite')}
					aria-pressed={liked}
					disabled={favorite.pending.has(resort._id)}
					onClick={() => void favorite.toggle(resort._id)}
				>
					{liked ? <FavoriteRoundedIcon color="error" /> : <FavoriteBorderRoundedIcon />}
				</IconButton>
				{resort.resortLevel && <span className="resort-photo-level">{t(resort.resortLevel)}</span>}
				{sources.length > 0 && (
					<Button
						className="resort-detail-all-photos"
						startIcon={<PhotoLibraryOutlinedIcon />}
						onClick={() => setPhoto(0)}
					>
						{t('View all resort photos', { count: sources.length })}
					</Button>
				)}
			</div>
			<Dialog
				open={photo !== null}
				onClose={() => setPhoto(null)}
				maxWidth="lg"
				fullWidth
				aria-label={t('Open gallery')}
			>
				<Stack className="resort-photo-dialog" p={2} spacing={2}>
					<Button onClick={() => setPhoto(null)}>{t('Close')}</Button>
					{photo !== null && image(photo)}
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Button
							disabled={photo === null || photo === 0}
							onClick={() => setPhoto((current) => Math.max(0, (current ?? 0) - 1))}
						>
							{t('Previous')}
						</Button>
						<span>
							{(photo ?? 0) + 1} / {sources.length}
						</span>
						<Button
							disabled={photo === null || photo >= sources.length - 1}
							onClick={() => setPhoto((current) => Math.min(sources.length - 1, (current ?? 0) + 1))}
						>
							{t('Next')}
						</Button>
					</Stack>
				</Stack>
			</Dialog>
		</>
	);
}

export default function ResortDetail() {
	const router = useRouter();
	const { t, i18n } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const id = router.query.id;
	const valid = validId(id);
	const dates = parseTravelDates(router.query.arrival, router.query.departure);
	const catalogHref = `/resort${dates.arrival ? `?${new URLSearchParams(dates)}` : ''}`;
	const { data, loading, error, refetch } = useQuery<{ getResort: ResortSearchResult }, { resortId: string }>(
		GET_RESORT,
		{
			variables: { resortId: valid ? id : '' },
			skip: !router.isReady || !valid,
			fetchPolicy: 'network-only',
			notifyOnNetworkStatusChange: true,
		},
	);
	const previousUser = useRef(user._id);
	useEffect(() => {
		if (previousUser.current !== user._id) {
			previousUser.current = user._id;
			if (router.isReady && valid) void refetch().catch(() => undefined);
		}
	}, [user._id, router.isReady, valid, refetch]);
	const [shareMessage, setShareMessage] = useState('');
	const shareTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => {
		setShareMessage('');
		return () => {
			if (shareTimer.current !== null) clearTimeout(shareTimer.current);
		};
	}, [id]);
	const [commentCount, setCommentCount] = useState<{ id: string; total: number } | null>(null);
	const updateCommentCount = useCallback(
		(total: number) => {
			if (validId(id)) setCommentCount({ id, total });
		},
		[id],
	);
	const share = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setShareMessage(t('Resort link copied'));
		} catch {
			setShareMessage(t('Unable to copy resort link'));
		}
		if (shareTimer.current !== null) clearTimeout(shareTimer.current);
		shareTimer.current = setTimeout(() => setShareMessage(''), 3000);
	};
	if (!router.isReady || (valid && loading && !data))
		return (
			<div className="resort-detail-page">
				<div
					className="resort-detail-container resort-detail-loading"
					role="status"
					aria-label={t('Loading collection')}
				>
					<Skeleton width="50%" height={40} />
					<Skeleton variant="rectangular" height={460} />
					<Skeleton width="70%" height={80} />
				</div>
			</div>
		);
	const resort = data?.getResort;
	if (!valid || error || !resort || resort._id !== id || resort.resortStatus === 'DELETE')
		return (
			<div className="resort-detail-page">
				<Stack className="resort-detail-container resort-detail-loading" spacing={2}>
					<Alert severity="error">{t('This resource is unavailable')}</Alert>
					{valid && <Button onClick={() => void refetch().catch(() => undefined)}>{t('Retry')}</Button>}
					<Button component={Link} href={catalogHref}>
						{t('Back to catalog')}
					</Button>
				</Stack>
			</div>
		);
	const count = (value: number) =>
		new Intl.NumberFormat(i18n.language === 'kr' ? 'ko-KR' : i18n.language).format(value);
	return (
		<div className="resort-detail-page">
			<Head>
				<title>{resort.resortTitle} | SNOWKR</title>
			</Head>
			<div className="resort-detail-container">
				<div className="resort-detail-topbar">
					<nav aria-label={t('Resort breadcrumb')}>
						<Link href={catalogHref}>{t('Resorts')}</Link>
						<span aria-hidden="true">/</span>
						<span>{t(resort.resortLocation)}</span>
						<span aria-hidden="true">/</span>
						<strong>{resort.resortTitle}</strong>
					</nav>
					<Button startIcon={<ShareOutlinedIcon />} onClick={() => void share()}>
						{t('Share')}
					</Button>
				</div>
				{shareMessage && (
					<Alert severity="info" role="status">
						{shareMessage}
					</Alert>
				)}
				<ResortPhotos key={resort._id} resort={resort} />
				<div className="resort-detail-columns">
					<div className="resort-detail-information">
						<section className="resort-detail-panel resort-detail-title">
							<div className="resort-detail-tags">
								<Chip size="small" label={t(resort.resortLocation)} />
								{resort.resortLevel && <Chip size="small" label={t(resort.resortLevel)} />}
							</div>
							<h1>{resort.resortTitle}</h1>
							<p className="resort-detail-address">
								<LocationOnOutlinedIcon />
								{resort.resortAddress}
							</p>
							<div className="resort-detail-counters">
								<span>
									<VisibilityOutlinedIcon />
									<strong>{count(resort.resortViews)}</strong> {t('Views')}
								</span>
								<span>
									<FavoriteBorderRoundedIcon />
									<strong>{count(resort.resortLikes)}</strong> {t('Likes')}
								</span>
								<a href="#resort-comments">
									<ChatBubbleOutlineRoundedIcon />
									<strong>
										{count(commentCount?.id === resort._id ? commentCount.total : resort.resortComments ?? 0)}
									</strong>{' '}
									{t('Comments')}
								</a>
							</div>
							{resort.resortStatus === 'SOLD_OUT' && <Alert severity="info">{t('Sold out')}</Alert>}
						</section>
						<section className="resort-detail-panel">
							<h2>{t('About this resort')}</h2>
							<p className="resort-detail-description">
								{resort.resortDesc?.trim() || t('Resort description unavailable')}
							</p>
						</section>
						<section className="resort-detail-panel">
							<h2>{t('Resort facilities')}</h2>
							{resort.resortFacilities?.length ? (
								<div className="resort-detail-facilities">
									{resort.resortFacilities.map((facility: ResortFacilities) => {
										const Icon = facilityIcons[facility];
										return (
											<div className="resort-detail-facility" key={facility}>
												<span>
													<Icon />
												</span>
												<strong>{t(facility)}</strong>
											</div>
										);
									})}
								</div>
							) : (
								<p>{t('Resort facilities unavailable')}</p>
							)}
						</section>
					</div>
					<aside className="resort-detail-booking">
						<DemoBookingPanel key={`${id}-${dates.arrival}-${dates.departure}`} resort={resort} initialDates={dates} />
					</aside>
				</div>
				<div className="resort-detail-instructors home-refreshed skiresort-home">
					<TopInstructors />
				</div>
				<section id="resort-comments" className="resort-detail-panel resort-detail-comments">
					<ResourceComments
						key={resort._id}
						id={resort._id}
						group="RESORT"
						onChange={() => refetch()}
						onTotalChange={updateCommentCount}
					/>
				</section>
			</div>
		</div>
	);
}
