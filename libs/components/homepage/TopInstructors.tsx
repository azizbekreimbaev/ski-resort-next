import React from 'react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Button } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { GET_INSTRUCTORS } from '../../../apollo/user/query';
import { Direction } from '../../enums/common.enum';
import { InstructorsInquiry } from '../../types/member/instructor';
import { CatalogList, CatalogMember } from '../../types/catalog';
import { userVar } from '../../../apollo/store';
import HomeSection from './HomeSection';
import HomeCarousel from './HomeCarousel';
import HomeCollectionState from './HomeCollectionState';
import { HomeInstructorCard } from './HomeCatalogCards';

const input: InstructorsInquiry = { page: 1, limit: 6, sort: 'memberRank', direction: Direction.DESC, search: {} };

const TopInstructors = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const previousMember = useRef(user._id);
	const { data, loading, error, refetch } = useQuery<
		{ getInstructors: CatalogList<CatalogMember> },
		{ input: InstructorsInquiry }
	>(GET_INSTRUCTORS, {
		variables: { input },
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
	});
	const instructors = data?.getInstructors.list ?? [];
	useEffect(() => {
		if (previousMember.current !== user._id) {
			previousMember.current = user._id;
			void refetch().catch(() => undefined);
		}
	}, [user._id, refetch]);
	return (
		<HomeSection
			id="instructors"
			eyebrow={t('Learn on the slopes')}
			title={t('Meet the instructors')}
			subtitle={t('Explore instructor experience, languages and teaching levels.')}
			action={
				<Link href="/instructor">
					<Button>{t('View Instructors')}</Button>
				</Link>
			}
		>
			<HomeCollectionState
				skeleton
				loading={loading && !instructors.length}
				error={Boolean(error)}
				empty={!instructors.length}
				retry={refetch}
			/>
			{!error && instructors.length > 0 && (
				<HomeCarousel label={t('Meet the instructors')}>
					{instructors.map((instructor) => (
						<HomeInstructorCard key={instructor._id} instructor={instructor} />
					))}
				</HomeCarousel>
			)}
		</HomeSection>
	);
};

export default TopInstructors;
