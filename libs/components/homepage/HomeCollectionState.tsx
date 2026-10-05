import React from 'react';
import { Alert, Button, CircularProgress } from '@mui/material';
import { useTranslation } from 'next-i18next';

interface HomeCollectionStateProps {
	loading: boolean;
	error: boolean;
	empty: boolean;
	retry: () => Promise<unknown>;
}

const HomeCollectionState = ({ loading, error, empty, retry }: HomeCollectionStateProps) => {
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
				<CircularProgress size={28} />
			</div>
		);
	if (empty) return <Alert severity="info">{t('No items to show yet.')}</Alert>;
	return null;
};

export default HomeCollectionState;
