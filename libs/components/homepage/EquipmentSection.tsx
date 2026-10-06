import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Button, Chip } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { userVar } from '../../../apollo/store';
import { GET_EQUIPMENTS } from '../../../apollo/user/query';
import { EquipmentCategory } from '../../enums/equipment.enum';
import { Direction } from '../../enums/common.enum';
import { EquipmentPreviewData } from '../../types/equipment/equipment';
import { EquipmentPreviewInquiry } from '../../types/equipment/equipment.input';
import HomeSection from './HomeSection';
import HomeCarousel from './HomeCarousel';
import HomeCollectionState from './HomeCollectionState';
import { HomeEquipmentCard } from './HomeCatalogCards';

const categories = [
	EquipmentCategory.SKI,
	EquipmentCategory.SNOWBOARD,
	EquipmentCategory.BOOTS,
	EquipmentCategory.HELMET,
	EquipmentCategory.POLES,
	EquipmentCategory.CLOTHING,
];

const EquipmentSection = () => {
	const user = useReactiveVar(userVar);
	const lastMember = useRef(user._id);
	const { t } = useTranslation('common');
	const [category, setCategory] = useState<EquipmentCategory | ''>('');
	const input = useMemo<EquipmentPreviewInquiry>(
		() => ({
			page: 1,
			limit: 6,
			sort: 'createdAt',
			direction: Direction.DESC,
			search: category ? { categoryList: [category] } : {},
		}),
		[category],
	);
	const { data, loading, error, refetch } = useQuery<EquipmentPreviewData, { input: EquipmentPreviewInquiry }>(
		GET_EQUIPMENTS,
		{
			variables: { input },
			fetchPolicy: 'cache-and-network',
			notifyOnNetworkStatusChange: true,
		},
	);
	useEffect(() => {
		if (lastMember.current !== user._id) {
			lastMember.current = user._id;
			void refetch().catch(() => undefined);
		}
	}, [user._id, refetch]);
	const equipments = data?.getEquipments.list ?? [];
	return (
		<HomeSection
			id="equipment-preview"
			eyebrow={t('Gear up')}
			title={t('Equipment for the mountain')}
			subtitle={t('Explore rental packages for skiing and snowboarding.')}
			action={
				<Link href="/equipment">
					<Button>{t('Browse Equipment')}</Button>
				</Link>
			}
		>
			<div className="home-category-controls" role="group" aria-label={t('Equipment categories')}>
				{['', ...categories].map((value) => (
					<Chip
						key={value || 'all'}
						label={t(value || 'All equipment')}
						color={category === value ? 'primary' : 'default'}
						aria-pressed={category === value}
						onClick={() => {
							setCategory(value as EquipmentCategory | '');
						}}
					/>
				))}
			</div>
			<HomeCollectionState
				skeleton
				loading={loading && !equipments.length}
				error={Boolean(error)}
				empty={!equipments.length}
				retry={refetch}
			/>
			{!error && equipments.length > 0 && (
				<HomeCarousel label={t('Equipment for the mountain')}>
					{equipments.map((equipment) => (
						<HomeEquipmentCard key={equipment._id} equipment={equipment} />
					))}
				</HomeCarousel>
			)}
		</HomeSection>
	);
};

export default EquipmentSection;
