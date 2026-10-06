import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useApolloClient, useQuery, useReactiveVar } from '@apollo/client';
import { Button, Drawer, IconButton, Pagination } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useTranslation } from 'next-i18next';
import { GET_EQUIPMENTS, GET_RESORTS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { CatalogInquiry } from '../../types/catalog';
import { EquipmentPreview, EquipmentPreviewData } from '../../types/equipment/equipment';
import { ResortSearchData } from '../../types/resort/resort';
import { EquipmentAudience, EquipmentCategory } from '../../enums/equipment.enum';
import { collectEquipmentPrices, equipmentSortOptions, parseEquipmentInput } from '../../equipmentSearch';
import useCatalogFavorite from '../../hooks/useCatalogFavorite';
import HomeCollectionState from '../homepage/HomeCollectionState';
import { EquipmentImage } from '../homepage/EquipmentCard';
import { homePrice } from '../homepage/homeUtils';

const sizeOptions: Record<EquipmentCategory, string[]> = {
	SKI: ['140 CM', '150 CM', '160 CM', '170 CM', '180 CM'],
	SNOWBOARD: ['130 CM', '140 CM', '150 CM', '155 CM', '160 CM'],
	BOOTS: ['23.5', '24.0', '24.5', '25.0', '25.5', '26.0', '26.5', '27.0', '27.5', '28.0'],
	HELMET: ['XS', 'S', 'M', 'L', 'XL'],
	POLES: ['100 CM', '110 CM', '120 CM', '130 CM'],
	CLOTHING: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
	OTHER: ['ONE SIZE'],
};

export default function EquipmentCatalog() {
	const router = useRouter();
	const { t, i18n } = useTranslation('common');
	const client = useApolloClient();
	const user = useReactiveVar(userVar);
	const input = useMemo(() => parseEquipmentInput(router.query.input), [router.query.input]);
	const priceSort = input.sort === 'purchasePrice';
	const [revision, setRevision] = useState(0);
	const [priceResult, setPriceResult] = useState<{ key: string; list: EquipmentPreview[]; error: boolean }>();
	const priceKey = JSON.stringify([input.search, input.direction, user._id, revision]);
	const {
		data,
		loading: queryLoading,
		error: queryError,
		refetch,
	} = useQuery<EquipmentPreviewData>(GET_EQUIPMENTS, {
		variables: { input },
		skip: !router.isReady || priceSort,
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
	});
	const {
		data: resorts,
		error: resortError,
		refetch: retryResorts,
	} = useQuery<ResortSearchData>(GET_RESORTS, {
		variables: { input: { page: 1, limit: 100, sort: 'resortTitle', direction: 'ASC', search: {} } },
		skip: !router.isReady,
	});
	const favorite = useCatalogFavorite('equipment');
	const [search, setSearch] = useState('');
	const [brand, setBrand] = useState('');
	const [customSize, setCustomSize] = useState('');
	const [mobileOpen, setMobileOpen] = useState(false);
	const [priceMode, setPriceMode] = useState<'rental' | 'purchase'>('rental');
	const [duration, setDuration] = useState('');
	const [minimum, setMinimum] = useState('');
	const [maximum, setMaximum] = useState('');
	const [priceError, setPriceError] = useState('');
	useEffect(() => {
		setSearch(typeof input.search.text === 'string' ? input.search.text : '');
		setBrand(typeof input.search.equipmentBrand === 'string' ? input.search.equipmentBrand : '');
		setCustomSize('');
		setDuration(String(input.search.rentalDurationHours ?? ''));
		const mode = input.search.purchasePricesRange ? 'purchase' : 'rental';
		setPriceMode(mode);
		const range = input.search[mode === 'purchase' ? 'purchasePricesRange' : 'rentalPricesRange'];
		setMinimum(range && typeof range === 'object' && !Array.isArray(range) ? String(range.start) : '');
		setMaximum(range && typeof range === 'object' && !Array.isArray(range) ? String(range.end) : '');
		setPriceError('');
	}, [input]);
	useEffect(() => {
		if (!router.isReady || priceSort) return;
		void refetch().catch(() => undefined);
	}, [user._id, router.isReady, priceSort, refetch]);
	useEffect(() => {
		if (!router.isReady || !priceSort) return;
		let cancelled = false;
		void collectEquipmentPrices(
			async (next) => {
				const result = await client.query<EquipmentPreviewData>({
					query: GET_EQUIPMENTS,
					variables: { input: next },
					fetchPolicy: 'network-only',
				});
				return result.data;
			},
			input,
			() => cancelled,
		).then(
			(list) => {
				if (!cancelled) setPriceResult({ key: priceKey, list, error: false });
			},
			() => {
				if (!cancelled) setPriceResult({ key: priceKey, list: [], error: true });
			},
		);
		return () => {
			cancelled = true;
		};
		// Page changes slice the already sorted collection without refetching it.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [client, router.isReady, priceSort, priceKey]);
	const loading = !router.isReady || (priceSort ? priceResult?.key !== priceKey : queryLoading);
	const error = priceSort ? priceResult?.key === priceKey && priceResult.error : Boolean(queryError);
	const all = priceSort && priceResult?.key === priceKey ? priceResult.list : [];
	const list = priceSort
		? all.slice((input.page - 1) * input.limit, input.page * input.limit)
		: data?.getEquipments.list ?? [];
	const total = priceSort ? all.length : data?.getEquipments.metaCounter[0]?.total ?? 0;
	const retry = async () => {
		if (priceSort) setRevision((value) => value + 1);
		else await refetch();
	};
	const navigate = (next: CatalogInquiry) =>
		void router.push({ pathname: '/equipment', query: { input: JSON.stringify(next) } }, undefined, { scroll: false });
	const update = (changes: Record<string, CatalogInquiry['search'][string] | undefined>) => {
		const next = { ...input.search };
		Object.entries(changes).forEach(([key, value]) => {
			if (value === undefined || value === '' || (Array.isArray(value) && !value.length)) delete next[key];
			else next[key] = value;
		});
		navigate({ ...input, page: 1, search: next });
	};
	const selected = (key: string): string[] => (Array.isArray(input.search[key]) ? (input.search[key] as string[]) : []);
	const categories = selected('categoryList');
	const category = categories.length === 1 ? (categories[0] as EquipmentCategory) : undefined;
	const toggle = (key: string, value: string) => {
		const values = selected(key);
		update({
			[key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
			...(key === 'categoryList' ? { sizeList: undefined } : {}),
		});
	};
	const clear = () => {
		setPriceMode('rental');
		navigate({ ...input, page: 1, search: {} });
	};
	const applyPrice = (event: React.FormEvent) => {
		event.preventDefault();
		const start = minimum.trim() ? Number(minimum) : 0;
		const end = maximum.trim() ? Number(maximum) : NaN;
		const hours = Number(duration);
		if ((minimum || maximum) && (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start)) {
			setPriceError(t('Enter a valid price range'));
			return;
		}
		if (
			priceMode === 'rental' &&
			(duration || minimum || maximum) &&
			(!Number.isInteger(hours) || hours < 1 || hours > 2147483647)
		) {
			setPriceError(t('Choose a positive whole-hour rental package'));
			return;
		}
		setPriceError('');
		update({
			rentalPricesRange: priceMode === 'rental' && (minimum || maximum) ? { start, end } : undefined,
			purchasePricesRange: priceMode === 'purchase' && (minimum || maximum) ? { start, end } : undefined,
			rentalDurationHours: priceMode === 'rental' && duration ? hours : undefined,
			...(priceMode === 'purchase' && (minimum || maximum) ? { equipmentPurchasable: true } : {}),
		});
	};
	const filters = (suffix: string) => (
		<div className="equipment-filters">
			<div className="equipment-filter-heading">
				<h2>{t('Filters')}</h2>
				<button type="button" onClick={clear}>
					{t('Clear all')}
				</button>
			</div>
			<fieldset>
				<legend>{t('Category')}</legend>
				{Object.values(EquipmentCategory).map((value) => (
					<label key={value}>
						<input
							type="checkbox"
							checked={categories.includes(value)}
							onChange={() => toggle('categoryList', value)}
						/>
						{t(value)}
					</label>
				))}
			</fieldset>
			<fieldset>
				<legend>{t('Audience')}</legend>
				{[
					['', 'All audiences'],
					[EquipmentAudience.ADULTS, 'Adults'],
					[EquipmentAudience.KIDS, 'Kids'],
					[EquipmentAudience.ALL, 'Audience ALL'],
				].map(([value, label]) => (
					<label key={value}>
						<input
							type="radio"
							name={`audience-${suffix}`}
							checked={(selected('audienceList')[0] ?? '') === value}
							onChange={() => update({ audienceList: value ? [value] : undefined })}
						/>
						{t(label)}
					</label>
				))}
			</fieldset>
			<fieldset>
				<legend>{t(category === EquipmentCategory.BOOTS ? 'Size (Mondopoint / CM)' : 'Size')}</legend>
				{category ? (
					<>
						<div className="equipment-size-pills">
							{Array.from(new Set([...sizeOptions[category], ...selected('sizeList')])).map((size) => (
								<button
									type="button"
									key={size}
									aria-pressed={selected('sizeList').includes(size)}
									onClick={() => toggle('sizeList', size)}
								>
									{size}
								</button>
							))}
						</div>
						<form
							onSubmit={(event) => {
								event.preventDefault();
								if (customSize.trim()) {
									update({ sizeList: [customSize.trim()] });
									setCustomSize('');
								}
							}}
							className="equipment-inline-form"
						>
							<input
								aria-label={t('Custom size')}
								placeholder={t('Custom size')}
								value={customSize}
								onChange={(event) => setCustomSize(event.target.value)}
							/>
							<button type="submit">{t('Apply')}</button>
						</form>
					</>
				) : (
					<p>{t('Select one category to filter sizes')}</p>
				)}
			</fieldset>
			<fieldset>
				<legend>{t('Brand')}</legend>
				<form
					className="equipment-inline-form"
					onSubmit={(event) => {
						event.preventDefault();
						update({ equipmentBrand: brand.trim() });
					}}
				>
					<input
						aria-label={t('Brand')}
						placeholder={t('Enter a brand')}
						value={brand}
						onChange={(event) => setBrand(event.target.value)}
					/>
					<button type="submit">{t('Apply')}</button>
				</form>
			</fieldset>
			<fieldset>
				<legend>{t('Availability mode')}</legend>
				{[
					['all', 'All equipment'],
					['rent', 'Rental only'],
					['buy', 'Purchase available'],
				].map(([value, label]) => (
					<label key={value}>
						<input
							type="radio"
							name={`mode-${suffix}`}
							checked={
								(input.search.equipmentPurchasable === true
									? 'buy'
									: input.search.equipmentPurchasable === false
									? 'rent'
									: 'all') === value
							}
							onChange={() =>
								update({
									equipmentPurchasable: value === 'all' ? undefined : value === 'buy',
									...(value !== 'buy' ? { purchasePricesRange: undefined } : {}),
								})
							}
						/>
						{t(label)}
					</label>
				))}
			</fieldset>
			<fieldset>
				<legend>{t('Price filter')}</legend>
				<div className="equipment-price-tabs">
					{(['rental', 'purchase'] as const).map((mode) => (
						<button
							type="button"
							key={mode}
							aria-pressed={priceMode === mode}
							onClick={() => {
								setPriceMode(mode);
								setMinimum('');
								setMaximum('');
								setPriceError('');
							}}
						>
							{t(mode === 'rental' ? 'Rental price' : 'Purchase price')}
						</button>
					))}
				</div>
				<form onSubmit={applyPrice}>
					{priceMode === 'rental' && (
						<label className="equipment-input-label">
							{t('Rental duration (hours)')}
							<input
								type="number"
								min="1"
								max="2147483647"
								step="1"
								value={duration}
								onChange={(event) => setDuration(event.target.value)}
							/>
						</label>
					)}
					<div className="equipment-price-inputs">
						<label className="equipment-input-label">
							{t('Minimum (KRW)')}
							<input
								type="number"
								min="0"
								step="any"
								value={minimum}
								onChange={(event) => setMinimum(event.target.value)}
							/>
						</label>
						<label className="equipment-input-label">
							{t('Maximum (KRW)')}
							<input
								type="number"
								min="0"
								step="any"
								value={maximum}
								onChange={(event) => setMaximum(event.target.value)}
							/>
						</label>
					</div>
					{priceError && (
						<p role="alert" className="equipment-price-error">
							{priceError}
						</p>
					)}
					<Button type="submit" size="small">
						{t('Apply price filter')}
					</Button>
				</form>
			</fieldset>
			<fieldset>
				<legend>{t('Resort')}</legend>
				<select
					aria-label={t('Resort')}
					value={String(input.search.resortId ?? '')}
					onChange={(event) => update({ resortId: event.target.value })}
				>
					<option value="">{t('All resorts')}</option>
					{input.search.resortId &&
						!resorts?.getResorts.list.some((resort) => resort._id === input.search.resortId) && (
							<option value={String(input.search.resortId)}>{t('Selected resort')}</option>
						)}
					{resorts?.getResorts.list.map((resort) => (
						<option key={resort._id} value={resort._id}>
							{resort.resortTitle}
						</option>
					))}
				</select>
				{resortError && (
					<button type="button" onClick={() => void retryResorts().catch(() => undefined)}>
						{t('Retry')}
					</button>
				)}
			</fieldset>
		</div>
	);
	const start = list.length ? (input.page - 1) * input.limit + 1 : 0;
	const countLabel = t('Showing equipment range', { start, end: list.length ? start + list.length - 1 : 0, total });
	return (
		<div className="equipment-directory">
			<Head>
				<title>{t('Ski & Snowboard Equipment')} | SNOWKR</title>
			</Head>
			<section className="equipment-banner">
				<div className="equipment-container">
					<span>{t('Catalog & Inventory')}</span>
					<h1>{t('Ski & Snowboard Equipment')}</h1>
					<p>{t('Browse equipment available to rent or buy.')}</p>
				</div>
			</section>
			<section className="equipment-search-strip">
				<div className="equipment-container">
					<form
						className="equipment-search"
						onSubmit={(event) => {
							event.preventDefault();
							update({ text: search.trim() });
						}}
					>
						<SearchRoundedIcon />
						<input
							aria-label={t('Search equipment')}
							placeholder={t('Search equipment by name...')}
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>
						{search && (
							<IconButton
								aria-label={t('Clear search')}
								onClick={() => {
									setSearch('');
									update({ text: undefined });
								}}
							>
								<CloseRoundedIcon />
							</IconButton>
						)}
						<Button type="submit" variant="contained" disableElevation>
							{t('Search')}
						</Button>
					</form>
				</div>
			</section>
			<div className="equipment-container equipment-main">
				<Button
					className="equipment-mobile-filters"
					startIcon={<TuneRoundedIcon />}
					onClick={() => setMobileOpen(true)}
				>
					{t('Filters')}
				</Button>
				<aside className="equipment-desktop-filters">{filters('desktop')}</aside>
				<section className="equipment-results" aria-label={t('Equipment results')} aria-busy={loading}>
					<div className="equipment-toolbar">
						<p role="status">{loading ? t('Loading collection') : error ? t('Results') : countLabel}</p>
						<label>
							{t('Sort By:')}
							<select
								aria-label={t('Sort equipment')}
								value={`${input.sort}:${input.direction}`}
								onChange={(event) => {
									const [sort, direction] = event.target.value.split(':');
									navigate({ ...input, page: 1, sort, direction: direction === 'ASC' ? 'ASC' : 'DESC' });
								}}
							>
								{equipmentSortOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{t(option.label)}
									</option>
								))}
							</select>
						</label>
					</div>
					{priceSort && (
						<p className="equipment-sort-note">{t('Sorted by purchase price. Rental-only items appear last.')}</p>
					)}
					<HomeCollectionState loading={loading} error={Boolean(error)} empty={!list.length} retry={retry} skeleton />
					{!loading && !error && (
						<>
							<div className="equipment-grid">
								{list.map((item) => {
									const href = `/equipment/detail?id=${encodeURIComponent(item._id)}`;
									const liked = item.meLiked?.some((like) => like.myFavorite) ?? false;
									const rate =
										typeof input.search.rentalDurationHours === 'number'
											? item.equipmentRentalRates.find(
													(value) => value.durationHours === input.search.rentalDurationHours,
											  )
											: item.equipmentRentalRates.reduce<EquipmentPreview['equipmentRentalRates'][number] | undefined>(
													(lowest, value) => (!lowest || value.price < lowest.price ? value : lowest),
													undefined,
											  );
									return (
										<article className="equipment-card" key={item._id}>
											<div className="equipment-card-photo">
												<Link href={href} aria-label={item.equipmentName}>
													<EquipmentImage equipment={item} />
												</Link>
												<IconButton
													className={liked ? 'is-saved' : ''}
													aria-label={t(liked ? 'Remove favorite' : 'Save favorite')}
													aria-pressed={liked}
													disabled={favorite.pending.has(item._id)}
													onClick={async () => {
														await favorite.toggle(item._id);
														if (priceSort && user._id) setRevision((value) => value + 1);
													}}
												>
													{liked ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
												</IconButton>
											</div>
											<div className="equipment-card-body">
												<span className="equipment-brand">{item.equipmentBrand || t('Unbranded')}</span>
												<h2>
													<Link href={href}>{item.equipmentName}</Link>
												</h2>
												<p className="equipment-card-meta">
													{t(item.equipmentCategory)} · {item.equipmentSize || t('Size not specified')} ·{' '}
													{t(`Audience ${item.equipmentAudience}`)}
												</p>
												<div className="equipment-social">
													<span>
														<VisibilityOutlinedIcon />
														{(item.equipmentViews ?? 0).toLocaleString()} {t('Views')}
													</span>
													<span>
														<FavoriteBorderRoundedIcon />
														{(item.equipmentLikes ?? 0).toLocaleString()} {t('Likes')}
													</span>
												</div>
												<div className="equipment-card-footer">
													<div>
														{rate && (
															<>
																<strong>{t('Rent from price', { price: homePrice(rate.price, i18n.language) })}</strong>
																<small>{t('Equipment package hours', { hours: rate.durationHours })}</small>
															</>
														)}
														<p>
															{item.equipmentPurchasable && item.equipmentPurchasePrice != null
																? t('Buy equipment price', {
																		price: homePrice(item.equipmentPurchasePrice, i18n.language),
																  })
																: t('Rental only')}
														</p>
													</div>
													<Button component={Link} href={href} variant="contained" size="small" disableElevation>
														{t('View Item')}
													</Button>
												</div>
											</div>
										</article>
									);
								})}
							</div>
							<div className="equipment-pagination">
								<p>{countLabel}</p>
								{total > input.limit && (
									<Pagination
										count={Math.ceil(total / input.limit)}
										page={input.page}
										onChange={(_event, page) => {
											navigate({ ...input, page });
											document.querySelector('.equipment-toolbar')?.scrollIntoView({ block: 'start' });
										}}
										shape="rounded"
										color="primary"
									/>
								)}
							</div>
						</>
					)}
					{!loading && !error && !list.length && input.page > 1 && (
						<Button onClick={() => navigate({ ...input, page: 1 })}>{t('Back to first page')}</Button>
					)}
				</section>
			</div>
			<Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)}>
				<div className="equipment-filter-drawer">
					<div className="equipment-drawer-close">
						<IconButton aria-label={t('Close filters')} onClick={() => setMobileOpen(false)}>
							<CloseRoundedIcon />
						</IconButton>
					</div>
					{filters('mobile')}
					<Button fullWidth variant="contained" onClick={() => setMobileOpen(false)}>
						{t('Show results')}
					</Button>
				</div>
			</Drawer>
		</div>
	);
}
