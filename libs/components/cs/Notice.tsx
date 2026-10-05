import React from 'react';
import { Alert, Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
export default function Notice() {
	const { t } = useTranslation('common');
	return (
		<Stack spacing={2}>
			<Typography variant="h5">{t('Service information')}</Typography>
			<Alert severity="info">
				{t('Explore resorts, equipment packages and instructors. Booking and checkout are not available yet.')}
			</Alert>
		</Stack>
	);
}
