import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { Alert, Button, Pagination } from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import TerrainOutlinedIcon from '@mui/icons-material/TerrainOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useTranslation } from 'next-i18next';
import {
	GET_ALL_EQUIPMENTS_BY_ADMIN,
	EQUIPMENT_ADMIN_SUMMARY,
	EQUIPMENT_ADMIN_STOCK,
	GET_ALL_RESORTS_BY_ADMIN,
} from '../../../apollo/admin/query';
import { UPDATE_EQUIPMENT_BY_ADMIN } from '../../../apollo/admin/mutation';
import { EquipmentPreview } from '../../types/equipment/equipment';
import { EquipmentAudience, EquipmentCategory } from '../../enums/equipment.enum';
import { ResortSearchResult } from '../../types/resort/resort';
import { REACT_APP_API_URL } from '../../config';
import ResortSelect from '../common/ResortSelect';
export type EquipmentResult = { list: EquipmentPreview[]; metaCounter: { total: number }[] | null };
export const equipmentImage = (path?: string) =>
	path
		? /^https?:\/\//i.test(path)
			? path
			: `${REACT_APP_API_URL}/${path.replace(/^\//, '')}`
		: '/img/icons/equipment-placeholder.svg';
export const equipmentWon = (price: number) => `₩${price.toLocaleString('en-US')}`;
export const equipmentStatusLabel = (status?: string) =>
	status === 'MAINTENANCE' ? 'Unavailable' : status === 'DELETE' ? 'Deleted' : 'Available';
export function EquipmentAdminCard({
	item,
	resortName,
	busy,
	change,
	preview = false,
}: {
	item: EquipmentPreview;
	resortName?: string;
	busy?: boolean;
	change?: () => void;
	preview?: boolean;
}) {
	const { t } = useTranslation('common');
	const [photo, setPhoto] = useState(0);
	const images = item.equipmentImages ?? [];
	const index = photo < images.length ? photo : 0;
	const base = [...item.equipmentRentalRates].sort((a, b) => a.durationHours - b.durationHours)[0];
	return (
		<article className={`ar-card ae-card ${item.equipmentStatus === 'DELETE' ? 'is-deleted' : ''}`}>
			<div className="ar-cover">
				<img
					src={equipmentImage(images[index])}
					alt={item.equipmentName || t('Equipment preview')}
					onError={(e) => {
						e.currentTarget.onerror = null;
						e.currentTarget.src = '/img/icons/equipment-placeholder.svg';
					}}
				/>
				<span className={`ar-status ae-status-${item.equipmentStatus}`}>
					● {t(equipmentStatusLabel(item.equipmentStatus))}
				</span>
				<span className="ar-photo-count">
					{images.length ? index + 1 : 0} / {images.length}
				</span>
				{images.length > 1 && (
					<>
						<button
							type="button"
							className="ae-photo-prev"
							aria-label={t('Previous photo')}
							onClick={() => setPhoto((index + images.length - 1) % images.length)}
						>
							‹
						</button>
						<button
							type="button"
							className="ae-photo-next"
							aria-label={t('Next photo')}
							onClick={() => setPhoto((index + 1) % images.length)}
						>
							›
						</button>
						<div className="ar-photo-dots">
							{images.map((_, i) => (
								<button
									type="button"
									key={i}
									aria-label={`${t('Photo')} ${i + 1}`}
									aria-pressed={index === i}
									onClick={() => setPhoto(i)}
								/>
							))}
						</div>
					</>
				)}
			</div>
			<div className="ar-card-body">
				<h2>{item.equipmentName || t('Untitled Equipment')}</h2>
				<p className="ae-brand">{item.equipmentBrand || t('Not configured')}</p>
				<div>
					<span className="ar-chip">
						{t(item.equipmentCategory)} · {item.equipmentSize || t('Not configured')} · {t(item.equipmentAudience)}
					</span>
				</div>
				<p className="ae-resort">
					<TerrainOutlinedIcon /> {t('Resort')}:{' '}
					<strong>{resortName || item.resortId || t('No Resort Assigned')}</strong>
				</p>
				<div className="ae-prices">
					<div>
						<small>{t('Rental rate')}</small>
						<strong>{base ? `${t('From')} ${equipmentWon(base.price)}` : '—'}</strong>
						<small>{base ? `${base.durationHours} ${t('Hours')}` : t('Add rental package')}</small>
					</div>
					<div>
						<small>{t('Purchase price')}</small>
						<strong>
							{item.equipmentPurchasable && item.equipmentPurchasePrice != null
								? equipmentWon(item.equipmentPurchasePrice)
								: t('Not for sale')}
						</strong>
						<small>{t(item.equipmentPurchasable ? 'Direct purchase' : 'Rental only')}</small>
					</div>
				</div>
				<div className="ae-stock">
					<span className={(item.equipmentQuantity ?? 0) < 5 ? 'ae-low' : ''}>
						● {t('Quantity')}: {item.equipmentQuantity ?? 0} {t('in stock')}
						{(item.equipmentQuantity ?? 0) < 5 && ` · ${t('Low Stock')}`}
					</span>
					{!preview && (
						<span className="ae-engagement">
							<span title={t('Views')}>
								<VisibilityOutlinedIcon /> {item.equipmentViews ?? 0}
							</span>
							<span title={t('Likes')}>
								<FavoriteBorderOutlinedIcon /> {item.equipmentLikes ?? 0}
							</span>
							<span title={t('Comments')}>
								<ChatBubbleOutlineIcon /> {item.equipmentComments ?? 0}
							</span>
						</span>
					)}
				</div>
			</div>
			{!preview && (
				<footer>
					{item.equipmentStatus === 'AVAILABLE' && (
						<Link href={{ pathname: '/equipment/detail', query: { id: item._id } }}>{t('View Details')}</Link>
					)}
					<Link className="ae-edit" href={{ pathname: '/_admin/equipment/create', query: { id: item._id } }}>
						{t('Edit Equipment')}
					</Link>
					<Button disabled={busy} color={item.equipmentStatus === 'DELETE' ? 'primary' : 'error'} onClick={change}>
						{t(item.equipmentStatus === 'DELETE' ? 'Restore Equipment' : 'Archive')}
					</Button>
				</footer>
			)}
		</article>
	);
}
export default function AdminEquipment() {
	const { t } = useTranslation('common');
	const [page, setPage] = useState(1),
		[limit, setLimit] = useState(6),
		[text, setText] = useState(''),
		[category, setCategory] = useState(''),
		[audience, setAudience] = useState(''),
		[size, setSize] = useState(''),
		[status, setStatus] = useState(''),
		[sort, setSort] = useState('createdAt'),
		[resortId, setResortId] = useState(''),
		[error, setError] = useState('');
	const lock = useRef(false);
	const client = useApolloClient();
	const [stockCount, setStockCount] = useState<number | null>(null);
	const [stockError, setStockError] = useState('');
	const [stockRefresh, setStockRefresh] = useState(0);
	useEffect(() => {
		let cancelled = false;
		setStockCount(null);
		setStockError('');
		const scan = async () => {
			let scanPage = 1,
				scanTotal = 0,
				lowStock = 0;
			do {
				const result = await client.query<{
					getAllEquipmentsByAdmin: {
						list: Pick<EquipmentPreview, '_id' | 'equipmentQuantity' | 'equipmentStatus'>[];
						metaCounter: { total: number }[] | null;
					};
				}>({
					query: EQUIPMENT_ADMIN_STOCK,
					variables: { input: { page: scanPage, limit: 100, sort: 'createdAt', direction: 'ASC', search: {} } },
					fetchPolicy: 'network-only',
				});
				if (cancelled) return;
				scanTotal = result.data.getAllEquipmentsByAdmin.metaCounter?.[0]?.total ?? 0;
				lowStock += result.data.getAllEquipmentsByAdmin.list.filter(
					(i) => i.equipmentStatus !== 'DELETE' && (i.equipmentQuantity ?? 0) < 5,
				).length;
				scanPage++;
			} while ((scanPage - 1) * 100 < scanTotal);
			if (!cancelled) setStockCount(lowStock);
		};
		void scan().catch((e) => {
			if (!cancelled) setStockError(e instanceof Error ? e.message : 'Unable to load stock totals');
		});
		return () => {
			cancelled = true;
		};
	}, [client, stockRefresh]);
	const {
		data,
		loading,
		error: queryError,
		refetch,
	} = useQuery<{ getAllEquipmentsByAdmin: EquipmentResult }>(GET_ALL_EQUIPMENTS_BY_ADMIN, {
		variables: {
			input: {
				page,
				limit,
				sort,
				direction: sort === 'equipmentName' ? 'ASC' : 'DESC',
				search: {
					...(text.trim() ? { text: text.trim() } : {}),
					...(category ? { categoryList: [category] } : {}),
					...(audience ? { audienceList: [audience] } : {}),
					...(size.trim() && category ? { sizeList: [size.trim()] } : {}),
					...(status ? { equipmentStatus: status } : {}),
					...(resortId ? { resortId } : {}),
				},
			},
		},
		fetchPolicy: 'network-only',
	});
	const summary = useQuery<
		Record<'all' | 'available' | 'unavailable' | 'deleted' | 'purchasable', Pick<EquipmentResult, 'metaCounter'>>
	>(EQUIPMENT_ADMIN_SUMMARY, { fetchPolicy: 'network-only' });
	const resorts = useQuery<{ getAllResortsByAdmin: { list: ResortSearchResult[] } }>(GET_ALL_RESORTS_BY_ADMIN, {
		variables: { input: { page: 1, limit: 100, search: {} } },
	});
	const [update, mutation] = useMutation(UPDATE_EQUIPMENT_BY_ADMIN);
	const items = data?.getAllEquipmentsByAdmin.list ?? [],
		total = data?.getAllEquipmentsByAdmin.metaCounter?.[0]?.total ?? 0;
	useEffect(() => {
		if (data && !loading && !queryError && page > Math.max(1, Math.ceil(total / limit)))
			setPage(Math.max(1, Math.ceil(total / limit)));
	}, [data, loading, queryError, page, total, limit]);
	const count = (key: 'all' | 'available' | 'unavailable' | 'deleted' | 'purchasable') =>
		summary.error || summary.loading ? '—' : summary.data?.[key].metaCounter?.[0]?.total ?? '—';
	const change = async (item: EquipmentPreview) => {
		if (
			lock.current ||
			!window.confirm(
				t(
					item.equipmentStatus === 'DELETE'
						? 'Restore this equipment to AVAILABLE?'
						: 'Archive this equipment and hide it from the public catalog?',
				),
			)
		)
			return;
		lock.current = true;
		setError('');
		try {
			await update({
				variables: {
					input: { _id: item._id, equipmentStatus: item.equipmentStatus === 'DELETE' ? 'AVAILABLE' : 'DELETE' },
				},
			});
			await Promise.all([refetch(), summary.refetch()]);
			setStockRefresh((v) => v + 1);
		} catch (e) {
			setError(e instanceof Error ? e.message : t('Unable to save'));
		} finally {
			lock.current = false;
		}
	};
	const exportCsv = () => {
		const cell = (v: unknown) =>
			`"${String(v ?? '')
				.replace(/^[=+@-]/, "'$&")
				.replace(/"/g, '""')}"`;
		const rows = [
			['Name', 'Brand', 'Category', 'Audience', 'Size', 'Status', 'Quantity', 'Purchase price', 'Resort'],
			...items.map((i) => [
				i.equipmentName,
				i.equipmentBrand,
				i.equipmentCategory,
				i.equipmentAudience,
				i.equipmentSize,
				i.equipmentStatus,
				i.equipmentQuantity,
				i.equipmentPurchasePrice,
				i.resortId,
			]),
		];
		const url = URL.createObjectURL(
			new Blob(['\uFEFF', rows.map((r) => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }),
		);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'equipment-current-page.csv';
		a.click();
		URL.revokeObjectURL(url);
	};
	return (
		<div className="admin-resorts admin-equipment">
			<header className="ar-heading">
				<div>
					<small className="ae-eyebrow">{t('Inventory Control')}</small>
					<h1>{t('Equipment')}</h1>
					<p>{t('Manage ski and snowboard equipment, rental rates, purchase pricing, inventory, and availability.')}</p>
				</div>
				<div>
					<Button
						className="ae-export"
						startIcon={<FileDownloadOutlinedIcon />}
						onClick={exportCsv}
						disabled={loading || !!queryError || !items.length}
					>
						{t('Export CSV')}
					</Button>
					<Link className="ar-primary" href="/_admin/equipment/create">
						+ {t('Add Equipment')}
					</Link>
				</div>
			</header>
			<div className="ar-summary">
				{[
					{ label: 'Total Equipment', value: count('all'), hint: 'All catalog records', Icon: Inventory2OutlinedIcon },
					{
						label: 'Available',
						value: count('available'),
						hint: 'Active in rental/catalog',
						Icon: CheckCircleOutlineIcon,
					},
					{
						label: 'Purchasable',
						value: count('purchasable'),
						hint: 'Direct retail enabled',
						Icon: ShoppingBagOutlinedIcon,
					},
					{
						label: 'Low Stock',
						value: stockCount ?? '—',
						hint: 'Inventory < 5 units · Excludes archived',
						Icon: WarningAmberOutlinedIcon,
					},
				].map(({ label, value, hint, Icon }) => (
					<div key={label} className={label === 'Low Stock' ? 'ae-summary-low' : ''}>
						<div className="ae-summary-heading">
							<small>{t(label)}</small>
							<Icon />
						</div>
						<strong>{value}</strong>
						<span>{t(hint)}</span>
					</div>
				))}
			</div>
			{summary.error && (
				<Alert severity="error" action={<Button onClick={() => void summary.refetch()}>{t('Retry')}</Button>}>
					{t('Unable to load equipment totals')}
				</Alert>
			)}
			{stockError && (
				<Alert severity="error" action={<Button onClick={() => setStockRefresh((v) => v + 1)}>{t('Retry')}</Button>}>
					{stockError}
				</Alert>
			)}
			<section className="ar-list">
				<nav className="ar-tabs">
					{[
						['', 'All', 'all'],
						['AVAILABLE', 'Available', 'available'],
						['MAINTENANCE', 'Unavailable', 'unavailable'],
						['DELETE', 'Deleted', 'deleted'],
					].map(([value, label, key]) => (
						<button
							key={key}
							aria-pressed={status === value}
							onClick={() => {
								setStatus(value);
								setPage(1);
							}}
						>
							{t(label)} <span>{count(key as 'all' | 'available' | 'unavailable' | 'deleted')}</span>
						</button>
					))}
				</nav>
				<div className="ar-filters">
					<input
						aria-label={t('Search equipment')}
						placeholder={t('Search equipment...')}
						value={text}
						onChange={(e) => {
							setText(e.target.value);
							setPage(1);
						}}
					/>
					{[
						{ label: 'All Categories', value: category, options: Object.values(EquipmentCategory), set: setCategory },
						{ label: 'All Audiences', value: audience, options: Object.values(EquipmentAudience), set: setAudience },
						{ label: 'All Statuses', value: status, options: ['AVAILABLE', 'MAINTENANCE', 'DELETE'], set: setStatus },
						{
							label: 'Sort',
							value: sort,
							options: [
								'createdAt',
								'updatedAt',
								'equipmentName',
								'equipmentViews',
								'equipmentLikes',
								'equipmentComments',
							],
							set: setSort,
						},
					].map((f) => (
						<select
							key={f.label}
							aria-label={t(f.label)}
							value={f.value}
							onChange={(e) => {
								f.set(e.target.value);
								if (f.label === 'All Categories') setSize('');
								setPage(1);
							}}
						>
							{f.label !== 'Sort' && <option value="">{t(f.label)}</option>}
							{f.options.map((o) => (
								<option key={o} value={o}>
									{t(
										o === 'createdAt'
											? 'Newest'
											: o === 'updatedAt'
											? 'Recently updated'
											: o === 'equipmentName'
											? 'Name'
											: o === 'equipmentViews'
											? 'Views'
											: o === 'equipmentLikes'
											? 'Likes'
											: o === 'equipmentComments'
											? 'Comments'
											: o,
									)}
								</option>
							))}
						</select>
					))}
					<input
						disabled={!category}
						aria-label={t('Size filter')}
						placeholder={t(category ? 'Size' : 'Select category for size')}
						value={size}
						onChange={(e) => {
							setSize(e.target.value);
							setPage(1);
						}}
					/>
					<Button
						onClick={() => {
							setText('');
							setCategory('');
							setAudience('');
							setSize('');
							setStatus('');
							setSort('createdAt');
							setResortId('');
							setPage(1);
						}}
					>
						{t('Reset')}
					</Button>
					<div className="ae-resort-filter">
						<ResortSelect
							value={resortId}
							onChange={(id) => {
								setResortId(id);
								setPage(1);
							}}
						/>
					</div>
				</div>
				{loading ? (
					<p className="ar-state" role="status">
						{t('Loading...')}
					</p>
				) : queryError ? (
					<Alert severity="error" action={<Button onClick={() => void refetch()}>{t('Retry')}</Button>}>
						{queryError.message}
					</Alert>
				) : (
					<>
						<div className="ar-grid">
							{items.map((item) => (
								<EquipmentAdminCard
									key={item._id}
									item={item}
									resortName={resorts.data?.getAllResortsByAdmin.list.find((r) => r._id === item.resortId)?.resortTitle}
									busy={mutation.loading}
									change={() => void change(item)}
								/>
							))}
						</div>
						{!items.length && <p className="ar-state">{t('No equipment found')}</p>}
					</>
				)}
				{error && <Alert severity="error">{error}</Alert>}
				<footer className="ar-pagination">
					<span>
						{total ? `${(page - 1) * limit + 1}–${Math.min(page * limit, total)} / ${total}` : '0 / 0'}{' '}
						{t('equipment items')}
					</span>
					<label>
						{t('Rows per page')}{' '}
						<select
							value={limit}
							onChange={(e) => {
								setLimit(Number(e.target.value));
								setPage(1);
							}}
						>
							{[6, 12, 24, 50].map((n) => (
								<option key={n}>{n}</option>
							))}
						</select>
					</label>
					<Pagination page={page} count={Math.max(1, Math.ceil(total / limit))} onChange={(_, n) => setPage(n)} />
				</footer>
			</section>
		</div>
	);
}
