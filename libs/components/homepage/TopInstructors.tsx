import React from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { Button } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { GET_INSTRUCTORS } from '../../../apollo/user/query';
import { Direction } from '../../enums/common.enum';
import { InstructorPreviewData, InstructorsInquiry } from '../../types/member/instructor';
import HomeSection from './HomeSection';
import HomeCarousel from './HomeCarousel';
import HomeCollectionState from './HomeCollectionState';
import InstructorCard from './InstructorCard';

const input: InstructorsInquiry = { page: 1, limit: 6, sort: 'memberRank', direction: Direction.DESC, search: {} };

const TopInstructors = () => {
	const { t } = useTranslation('common');
	const { data, loading, error, refetch } = useQuery<InstructorPreviewData, { input: InstructorsInquiry }>(
		GET_INSTRUCTORS,
		{
			variables: { input },
			fetchPolicy: 'cache-and-network',
			notifyOnNetworkStatusChange: true,
		},
	);
	const instructors = data?.getInstructors.list ?? [];
	return (
		<HomeSection
			id="instructors"
			title={t('Meet the instructors')}
			subtitle={t('Explore instructor experience, languages and teaching levels.')}
			action={
				<Link href="/instructor">
					<Button>{t('View Instructors')}</Button>
				</Link>
			}
		>
			<HomeCollectionState loading={loading} error={Boolean(error)} empty={!instructors.length} retry={refetch} />
			{!error && instructors.length > 0 && (
				<HomeCarousel label={t('Meet the instructors')}>
					{instructors.map((instructor) => (
						<InstructorCard key={instructor._id} instructor={instructor} />
					))}
				</HomeCarousel>
			)}
		</HomeSection>
	);
};

export default TopInstructors;
