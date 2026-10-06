import React from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { GET_RESORT } from '../../../apollo/user/query';
import { ResortSearchResult } from '../../types/resort/resort';
import { validId } from '../../catalogSearch';
export default function AssociatedResort({ id }: { id: string }) {
	const { t } = useTranslation('common');
	const { data, loading, error, refetch } = useQuery<{ getResort: ResortSearchResult }>(GET_RESORT, {
		variables: { resortId: id },
		skip: !validId(id),
	});
	return (
		<Stack spacing={1}>
			<Typography component="h2" variant="h5">
				{t('Associated Resort')}
			</Typography>
			{loading ? (
				<Typography>{t('Loading')}</Typography>
			) : error || !data ? (
				<Alert severity="info">
					{t('Associated resort is unavailable')} <Button onClick={() => void refetch()}>{t('Retry')}</Button>
				</Alert>
			) : (
				<>
					<Typography>{data.getResort.resortTitle}</Typography>
					<Typography color="text.secondary">
						{t(data.getResort.resortLocation)} · {data.getResort.resortAddress}
					</Typography>
					<Button component={Link} href={'/resort/detail?id=' + id}>
						{t('View Resort')}
					</Button>
				</>
			)}
		</Stack>
	);
}
