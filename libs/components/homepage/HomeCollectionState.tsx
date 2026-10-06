import React from 'react';
import { Alert, Button, CircularProgress, Skeleton } from '@mui/material';
import { useTranslation } from 'next-i18next';

interface HomeCollectionStateProps {
	loading: boolean;
	error: boolean;
	empty: boolean;
	retry: () => Promise<unknown>;
	skeleton?: boolean;
}

const HomeCollectionState = ({ loading, error, empty, retry, skeleton = false }: HomeCollectionStateProps) => {
	const { t } = useTranslation('common');
	if (error)
		return (
			<Alert
				severity="error"
				action={
					<Button color="inherit" onClick={() => void retry().catch(() => undefined)}>
						{t('Retry')}
					</Button>
				}
			>
				{t('Unable to load this collection. Please try again.')}
			</Alert>
		);
	if (loading)
		return (
			<div className="home-collection-loading" role="status" aria-label={t('Loading collection')}>
				{skeleton ? (
					[0, 1, 2, 3].map((item) => (
						<div className="home-loading-card" key={item}>
							<Skeleton variant="rectangular" height={190} />
							<Skeleton width="75%" height={36} />
							<Skeleton width="50%" />
							<Skeleton width="90%" />
						</div>
					))
				) : (
					<CircularProgress size={28} />
				)}
			</div>
		);
	if (empty) return <Alert severity="info">{t('No items to show yet.')}</Alert>;
	return null;
};

export default HomeCollectionState;
