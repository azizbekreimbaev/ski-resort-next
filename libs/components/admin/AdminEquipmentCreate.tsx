import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { Alert, Button } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { CREATE_EQUIPMENT, UPDATE_EQUIPMENT_BY_ADMIN } from '../../../apollo/admin/mutation';
import { GET_ALL_EQUIPMENTS_BY_ADMIN } from '../../../apollo/admin/query';
import { EquipmentAudience, EquipmentCategory } from '../../enums/equipment.enum';
import { EquipmentPreview } from '../../types/equipment/equipment';
import { uploadImages } from '../../uploadImages';
import ResortSelect from '../common/ResortSelect';
import { EquipmentAdminCard, EquipmentResult, equipmentImage } from './AdminEquipment';
export default function AdminEquipmentCreate() {
	const router = useRouter();
	const { t } = useTranslation('common');
	if (!router.isReady) return <p role="status">{t('Loading...')}</p>;
	const id = router.query.id;
	if (id === undefined) return <EquipmentForm key="create" />;
	if (typeof id !== 'string' || !/^[a-f0-9]{24}$/i.test(id))
		return (
			<Alert severity="error">
				{t('Invalid equipment ID')} <Link href="/_admin/equipment">{t('Equipment')}</Link>
			</Alert>
		);
	return <EquipmentLoader key={id} id={id} />;
}
function EquipmentLoader({ id }: { id: string }) {
	const { t } = useTranslation('common');
	const [page, setPage] = useState(1);
	const { data, loading, error, refetch } = useQuery<{ getAllEquipmentsByAdmin: EquipmentResult }>(
		GET_ALL_EQUIPMENTS_BY_ADMIN,
		{
			variables: { input: { page, limit: 100, sort: 'createdAt', direction: 'ASC', search: {} } },
			fetchPolicy: 'network-only',
		},
	);
	const selected = !loading && !error ? data?.getAllEquipmentsByAdmin.list.find((i) => i._id === id) : undefined;
	const hasNext = page * 100 < (data?.getAllEquipmentsByAdmin.metaCounter?.[0]?.total ?? 0);
	useEffect(() => {
		if (!loading && !error && data && !selected && hasNext) setPage((p) => p + 1);
	}, [data, loading, error, selected, hasNext]);
	if (error)
		return (
			<Alert severity="error" action={<Button onClick={() => void refetch()}>{t('Retry')}</Button>}>
				{error.message}
			</Alert>
		);
	if (selected) return <EquipmentForm selected={selected} />;
	if (loading || !data || hasNext) return <p role="status">{t('Loading...')}</p>;
	return (
		<Alert severity="error">
			{t('Equipment not found')} <Link href="/_admin/equipment">{t('Equipment')}</Link>
		</Alert>
	);
}
function EquipmentForm({ selected }: { selected?: EquipmentPreview }) {
	const { t } = useTranslation('common');
	const router = useRouter();
	const [name, setName] = useState(selected?.equipmentName ?? ''),
		[brand, setBrand] = useState(selected?.equipmentBrand ?? ''),
		[size, setSize] = useState(selected?.equipmentSize ?? ''),
		[category, setCategory] = useState(selected?.equipmentCategory ?? EquipmentCategory.SKI),
		[audience, setAudience] = useState(selected?.equipmentAudience ?? EquipmentAudience.ALL),
		[resortId, setResortId] = useState(selected?.resortId ?? ''),
		[status, setStatus] = useState(selected?.equipmentStatus ?? 'AVAILABLE'),
		[quantity, setQuantity] = useState(String(selected?.equipmentQuantity ?? 0)),
		[purchasable, setPurchasable] = useState(selected?.equipmentPurchasable ?? false),
		[price, setPrice] = useState(
			selected?.equipmentPurchasePrice == null ? '' : String(selected.equipmentPurchasePrice),
		),
		[desc, setDesc] = useState(selected?.equipmentDesc ?? ''),
		[images, setImages] = useState(selected?.equipmentImages ?? []),
		[rates, setRates] = useState(
			(selected?.equipmentRentalRates ?? [{ durationHours: 3, price: 0 }]).map((r) => ({
				hours: String(r.durationHours),
				price: String(r.price),
			})),
		),
		[error, setError] = useState(''),
		[uploading, setUploading] = useState(false),
		[pending, setPending] = useState(false),
		[saved, setSaved] = useState(false);
	const lock = useRef(false),
		uploadLock = useRef(false),
		completed = useRef(false);
	const [mutate] = useMutation(selected ? UPDATE_EQUIPMENT_BY_ADMIN : CREATE_EQUIPMENT);
	const upload = async (files: File[]) => {
		if (!files.length || lock.current || uploadLock.current || completed.current) return;
		if (files.some((f) => !['image/jpeg', 'image/png'].includes(f.type) || f.size > 10 * 1024 * 1024)) {
			setError(t('Use JPG or PNG images up to 10 MB each.'));
			return;
		}
		uploadLock.current = true;
		setUploading(true);
		setError('');
		try {
			const paths = await uploadImages(files, 'equipment');
			if (paths.length !== files.length) setError(t('Some images could not be uploaded. Retry the missing images.'));
			setImages((old) => [...old, ...paths]);
		} catch (e) {
			setError(e instanceof Error ? e.message : t('Upload failed'));
		} finally {
			uploadLock.current = false;
			setUploading(false);
		}
	};
	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (lock.current || uploadLock.current || completed.current) return;
		const packages = rates.map((r) => ({ durationHours: Number(r.hours), price: Number(r.price) }));
		if (
			!name.trim() ||
			!quantity.trim() ||
			!Number.isInteger(Number(quantity)) ||
			Number(quantity) < 0 ||
			Number(quantity) > 2147483647 ||
			!packages.length ||
			rates.some((r) => !r.hours.trim() || !r.price.trim()) ||
			packages.some(
				(r) =>
					!Number.isInteger(r.durationHours) ||
					r.durationHours < 1 ||
					r.durationHours > 2147483647 ||
					!Number.isFinite(r.price) ||
					r.price < 0,
			) ||
			new Set(packages.map((r) => r.durationHours)).size !== packages.length ||
			(purchasable && (!price.trim() || !Number.isFinite(Number(price)) || Number(price) < 0))
		) {
			setError(t('Enter a name, valid stock quantity, unique rental durations, and non-negative prices.'));
			return;
		}
		lock.current = true;
		setPending(true);
		setError('');
		try {
			await mutate({
				variables: {
					input: {
						...(selected ? { _id: selected._id } : {}),
						equipmentName: name.trim(),
						equipmentBrand: brand.trim() || null,
						equipmentSize: size.trim() || null,
						equipmentCategory: category,
						equipmentAudience: audience,
						...(!selected || resortId !== (selected.resortId ?? '') ? { resortId: resortId || null } : {}),
						equipmentStatus: status,
						equipmentQuantity: Number(quantity),
						equipmentRentalRates: packages,
						equipmentPurchasable: purchasable,
						equipmentPurchasePrice: purchasable ? Number(price) : null,
						equipmentDesc: desc.trim() || null,
						equipmentImages: images,
					},
				},
			});
			completed.current = true;
			setSaved(true);
			await router.push('/_admin/equipment');
		} catch (e) {
			setError(e instanceof Error ? e.message : t('Unable to save'));
		} finally {
			lock.current = false;
			setPending(false);
		}
	};
	const section = (title: string, step: string, children: React.ReactNode) => (
		<section className="ar-form-section">
			<h2>
				<small>
					{t('Section')} {step}
				</small>
				{t(title)}
			</h2>
			{children}
		</section>
	);
	const input = (label: string, value: string, set: (v: string) => void, required = false, type = 'text') => (
		<label>
			{t(label)}
			{required ? ' *' : ''}
			<input
				type={type}
				required={required}
				value={value}
				min={type === 'number' ? 0 : undefined}
				max={label === 'Stock Units' ? 2147483647 : undefined}
				step={label === 'Stock Units' ? 1 : 'any'}
				onChange={(e) => set(e.target.value)}
			/>
		</label>
	);
	const disabled = pending || uploading || saved;
	const preview: EquipmentPreview = {
		_id: selected?._id ?? '',
		equipmentName: name,
		equipmentBrand: brand,
		equipmentSize: size,
		equipmentCategory: category,
		equipmentAudience: audience,
		resortId,
		equipmentStatus: status,
		equipmentQuantity: Number(quantity) || 0,
		equipmentImages: images,
		equipmentDesc: desc,
		equipmentRentalRates: rates
			.filter((r) => r.hours.trim() && r.price.trim() && Number(r.hours) > 0 && Number(r.price) >= 0)
			.map((r) => ({ durationHours: Number(r.hours), price: Number(r.price) })),
		equipmentPurchasable: purchasable,
		equipmentPurchasePrice: purchasable && price.trim() ? Number(price) : null,
	};
	return (
		<div className="admin-resorts admin-equipment">
			<p className="ar-breadcrumb">
				<Link href="/_admin/equipment">{t('Equipment')}</Link> / {t(selected ? 'Update Equipment' : 'Add Equipment')}{' '}
				<span className="ar-chip">{t('Catalog Asset')}</span>
			</p>
			<header className="ar-heading">
				<div>
					<h1>{t(selected ? 'Update Equipment' : 'Add Equipment')}</h1>
					<p>
						{t(
							selected
								? 'Update equipment details, rental tiers, pricing, and inventory.'
								: 'Create a new equipment inventory record for rental tiering, direct retail purchase, or cross-resort assignment.',
						)}
					</p>
				</div>
				<div>
					<Button disabled={pending || uploading} onClick={() => void router.push('/_admin/equipment')}>
						{t('Cancel')}
					</Button>
					<Button className="ar-primary" type="submit" form="equipment-form" disabled={disabled}>
						{t(selected ? 'Update Equipment' : 'Create Equipment')}
					</Button>
				</div>
			</header>
			<div className="ar-create-layout">
				<form id="equipment-form" onSubmit={submit}>
					<fieldset disabled={disabled}>
						{section(
							'Basic Information',
							'01',
							<>
								{input('Equipment Name', name, setName, true)}
								<div className="ar-form-row">
									{input('Brand', brand, setBrand)}
									<label>
										{t('Category')} *
										<select value={category} onChange={(e) => setCategory(e.target.value as EquipmentCategory)}>
											{Object.values(EquipmentCategory).map((v) => (
												<option key={v} value={v}>{t(v)}</option>
											))}
										</select>
									</label>
									{input(
										category === EquipmentCategory.BOOTS ? 'Size (Mondopoint / CM)' : 'Size / Length',
										size,
										setSize,
									)}
									<label>
										{t('Audience')}
										<select value={audience} onChange={(e) => setAudience(e.target.value as EquipmentAudience)}>
											{Object.values(EquipmentAudience).map((v) => (
												<option key={v} value={v}>{t(v)}</option>
											))}
										</select>
									</label>
								</div>
								<small>
									{t(
										'Use centimeters for skis, snowboards, and poles; Mondopoint for boots; alpha sizes for clothing.',
									)}
								</small>
							</>,
						)}
						{section(
							'Assigned Resort Station',
							'02',
							<>
								<ResortSelect value={resortId} onChange={setResortId} />
								<p className="ar-published">
									{t('No Resort Assigned keeps this gear in the shared equipment catalog.')}
								</p>
							</>,
						)}
						{section(
							'Rental Pricing Tiers',
							'03',
							<>
								{rates.map((rate, index) => (
									<div className="ae-rate" key={index}>
										<label>
											{t('Duration (Hours)')}
											<input
												required
												type="number"
												min="1"
												max="2147483647"
												step="1"
												value={rate.hours}
												onChange={(e) =>
													setRates((old) => old.map((r, i) => (i === index ? { ...r, hours: e.target.value } : r)))
												}
											/>
										</label>
										<label>
											{t('Fee (KRW)')}
											<input
												required
												type="number"
												min="0"
												step="any"
												value={rate.price}
												onChange={(e) =>
													setRates((old) => old.map((r, i) => (i === index ? { ...r, price: e.target.value } : r)))
												}
											/>
										</label>
										<Button
											disabled={rates.length === 1}
											aria-label={`${t('Remove rental tier')} ${index + 1}`}
											onClick={() => setRates((old) => old.filter((_, i) => i !== index))}
										>
											{t('Remove')}
										</Button>
									</div>
								))}
								<Button className="ae-add-rate" onClick={() => setRates((old) => [...old, { hours: '', price: '' }])}>
									+ {t('Add Rental Rate Tier')}
								</Button>
								<small>{t('Each tier is a separate per-unit package in KRW. Durations must be unique.')}</small>
							</>,
						)}
						{section(
							'Direct Retail / Purchase Availability',
							'04',
							<div className="ar-published">
								<label className="ae-toggle">
									<span>{t('Purchasable (Direct Retail Buy)')}</span>
									<input
										type="checkbox"
										role="switch"
										checked={purchasable}
										onChange={(e) => setPurchasable(e.target.checked)}
									/>
								</label>
								{purchasable && input('Retail Price (KRW)', price, setPrice, true, 'number')}
							</div>,
						)}
						{section(
							'Stock & Physical Inventory',
							'05',
							<>
								{input('Stock Units', quantity, setQuantity, true, 'number')}
								<small>{t('Physical units in inventory. Stock is managed manually.')}</small>
							</>,
						)}
						{section(
							'Technical Description',
							'06',
							<label>
								{t('Specification & Performance Overview')}
								<textarea rows={5} value={desc} onChange={(e) => setDesc(e.target.value)} />
								<small>
									{desc.length} {t('characters')}
								</small>
							</label>,
						)}
						{section(
							'Media & Equipment Photos',
							'07',
							<>
								<label
									className="ar-upload"
									onDragOver={(e) => e.preventDefault()}
									onDrop={(e) => {
										e.preventDefault();
										void upload(Array.from(e.dataTransfer.files));
									}}
								>
									<strong>↑</strong>
									<span>{t('Drop gear photos here, or Browse Files')}</span>
									<small>{t('JPG or PNG up to 10 MB per image. First photo is the cover.')}</small>
									<input
										type="file"
										multiple
										accept="image/jpeg,image/png"
										onChange={(e) => {
											void upload(Array.from(e.target.files ?? []));
											e.target.value = '';
										}}
									/>
								</label>
								<div className="ar-image-grid">
									{images.map((path, index) => (
										<div key={`${path}-${index}`}>
											<img src={equipmentImage(path)} alt={`${t('Equipment photo')} ${index + 1}`} />
											{index === 0 && <small>{t('Primary Cover')}</small>}
											<button
												type="button"
												aria-label={`${t('Remove photo')} ${index + 1}`}
												onClick={() => setImages((old) => old.filter((_, i) => i !== index))}
											>
												×
											</button>
											{index > 0 && (
												<button
													type="button"
													className="ar-make-cover"
													onClick={() => setImages((old) => [old[index], ...old.filter((_, i) => i !== index)])}
												>
													{t('Make cover')}
												</button>
											)}
										</div>
									))}
								</div>
							</>,
						)}
						{section(
							'Publishing Status',
							'08',
							<div className="ae-status-options">
								{(selected ? ['AVAILABLE', 'MAINTENANCE', 'DELETE'] : ['AVAILABLE', 'MAINTENANCE']).map((v) => (
									<label key={v} className={status === v ? 'is-selected' : ''}>
										<input
											type="radio"
											name="equipmentStatus"
											value={v}
											checked={status === v}
											onChange={() => setStatus(v)}
										/>
										<span>
											<strong>
												{t(v === 'AVAILABLE' ? 'Available' : v === 'MAINTENANCE' ? 'Unavailable' : 'Deleted')}
											</strong>
											<small>
												{t(
													v === 'AVAILABLE'
														? 'Visible in the public equipment catalog.'
														: 'Hidden from the public equipment catalog.',
												)}
											</small>
										</span>
									</label>
								))}
							</div>,
						)}
					</fieldset>
					{uploading && <p role="status">{t('Uploading images...')}</p>}
					{saved && (
						<Alert severity="success">
							{t('Equipment saved.')} <Link href="/_admin/equipment">{t('Return to Equipment')}</Link>
						</Alert>
					)}
					{error && !saved && <Alert severity="error">{error}</Alert>}
					<div className="ar-form-actions">
						<Button disabled={pending || uploading} onClick={() => void router.push('/_admin/equipment')}>
							{t('Cancel')}
						</Button>
						<Button className="ar-primary" type="submit" disabled={disabled}>
							{t(pending ? 'Saving...' : selected ? 'Update Equipment' : 'Create Equipment')}
						</Button>
					</div>
				</form>
				<aside className="ar-preview">
					<section>
						<h2>
							{t('Live Equipment Preview')} <span className="ar-chip">●</span>
						</h2>
						<p>{t('Real-time mirror of the public equipment card.')}</p>
					</section>
					<EquipmentAdminCard item={preview} preview />
					<section className="ar-preview-note">
						<h3>{t('Catalog Uniformity Guidelines')}</h3>
						<p>
							{t(
								'Use consistent vendor sizes and clear equipment photos. Views, likes, and comments are managed by the platform.',
							)}
						</p>
					</section>
				</aside>
			</div>
		</div>
	);
}
