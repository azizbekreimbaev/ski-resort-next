import React from 'react';
import Link from 'next/link';
import { Typography } from '@mui/material';
import DownhillSkiingOutlinedIcon from '@mui/icons-material/DownhillSkiingOutlined';
import { useTranslation } from 'next-i18next';
import { ResortLevel } from '../../enums/resort.enum';
import { defaultResortInquiry } from '../../resortSearch';
import HomeSection from './HomeSection';

const ResortDifficultySection = () => {
	const { t } = useTranslation('common');
	return (
		<HomeSection
			id="resort-difficulty"
			title={t('Find your ski level')}
			subtitle={t('Discover resorts for your preferred terrain.')}
		>
			<div className="home-difficulty-grid">
				{Object.values(ResortLevel).map((level) => (
					<Link
						key={level}
						href={{
							pathname: '/resort',
							query: { input: JSON.stringify({ ...defaultResortInquiry(), search: { levelList: [level] } }) },
						}}
					>
						<div className={`home-difficulty-tile difficulty-${level.toLowerCase()}`}>
							<DownhillSkiingOutlinedIcon />
							<Typography component="h3" variant="h6">
								{t(level)}
							</Typography>
						</div>
					</Link>
				))}
			</div>
		</HomeSection>
	);
};

export default ResortDifficultySection;
