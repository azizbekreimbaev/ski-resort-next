import React, { useEffect, useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Autoplay, Keyboard, Navigation, Pagination } from 'swiper';
import type { Swiper as SwiperInstance } from 'swiper';
import Link from 'next/link';

const heroImages = [
	{ src: '/img/hero/winter-1.jpg', alt: 'Snow-covered ski resort beneath mountain peaks' },
	{ src: '/img/hero/winter-2.jpg', alt: 'Ski slopes and lifts below snowy mountains' },
	{ src: '/img/hero/winter-3.jpg', alt: 'Snowy mountain range under a clear winter sky' },
	{ src: '/img/hero/winter-4.jpg', alt: 'Winter mountain peaks in soft evening light' },
	{ src: '/img/hero/winter-5.jpg', alt: 'Snow-dusted mountain summit at sunset' },
];

const HeroBanner = () => {
	const { t } = useTranslation('common');
	const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
	const [paused, setPaused] = useState(true);
	const [reducedMotion, setReducedMotion] = useState(true);

	useEffect(() => {
		const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		const updatePreference = () => {
			setReducedMotion(preference.matches);
			setPaused(preference.matches);
		};
		updatePreference();
		preference.addEventListener('change', updatePreference);
		return () => preference.removeEventListener('change', updatePreference);
	}, []);

	useEffect(() => {
		if (!swiper || swiper.destroyed) return;
		if (paused) swiper.autoplay.stop();
		else swiper.autoplay.start();
	}, [swiper, paused]);

	return (
		<Stack className="hero-banner" role="region" aria-label={t('Winter inspiration')}>
			<Swiper
				modules={[A11y, Autoplay, Keyboard, Navigation, Pagination]}
				onSwiper={setSwiper}
				loop
				speed={reducedMotion ? 0 : 700}
				autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
				navigation
				pagination={{ clickable: true }}
				keyboard={{ enabled: true, onlyInViewport: true }}
				className="hero-swiper"
			>
				{heroImages.map((image, index) => (
					<SwiperSlide key={image.src}>
						<img src={image.src} alt={image.alt} loading={index === 0 ? 'eager' : 'lazy'} />
					</SwiperSlide>
				))}
			</Swiper>
			<div className="hero-shade" />
			<Stack className="hero-copy">
				<Typography className="hero-eyebrow">{t('Your next winter escape')}</Typography>
				<Typography component="h1">{t('Find your mountain moment')}</Typography>
				<Typography component="p">{t('Discover ski resorts for your next adventure in South Korea.')}</Typography>
				<Link href="/resort">
					<Button className="hero-explore" variant="contained">
						{t('Explore resorts')}
					</Button>
				</Link>
			</Stack>
			<Button className="hero-playback" onClick={() => setPaused(!paused)} aria-pressed={paused}>
				{t(paused ? 'Play slideshow' : 'Pause slideshow')}
			</Button>
		</Stack>
	);
};

export default HeroBanner;
