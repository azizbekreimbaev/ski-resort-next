import useCatalogFavorite from '../libs/hooks/useCatalogFavorite';
import React from 'react';
import { useRouter } from 'next/router';
import { GetStaticProps, NextPage } from 'next';
import { Stack } from '@mui/material';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutMain from '../libs/components/layout/LayoutHome';
import PopularResorts from '../libs/components/homepage/PopularResorts';
import EquipmentSection from '../libs/components/homepage/EquipmentSection';
import TopInstructors from '../libs/components/homepage/TopInstructors';
import CommunityBoards from '../libs/components/homepage/CommunityBoards';
import HeroBanner from '../libs/components/homepage/HeroBanner';
import HeaderFilter from '../libs/components/homepage/HeaderFilter';
import { parseTravelDates } from '../libs/resortSearch';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});

const Home: NextPage = () => {
	const { pending: pendingIds, toggle: favoriteHandler } = useCatalogFavorite('resort');
	const router = useRouter();
	const tripDates = parseTravelDates(router.query.arrival, router.query.departure);

	return (
		<Stack className="home-page skiresort-home home-refreshed">
			<section className="snowkr-home-hero">
				<HeroBanner />
				<div className="snowkr-container hero-search-container">
					<HeaderFilter
						onSearch={(input, dates) => {
							void router.push({
								pathname: '/resort',
								query: { input: JSON.stringify(input), ...(dates.arrival ? dates : {}) },
							});
						}}
					/>
				</div>
			</section>
			<PopularResorts
				tripDates={tripDates}
				pendingIds={pendingIds}
				onFavorite={favoriteHandler}
			/>
			<TopInstructors />
			<EquipmentSection />
			<CommunityBoards />
			<CommunityBoards news />
		</Stack>
	);
};

export default withLayoutMain(Home);
