import React from 'react';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import FaqRecord from '../../libs/components/faq/FaqRecord';
function Page() {
	const { t } = useTranslation('common');
	return (
		<div className="catalog-page faq-public-page">
			<Head>
				<title>{t('FAQ')} | SNOWKR</title>
			</Head>
			<div className="snowkr-page-heading">
				<h1>{t('Frequently asked questions')}</h1>
			</div>
			<FaqRecord />
		</div>
	);
}
export default withLayoutBasic(Page);
export { getStaticProps } from '../../libs/pageTranslations';
