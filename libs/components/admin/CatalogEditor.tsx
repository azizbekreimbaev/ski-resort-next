import React, { useState } from 'react';
import { Alert, Button, Dialog, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { useMutation } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import {
	CREATE_RESORT,
	CREATE_EQUIPMENT,
	UPDATE_RESORT_BY_ADMIN,
	UPDATE_EQUIPMENT_BY_ADMIN,
} from '../../../apollo/admin/mutation';
import { ResortSearchResult } from '../../types/resort/resort';
import { EquipmentPreview } from '../../types/equipment/equipment';
import { ResortFacilities, ResortLevel, ResortLocation } from '../../enums/resort.enum';
import { EquipmentAudience, EquipmentCategory } from '../../enums/equipment.enum';
import { uploadImages } from '../../uploadImages';
import ResortSelect from '../common/ResortSelect';

export default function CatalogEditor({
	domain,
	selected,
	close,
	saved,
}: {
	domain: 'resort' | 'equipment';
	selected: ResortSearchResult | EquipmentPreview | null;
	close: () => void;
	saved: () => Promise<unknown>;
}) {
	const { t } = useTranslation('common');
	const resort = selected && 'resortTitle' in selected ? selected : null;
	const equipment = selected && 'equipmentName' in selected ? selected : null;
	const [form, setForm] = useState<Record<string, string>>(
		(): Record<string, string> =>
			domain === 'resort'
				? {
						resortTitle: resort?.resortTitle ?? '',
						resortAddress: resort?.resortAddress ?? '',
						resortLocation: resort?.resortLocation ?? Object.values(ResortLocation)[0],
						resortLevel: resort?.resortLevel ?? '',
						resortPricePerDay: String(resort?.resortPricePerDay ?? 0),
						resortMinDays: String(resort?.resortMinDays ?? 2),
						resortDesc: resort?.resortDesc ?? '',
						resortStatus: resort?.resortStatus ?? 'ACTIVE',
				  }
				: {
						equipmentName: equipment?.equipmentName ?? '',
						equipmentBrand: equipment?.equipmentBrand ?? '',
						equipmentSize: equipment?.equipmentSize ?? '',
						equipmentCategory: equipment?.equipmentCategory ?? 'SKI',
						equipmentAudience: equipment?.equipmentAudience ?? 'ALL',
						equipmentQuantity: String(equipment?.equipmentQuantity ?? 0),
						equipmentPurchasable: String(equipment?.equipmentPurchasable ?? false),
						equipmentPurchasePrice:
							equipment?.equipmentPurchasePrice == null ? '' : String(equipment.equipmentPurchasePrice),
						equipmentDesc: equipment?.equipmentDesc ?? '',
						equipmentStatus: equipment?.equipmentStatus ?? 'AVAILABLE',
						resortId: equipment?.resortId ?? '',
				  },
	);
	const [images, setImages] = useState<string[]>(resort?.resortImages ?? equipment?.equipmentImages ?? []);
	const [facilities, setFacilities] = useState<string[]>(resort?.resortFacilities ?? []);
	const [rates, setRates] = useState(
		(equipment?.equipmentRentalRates ?? [{ durationHours: 3, price: 0 }]).map((rate) => ({
			hours: String(rate.durationHours),
			price: String(rate.price),
		})),
	);
	const [error, setError] = useState('');
	const [uploading, setUploading] = useState(false);
	const [mutate, state] = useMutation(
		domain === 'resort'
			? selected
				? UPDATE_RESORT_BY_ADMIN
				: CREATE_RESORT
			: selected
			? UPDATE_EQUIPMENT_BY_ADMIN
			: CREATE_EQUIPMENT,
	);
	const options: Record<string, string[]> = {
		resortLocation: Object.values(ResortLocation),
		resortLevel: ['', ...Object.values(ResortLevel)],
		resortStatus: ['ACTIVE', 'SOLD_OUT', 'DELETE'],
		equipmentCategory: Object.values(EquipmentCategory),
		equipmentAudience: Object.values(EquipmentAudience),
		equipmentStatus: ['AVAILABLE', 'MAINTENANCE', 'DELETE'],
		equipmentPurchasable: ['false', 'true'],
	};
	const numbers = ['resortPricePerDay', 'resortMinDays', 'equipmentQuantity', 'equipmentPurchasePrice'];
	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		const input: Record<string, unknown> = {};
		Object.entries(form).forEach(([key, value]) => {
			if (key === 'resortStatus' && !selected) return;
			input[key] =
				key === 'equipmentPurchasable'
					? value === 'true'
					: numbers.includes(key)
					? value === ''
						? null
						: Number(value)
					: ['resortLevel', 'resortDesc', 'equipmentBrand', 'equipmentSize', 'equipmentDesc', 'resortId'].includes(key)
					? value || null
					: value.trim();
		});
		if (domain === 'resort') {
			input.resortImages = images;
			input.resortFacilities = facilities;
		} else {
			const packages = rates.map((rate) => ({ durationHours: Number(rate.hours), price: Number(rate.price) }));
			if (
				!packages.length ||
				packages.some(
					(rate) =>
						!Number.isInteger(rate.durationHours) ||
						rate.durationHours < 1 ||
						rate.durationHours > 2147483647 ||
						!Number.isFinite(rate.price) ||
						rate.price < 0,
				) ||
				new Set(packages.map((rate) => rate.durationHours)).size !== packages.length ||
				(input.equipmentPurchasable && input.equipmentPurchasePrice == null)
			) {
				setError(t('Please check rental packages and purchase price'));
				return;
			}
			input.equipmentRentalRates = packages;
			input.equipmentImages = images;
			if (!input.equipmentPurchasable) input.equipmentPurchasePrice = null;
		}
		if (selected) input._id = selected._id;
		try {
			await mutate({ variables: { input } });
			await saved();
			close();
		} catch (failure) {
			setError(failure instanceof Error ? failure.message : t('Unable to save'));
		}
	};
	const upload = async (files: FileList | null) => {
		if (!files?.length) return;
		setUploading(true);
		try {
			const uploaded = await uploadImages(Array.from(files), domain);
			setImages((previous) => [...previous, ...uploaded]);
			setError('');
		} catch {
			setError(t('Upload failed'));
		} finally {
			setUploading(false);
		}
	};
	return (
		<Dialog open onClose={state.loading ? undefined : close} fullWidth maxWidth="sm">
			<DialogTitle>
				{t(selected ? 'Edit' : 'Create')} {t(domain === 'resort' ? 'Resort' : 'Equipment')}
			</DialogTitle>
			<DialogContent>
				<Stack component="form" onSubmit={submit} spacing={2} sx={{ pt: 2 }}>
					{Object.entries(form).map(([key, value]) =>
						key === 'resortId' ? (
							<ResortSelect key={key} value={value} onChange={(id) => setForm({ ...form, resortId: id })} />
						) : key === 'resortStatus' && !selected ? null : (
							<TextField
								key={key}
								label={t(key)}
								select={Boolean(options[key])}
								type={numbers.includes(key) ? 'number' : 'text'}
								required={[
									'resortTitle',
									'resortAddress',
									'resortPricePerDay',
									'resortMinDays',
									'equipmentName',
									'equipmentQuantity',
								].includes(key)}
								multiline={key.endsWith('Desc')}
								inputProps={{
									min: key === 'resortMinDays' ? 2 : 0,
									step: key === 'resortMinDays' || key === 'equipmentQuantity' ? 1 : 'any',
								}}
								value={value}
								onChange={(event) => setForm({ ...form, [key]: event.target.value })}
							>
								{options[key]?.map((option) => (
									<MenuItem key={option} value={option}>
										{option ? t(option) : t('Not configured')}
									</MenuItem>
								))}
							</TextField>
						),
					)}
					{domain === 'resort' ? (
						<TextField
							select
							label={t('Facilities')}
							SelectProps={{ multiple: true }}
							value={facilities}
							onChange={(event) =>
								setFacilities(
									typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value,
								)
							}
						>
							{Object.values(ResortFacilities).map((facility) => (
								<MenuItem key={facility} value={facility}>
									{t(facility)}
								</MenuItem>
							))}
						</TextField>
					) : (
						<Stack spacing={2}>
							{rates.map((rate, index) => (
								<Stack key={index} direction="row" spacing={1}>
									<TextField
										required
										type="number"
										label={t('Hours')}
										value={rate.hours}
										inputProps={{ min: 1, step: 1 }}
										onChange={(event) =>
											setRates(
												rates.map((current, i) => (i === index ? { ...current, hours: event.target.value } : current)),
											)
										}
									/>
									<TextField
										required
										type="number"
										label={t('Price')}
										value={rate.price}
										inputProps={{ min: 0, step: 'any' }}
										onChange={(event) =>
											setRates(
												rates.map((current, i) => (i === index ? { ...current, price: event.target.value } : current)),
											)
										}
									/>
									<Button onClick={() => setRates(rates.filter((_current, i) => i !== index))}>{t('Remove')}</Button>
								</Stack>
							))}
							<Button onClick={() => setRates([...rates, { hours: '', price: '' }])}>{t('Add rental package')}</Button>
						</Stack>
					)}
					<Button component="label" disabled={uploading}>
						{t('Upload images')}
						<input
							hidden
							multiple
							type="file"
							accept="image/jpeg,image/png"
							onChange={(event) => void upload(event.target.files)}
						/>
					</Button>
					{images.map((image, index) => (
						<Stack direction="row" key={`${image}-${index}`}>
							<span style={{ overflowWrap: 'anywhere' }}>{image}</span>
							<Button onClick={() => setImages(images.filter((_image, i) => i !== index))}>{t('Remove')}</Button>
						</Stack>
					))}
					{error && <Alert severity="error">{error}</Alert>}
					<Button variant="contained" type="submit" disabled={state.loading || uploading}>
						{t('Save')}
					</Button>
					<Button onClick={close} disabled={state.loading}>
						{t('Cancel')}
					</Button>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}
