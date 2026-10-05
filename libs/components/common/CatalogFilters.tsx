import React, { useState } from 'react';
import { Alert, Button, Drawer, MenuItem, Stack, TextField } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { CatalogDomain, CatalogInquiry } from '../../types/catalog';
import { catalogSorts, defaultInquiry, parseCatalogInquiry } from '../../catalogSearch';
import { ResortFacilities, ResortLevel, ResortLocation } from '../../enums/resort.enum';
import { EquipmentAudience, EquipmentCategory } from '../../enums/equipment.enum';
import ResortSelect from './ResortSelect';

export default function CatalogFilters({
	domain,
	input,
	onApply,
}: {
	domain: CatalogDomain;
	input: CatalogInquiry;
	onApply: (input: CatalogInquiry) => void;
}) {
	const { t } = useTranslation('common');
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState(input);
	const [error, setError] = useState('');
	React.useEffect(() => setDraft(input), [input]);
	const change = (key: string, value: CatalogInquiry['search'][string] | undefined) =>
		setDraft((previous) => {
			const search = { ...previous.search };
			if (value === undefined || value === '' || (Array.isArray(value) && !value.length)) delete search[key];
			else search[key] = value;
			if (key === 'rentalDurationHours' && !value) delete search.rentalPricesRange;
			if (key === 'equipmentPurchasable' && value === false) delete search.purchasePricesRange;
			return { ...previous, search };
		});
	const multi = (key: string, label: string, values: string[]) => (
		<TextField
			key={key}
			select
			label={t(label)}
			value={draft.search[key] ?? []}
			SelectProps={{ multiple: true }}
			onChange={(event) =>
				change(key, typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value)
			}
		>
			{values.map((value) => (
				<MenuItem key={value} value={value}>
					{t(value)}
				</MenuItem>
			))}
		</TextField>
	);
	const range = (key: string, label: string) => {
		const value = draft.search[key];
		const selected = typeof value === 'object' && !Array.isArray(value) ? value : undefined;
		return (
			<Stack key={key} direction="row" spacing={1}>
				<TextField
					type="number"
					label={t(`${label} minimum`)}
					value={selected?.start ?? ''}
					inputProps={{ min: 0 }}
					onChange={(event) =>
						change(
							key,
							event.target.value === ''
								? undefined
								: { start: Number(event.target.value), end: selected?.end ?? Number(event.target.value) },
						)
					}
				/>
				<TextField
					type="number"
					label={t(`${label} maximum`)}
					value={selected?.end ?? ''}
					inputProps={{ min: 0 }}
					onChange={(event) =>
						change(
							key,
							event.target.value === '' ? undefined : { start: selected?.start ?? 0, end: Number(event.target.value) },
						)
					}
				/>
			</Stack>
		);
	};
	const apply = () => {
		const duration = draft.search.rentalDurationHours;
		if (
			duration !== undefined &&
			(typeof duration !== 'number' || !Number.isInteger(duration) || duration < 1 || duration > 2147483647)
		) {
			setError(t('Choose a positive whole number of rental hours'));
			return;
		}
		for (const key of ['pricesRange', 'rentalPricesRange', 'purchasePricesRange']) {
			const value = draft.search[key];
			if (
				value &&
				typeof value === 'object' &&
				!Array.isArray(value) &&
				(value.start < 0 || value.end < value.start || !Number.isFinite(value.start) || !Number.isFinite(value.end))
			) {
				setError(t('Enter a valid price range'));
				return;
			}
		}
		if (draft.search.rentalPricesRange && !draft.search.rentalDurationHours) {
			setError(t('Choose rental duration before filtering prices'));
			return;
		}
		onApply(parseCatalogInquiry(domain, JSON.stringify({ ...draft, page: 1 })));
		setError('');
		setOpen(false);
	};
	const controls = (
		<Stack className="catalog-filter-controls" spacing={2}>
			<TextField
				label={t(domain === 'instructor' ? 'Search nickname' : 'Search')}
				value={draft.search.text ?? ''}
				onChange={(event) => change('text', event.target.value)}
			/>
			{domain === 'resort' && (
				<>
					{multi('locationList', 'Location', Object.values(ResortLocation))}
					{multi('levelList', 'Ski level', Object.values(ResortLevel))}
					{multi('facilities', 'Facilities', Object.values(ResortFacilities))}
					{range('pricesRange', 'Daily price')}
				</>
			)}
			{domain === 'equipment' && (
				<>
					{multi('categoryList', 'Category', Object.values(EquipmentCategory))}
					{multi('audienceList', 'Audience', Object.values(EquipmentAudience))}
					<TextField
						label={t('Sizes separated by commas')}
						helperText={t('Boot sizes use Mondopoint / CM')}
						value={Array.isArray(draft.search.sizeList) ? draft.search.sizeList.join(', ') : ''}
						onChange={(event) =>
							change(
								'sizeList',
								event.target.value
									.split(',')
									.map((size) => size.trim())
									.filter(Boolean),
							)
						}
					/>
					<TextField
						label={t('Brand')}
						value={draft.search.equipmentBrand ?? ''}
						onChange={(event) => change('equipmentBrand', event.target.value)}
					/>
					<ResortSelect
						value={typeof draft.search.resortId === 'string' ? draft.search.resortId : ''}
						onChange={(id) => change('resortId', id)}
					/>
					<TextField
						select
						label={t('Purchase capability')}
						value={draft.search.equipmentPurchasable === undefined ? 'all' : String(draft.search.equipmentPurchasable)}
						onChange={(event) =>
							change('equipmentPurchasable', event.target.value === 'all' ? undefined : event.target.value === 'true')
						}
					>
						<MenuItem value="all">{t('All')}</MenuItem>
						<MenuItem value="false">{t('Rental only')}</MenuItem>
						<MenuItem value="true">{t('Purchasable')}</MenuItem>
					</TextField>
					<TextField
						type="number"
						label={t('Rental duration (hours)')}
						inputProps={{ min: 1, step: 1 }}
						value={draft.search.rentalDurationHours ?? ''}
						onChange={(event) =>
							change('rentalDurationHours', event.target.value ? Number(event.target.value) : undefined)
						}
					/>
					{range('rentalPricesRange', 'Rental price')}
					{range('purchasePricesRange', 'Purchase price')}
				</>
			)}
			<TextField
				select
				label={t('Sort')}
				value={draft.sort}
				onChange={(event) => setDraft({ ...draft, sort: event.target.value })}
			>
				{catalogSorts[domain].map((sort) => (
					<MenuItem key={sort} value={sort}>
						{t(sort)}
					</MenuItem>
				))}
			</TextField>
			<TextField
				select
				label={t('Order')}
				value={draft.direction}
				onChange={(event) => setDraft({ ...draft, direction: event.target.value === 'ASC' ? 'ASC' : 'DESC' })}
			>
				<MenuItem value="DESC">{t('Descending')}</MenuItem>
				<MenuItem value="ASC">{t('Ascending')}</MenuItem>
			</TextField>
			{error && <Alert severity="error">{error}</Alert>}
			<Button variant="contained" onClick={apply}>
				{t('Apply filters')}
			</Button>
			<Button
				onClick={() => {
					const cleared = defaultInquiry(domain);
					setDraft(cleared);
					onApply(cleared);
					setError('');
					setOpen(false);
				}}
			>
				{t('Clear Filters')}
			</Button>
		</Stack>
	);
	return (
		<>
			<Button className="catalog-mobile-filter-button" onClick={() => setOpen(true)}>
				{t('Filters')}
			</Button>
			<aside className="catalog-desktop-filters">{controls}</aside>
			<Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
				<Stack sx={{ width: { xs: '90vw', sm: 380 }, p: 3 }}>
					<Button onClick={() => setOpen(false)}>{t('Close')}</Button>
					{controls}
				</Stack>
			</Drawer>
		</>
	);
}
