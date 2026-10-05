import React from 'react';
import Link from 'next/link';
import { Button, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';

const HomeCTA = () => {
	const { t } = useTranslation('common');
	return (
		<section className="home-winter-cta" aria-labelledby="home-cta-title">
			<div className="home-section-container">
				<Typography id="home-cta-title" component="h2" variant="h3">
					{t('Ready for your next winter adventure?')}
				</Typography>
				<Typography>{t('Explore mountains, equipment and instructor profiles.')}</Typography>
				<div className="home-cta-buttons">
					<Link href="/resort">
						<Button variant="contained">{t('Explore resorts')}</Button>
					</Link>
					<Link href="/equipment">
						<Button variant="outlined">{t('Browse Equipment')}</Button>
					</Link>
				</div>
			</div>
		</section>
	);
};

export default HomeCTA;
