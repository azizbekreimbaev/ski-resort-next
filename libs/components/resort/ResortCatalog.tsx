import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Button, Checkbox, Chip, Drawer, IconButton, MenuItem, Pagination, TextField } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DownhillSkiingRoundedIcon from '@mui/icons-material/DownhillSkiingRounded';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useTranslation } from 'next-i18next';
import { GET_RESORTS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { parseCatalogInquiry } from '../../catalogSearch';
import { parseTravelDates } from '../../resortSearch';
import { ResortFacilities, ResortLevel, ResortLocation } from '../../enums/resort.enum';
import { CatalogInquiry } from '../../types/catalog';
import { ResortSearchData, ResortSearchResult } from '../../types/resort/resort';
import useCatalogFavorite from '../../hooks/useCatalogFavorite';
import HomeCollectionState from '../homepage/HomeCollectionState';
import { homeImageUrl, homePrice } from '../homepage/homeUtils';

export const resortCatalogSortOptions = [
	{ value: 'resortViews:DESC', label: 'Most viewed' },
	{ value: 'resortLikes:DESC', label: 'Popular (most likes)' },
	{ value: 'resortPricePerDay:DESC', label: 'Price high to low' },
	{ value: 'resortPricePerDay:ASC', label: 'Price low to high' },
];

export function parseResortCatalogInput(raw: string | string[] | undefined): CatalogInquiry {
	const input = parseCatalogInquiry('resort', raw);
	// Keep existing homepage and saved links; new directory visits default to views.
	if (!raw) input.sort = 'resortViews';
	return { ...input, limit: 8 };
}

function ResortCatalogCard({
	resort,
	pending,
	onFavorite,
	dates,
}: {
	resort: ResortSearchResult;
	pending: boolean;
	onFavorite: (id: string) => Promise<void>;
	dates: { arrival: string; departure: string };
}) {
	const { t, i18n } = useTranslation('common');
	const liked = resort.meLiked?.some((item) => item.myFavorite) ?? false;
	const href = `/resort/detail?${new URLSearchParams({ id: resort._id, ...(dates.arrival ? dates : {}) })}`;
	return (
		<article className="resort-directory-card">
			<div className="resort-directory-photo">
				<Link href={href} aria-label={resort.resortTitle}>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={homeImageUrl(resort.resortImages[0]) || '/img/hero/winter-1.jpg'}
						alt={resort.resortTitle}
						loading="lazy"
						onError={(event) => {
							if (!event.currentTarget.src.endsWith('/img/hero/winter-1.jpg'))
								event.currentTarget.src = '/img/hero/winter-1.jpg';
						}}
					/>
				</Link>
				<IconButton
					className={`resort-save${liked ? ' is-saved' : ''}`}
					disabled={pending}
					aria-label={t(liked ? 'Remove favorite' : 'Save favorite')}
					aria-pressed={liked}
					onClick={() => void onFavorite(resort._id)}
				>
					{liked ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
				</IconButton>
				{resort.resortStatus === 'SOLD_OUT' && <Chip className="resort-status" size="small" label={t('Sold out')} />}
			</div>
			<div className="resort-directory-card-body">
				<div className="resort-city">
					<LocationOnOutlinedIcon />
					{t(resort.resortLocation)}
				</div>
				<h2>
					<Link href={href}>{resort.resortTitle}</Link>
				</h2>
				<div className="resort-social">
					<span>
						<VisibilityOutlinedIcon />
						{resort.resortViews.toLocaleString()} {t('Views')}
					</span>
					<span>
						<FavoriteBorderRoundedIcon />
						{resort.resortLikes.toLocaleString()} {t('Likes')}
					</span>
					<span>
						<ChatBubbleOutlineRoundedIcon />
						{(resort.resortComments ?? 0).toLocaleString()} {t('Comments')}
					</span>
				</div>
				<div className="resort-directory-tags">
					{resort.resortLevel && (
						<span className={`resort-level level-${resort.resortLevel.toLowerCase()}`}>{t(resort.resortLevel)}</span>
					)}
					{resort.resortFacilities?.map((facility) => (
						<span key={facility}>{t(facility)}</span>
					))}
				</div>
				<div className="resort-directory-card-footer">
					<div>
						<span className="resort-price-label">{t('Daily resort price')}</span>
						<strong>
							{homePrice(resort.resortPricePerDay, i18n.language)}
							<small> / {t('day')}</small>
						</strong>
						<span className="resort-minimum">{t('Minimum stay', { count: resort.resortMinDays })}</span>
					</div>
					<Button
						component={Link}
						href={href}
						variant="contained"
						disableElevation
						endIcon={<ArrowForwardRoundedIcon />}
					>
						{t('View Resort')}
					</Button>
				</div>
			</div>
		</article>
	);
}

export default function ResortCatalog() {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const lastMember = useRef(user._id);
	const input = useMemo(() => parseResortCatalogInput(router.query.input), [router.query.input]);
	const dates = parseTravelDates(router.query.arrival, router.query.departure);
	const [search, setSearch] = useState('');
	const [mobileOpen, setMobileOpen] = useState(false);
	const [minimum, setMinimum] = useState('');
	const [maximum, setMaximum] = useState('');
	const [priceError, setPriceError] = useState('');
	const { data, loading, error, refetch } = useQuery<ResortSearchData>(GET_RESORTS, {
		variables: { input },
		skip: !router.isReady,
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
	});
	const favorite = useCatalogFavorite('resort');
	useEffect(() => {
		setSearch(typeof input.search.text === 'string' ? input.search.text : '');
		const range = input.search.pricesRange;
		const price = typeof range === 'object' && !Array.isArray(range) ? range : undefined;
		setMinimum(price ? String(price.start) : '');
		setMaximum(price ? String(price.end) : '');
		setPriceError('');
	}, [input]);
	useEffect(() => {
		if (router.isReady && lastMember.current !== user._id) {
			lastMember.current = user._id;
			void refetch().catch(() => undefined);
		}
	}, [router.isReady, user._id, refetch]);
	const navigate = (next: CatalogInquiry) =>
		void router.push(
			{
				pathname: '/resort',
				query: { input: JSON.stringify(next), ...(dates.arrival ? dates : {}) },
			},
			undefined,
			{ scroll: false },
		);
	const updateSearch = (key: string, value: CatalogInquiry['search'][string] | undefined) => {
		const next = { ...input.search };
		if (value === undefined || value === '' || (Array.isArray(value) && !value.length)) delete next[key];
		else next[key] = value;
		navigate({ ...input, page: 1, search: next });
	};
	const selected = (key: string): string[] => (Array.isArray(input.search[key]) ? (input.search[key] as string[]) : []);
	const toggle = (key: string, value: string) => {
		const values = selected(key);
		updateSearch(key, values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
	};
	const clear = () => {
		setSearch('');
		setMinimum('');
		setMaximum('');
		setPriceError('');
		navigate({ ...input, page: 1, search: {} });
	};
	const applyPrice = (event: React.FormEvent) => {
		event.preventDefault();
		if (!minimum && !maximum) {
			updateSearch('pricesRange', undefined);
			return;
		}
		const start = minimum.trim() ? Number(minimum) : 0;
		const end = maximum.trim() ? Number(maximum) : NaN;
		if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start) {
			setPriceError(t('Enter a valid price range'));
			return;
		}
		setPriceError('');
		updateSearch('pricesRange', { start, end });
	};
	const activeCount =
		selected('locationList').length +
		selected('levelList').length +
		selected('facilities').length +
		(input.search.pricesRange ? 1 : 0) +
		(input.search.text ? 1 : 0);
	const checkboxGroup = (key: string, title: string, values: string[], allLabel?: string) => (
		<fieldset className="resort-filter-group">
			<legend>{t(title)}</legend>
			{allLabel && (
				<label>
					<Checkbox size="small" checked={!selected(key).length} onChange={() => updateSearch(key, undefined)} />
					<span>{t(allLabel)}</span>
				</label>
			)}
			{values.map((value) => (
				<label key={value}>
					<Checkbox size="small" checked={selected(key).includes(value)} onChange={() => toggle(key, value)} />
					<span>{t(value)}</span>
				</label>
			))}
		</fieldset>
	);
	const filters = (
		<>
			<div className="resort-filter-header">
				<strong>
					<TuneRoundedIcon />
					{t('Filters')}
				</strong>
				<Button size="small" onClick={clear}>
					{t('Clear all')}
				</Button>
			</div>
			{checkboxGroup('locationList', 'Cities', Object.values(ResortLocation), 'All Korea')}
			{checkboxGroup('levelList', 'Ski level', Object.values(ResortLevel))}
			<form className="resort-filter-group resort-price-filter" onSubmit={applyPrice}>
				<h3>{t('Daily resort price')}</h3>
				<div className="resort-price-bounds">
					<label className="resort-price-bound">
						<span>{t('Minimum')}</span>
						<TextField
							hiddenLabel
							fullWidth
							size="small"
							type="number"
							placeholder="0"
							inputProps={{ min: 0, step: 'any', 'aria-label': t('Daily price minimum') }}
							value={minimum}
							onChange={(event) => setMinimum(event.target.value)}
						/>
					</label>
					<label className="resort-price-bound">
						<span>{t('Maximum')}</span>
						<TextField
							hiddenLabel
							fullWidth
							size="small"
							type="number"
							placeholder="150000"
							inputProps={{ min: 0, step: 'any', 'aria-label': t('Daily price maximum') }}
							value={maximum}
							onChange={(event) => setMaximum(event.target.value)}
						/>
					</label>
				</div>
				<small>{t('Prices in KRW')}</small>
				{priceError && <Alert severity="error">{priceError}</Alert>}
				<Button variant="outlined" type="submit" size="small">
					{t('Apply price range')}
				</Button>
			</form>
			{checkboxGroup('facilities', 'Facilities', Object.values(ResortFacilities))}
		</>
	);
	const list = data?.getResorts.list ?? [];
	const total = data?.getResorts.metaCounter?.[0]?.total ?? 0;
	const busy = loading || !router.isReady;
	const start = list.length ? (input.page - 1) * input.limit + 1 : 0;
	const summary = t('Showing resorts range', { start, end: list.length ? start + list.length - 1 : 0, total });
	const sortValue = `${input.sort}:${input.direction}`;
	return (
		<div className="resort-directory">
			<section className="resort-directory-hero">
				<div className="resort-directory-container">
					<span className="resort-hero-eyebrow">
						<DownhillSkiingRoundedIcon />
						{t('Discover winter in Korea')}
					</span>
					<h1>{t('Explore Ski Resorts in Korea')}</h1>
					<p>{t('Resort directory introduction')}</p>
				</div>
			</section>
			<div className="resort-directory-container resort-directory-main">
				<form
					className="resort-directory-search"
					onSubmit={(event) => {
						event.preventDefault();
						updateSearch('text', search.trim());
					}}
				>
					<SearchRoundedIcon />
					<input
						aria-label={t('Search resorts by name')}
						placeholder={t('Search resorts by name')}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
					<Button type="submit" variant="contained" disableElevation>
						{t('Search')}
					</Button>
				</form>
				{dates.arrival && (
					<Alert severity="info">
						{t('Dates are saved for your trip. Availability is not checked.')} {dates.arrival} — {dates.departure}
					</Alert>
				)}
				<div className="resort-directory-layout">
					<aside className="resort-desktop-filters" aria-label={t('Filters')}>
						{filters}
					</aside>
					<div className="resort-directory-results" aria-busy={busy}>
						<div className="resort-directory-toolbar">
							<strong role="status">{busy ? t('Loading collection') : error ? t('Resorts') : summary}</strong>
							<Button
								className="resort-mobile-filters"
								variant="outlined"
								startIcon={<TuneRoundedIcon />}
								onClick={() => setMobileOpen(true)}
							>
								{t('Filters')}
								{activeCount ? ` (${activeCount})` : ''}
							</Button>
							<TextField
								select
								size="small"
								label={t('Sort by')}
								value={sortValue}
								onChange={(event) => {
									const [sort, direction] = event.target.value.split(':');
									navigate({ ...input, page: 1, sort, direction: direction === 'ASC' ? 'ASC' : 'DESC' });
								}}
							>
								{!resortCatalogSortOptions.some((option) => option.value === sortValue) && (
									<MenuItem value={sortValue}>
										{t(input.sort)} · {input.direction}
									</MenuItem>
								)}
								{resortCatalogSortOptions.map((option) => (
									<MenuItem key={option.value} value={option.value}>
										{t(option.label)}
									</MenuItem>
								))}
							</TextField>
						</div>
						{activeCount > 0 && (
							<div className="resort-active-filters">
								{(['locationList', 'levelList', 'facilities'] as const).flatMap((key) =>
									selected(key).map((value) => (
										<Chip key={`${key}:${value}`} label={t(value)} size="small" onDelete={() => toggle(key, value)} />
									)),
								)}
								{typeof input.search.text === 'string' && (
									<Chip size="small" label={input.search.text} onDelete={() => updateSearch('text', undefined)} />
								)}
								{input.search.pricesRange && (
									<Chip
										size="small"
										label={t('Daily resort price')}
										onDelete={() => updateSearch('pricesRange', undefined)}
									/>
								)}
							</div>
						)}
						<HomeCollectionState loading={busy} error={Boolean(error)} empty={false} retry={refetch} skeleton />
						{!busy && !error && !list.length && (
							<div className="resort-directory-empty">
								<DownhillSkiingRoundedIcon />
								<h2>{t('No resorts match your filters')}</h2>
								<p>{t('Try another city or clear your filters.')}</p>
								<Button onClick={clear}>{t('Clear all')}</Button>
								{input.page > 1 && (
									<Button onClick={() => navigate({ ...input, page: 1 })}>{t('Back to first page')}</Button>
								)}
							</div>
						)}
						{!busy && !error && (
							<div className="resort-directory-grid">
								{list.map((resort) => (
									<ResortCatalogCard
										key={resort._id}
										resort={resort}
										dates={dates}
										pending={favorite.pending.has(resort._id)}
										onFavorite={favorite.toggle}
									/>
								))}
							</div>
						)}
						{!error && total > 0 && (
							<div className="resort-directory-pagination">
								<span>{busy ? t('Loading collection') : summary}</span>
								<Pagination
									shape="rounded"
									color="primary"
									count={Math.max(input.page, Math.ceil(total / input.limit))}
									page={input.page}
									disabled={busy}
									onChange={(_event, page) => navigate({ ...input, page })}
								/>
							</div>
						)}
					</div>
				</div>
			</div>
			<Drawer
				anchor="left"
				open={mobileOpen}
				onClose={() => setMobileOpen(false)}
				PaperProps={{ className: 'resort-filter-drawer' }}
			>
				<div className="resort-drawer-close">
					<IconButton aria-label={t('Close filters')} onClick={() => setMobileOpen(false)}>
						<CloseRoundedIcon />
					</IconButton>
				</div>
				{mobileOpen && filters}
				<Button variant="contained" onClick={() => setMobileOpen(false)}>
					{t('Show results')}
				</Button>
			</Drawer>
		</div>
	);
}
