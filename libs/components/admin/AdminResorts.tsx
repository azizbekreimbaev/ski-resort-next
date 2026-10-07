import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@apollo/client';
import { Alert, Button, Pagination } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { GET_ALL_RESORTS_BY_ADMIN, RESORT_ADMIN_SUMMARY } from '../../../apollo/admin/query';
import { UPDATE_RESORT_BY_ADMIN } from '../../../apollo/admin/mutation';
import { ResortSearchResult } from '../../types/resort/resort';
import { ResortLevel, ResortLocation } from '../../enums/resort.enum';
import { REACT_APP_API_URL } from '../../config';
import { useRouter } from 'next/router';
export const resortImage = (path?: string) =>
	path
		? /^https?:\/\//i.test(path)
			? path
			: `${REACT_APP_API_URL}/${path.replace(/^\//, '')}`
		: '/img/hero/winter-1.jpg';
export const won = (value: number) => `₩${value.toLocaleString()}`;
type Result = { list: ResortSearchResult[]; metaCounter: { total: number }[] | null };
function ResortCard({
	item,
	busy,
	change,
	edit,
}: {
	item: ResortSearchResult;
	busy: boolean;
	change: (item: ResortSearchResult) => void;
	edit: () => void;
}) {
	const { t } = useTranslation('common');
	const [photo, setPhoto] = useState(0);
	return (
		<article className={`ar-card ${item.resortStatus === 'DELETE' ? 'is-deleted' : ''}`}>
			<div className="ar-cover">
				<img
					src={resortImage(item.resortImages[photo])}
					alt={item.resortTitle}
					onError={(e) => {
						e.currentTarget.onerror = null;
						e.currentTarget.src = '/img/hero/winter-1.jpg';
					}}
				/>
				<span className="ar-status">● {t(item.resortStatus)}</span>
				<span className="ar-photo-count">
					{item.resortImages.length ? photo + 1 : 0} / {item.resortImages.length}
				</span>
				{item.resortImages.length > 1 && (
					<div className="ar-photo-dots">
						{item.resortImages.map((_, i) => (
							<button
								key={i}
								aria-label={`${t('Photo')} ${i + 1}`}
								aria-pressed={photo === i}
								onClick={() => setPhoto(i)}
							/>
						))}
					</div>
				)}
			</div>
			<div className="ar-card-body">
				<div className="ar-location">
					<span>♧ {t(item.resortLocation)}</span>
					<span className="ar-chip">{item.resortLevel ? t(item.resortLevel) : t('Not configured')}</span>
				</div>
				<h2>{item.resortTitle}</h2>
				<p className="ar-address" title={item.resortAddress}>
					{item.resortAddress}
				</p>
				<div className="ar-facilities">
					{(item.resortFacilities ?? []).slice(0, 4).map((f) => (
						<span className="ar-chip" key={f}>
							{t(f)}
						</span>
					))}
					{(item.resortFacilities?.length ?? 0) > 4 && (
						<span className="ar-chip">
							+{item.resortFacilities!.length - 4} {t('more')}
						</span>
					)}
				</div>
				<div className="ar-metrics">
					{[
						[t('Daily price'), won(item.resortPricePerDay)],
						[t('Views'), item.resortViews.toLocaleString()],
						[t('Likes'), item.resortLikes.toLocaleString()],
					].map(([label, value]) => (
						<div key={label}>
							<small>{label}</small>
							<strong>{value}</strong>
						</div>
					))}
				</div>
			</div>
			<footer>
				{item.resortStatus !== 'DELETE' && (
					<Link href={{ pathname: '/resort/detail', query: { id: item._id } }}>{t('View Details')}</Link>
				)}
				<Button onClick={edit} disabled={busy}>
					{t('Edit Resort')}
				</Button>
				<Button
					color={item.resortStatus === 'DELETE' ? 'primary' : 'error'}
					disabled={busy}
					onClick={() => change(item)}
				>
					{t(item.resortStatus === 'DELETE' ? 'Restore Resort' : 'Archive')}
				</Button>
			</footer>
		</article>
	);
}
export default function AdminResorts() {
	const { t } = useTranslation('common');
	const [page, setPage] = useState(1),
		[limit, setLimit] = useState(10),
		[text, setText] = useState(''),
		[location, setLocation] = useState(''),
		[level, setLevel] = useState(''),
		[status, setStatus] = useState(''),
		[sort, setSort] = useState('createdAt'),
		[error, setError] = useState('');
	const router = useRouter();
	const lock = useRef(false);
	const {
		data,
		loading,
		error: queryError,
		refetch,
	} = useQuery<{ getAllResortsByAdmin: Result }>(GET_ALL_RESORTS_BY_ADMIN, {
		variables: {
			input: {
				page,
				limit,
				sort,
				direction: sort === 'resortTitle' ? 'ASC' : 'DESC',
				search: {
					...(text.trim() ? { text: text.trim() } : {}),
					...(location ? { locationList: [location] } : {}),
					...(level ? { levelList: [level] } : {}),
					...(status ? { resortStatus: status } : {}),
				},
			},
		},
		fetchPolicy: 'network-only',
	});
	const summary = useQuery<Record<'all' | 'active' | 'deleted', Pick<Result, 'metaCounter'>>>(RESORT_ADMIN_SUMMARY, {
		fetchPolicy: 'network-only',
	});
	const [update, state] = useMutation(UPDATE_RESORT_BY_ADMIN);
	const items = data?.getAllResortsByAdmin.list ?? [],
		total = data?.getAllResortsByAdmin.metaCounter?.[0]?.total ?? 0;
	useEffect(() => {
		if (!loading && !queryError && data && page > Math.max(1, Math.ceil(total / limit)))
			setPage(Math.max(1, Math.ceil(total / limit)));
	}, [data, loading, queryError, page, total, limit]);
	const refresh = async () => {
		await Promise.all([refetch(), summary.refetch()]);
	};
	const change = async (item: ResortSearchResult) => {
		if (
			lock.current ||
			!window.confirm(
				t(
					item.resortStatus === 'DELETE'
						? 'Restore this resort to ACTIVE?'
						: 'Archive this resort and hide it from the public catalog?',
				),
			)
		)
			return;
		lock.current = true;
		setError('');
		try {
			await update({
				variables: { input: { _id: item._id, resortStatus: item.resortStatus === 'DELETE' ? 'ACTIVE' : 'DELETE' } },
			});
			await refresh();
		} catch (e) {
			setError(e instanceof Error ? e.message : t('Unable to save'));
		} finally {
			lock.current = false;
		}
	};
	const count = (key: 'all' | 'active' | 'deleted') => summary.data?.[key].metaCounter?.[0]?.total;
	const exportCsv = () => {
		const cell = (v: string | number) =>
			`"${String(v)
				.replace(/^[=+@-]/, "'$&")
				.replace(/"/g, '""')}"`;
		const csv = [
			['Title', 'Location', 'Address', 'Status', 'Daily price', 'Views', 'Likes'],
			...items.map((i) => [
				i.resortTitle,
				i.resortLocation,
				i.resortAddress,
				i.resortStatus,
				i.resortPricePerDay,
				i.resortViews,
				i.resortLikes,
			]),
		]
			.map((row) => row.map(cell).join(','))
			.join('\r\n');
		const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = 'resorts-current-page.csv';
		a.click();
		URL.revokeObjectURL(url);
	};
	return (
		<div className="admin-resorts">
			<header className="ar-heading">
				<div>
					<h1>{t('Resorts')}</h1>
					<p>{t('Manage ski resorts, pricing, facilities, images, and availability across SNOWAY.')}</p>
				</div>
				<div>
					<Button disabled={!items.length || loading || !!queryError} onClick={exportCsv}>
						{t('Export CSV')}
					</Button>
					<Link className="ar-primary" href="/_admin/resort/create">
						+ {t('Add Resort')}
					</Link>
				</div>
			</header>
			<div className="ar-summary">
				{[
					[t('Total Resorts'), count('all'), t('All catalog records')],
					[t('Active Resorts'), count('active'), t('Published resorts')],
					[t('Deleted Resorts'), count('deleted'), t('Archived / Inactive')],
					[
						t('Avg Daily Price'),
						items.length && !loading && !queryError
							? won(Math.round(items.reduce((n, i) => n + i.resortPricePerDay, 0) / items.length))
							: '—',
						t('Current page average'),
					],
				].map(([label, value, hint]) => (
					<div key={label}>
						<small>{label}</small>
						<strong>{value ?? '—'}</strong>
						<span>{hint}</span>
					</div>
				))}
			</div>
			{summary.error && (
				<Alert severity="error" action={<Button onClick={() => void summary.refetch()}>{t('Retry')}</Button>}>
					{t('Unable to load resort totals')}
				</Alert>
			)}
			<section className="ar-list">
				<nav className="ar-tabs">
					{[
						['', t('All'), 'all'],
						['ACTIVE', t('Active'), 'active'],
						['DELETE', t('Deleted'), 'deleted'],
					].map(([value, label, key]) => (
						<button
							key={key}
							aria-pressed={status === value}
							onClick={() => {
								setStatus(value);
								setPage(1);
							}}
						>
							{label} <span>{count(key as 'all' | 'active' | 'deleted') ?? '—'}</span>
						</button>
					))}
				</nav>
				<div className="ar-filters">
					<input
						aria-label={t('Search resorts by title')}
						placeholder={t('Search resorts by title...')}
						value={text}
						onChange={(e) => {
							setText(e.target.value);
							setPage(1);
						}}
					/>
					{[
						{ label: 'All Locations', value: location, options: Object.values(ResortLocation), set: setLocation },
						{ label: 'All Levels', value: level, options: Object.values(ResortLevel), set: setLevel },
						{ label: 'All Statuses', value: status, options: ['ACTIVE', 'SOLD_OUT', 'DELETE'], set: setStatus },
						{
							label: 'Sort: Newest',
							value: sort,
							options: ['createdAt', 'updatedAt', 'resortTitle', 'resortPricePerDay', 'resortLikes', 'resortViews'],
							set: setSort,
						},
					].map((f) => (
						<select
							key={f.label}
							aria-label={t(f.label)}
							value={f.value}
							onChange={(e) => {
								f.set(e.target.value);
								setPage(1);
							}}
						>
							{f.label !== 'Sort: Newest' && <option value="">{t(f.label)}</option>}
							{f.options.map((o) => (
								<option key={o} value={o}>
									{t(o)}
								</option>
							))}
						</select>
					))}
					<Button
						onClick={() => {
							setText('');
							setLocation('');
							setLevel('');
							setStatus('');
							setSort('createdAt');
							setPage(1);
						}}
					>
						{t('Reset')}
					</Button>
				</div>
				{loading ? (
					<p className="ar-state" role="status">
						{t('Loading...')}
					</p>
				) : queryError ? (
					<Alert severity="error" action={<Button onClick={() => void refetch()}>{t('Retry')}</Button>}>
						{t('Unable to load resorts')}
					</Alert>
				) : (
					<>
						<div className="ar-grid">
							{items.map((item) => (
								<ResortCard
									key={item._id}
									item={item}
									busy={state.loading}
									change={(i) => void change(i)}
									edit={() => void router.push({ pathname: '/_admin/resort/create', query: { id: item._id } })}
								/>
							))}
						</div>
						{!items.length && <p className="ar-state">{t('No resorts found')}</p>}
					</>
				)}
				{error && <Alert severity="error">{error}</Alert>}
				<footer className="ar-pagination">
					<label>
						{t('Rows per page')}:{' '}
						<select
							value={limit}
							onChange={(e) => {
								setLimit(Number(e.target.value));
								setPage(1);
							}}
						>
							{[10, 20, 50].map((n) => (
								<option key={n}>{n}</option>
							))}
						</select>
					</label>
					<span>
						{total ? `${(page - 1) * limit + 1}–${Math.min(page * limit, total)} / ${total}` : '0 / 0'} {t('resorts')}
					</span>
					<Pagination page={page} count={Math.max(1, Math.ceil(total / limit))} onChange={(_, n) => setPage(n)} />
				</footer>
			</section>
		</div>
	);
}
