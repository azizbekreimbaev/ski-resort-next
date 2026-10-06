import React from 'react';
import { Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';

const HeroBanner = () => {
	const { t } = useTranslation('common');
	return (
		<div className="home-alpine-hero">
			<img src="/img/hero/winter-1.jpg" alt="" loading="eager" />
			<div className="home-alpine-copy">
				<span className="home-season-label">{t('Korea Winter Ski Season')}</span>
				<Typography component="h1">{t('Discover Ski Resorts in South Korea')}</Typography>
				<Typography component="p">{t('Find your mountain. Meet your instructor. Get ready for the snow.')}</Typography>
			</div>
		</div>
	);
};

export default HeroBanner;
