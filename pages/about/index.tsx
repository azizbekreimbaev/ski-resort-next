import React from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import WhySkiResort from '../../libs/components/homepage/WhySkiResort';
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});
function About() {
	const { t } = useTranslation('common');
	return (
		<Stack className="catalog-page skiresort-home" spacing={3}>
			<Typography component="h1" variant="h3">
				{t('About SkiResort')}
			</Typography>
			<img className="resource-gallery-main" src="/img/hero/winter-2.jpg" alt={t('Winter mountains')} />
			<Typography>{t('Discover resorts, equipment and instructors for your next winter trip.')}</Typography>
			<WhySkiResort />
			<Button component={Link} href="/resort" variant="contained">
				{t('Explore Resorts')}
			</Button>
		</Stack>
	);
}
export default withLayoutBasic(About);
