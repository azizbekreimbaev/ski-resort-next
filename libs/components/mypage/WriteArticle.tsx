import React from 'react';
import { Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import dynamic from 'next/dynamic';
const TuiEditor = dynamic(() => import('../community/Teditor'), { ssr: false });
export default function WriteArticle() {
	const { t } = useTranslation('common');
	return (
		<Stack spacing={3}>
			<Typography component="h1" variant="h4">
				{t('Write an Article')}
			</Typography>
			<Typography color="text.secondary">{t('Share your winter experiences with the community.')}</Typography>
			<TuiEditor />
		</Stack>
	);
}
