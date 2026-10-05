import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import IconButton from '@mui/material/IconButton';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import useCatalogFavorite from '../../hooks/useCatalogFavorite';
import { Button, Card, CardContent, Chip, Typography } from '@mui/material';
import DownhillSkiingOutlinedIcon from '@mui/icons-material/DownhillSkiingOutlined';
import SnowboardingOutlinedIcon from '@mui/icons-material/SnowboardingOutlined';
import CheckroomOutlinedIcon from '@mui/icons-material/CheckroomOutlined';
import SportsMotorsportsOutlinedIcon from '@mui/icons-material/SportsMotorsportsOutlined';
import SnowshoeingOutlinedIcon from '@mui/icons-material/SnowshoeingOutlined';
import { useTranslation } from 'next-i18next';
import { EquipmentCategory } from '../../enums/equipment.enum';
import { EquipmentPreview } from '../../types/equipment/equipment';
import { homeImageUrl, homePrice } from './homeUtils';

export const EquipmentImage = ({ equipment }: { equipment: EquipmentPreview }) => {
	const [failed, setFailed] = useState(false);
	const image = homeImageUrl(equipment.equipmentImages?.[0]);
	useEffect(() => setFailed(false), [image]);
	const Icon =
		equipment.equipmentCategory === EquipmentCategory.SNOWBOARD
			? SnowboardingOutlinedIcon
			: equipment.equipmentCategory === EquipmentCategory.CLOTHING
			? CheckroomOutlinedIcon
			: equipment.equipmentCategory === EquipmentCategory.HELMET
			? SportsMotorsportsOutlinedIcon
			: equipment.equipmentCategory === EquipmentCategory.BOOTS
			? SnowshoeingOutlinedIcon
			: DownhillSkiingOutlinedIcon;
	return (
		<div className="home-card-image home-equipment-image">
			{image && !failed ? (
				<img src={image} alt={equipment.equipmentName} loading="lazy" onError={() => setFailed(true)} />
			) : (
				<Icon aria-hidden="true" />
			)}
		</div>
	);
};

const EquipmentCard = ({ equipment }: { equipment: EquipmentPreview }) => {
	const { t, i18n } = useTranslation('common');
	const router = useRouter();
	const favorite = useCatalogFavorite('equipment');
	const liked = equipment.meLiked?.some((like) => like.myFavorite) ?? false;
	return (
		<Card
			className="home-discovery-card"
			variant="outlined"
			onClick={(event) => {
				if (!(event.target as HTMLElement).closest('a,button'))
					void router.push(`/equipment/detail?id=${encodeURIComponent(equipment._id)}`);
			}}
		>
			<Link href={`/equipment/detail?id=${encodeURIComponent(equipment._id)}`}>
				<EquipmentImage equipment={equipment} />
			</Link>
			<CardContent>
				<IconButton
					aria-label={t(liked ? 'Remove favorite' : 'Save favorite')}
					aria-pressed={liked}
					disabled={favorite.pending.has(equipment._id)}
					onClick={() => void favorite.toggle(equipment._id)}
				>
					{liked ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
				</IconButton>
				<div className="home-card-tags">
					<Chip size="small" label={t(equipment.equipmentCategory)} />
					<Chip size="small" label={t(`Audience ${equipment.equipmentAudience}`)} />
				</div>
				<Typography component="h3" variant="h6">
					<Link href={`/equipment/detail?id=${encodeURIComponent(equipment._id)}`}>{equipment.equipmentName}</Link>
				</Typography>
				{equipment.equipmentBrand && <Typography className="home-card-muted">{equipment.equipmentBrand}</Typography>}
				{equipment.equipmentSize && (
					<Typography variant="body2">
						{t(equipment.equipmentCategory === EquipmentCategory.BOOTS ? 'Size (Mondopoint / CM)' : 'Size')}:{' '}
						{equipment.equipmentSize}
					</Typography>
				)}
				<div className="home-rental-rates">
					{equipment.equipmentRentalRates.slice(0, 2).map((rate) => (
						<Typography key={rate.durationHours} variant="body2">
							{t('Rental package', { hours: rate.durationHours, price: homePrice(rate.price, i18n.language) })}
						</Typography>
					))}
				</div>
				{equipment.equipmentPurchasable && (
					<Typography variant="body2">
						{t('Purchase option')}
						{equipment.equipmentPurchasePrice != null
							? ` Â· ${homePrice(equipment.equipmentPurchasePrice, i18n.language)}`
							: ''}
					</Typography>
				)}
				<Button component={Link} href={`/equipment/detail?id=${encodeURIComponent(equipment._id)}`}>
					{t('View equipment')}
				</Button>
			</CardContent>
		</Card>
	);
};

export default EquipmentCard;
