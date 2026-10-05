import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/router';
import { Button, Card, CardContent, Chip, IconButton, Typography } from '@mui/material';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useTranslation } from 'next-i18next';
import { ResortSearchResult } from '../../types/resort/resort';
import { homeImageUrl, homePrice } from './homeUtils';

interface ResortCardProps {
	resort: ResortSearchResult;
	pending: boolean;
	onFavorite: (id: string) => Promise<void>;
}

const ResortCard = ({ resort, pending, onFavorite }: ResortCardProps) => {
	const { t, i18n } = useTranslation('common');
	const router = useRouter();
	const liked = resort.meLiked?.some((like) => like.myFavorite) ?? false;
	return (
		<Card
			className="home-discovery-card"
			variant="outlined"
			onClick={(event) => {
				if (!(event.target as HTMLElement).closest('a,button'))
					void router.push(`/resort/detail?id=${encodeURIComponent(resort._id)}`);
			}}
		>
			<div className="home-card-image">
				<Link href={`/resort/detail?id=${encodeURIComponent(resort._id)}`}>
					<img
						src={homeImageUrl(resort.resortImages[0]) || '/img/hero/winter-1.jpg'}
						alt={resort.resortTitle}
						loading="lazy"
						onError={(event) => {
							if (!event.currentTarget.src.endsWith('/img/hero/winter-1.jpg'))
								event.currentTarget.src = '/img/hero/winter-1.jpg';
						}}
					/>
				</Link>
				<IconButton
					className="home-favorite"
					aria-label={t(liked ? 'Remove favorite' : 'Save favorite')}
					aria-pressed={liked}
					disabled={pending}
					onClick={() => void onFavorite(resort._id)}
				>
					{liked ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
				</IconButton>
				{resort.resortStatus === 'SOLD_OUT' && (
					<Chip className="home-card-status" color="warning" size="small" label={t('Sold out')} />
				)}
			</div>
			<CardContent>
				<div className="home-card-tags">
					<Chip size="small" label={t(resort.resortLocation)} />
					{resort.resortLevel && <Chip size="small" label={t(resort.resortLevel)} />}
				</div>
				<Typography component="h3" variant="h6">
					<Link href={`/resort/detail?id=${encodeURIComponent(resort._id)}`}>{resort.resortTitle}</Link>
				</Typography>
				<Typography className="home-card-muted">{resort.resortAddress}</Typography>
				<div className="home-facilities">
					{resort.resortFacilities?.slice(0, 3).map((facility) => (
						<span key={facility}>{t(facility)}</span>
					))}
				</div>
				<Typography className="home-card-price">
					{homePrice(resort.resortPricePerDay, i18n.language)} / {t('day')}
				</Typography>
				<Typography variant="body2">{t('Minimum stay', { count: resort.resortMinDays })}</Typography>
				<div className="home-card-footer">
					<span aria-label={t('Likes')}>
						<FavoriteBorderRoundedIcon fontSize="small" /> {resort.resortLikes}
					</span>
					<span aria-label={t('Views')}>
						<VisibilityOutlinedIcon fontSize="small" /> {resort.resortViews}
					</span>
					<Button component={Link} href={`/resort/detail?id=${encodeURIComponent(resort._id)}`}>
						{t('View Resort')}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};

export default ResortCard;
