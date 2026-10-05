import React, { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { Box, Pagination, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import {
	GET_FAVORITE_RESORTS,
	GET_FAVORITE_EQUIPMENTS,
	GET_VISITED_RESORTS,
	GET_VISITED_EQUIPMENTS,
} from '../../../apollo/user/query';
import { CatalogData } from '../../types/catalog';
import useCatalogFavorite from '../../hooks/useCatalogFavorite';
import HomeCollectionState from '../homepage/HomeCollectionState';
import ResortCard from '../homepage/ResortCard';
import EquipmentCard from '../homepage/EquipmentCard';
export default function SavedCatalog({ visited = false }: { visited?: boolean }) {
	const { t } = useTranslation('common');
	const [domain, setDomain] = useState<'resort' | 'equipment'>('resort');
	const [page, setPage] = useState(1);
	const query =
		domain === 'resort'
			? visited
				? GET_VISITED_RESORTS
				: GET_FAVORITE_RESORTS
			: visited
			? GET_VISITED_EQUIPMENTS
			: GET_FAVORITE_EQUIPMENTS;
	const { data, loading, error, refetch } = useQuery<CatalogData>(query, {
		variables: { input: { page, limit: 9 } },
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	const resorts = visited ? data?.getVisitedResorts : data?.getFavoriteResorts;
	const equipments = visited ? data?.getVisitedEquipments : data?.getFavoriteEquipments;
	const result = domain === 'resort' ? resorts : equipments;
	const favorite = useCatalogFavorite('resort');
	const total = result?.metaCounter?.[0]?.total ?? 0;
	useEffect(() => {
		if (!loading && !error && !result?.list.length && page > 1) setPage(page - 1);
	}, [loading, error, result, page]);
	return (
		<Stack className="skiresort-home" spacing={3}>
			<Typography component="h1" variant="h4">
				{t(visited ? 'Recently Visited' : 'My Favorites')}
			</Typography>
			<Tabs
				value={domain}
				onChange={(_event, next: 'resort' | 'equipment') => {
					setDomain(next);
					setPage(1);
				}}
			>
				<Tab value="resort" label={t('Resorts')} />
				<Tab value="equipment" label={t('Equipments')} />
			</Tabs>
			<HomeCollectionState loading={loading} error={Boolean(error)} empty={!result?.list.length} retry={refetch} />
			<div className="catalog-grid">
				{!error &&
					(domain === 'resort'
						? resorts?.list.map((resort) => (
								<ResortCard
									key={resort._id}
									resort={resort}
									pending={favorite.pending.has(resort._id)}
									onFavorite={favorite.toggle}
								/>
						  ))
						: equipments?.list.map((equipment) => <EquipmentCard key={equipment._id} equipment={equipment} />))}
			</div>
			{total > 9 && (
				<Pagination
					page={page}
					count={Math.ceil(total / 9)}
					disabled={loading}
					onChange={(_event, next) => setPage(next)}
				/>
			)}
		</Stack>
	);
}
