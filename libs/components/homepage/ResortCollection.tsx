import React, { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Button } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { GET_RESORTS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { defaultResortInquiry, parseTravelDates } from '../../resortSearch';
import { ResortSearchData } from '../../types/resort/resort';
import { ResortsInquiry, ResortSort } from '../../types/resort/resort.input';
import HomeSection from './HomeSection';
import HomeCarousel from './HomeCarousel';
import HomeCollectionState from './HomeCollectionState';
import { HomeResortCard } from './HomeCatalogCards';

export interface ResortInteractionProps {
	pendingIds: Set<string>;
	onFavorite: (id: string) => Promise<void>;
	search?: ResortsInquiry['search'];
	tripDates?: ReturnType<typeof parseTravelDates>;
}

interface ResortCollectionProps extends ResortInteractionProps {
	id: string;
	title: string;
	subtitle: string;
	sort: ResortSort;
}

const ResortCollection = ({
	id,
	title,
	subtitle,
	sort,
	pendingIds,
	onFavorite,
	search,
	tripDates,
}: ResortCollectionProps) => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const previousMemberId = useRef(user._id);
	const input = useMemo<ResortsInquiry>(
		() => ({ ...defaultResortInquiry(), limit: 6, sort, search: search ?? {} }),
		[sort, search],
	);
	const { data, loading, error, refetch } = useQuery<ResortSearchData, { input: ResortsInquiry }>(GET_RESORTS, {
		variables: { input },
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
	});
	const resorts = data?.getResorts.list ?? [];
	const catalogHref = `/resort?${new URLSearchParams({
		input: JSON.stringify({ ...input, limit: 9 }),
		...(tripDates?.arrival ? tripDates : {}),
	})}`;

	useEffect(() => {
		if (previousMemberId.current !== user._id) {
			previousMemberId.current = user._id;
			void refetch().catch(() => undefined);
		}
	}, [user._id, refetch]);

	return (
		<HomeSection id={id} eyebrow={t('Destinations')} title={t(title)} titleHref={catalogHref} subtitle={t(subtitle)}>
			<HomeCollectionState
				skeleton
				loading={loading && !resorts.length}
				error={Boolean(error)}
				empty={!resorts.length}
				retry={refetch}
			/>
			{!error && resorts.length > 0 && (
				<HomeCarousel label={t(title)}>
					{resorts.map((resort) => (
						<HomeResortCard
							key={resort._id}
							resort={resort}
							tripDates={tripDates}
							pending={pendingIds.has(resort._id)}
							onFavorite={onFavorite}
						/>
					))}
				</HomeCarousel>
			)}
			{!error && resorts.length > 0 && (
				<div className="home-collection-link">
					<Button component={Link} href={catalogHref}>
						{t('Explore resorts')}
					</Button>
				</div>
			)}
		</HomeSection>
	);
};

export default ResortCollection;
