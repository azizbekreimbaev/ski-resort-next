import React from 'react';
import { Alert, Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
function Page() {
	const { t } = useTranslation('common');
	return (
		<Stack spacing={3}>
			<Typography component="h1" variant="h4">
				{t('Support administration')}
			</Typography>
			<Alert severity="info">
				{t('This backend does not expose support administration operations. No records or actions are available.')}
			</Alert>
		</Stack>
	);
}
export default withAdminLayout(Page);

export { getStaticProps } from '../../../libs/pageTranslations';
