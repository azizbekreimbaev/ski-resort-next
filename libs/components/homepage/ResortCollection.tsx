import React, { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Button } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { GET_RESORTS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { defaultResortInquiry } from '../../resortSearch';
import { ResortSearchData } from '../../types/resort/resort';
import { ResortsInquiry, ResortSort } from '../../types/resort/resort.input';
import HomeSection from './HomeSection';
import HomeCarousel from './HomeCarousel';
import HomeCollectionState from './HomeCollectionState';
import ResortCard from './ResortCard';

export interface ResortInteractionProps {
	pendingIds: Set<string>;
	onFavorite: (id: string) => Promise<void>;
}

interface ResortCollectionProps extends ResortInteractionProps {
	id: string;
	title: string;
	subtitle: string;
	sort: ResortSort;
}

const ResortCollection = ({ id, title, subtitle, sort, pendingIds, onFavorite }: ResortCollectionProps) => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const previousMemberId = useRef(user._id);
	const input = useMemo<ResortsInquiry>(() => ({ ...defaultResortInquiry(), limit: 6, sort }), [sort]);
	const { data, loading, error, refetch } = useQuery<ResortSearchData, { input: ResortsInquiry }>(GET_RESORTS, {
		variables: { input },
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
	});
	const resorts = data?.getResorts.list ?? [];

	useEffect(() => {
		if (previousMemberId.current !== user._id) {
			previousMemberId.current = user._id;
			void refetch().catch(() => undefined);
		}
	}, [user._id, refetch]);

	return (
		<HomeSection
			id={id}
			title={t(title)}
			subtitle={t(subtitle)}
			action={
				<Link href={{ pathname: '/resort', query: { input: JSON.stringify({ ...input, limit: 9 }) } }}>
					<Button>{t('Explore resorts')}</Button>
				</Link>
			}
		>
			<HomeCollectionState loading={loading} error={Boolean(error)} empty={!resorts.length} retry={refetch} />
			{!error && resorts.length > 0 && (
				<HomeCarousel label={t(title)}>
					{resorts.map((resort) => (
						<ResortCard key={resort._id} resort={resort} pending={pendingIds.has(resort._id)} onFavorite={onFavorite} />
					))}
				</HomeCarousel>
			)}
		</HomeSection>
	);
};

export default ResortCollection;
