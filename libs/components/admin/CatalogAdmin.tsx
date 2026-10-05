import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
	Alert,
	Button,
	MenuItem,
	Pagination,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import { useTranslation } from 'next-i18next';
import { GET_ALL_RESORTS_BY_ADMIN, GET_ALL_EQUIPMENTS_BY_ADMIN } from '../../../apollo/admin/query';
import { REMOVE_RESORT_BY_ADMIN, REMOVE_EQUIPMENT_BY_ADMIN } from '../../../apollo/admin/mutation';
import { ResortSearchResult } from '../../types/resort/resort';
import { EquipmentPreview } from '../../types/equipment/equipment';
import { CatalogList } from '../../types/catalog';
import CatalogEditor from './CatalogEditor';
import HomeCollectionState from '../homepage/HomeCollectionState';

export default function CatalogAdmin({ domain }: { domain: 'resort' | 'equipment' }) {
	const { t } = useTranslation('common');
	const [page, setPage] = useState(1);
	const [text, setText] = useState('');
	const [status, setStatus] = useState('');
	const [editor, setEditor] = useState<{ selected: ResortSearchResult | EquipmentPreview | null } | null>(null);
	const [error, setError] = useState('');
	const key = domain === 'resort' ? 'getAllResortsByAdmin' : 'getAllEquipmentsByAdmin';
	const {
		data,
		loading,
		error: queryError,
		refetch,
	} = useQuery<{
		getAllResortsByAdmin?: CatalogList<ResortSearchResult>;
		getAllEquipmentsByAdmin?: CatalogList<EquipmentPreview>;
	}>(domain === 'resort' ? GET_ALL_RESORTS_BY_ADMIN : GET_ALL_EQUIPMENTS_BY_ADMIN, {
		variables: {
			input: {
				page,
				limit: 10,
				sort: 'createdAt',
				direction: 'DESC',
				search: {
					...(text ? { text } : {}),
					...(status ? { [domain === 'resort' ? 'resortStatus' : 'equipmentStatus']: status } : {}),
				},
			},
		},
		fetchPolicy: 'network-only',
	});
	const [remove, state] = useMutation(domain === 'resort' ? REMOVE_RESORT_BY_ADMIN : REMOVE_EQUIPMENT_BY_ADMIN);
	const deleteItem = async (id: string) => {
		if (!window.confirm(t('Permanently remove this resource? This cannot be undone.'))) return;
		try {
			await remove({ variables: domain === 'resort' ? { resortId: id } : { equipmentId: id } });
			await refetch();
			setError('');
		} catch (failure) {
			setError(failure instanceof Error ? failure.message : t('Unable to save'));
		}
	};
	const result = data?.[key];
	const total = result?.metaCounter?.[0]?.total ?? 0;
	return (
		<Stack className="catalog-admin" spacing={3}>
			<Typography component="h1" variant="h4">
				{t(domain === 'resort' ? 'Resorts' : 'Equipments')}
			</Typography>
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
				<TextField
					label={t('Search')}
					value={text}
					onChange={(event) => {
						setText(event.target.value);
						setPage(1);
					}}
				/>
				<TextField
					select
					label={t('Status')}
					value={status}
					sx={{ minWidth: 180 }}
					onChange={(event) => {
						setStatus(event.target.value);
						setPage(1);
					}}
				>
					<MenuItem value="">{t('All')}</MenuItem>
					{(domain === 'resort' ? ['ACTIVE', 'SOLD_OUT', 'DELETE'] : ['AVAILABLE', 'MAINTENANCE', 'DELETE']).map(
						(value) => (
							<MenuItem key={value} value={value}>
								{t(value)}
							</MenuItem>
						),
					)}
				</TextField>
				<Button variant="contained" onClick={() => setEditor({ selected: null })}>
					{t('Create')}
				</Button>
			</Stack>
			<HomeCollectionState loading={loading} error={Boolean(queryError)} empty={!result?.list.length} retry={refetch} />
			{error && <Alert severity="error">{error}</Alert>}
			<div style={{ overflowX: 'auto' }}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>{t('Name')}</TableCell>
							<TableCell>{t('Status')}</TableCell>
							<TableCell>{t('Actions')}</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{result?.list.map((item) => (
							<TableRow key={item._id}>
								<TableCell>{'resortTitle' in item ? item.resortTitle : item.equipmentName}</TableCell>
								<TableCell>{'resortStatus' in item ? item.resortStatus : item.equipmentStatus}</TableCell>
								<TableCell>
									<Button onClick={() => setEditor({ selected: item })}>{t('Edit')}</Button>
									<Button color="error" disabled={state.loading} onClick={() => void deleteItem(item._id)}>
										{t('Permanently remove')}
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			{total > 10 && (
				<Pagination page={page} count={Math.ceil(total / 10)} onChange={(_event, next) => setPage(next)} />
			)}
			{editor && (
				<CatalogEditor domain={domain} selected={editor.selected} close={() => setEditor(null)} saved={refetch} />
			)}
		</Stack>
	);
}
