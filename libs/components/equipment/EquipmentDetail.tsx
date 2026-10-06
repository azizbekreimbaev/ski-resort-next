import React, { useCallback, useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Button, Dialog, IconButton, Skeleton, Stack } from '@mui/material';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useTranslation } from 'next-i18next';
import { GET_EQUIPMENT, GET_RESORT } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { EquipmentPreview } from '../../types/equipment/equipment';
import { ResortSearchResult } from '../../types/resort/resort';
import { EquipmentCategory } from '../../enums/equipment.enum';
import { validId } from '../../catalogSearch';
import useCatalogFavorite from '../../hooks/useCatalogFavorite';
import { homeImageUrl } from '../homepage/homeUtils';
import ResourceComments from '../common/ResourceComments';
import EquipmentActionDesk from './EquipmentActionDesk';

function EquipmentPhoto({ source, title }: { source: string; title: string }) {
	const { t } = useTranslation('common');
	const [failed, setFailed] = useState(false);
	useEffect(() => setFailed(false), [source]);
	return source && !failed ? (
		// eslint-disable-next-line @next/next/no-img-element
		<img src={source} alt={title} onError={() => setFailed(true)} />
	) : (
		<div className="equipment-photo-unavailable">
			<PhotoLibraryOutlinedIcon />
			<span>{t('Equipment photos unavailable')}</span>
		</div>
	);
}

function EquipmentPhotos({ equipment }: { equipment: EquipmentPreview }) {
	const { t } = useTranslation('common');
	const favorite = useCatalogFavorite('equipment');
	const sources = (equipment.equipmentImages ?? []).map(homeImageUrl).filter(Boolean);
	const [selected, setSelected] = useState(0);
	const [open, setOpen] = useState(false);
	const index = Math.min(selected, Math.max(0, sources.length - 1));
	const liked = equipment.meLiked?.some((item) => item.myFavorite) ?? false;
	const alt = `${equipment.equipmentName} — ${t('Image')} ${index + 1}`;
	return (
		<>
			<section className="equipment-detail-panel equipment-photo-panel" aria-label={t('Equipment photos')}>
				<div className="equipment-photo-stage">
					<button
						className="equipment-open-photo"
						type="button"
						disabled={!sources.length}
						aria-label={t('Open gallery')}
						onClick={() => setOpen(true)}
					>
						<EquipmentPhoto source={sources[index] ?? ''} title={alt} />
					</button>
					<IconButton
						className={`equipment-detail-favorite${liked ? ' is-saved' : ''}`}
						aria-label={t(liked ? 'Remove favorite' : 'Save favorite')}
						aria-pressed={liked}
						disabled={favorite.pending.has(equipment._id)}
						onClick={() => void favorite.toggle(equipment._id)}
					>
						{liked ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
					</IconButton>
					<span className="equipment-photo-status">{t('AVAILABLE')}</span>
				</div>
				{sources.length > 0 && (
					<div className="equipment-thumbnails">
						{sources.map((source, photo) => (
							<button
								type="button"
								key={`${source}:${photo}`}
								aria-label={`${t('Image')} ${photo + 1}`}
								aria-pressed={index === photo}
								onClick={() => setSelected(photo)}
							>
								<EquipmentPhoto source={source} title={`${equipment.equipmentName} — ${t('Image')} ${photo + 1}`} />
							</button>
						))}
					</div>
				)}
			</section>
			<Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth aria-label={t('Open gallery')}>
				<Stack className="equipment-photo-dialog" p={2} spacing={2}>
					<Button onClick={() => setOpen(false)}>{t('Close')}</Button>
					<EquipmentPhoto source={sources[index] ?? ''} title={alt} />
					<Stack direction="row" alignItems="center" justifyContent="space-between">
						<Button disabled={index === 0} onClick={() => setSelected(index - 1)}>
							{t('Previous')}
						</Button>
						<span>
							{index + 1} / {sources.length}
						</span>
						<Button disabled={index >= sources.length - 1} onClick={() => setSelected(index + 1)}>
							{t('Next')}
						</Button>
					</Stack>
				</Stack>
			</Dialog>
		</>
	);
}

function EquipmentResort({ id }: { id: string | null | undefined }) {
	const { t } = useTranslation('common');
	const { data, loading, error, refetch } = useQuery<{ getResort: ResortSearchResult }>(GET_RESORT, {
		variables: { resortId: validId(id) ? id : '' },
		skip: !validId(id),
		fetchPolicy: 'cache-and-network',
	});
	const resort = data?.getResort;
	return (
		<section className="equipment-detail-panel equipment-associated-resort">
			<h2>{t('Associated Resort')}</h2>
			{!validId(id) ? (
				<p>{t('This equipment has no associated resort.')}</p>
			) : loading ? (
				<Skeleton variant="rectangular" height={84} />
			) : error || !resort || resort._id !== id || resort.resortStatus === 'DELETE' ? (
				<Alert severity="info">
					{t('Associated resort is unavailable')}
					<Button onClick={() => void refetch().catch(() => undefined)}>{t('Retry')}</Button>
				</Alert>
			) : (
				<div className="equipment-resort-card">
					<div className="equipment-resort-photo">
						<EquipmentPhoto source={homeImageUrl(resort.resortImages?.[0])} title={resort.resortTitle} />
					</div>
					<div>
						<h3>{resort.resortTitle}</h3>
						<p>
							<LocationOnOutlinedIcon />
							{t(resort.resortLocation)} · {resort.resortAddress}
						</p>
					</div>
					<Button component={Link} href={`/resort/detail?id=${id}`} endIcon={<ChevronRightRoundedIcon />}>
						{t('View Resort')}
					</Button>
				</div>
			)}
		</section>
	);
}

export default function EquipmentDetail() {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const id = router.query.id;
	const valid = validId(id);
	const { data, loading, error, refetch } = useQuery<{ getEquipment: EquipmentPreview }, { equipmentId: string }>(
		GET_EQUIPMENT,
		{
			variables: { equipmentId: valid ? id : '' },
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
	const [commentCount, setCommentCount] = useState<{ id: string; total: number }>();
	const updateCommentCount = useCallback(
		(total: number) => {
			if (validId(id)) setCommentCount({ id, total });
		},
		[id],
	);
	const [shareMessage, setShareMessage] = useState('');
	const shareTimer = useRef<ReturnType<typeof setTimeout>>();
	useEffect(() => {
		setShareMessage('');
		return () => {
			if (shareTimer.current) clearTimeout(shareTimer.current);
		};
	}, [id]);
	const share = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setShareMessage(t('Equipment link copied'));
		} catch {
			setShareMessage(t('Unable to copy equipment link'));
		}
		if (shareTimer.current) clearTimeout(shareTimer.current);
		shareTimer.current = setTimeout(() => setShareMessage(''), 3000);
	};
	const equipment = data?.getEquipment;
	if (!router.isReady || (valid && loading && (!equipment || equipment._id !== id)))
		return (
			<div className="equipment-detail-page">
				<div
					className="equipment-detail-container equipment-detail-loading"
					role="status"
					aria-label={t('Loading collection')}
				>
					<Skeleton width="55%" height={36} />
					<Skeleton variant="rectangular" height={460} />
					<Skeleton width="70%" height={72} />
				</div>
			</div>
		);
	if (!valid || error || !equipment || equipment._id !== id || equipment.equipmentStatus !== 'AVAILABLE')
		return (
			<div className="equipment-detail-page">
				<Stack className="equipment-detail-container equipment-detail-loading" spacing={2}>
					<Alert severity="error">{t('This resource is unavailable')}</Alert>
					{valid && <Button onClick={() => void refetch().catch(() => undefined)}>{t('Retry')}</Button>}
					<Button component={Link} href="/equipment">
						{t('Back to catalog')}
					</Button>
				</Stack>
			</div>
		);
	const comments = commentCount?.id === equipment._id ? commentCount.total : equipment.equipmentComments ?? 0;
	const sizeLabel = t(equipment.equipmentCategory === EquipmentCategory.BOOTS ? 'Size (Mondopoint / CM)' : 'Size');
	const categoryHref = `/equipment?${new URLSearchParams({
		input: JSON.stringify({
			page: 1,
			limit: 9,
			sort: 'createdAt',
			direction: 'DESC',
			search: { categoryList: [equipment.equipmentCategory] },
		}),
	})}`;
	return (
		<div className="equipment-detail-page">
			<Head>
				<title>{equipment.equipmentName} | SNOWKR</title>
				<meta name="description" content={equipment.equipmentDesc || equipment.equipmentName} />
			</Head>
			<div className="equipment-detail-container">
				<nav className="equipment-detail-breadcrumb" aria-label={t('Breadcrumb')}>
					<Link href="/">{t('Home')}</Link>
					<ChevronRightRoundedIcon />
					<Link href="/equipment">{t('Equipment')}</Link>
					<ChevronRightRoundedIcon />
					<Link href={categoryHref}>{t(equipment.equipmentCategory)}</Link>
					<ChevronRightRoundedIcon />
					<span aria-current="page">{equipment.equipmentName}</span>
				</nav>
				<div className="equipment-detail-layout">
					<div className="equipment-detail-content">
						<EquipmentPhotos key={equipment._id} equipment={equipment} />
						<section className="equipment-detail-panel equipment-identity">
							<div className="equipment-identity-top">
								<span className="equipment-detail-brand">{equipment.equipmentBrand || t('Unbranded')}</span>
								<div className="equipment-detail-social">
									<span>
										<VisibilityOutlinedIcon />
										{(equipment.equipmentViews ?? 0).toLocaleString()} {t('Views')}
									</span>
									<span>
										<FavoriteBorderRoundedIcon />
										{(equipment.equipmentLikes ?? 0).toLocaleString()} {t('Likes')}
									</span>
									<span>
										<ChatBubbleOutlineRoundedIcon />
										{comments.toLocaleString()} {t('Comments')}
									</span>
									<IconButton aria-label={t('Share')} onClick={() => void share()}>
										<ShareOutlinedIcon />
									</IconButton>
								</div>
							</div>
							<h1>{equipment.equipmentName}</h1>
							<div className="equipment-detail-tags">
								<Link href={categoryHref}>{t(equipment.equipmentCategory)}</Link>
								<span>
									{sizeLabel}: {equipment.equipmentSize || t('Size not specified')}
								</span>
								<span>{t(`Audience ${equipment.equipmentAudience}`)}</span>
								<span className="equipment-capability">
									{t(equipment.equipmentPurchasable ? 'Purchasable & Rentable' : 'Rental only')}
								</span>
							</div>
							{shareMessage && (
								<p role="status" className="equipment-share-message">
									{shareMessage}
								</p>
							)}
						</section>
						<aside className="equipment-detail-sidebar" aria-label={t('Rent or Buy')}>
							<EquipmentActionDesk key={equipment._id} equipment={equipment} />
						</aside>
						<section className="equipment-detail-panel">
							<h2>{t('About This Equipment')}</h2>
							<p className="equipment-description">
								{equipment.equipmentDesc?.trim() || t('Equipment description unavailable')}
							</p>
						</section>
						<section className="equipment-detail-panel">
							<h2>{t('Product Information')}</h2>
							<dl className="equipment-specifications">
								{[
									[t('Brand'), equipment.equipmentBrand || t('Unbranded')],
									[t('Category'), t(equipment.equipmentCategory)],
									[sizeLabel, equipment.equipmentSize || t('Size not specified')],
									[t('Audience'), t(`Audience ${equipment.equipmentAudience}`)],
									[t('Operational Status'), t(equipment.equipmentStatus)],
									[
										t('Catalog quantity'),
										equipment.equipmentQuantity == null
											? t('Not specified')
											: equipment.equipmentQuantity.toLocaleString(),
									],
								].map(([label, value]) => (
									<div key={label}>
										<dt>{label}</dt>
										<dd>{value}</dd>
									</div>
								))}
							</dl>
							<p className="equipment-catalog-note">
								{t('Catalog quantity does not confirm availability for your rental date.')}
							</p>
						</section>
						<EquipmentResort key={equipment.resortId} id={equipment.resortId} />
						<section className="equipment-detail-panel equipment-detail-comments">
							<div className="equipment-comments-intro">
								<span>{t('Alpine equipment discussions')}</span>
								<span className="equipment-comment-count" aria-label={t('Active comments')}>
									{comments}
								</span>
							</div>
							<ResourceComments
								key={equipment._id}
								id={equipment._id}
								group="EQUIPMENT"
								onChange={refetch}
								onTotalChange={updateCommentCount}
							/>
						</section>
					</div>
				</div>
			</div>
		</div>
	);
}
