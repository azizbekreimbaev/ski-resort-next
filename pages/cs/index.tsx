import React from 'react';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import Faq from '../../libs/components/cs/Faq';
import Notice from '../../libs/components/cs/Notice';
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});
function HelpCenter() {
	const router = useRouter();
	const { t } = useTranslation('common');
	const tab = typeof router.query.tab === 'string' ? router.query.tab : 'faq';
	const unavailable = ['terms', 'privacy', 'lift-passes'].includes(tab);
	return (
		<div className="catalog-page faq-public-page">
			<div className="snowkr-page-heading">
				<h1>{t('Help Center')}</h1>
				<p>{t('Find your way around SNOWKR.')}</p>
			</div>
			<Stack direction="row" gap={2} mb={3}>
				<Button component={Link} href="/cs?tab=faq" variant={tab === 'faq' ? 'contained' : 'outlined'}>
					{t('FAQ')}
				</Button>
				<Button component={Link} href="/cs?tab=notice" variant={tab === 'notice' ? 'contained' : 'outlined'}>
					{t('Notices')}
				</Button>
			</Stack>
			<section className="snowkr-panel">
				{unavailable ? (
					<>
						<Typography component="h2" variant="h5">
							{t(tab === 'terms' ? 'Terms of Service' : tab === 'privacy' ? 'Privacy Policy' : 'Lift Pass Rates')}
						</Typography>
						<Alert severity="info" sx={{ mt: 2 }}>
							{t('This information has not been published yet.')}
						</Alert>
					</>
				) : tab === 'notice' ? (
					<Notice />
				) : (
					<Faq />
				)}
			</section>
		</div>
	);
}
export default withLayoutBasic(HelpCenter);
