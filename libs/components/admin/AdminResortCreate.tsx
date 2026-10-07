import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { Alert, Button } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { CREATE_RESORT, UPDATE_RESORT_BY_ADMIN } from '../../../apollo/admin/mutation';
import { ResortFacilities, ResortLevel, ResortLocation } from '../../enums/resort.enum';
import { uploadImages } from '../../uploadImages';
import { resortImage, won } from './AdminResorts';
import { GET_ALL_RESORTS_BY_ADMIN } from '../../../apollo/admin/query';
import { ResortSearchResult } from '../../types/resort/resort';
export default function AdminResortCreate() {
	const router = useRouter();
	const { t } = useTranslation('common');
	if (!router.isReady) return <p role="status">{t('Loading...')}</p>;
	const id = router.query.id;
	if (id === undefined) return <ResortForm key="create" />;
	if (typeof id !== 'string' || !/^[a-f0-9]{24}$/i.test(id))
		return (
			<Alert severity="error">
				{t('Invalid resort ID')} <Link href="/_admin/resort">{t('Resorts')}</Link>
			</Alert>
		);
	return <ResortLoader key={id} id={id} />;
}
function ResortLoader({ id }: { id: string }) {
	const { t } = useTranslation('common');
	const [page, setPage] = useState(1);
	const { data, loading, error, refetch } = useQuery<{
		getAllResortsByAdmin: { list: ResortSearchResult[]; metaCounter: { total: number }[] | null };
	}>(GET_ALL_RESORTS_BY_ADMIN, {
		variables: { input: { page, limit: 100, sort: 'createdAt', direction: 'ASC', search: {} } },
		fetchPolicy: 'network-only',
	});
	const selected = !loading && !error ? data?.getAllResortsByAdmin.list.find((item) => item._id === id) : undefined;
	const hasNext = page * 100 < (data?.getAllResortsByAdmin.metaCounter?.[0]?.total ?? 0);
	useEffect(() => {
		if (!loading && !error && data && !selected && hasNext) setPage((old) => old + 1);
	}, [loading, error, data, selected, hasNext]);
	if (error)
		return (
			<Alert severity="error" action={<Button onClick={() => void refetch()}>{t('Retry')}</Button>}>
				{t('Unable to load resorts')}
			</Alert>
		);
	if (selected) return <ResortForm selected={selected} />;
	if (loading || !data || hasNext) return <p role="status">{t('Loading...')}</p>;
	return (
		<Alert severity="error">
			{t('Resort not found')} <Link href="/_admin/resort">{t('Resorts')}</Link>
		</Alert>
	);
}
function ResortForm({ selected }: { selected?: ResortSearchResult }) {
	const { t } = useTranslation('common');
	const router = useRouter();
	const [title, setTitle] = useState(selected?.resortTitle ?? ''),
		[address, setAddress] = useState(selected?.resortAddress ?? ''),
		[location, setLocation] = useState<ResortLocation>(selected?.resortLocation ?? ResortLocation.PYEONGCHANG),
		[level, setLevel] = useState<ResortLevel | ''>(selected?.resortLevel ?? ''),
		[price, setPrice] = useState(selected ? String(selected.resortPricePerDay) : ''),
		[days, setDays] = useState(String(selected?.resortMinDays ?? 1)),
		[desc, setDesc] = useState(selected?.resortDesc ?? ''),
		[facilities, setFacilities] = useState<ResortFacilities[]>(selected?.resortFacilities ?? []),
		[images, setImages] = useState<string[]>(selected?.resortImages ?? []),
		[error, setError] = useState(''),
		[uploading, setUploading] = useState(false),
		[pending, setPending] = useState(false);
	const lock = useRef(false),
		uploadLock = useRef(false),
		created = useRef(false);
	const [status, setStatus] = useState<ResortSearchResult['resortStatus']>(selected?.resortStatus ?? 'ACTIVE');
	const [create] = useMutation(selected ? UPDATE_RESORT_BY_ADMIN : CREATE_RESORT);
	const upload = async (files: File[]) => {
		if (!files.length || uploadLock.current || lock.current) return;
		if (files.some((f) => !['image/jpeg', 'image/png'].includes(f.type) || f.size > 10 * 1024 * 1024)) {
			setError(t('Use JPG or PNG images up to 10 MB each.'));
			return;
		}
		uploadLock.current = true;
		setUploading(true);
		setError('');
		try {
			const paths = await uploadImages(files, 'resort');
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
		if (lock.current || uploadLock.current || created.current) return;
		if (
			!title.trim() ||
			!address.trim() ||
			!price.trim() ||
			!Number.isFinite(Number(price)) ||
			Number(price) < 0 ||
			!Number.isInteger(Number(days)) ||
			Number(days) < 1 ||
			Number(days) > 2147483647
		) {
			setError(t('Enter a title, address, non-negative price, and at least one booking day.'));
			return;
		}
		lock.current = true;
		setPending(true);
		setError('');
		try {
			await create({
				variables: {
					input: {
						...(selected ? { _id: selected._id, resortStatus: status } : {}),
						resortTitle: title.trim(),
						resortAddress: address.trim(),
						resortLocation: location,
						resortLevel: level || null,
						resortPricePerDay: Number(price),
						resortMinDays: Number(days),
						resortDesc: desc.trim() || null,
						resortFacilities: facilities,
						resortImages: images,
					},
				},
			});
			created.current = true;
			await router.push('/_admin/resort');
		} catch (e) {
			setError(e instanceof Error ? e.message : t('Unable to save'));
		} finally {
			lock.current = false;
			setPending(false);
		}
	};
	const section = (name: string, step: string, children: React.ReactNode) => (
		<section className="ar-form-section">
			<h2>
				{t(name)}
				<small>
					{t('Step')} {step}
				</small>
			</h2>
			{children}
		</section>
	);
	return (
		<div className="admin-resorts">
			<p className="ar-breadcrumb">
				<Link href="/_admin">{t('Admin')}</Link> › <Link href="/_admin/resort">{t('Resorts')}</Link> ›{' '}
				{t(selected ? 'Update Resort' : 'Add Resort')}
			</p>
			<header className="ar-heading">
				<div>
					<h1>{t(selected ? 'Update Resort' : 'Add Resort')}</h1>
					<p>
						{t(
							selected
								? 'Update the resort details for the SNOWAY platform.'
								: 'Create a new ski resort listing for the SNOWAY platform.',
						)}
					</p>
				</div>
				<div>
					<Button disabled={pending || uploading} onClick={() => void router.push('/_admin/resort')}>
						{t('Cancel')}
					</Button>
					<Button
						className="ar-primary"
						type="submit"
						form="resort-create"
						disabled={pending || uploading || created.current}
					>
						{t(selected ? 'Update Resort' : 'Publish Resort')}
					</Button>
				</div>
			</header>
			<div className="ar-create-layout">
				<form id="resort-create" onSubmit={submit}>
					<fieldset disabled={pending || uploading || created.current}>
						{section(
							'Basic Information',
							'01',
							<>
								<label>
									{t('Resort Title')} *<input required value={title} onChange={(e) => setTitle(e.target.value)} />
								</label>
								<div className="ar-form-row">
									<label>
										{t('Location')} *
										<select value={location} onChange={(e) => setLocation(e.target.value as ResortLocation)}>
											{Object.values(ResortLocation).map((v) => (
												<option key={v} value={v}>
													{t(v)}
												</option>
											))}
										</select>
									</label>
									<label>
										{t('Primary Skill Level')}
										<select value={level} onChange={(e) => setLevel(e.target.value as ResortLevel | '')}>
											<option value="">{t('Not configured')}</option>
											{Object.values(ResortLevel).map((v) => (
												<option key={v} value={v}>
													{t(v)}
												</option>
											))}
										</select>
									</label>
								</div>
								<label>
									{t('Full Street Address')} *
									<input required value={address} onChange={(e) => setAddress(e.target.value)} />
								</label>
							</>,
						)}
						{section(
							'Pricing & Duration Policy',
							'02',
							<div className="ar-form-row">
								<label>
									{t('Daily Pass Price (KRW)')} *
									<input
										required
										type="number"
										min="0"
										step="any"
										value={price}
										onChange={(e) => setPrice(e.target.value)}
									/>
									<small>{t('Price per day in KRW')}</small>
								</label>
								<label>
									{t('Minimum Booking Days')}
									<div className="ar-day-control">
										<button
											type="button"
											disabled={Number(days) <= 1}
											onClick={() => setDays(String(Math.max(1, Number(days) - 1)))}
										>
											−
										</button>
										<input
											required
											type="number"
											min="1"
											max="2147483647"
											step="1"
											value={days}
											onChange={(e) => setDays(e.target.value)}
										/>
										<button type="button" onClick={() => setDays(String(Math.min(2147483647, Number(days) + 1)))}>
											+
										</button>
									</div>
									<small>{t('Minimum one day')}</small>
								</label>
							</div>,
						)}
						{section(
							'Resort Description',
							'03',
							<label>
								{t('Resort Overview & Details')}
								<textarea rows={6} value={desc} onChange={(e) => setDesc(e.target.value)} />
								<small>
									{desc.length} {t('characters')}
								</small>
							</label>,
						)}
						{section(
							'Verified Facilities',
							'04',
							<>
								<p>{t('Select all verified amenities available at this resort.')}</p>
								<div className="ar-facility-options">
									{Object.values(ResortFacilities).map((f) => (
										<label key={f}>
											<input
												type="checkbox"
												checked={facilities.includes(f)}
												onChange={(e) =>
													setFacilities((old) => (e.target.checked ? [...old, f] : old.filter((v) => v !== f)))
												}
											/>
											{t(f)}
										</label>
									))}
								</div>
							</>,
						)}
						{section(
							'Resort Imagery',
							'05',
							<>
								<label
									className="ar-upload"
									onDragOver={(e) => e.preventDefault()}
									onDrop={(e) => {
										e.preventDefault();
										void upload(Array.from(e.dataTransfer.files));
									}}
								>
									<strong>☁</strong>
									<span>{t('Drop resort photos here, or Browse Files')}</span>
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
									{images.map((path, i) => (
										<div key={`${path}-${i}`}>
											<img src={resortImage(path)} alt={`${t('Resort photo')} ${i + 1}`} />
											{i === 0 && <small>{t('Cover Photo')}</small>}
											<button
												type="button"
												aria-label={`${t('Remove photo')} ${i + 1}`}
												onClick={() => setImages((old) => old.filter((_, index) => index !== i))}
											>
												×
											</button>
											{i > 0 && (
												<button
													type="button"
													className="ar-make-cover"
													onClick={() => setImages((old) => [old[i], ...old.filter((_, index) => index !== i)])}
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
							'Listing Status',
							'06',
							<div className="ar-published">
								{selected ? (
									<label>
										{t('Status')}
										<select
											value={status}
											onChange={(e) => setStatus(e.target.value as ResortSearchResult['resortStatus'])}
										>
											{['ACTIVE', 'SOLD_OUT', 'DELETE'].map((v) => (
												<option key={v} value={v}>
													{t(v)}
												</option>
											))}
										</select>
									</label>
								) : (
									<strong>● {t('Active (Published)')}</strong>
								)}
								<p>
									{t(
										selected
											? 'Changes are saved to the existing resort.'
											: 'New resorts are published immediately in the public catalog.',
									)}
								</p>
							</div>,
						)}
					</fieldset>
					{error && (
						<Alert severity={created.current ? 'success' : 'error'}>
							{created.current
								? t(
										selected
											? 'Resort updated. Return to Resorts to view it.'
											: 'Resort created. Return to Resorts to view it.',
								  )
								: error}
							{created.current && <Link href="/_admin/resort">{t('Resorts')}</Link>}
						</Alert>
					)}
					{uploading && <p role="status">{t('Uploading images...')}</p>}
					<div className="ar-form-actions">
						<Button disabled={pending || uploading} onClick={() => void router.push('/_admin/resort')}>
							{t('Cancel')}
						</Button>
						<Button type="submit" className="ar-primary" disabled={pending || uploading || created.current}>
							{t(pending ? 'Saving...' : selected ? 'Update Resort' : 'Create Resort Listing')}
						</Button>
					</div>
				</form>
				<aside className="ar-preview">
					<section>
						<h2>
							{t('Public Card Preview')}
							<span className="ar-chip">{t('Live Form Sync')}</span>
						</h2>
					</section>
					<article className="ar-card">
						<div className="ar-cover">
							<img src={resortImage(images[0])} alt={t('Resort preview')} />
							<span className="ar-status">● {t(status)}</span>
							<span className="ar-preview-location">{t(location)}</span>
							<div className="ar-preview-title">
								<small>{level ? t(level) : ''}</small>
								<h2>{title || t('Untitled Resort')}</h2>
							</div>
						</div>
						<div className="ar-card-body">
							<div className="ar-preview-price">
								<div>
									<small>{t('Pricing / Day')}</small>
									<strong>{won(Number(price) || 0)}</strong>
								</div>
								<div>
									<small>{t('Min Booking')}</small>
									<strong>
										{days || '1'} {t('Days')}
									</strong>
								</div>
							</div>
							<p className="ar-preview-desc">{desc || t('No description provided yet.')}</p>
							<div className="ar-published">
								<small>
									{t('Selected Amenities')} · {facilities.length}
								</small>
								<p>{facilities.map((f) => t(f)).join(', ') || t('None selected')}</p>
							</div>
							<Button disabled fullWidth>
								{t('Public Card Preview (Disabled)')}
							</Button>
						</div>
					</article>
					<section className="ar-preview-note">
						<h3>{t('Ready to publish')}</h3>
						<p>{t('Check the resort details and cover photo before publishing.')}</p>
					</section>
				</aside>
			</div>
		</div>
	);
}
