import React, { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Box, Button, Pagination, Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { GET_RESORTS, GET_EQUIPMENTS, GET_INSTRUCTORS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { CatalogData, CatalogDomain, CatalogInquiry } from '../../types/catalog';
import { parseCatalogInquiry } from '../../catalogSearch';
import { parseTravelDates } from '../../resortSearch';
import useCatalogFavorite from '../../hooks/useCatalogFavorite';
import CatalogFilters from './CatalogFilters';
import ResortCard from '../homepage/ResortCard';
import EquipmentCard from '../homepage/EquipmentCard';
import InstructorCard from '../homepage/InstructorCard';
import HomeCollectionState from '../homepage/HomeCollectionState';

export default function CatalogPage({ domain }: { domain: CatalogDomain }) {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const lastMember = useRef(user._id);
	const input = useMemo(() => parseCatalogInquiry(domain, router.query.input), [domain, router.query.input]);
	const { data, loading, error, refetch } = useQuery<CatalogData>(
		domain === 'resort' ? GET_RESORTS : domain === 'equipment' ? GET_EQUIPMENTS : GET_INSTRUCTORS,
		{
			variables: { input },
			skip: !router.isReady,
			fetchPolicy: 'cache-and-network',
			notifyOnNetworkStatusChange: true,
		},
	);
	useEffect(() => {
		if (router.isReady && lastMember.current !== user._id) {
			lastMember.current = user._id;
			void refetch().catch(() => undefined);
		}
	}, [user._id, refetch, router.isReady]);
	const favorite = useCatalogFavorite(domain === 'equipment' ? 'equipment' : 'resort');
	const result =
		domain === 'resort' ? data?.getResorts : domain === 'equipment' ? data?.getEquipments : data?.getInstructors;
	const total = result?.metaCounter?.[0]?.total ?? 0;
	const navigate = (next: CatalogInquiry) => {
		const dates = parseTravelDates(router.query.arrival, router.query.departure);
		void router.push({
			pathname: `/${domain}`,
			query: { input: JSON.stringify(next), ...(domain === 'resort' && dates.arrival ? dates : {}) },
		});
	};
	return (
		<Stack className="catalog-page skiresort-home">
			<Typography component="h1" variant="h3">
				{t(domain === 'resort' ? 'Resorts' : domain === 'equipment' ? 'Equipments' : 'Instructors')}
			</Typography>
			{domain === 'resort' && router.query.arrival && (
				<Alert severity="info">
					{t('Dates are saved for your trip. Availability is not checked.')} {String(router.query.arrival)} â€”{' '}
					{String(router.query.departure ?? '')}
				</Alert>
			)}
			<div className="catalog-layout">
				<CatalogFilters domain={domain} input={input} onApply={navigate} />
				<Stack spacing={3} className="catalog-content">
					<div className="catalog-toolbar">
						<Typography>
							{t('Results')}: {total}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{t('Sort')}: {t(input.sort)} · {input.direction}
						</Typography>
					</div>
					<HomeCollectionState
						loading={loading || !router.isReady}
						error={Boolean(error)}
						empty={!result?.list.length}
						retry={refetch}
					/>
					<div className="catalog-grid" aria-busy={loading}>
						{!error &&
							(domain === 'resort'
								? data?.getResorts?.list.map((resort) => (
										<ResortCard
											key={resort._id}
											resort={resort}
											pending={favorite.pending.has(resort._id)}
											onFavorite={favorite.toggle}
										/>
								  ))
								: domain === 'equipment'
								? data?.getEquipments?.list.map((equipment) => (
										<EquipmentCard key={equipment._id} equipment={equipment} />
								  ))
								: data?.getInstructors?.list.map((instructor) => (
										<InstructorCard key={instructor._id} instructor={instructor} />
								  )))}
					</div>
					{total > input.limit && (
						<Pagination
							count={Math.ceil(total / input.limit)}
							page={input.page}
							disabled={loading}
							onChange={(_event, page) => navigate({ ...input, page })}
						/>
					)}
					{!loading && !result?.list.length && input.page > 1 && (
						<Button onClick={() => navigate({ ...input, page: 1 })}>{t('Back to first page')}</Button>
					)}
				</Stack>
			</div>
		</Stack>
	);
}
