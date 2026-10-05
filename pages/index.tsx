import useCatalogFavorite from '../libs/hooks/useCatalogFavorite';
import React from 'react';
import { GetStaticProps, NextPage } from 'next';
import { Stack } from '@mui/material';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutMain from '../libs/components/layout/LayoutHome';
import PopularResorts from '../libs/components/homepage/PopularResorts';
import ResortDifficultySection from '../libs/components/homepage/ResortDifficultySection';
import TrendResorts from '../libs/components/homepage/TrendResorts';
import EquipmentSection from '../libs/components/homepage/EquipmentSection';
import TopInstructors from '../libs/components/homepage/TopInstructors';
import WhySkiResort from '../libs/components/homepage/WhySkiResort';
import HomeCTA from '../libs/components/homepage/HomeCTA';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});

const Home: NextPage = () => {
	const { pending: pendingIds, toggle: favoriteHandler } = useCatalogFavorite('resort');

	return (
		<Stack className="home-page skiresort-home">
			<PopularResorts pendingIds={pendingIds} onFavorite={favoriteHandler} />
			<ResortDifficultySection />
			<TrendResorts pendingIds={pendingIds} onFavorite={favoriteHandler} />
			<EquipmentSection />
			<TopInstructors />
			<WhySkiResort />
			<HomeCTA />
		</Stack>
	);
};

export default withLayoutMain(Home);
