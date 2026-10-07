import React from 'react';
import Link from 'next/link';
import { Typography } from '@mui/material';
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined';
import SnowboardingOutlinedIcon from '@mui/icons-material/SnowboardingOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import { useTranslation } from 'next-i18next';
import HomeSection from './HomeSection';

const benefits = [
	{
		title: 'Explore Ski Resorts',
		text: 'Compare locations, ski levels and facilities.',
		href: '/resort',
		Icon: LandscapeOutlinedIcon,
	},
	{
		title: 'Discover Equipment',
		text: 'Explore ski and snowboard rental packages.',
		href: '/equipment',
		Icon: SnowboardingOutlinedIcon,
	},
	{
		title: 'Learn With Instructors',
		text: 'Find instructor profiles that suit your interests.',
		href: '/#instructors',
		Icon: SchoolOutlinedIcon,
	},
	{
		title: 'Save Favorites',
		text: 'Sign in and keep the resorts you love.',
		href: '/#popular-resorts',
		Icon: FavoriteBorderRoundedIcon,
	},
];

const WhySkiResort = () => {
	const { t } = useTranslation('common');
	return (
		<HomeSection id="why-skiresort" title={t('Why SNOWAY')} subtitle={t('Start your winter adventure in one place.')}>
			<div className="home-benefits-grid">
				{benefits.map(({ title, text, href, Icon }) => (
					<Link key={title} href={href}>
						<div className="home-benefit">
							<Icon />
							<Typography component="h3" variant="h6">
								{t(title)}
							</Typography>
							<Typography>{t(text)}</Typography>
						</div>
					</Link>
				))}
			</div>
		</HomeSection>
	);
};

export default WhySkiResort;
