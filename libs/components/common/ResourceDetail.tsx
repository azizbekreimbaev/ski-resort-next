import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Button, Chip, Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { GET_RESORT, GET_EQUIPMENT, GET_INSTRUCTOR } from '../../../apollo/user/query';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { CatalogDomain, CatalogMember } from '../../types/catalog';
import { ResortSearchResult } from '../../types/resort/resort';
import { EquipmentPreview } from '../../types/equipment/equipment';
import { validId } from '../../catalogSearch';
import useCatalogFavorite from '../../hooks/useCatalogFavorite';
import { homePrice } from '../homepage/homeUtils';
import { InstructorImage } from '../homepage/InstructorCard';
import ResourceGallery from './ResourceGallery';
import ResourceComments from './ResourceComments';
import HomeCollectionState from '../homepage/HomeCollectionState';

export default function ResourceDetail({ domain }: { domain: CatalogDomain }) {
	const router = useRouter();
	const { t, i18n } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const id = domain === 'instructor' ? router.query.instructorId : router.query.id;
	const valid = validId(id);
	const { data, loading, error, refetch } = useQuery<{
		getResort?: ResortSearchResult;
		getEquipment?: EquipmentPreview;
		getMember?: CatalogMember;
	}>(domain === 'resort' ? GET_RESORT : domain === 'equipment' ? GET_EQUIPMENT : GET_INSTRUCTOR, {
		variables: domain === 'resort' ? { resortId: id } : domain === 'equipment' ? { equipmentId: id } : { memberId: id },
		skip: !router.isReady || !valid,
		fetchPolicy: 'network-only',
	});
	const previousUser = useRef(user._id);
	useEffect(() => {
		if (previousUser.current !== user._id && valid) {
			previousUser.current = user._id;
			void refetch().catch(() => undefined);
		}
	}, [user._id, refetch, valid]);
	const resort = data?.getResort;
	const equipment = data?.getEquipment;
	const instructor = data?.getMember;
	const favorite = useCatalogFavorite(domain === 'equipment' ? 'equipment' : 'resort');
	const [likeMember, likeState] = useMutation(LIKE_TARGET_MEMBER);
	const [subscribe, subState] = useMutation(SUBSCRIBE);
	const [unsubscribe, unsubState] = useMutation(UNSUBSCRIBE);
	const [failure, setFailure] = useState('');
	const social = async (follow: boolean) => {
		if (!user._id || !valid || likeState.loading || subState.loading || unsubState.loading) return;
		try {
			const mutation = follow
				? instructor?.meFollowed?.some((item) => item.myFollowing)
					? unsubscribe
					: subscribe
				: likeMember;
			await mutation({ variables: { input: id } });
			await refetch();
			setFailure('');
		} catch {
			setFailure(t('Unable to update profile interaction'));
		}
	};
	if (!router.isReady || (loading && !data))
		return (
			<div className="catalog-page">
				<HomeCollectionState loading error={false} empty={false} retry={refetch} />
			</div>
		);
	if (
		!valid ||
		error ||
		(!resort && !equipment && !instructor) ||
		(domain === 'instructor' && (instructor?.memberType !== 'INSTRUCTOR' || instructor.memberStatus !== 'ACTIVE'))
	)
		return (
			<Stack className="catalog-page" spacing={2}>
				<Alert severity="error">{t('This resource is unavailable')}</Alert>
				{valid && <Button onClick={() => void refetch().catch(() => undefined)}>{t('Retry')}</Button>}
				<Button component={Link} href={`/${domain}`}>
					{t('Back to catalog')}
				</Button>
			</Stack>
		);
	const title =
		resort?.resortTitle ?? equipment?.equipmentName ?? (instructor?.memberFullName || instructor?.memberNick || '');
	const liked =
		(resort?.meLiked ?? equipment?.meLiked ?? instructor?.meLiked)?.some((item) => item.myFavorite) ?? false;
	return (
		<Stack className="catalog-page resource-detail skiresort-home" spacing={4}>
			<Button component={Link} href={`/${domain}`} sx={{ alignSelf: 'flex-start' }}>
				{t('Back to catalog')}
			</Button>
			<Typography component="h1" variant="h3">
				{title}
			</Typography>
			{instructor ? (
				<InstructorImage instructor={instructor} />
			) : (
				<ResourceGallery images={resort?.resortImages ?? equipment?.equipmentImages ?? []} title={title} />
			)}
			<Stack direction="row" spacing={2} flexWrap="wrap">
				<Button
					variant="outlined"
					disabled={domain === 'instructor' ? !user._id || likeState.loading : favorite.pending.has(String(id))}
					onClick={() => void (domain === 'instructor' ? social(false) : favorite.toggle(String(id)))}
				>
					{t(domain === 'instructor' ? (liked ? 'Unlike' : 'Like') : liked ? 'Remove favorite' : 'Save favorite')}
				</Button>
				<Typography>
					{t('Likes')}: {resort?.resortLikes ?? equipment?.equipmentLikes ?? instructor?.memberLikes ?? 0}
				</Typography>
				<Typography>
					{t('Views')}: {resort?.resortViews ?? equipment?.equipmentViews ?? instructor?.memberViews ?? 0}
				</Typography>
				{instructor && user._id !== instructor._id && (
					<Button disabled={!user._id || subState.loading || unsubState.loading} onClick={() => void social(true)}>
						{t(instructor.meFollowed?.some((item) => item.myFollowing) ? 'Unfollow' : 'Follow')}
					</Button>
				)}
			</Stack>
			{failure && <Alert severity="error">{failure}</Alert>}
			{resort && (
				<Stack spacing={2}>
					<Typography>
						{t(resort.resortLocation)} Â· {resort.resortAddress}
					</Typography>
					{resort.resortLevel && <Chip sx={{ alignSelf: 'flex-start' }} label={t(resort.resortLevel)} />}
					{resort.resortStatus === 'SOLD_OUT' && <Alert severity="info">{t('Sold out')}</Alert>}
					<Typography variant="h5">
						{homePrice(resort.resortPricePerDay, i18n.language)} / {t('day')}
					</Typography>
					<Typography>{t('Minimum stay', { count: resort.resortMinDays })}</Typography>
					<Stack direction="row" gap={1} flexWrap="wrap">
						{resort.resortFacilities?.map((facility) => (
							<Chip key={facility} label={t(facility)} />
						))}
					</Stack>
					<Typography sx={{ whiteSpace: 'pre-wrap' }}>{resort.resortDesc}</Typography>
				</Stack>
			)}
			{equipment && (
				<Stack spacing={2}>
					<Typography>
						{t(equipment.equipmentCategory)} Â· {t(`Audience ${equipment.equipmentAudience}`)}
					</Typography>
					{equipment.equipmentBrand && <Typography>{equipment.equipmentBrand}</Typography>}
					{equipment.equipmentSize && (
						<Typography>
							{t(equipment.equipmentCategory === 'BOOTS' ? 'Size (Mondopoint / CM)' : 'Size')}:{' '}
							{equipment.equipmentSize}
						</Typography>
					)}
					<Typography variant="h5">{t('Rental packages')}</Typography>
					{equipment.equipmentRentalRates.map((rate) => (
						<Typography key={rate.durationHours}>
							{t('Rental package', { hours: rate.durationHours, price: homePrice(rate.price, i18n.language) })}
						</Typography>
					))}
					{equipment.equipmentPurchasable && (
						<Typography>
							{t('Purchase option')}:{' '}
							{equipment.equipmentPurchasePrice == null
								? t('Price not configured')
								: homePrice(equipment.equipmentPurchasePrice, i18n.language)}
						</Typography>
					)}
					<Typography sx={{ whiteSpace: 'pre-wrap' }}>{equipment.equipmentDesc}</Typography>
					{equipment.resortId && (
						<Button component={Link} href={`/resort/detail?id=${encodeURIComponent(equipment.resortId)}`}>
							{t('View associated Resort')}
						</Button>
					)}
					<Alert severity="info">{t('Catalog stock does not confirm trip availability.')}</Alert>
				</Stack>
			)}
			{instructor && (
				<Stack spacing={2}>
					{instructor.instructorExperienceYears != null && (
						<Typography>{t('Instructor experience', { count: instructor.instructorExperienceYears })}</Typography>
					)}
					<Typography>{instructor.instructorLanguages?.join(', ')}</Typography>
					{instructor.instructorLevel && <Typography>{t(`Instructor level ${instructor.instructorLevel}`)}</Typography>}
					{instructor.instructorAudience && <Typography>{t(`Audience ${instructor.instructorAudience}`)}</Typography>}
					{[
						instructor.instructorPrice1Week,
						instructor.instructorPrice2Weeks,
						instructor.instructorPrice3Weeks,
						instructor.instructorPrice4Weeks,
					].map(
						(price, index) =>
							price != null && (
								<Typography key={index}>
									{t('Weekly profile price', { count: index + 1, price: homePrice(price, i18n.language) })}
								</Typography>
							),
					)}
					<Typography sx={{ whiteSpace: 'pre-wrap' }}>{instructor.memberDesc}</Typography>
					{instructor.instructorResortId && (
						<Button component={Link} href={`/resort/detail?id=${encodeURIComponent(instructor.instructorResortId)}`}>
							{t('View associated Resort')}
						</Button>
					)}
					<Button component={Link} href={`/member?memberId=${encodeURIComponent(instructor._id)}`}>
						{t('Member profile')}
					</Button>
				</Stack>
			)}
			<ResourceComments
				key={`${domain}-${id}`}
				id={String(id)}
				group={domain === 'resort' ? 'RESORT' : domain === 'equipment' ? 'EQUIPMENT' : 'MEMBER'}
			/>
		</Stack>
	);
}
