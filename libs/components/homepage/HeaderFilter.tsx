import React, { useEffect, useId, useMemo, useState } from 'react';
import { Button, Chip, InputAdornment, MenuItem, TextField, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import DownhillSkiingOutlinedIcon from '@mui/icons-material/DownhillSkiingOutlined';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { ResortFacilities, ResortLevel, ResortLocation } from '../../enums/resort.enum';
import { defaultResortInquiry, parseTravelDates } from '../../resortSearch';
import { ResortsInquiry } from '../../types/resort/resort.input';
import { homeRegions } from './homeSearchOptions';
import TravelDateRange from './TravelDateRange';

interface HeaderFilterProps {
	initialInput?: ResortsInquiry;
	onSearch?: (input: ResortsInquiry, dates: ReturnType<typeof parseTravelDates>) => void;
}

const HeaderFilter = ({ initialInput, onSearch }: HeaderFilterProps) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const fieldId = useId();
	const tripDates = useMemo(
		() => parseTravelDates(router.query.arrival, router.query.departure),
		[router.query.arrival, router.query.departure],
	);
	const [arrival, setArrival] = useState(tripDates.arrival);
	const [departure, setDeparture] = useState(tripDates.departure);
	const [dateError, setDateError] = useState(false);
	const [location, setLocation] = useState<ResortLocation | ''>(initialInput?.search.locationList?.[0] ?? '');
	const [region, setRegion] = useState('');
	const [level, setLevel] = useState<ResortLevel | ''>(initialInput?.search.levelList?.[0] ?? '');
	const [facilities, setFacilities] = useState<ResortFacilities[]>([]);
	useEffect(() => {
		setLocation(initialInput?.search.locationList?.[0] ?? '');
		setLevel(initialInput?.search.levelList?.[0] ?? '');
	}, [initialInput]);
	useEffect(() => {
		setArrival(tripDates.arrival);
		setDeparture(tripDates.departure);
		setDateError(false);
	}, [tripDates]);
	const searchHandler = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const dates = parseTravelDates(arrival, departure);
		if ((arrival || departure) && !dates.arrival) {
			setDateError(true);
			return;
		}
		setDateError(false);
		const input = defaultResortInquiry();
		const locations = onSearch
			? homeRegions.find((option) => option.value === region)?.locations
			: location
				? [location]
				: undefined;
		if (locations) input.search.locationList = locations;
		if (level) input.search.levelList = [level];
		if (facilities.length) input.search.facilities = facilities;
		if (onSearch) {
			onSearch(input, dates);
			return;
		}
		void router.push({ pathname: '/resort', query: { input: JSON.stringify(input), ...(dates.arrival ? dates : {}) } });
	};
	const dateField = (
		<TravelDateRange
			inputId={`${fieldId}-dates`}
			homepage={Boolean(onSearch)}
			arrival={arrival}
			departure={departure}
			error={dateError}
			onChange={(start, end) => {
				setArrival(start);
				setDeparture(end);
				setDateError(false);
			}}
		/>
	);
	return (
		<form
			className={`resort-search-form${onSearch ? ' home-search-panel' : ''}`}
			onSubmit={searchHandler}
			aria-label={t('Resort Search')}
		>
			{onSearch ? (
				<>
					<div className="home-search-field">
						<label className="home-search-label" htmlFor={`${fieldId}-region`}>
							{t('Province / Region')}
						</label>
						<TextField
							id={`${fieldId}-region`}
							select
							value={region}
							onChange={(event) => setRegion(event.target.value)}
							fullWidth
							size="small"
							SelectProps={{ displayEmpty: true, inputProps: { 'aria-label': t('Province / Region') } }}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<LocationOnOutlinedIcon />
									</InputAdornment>
								),
							}}
						>
							<MenuItem value="">{t('All Regions')}</MenuItem>
							{homeRegions.map((option) => (
								<MenuItem value={option.value} key={option.value}>
									{t(option.label)}
								</MenuItem>
							))}
						</TextField>
					</div>
					<div className="home-search-field">
						<label
							className="home-search-label"
							htmlFor={`${fieldId}-dates`}
							title={t('Dates are saved for your trip. Availability is not checked.')}
						>
							{t('Trip Dates')}
						</label>
						{dateField}
					</div>
					<div className="home-search-field">
						<label className="home-search-label" htmlFor={`${fieldId}-level`}>
							{t('Skill Level')}
						</label>
						<TextField
							id={`${fieldId}-level`}
							select
							value={level}
							onChange={(event) => setLevel(event.target.value as ResortLevel | '')}
							fullWidth
							size="small"
							SelectProps={{ displayEmpty: true, inputProps: { 'aria-label': t('Skill Level') } }}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<DownhillSkiingOutlinedIcon />
									</InputAdornment>
								),
							}}
						>
							<MenuItem value="">{t('All Levels')}</MenuItem>
							{Object.values(ResortLevel).map((value) => (
								<MenuItem value={value} key={value}>
									{t(value)}
								</MenuItem>
							))}
						</TextField>
					</div>
				</>
			) : (
				<>
					{dateField}
					<TextField
						select
						label={t('Location')}
						value={location}
						onChange={(event) => setLocation(event.target.value as ResortLocation | '')}
						fullWidth
					>
						<MenuItem value="">{t('All locations')}</MenuItem>
						{Object.values(ResortLocation).map((value) => (
							<MenuItem key={value} value={value}>
								{t(value)}
							</MenuItem>
						))}
					</TextField>
					<TextField
						select
						label={t('Ski level')}
						value={level}
						onChange={(event) => setLevel(event.target.value as ResortLevel | '')}
						fullWidth
					>
						<MenuItem value="">{t('All levels')}</MenuItem>
						{Object.values(ResortLevel).map((value) => (
							<MenuItem key={value} value={value}>
								{t(value)}
							</MenuItem>
						))}
					</TextField>
				</>
			)}
			<Button
				className={onSearch ? 'home-search-submit' : undefined}
				type="submit"
				variant="contained"
				startIcon={<SearchRoundedIcon />}
			>
				{t(onSearch ? 'Search Resorts' : 'Search resorts')}
			</Button>
			<Typography className={onSearch ? 'home-date-hint' : 'travel-dates-note'} variant="caption">
				{t('Dates are saved for your trip. Availability is not checked.')}
			</Typography>
			{onSearch && (
				<div className="home-quick-filters" role="group" aria-label={t('Quick Filters')}>
					<span>{t('Quick Filters')}:</span>
					<Chip
						label={t('Beginner Friendly')}
						aria-pressed={level === ResortLevel.BEGINNER}
						onClick={() => setLevel(level === ResortLevel.BEGINNER ? '' : ResortLevel.BEGINNER)}
					/>
					<Chip label={t('All Levels')} aria-pressed={!level} onClick={() => setLevel('')} />
					{[
						{ value: ResortFacilities.EQUIPMENT_RENTAL, label: 'Equipment Available' },
						{ value: ResortFacilities.SKI_SCHOOL, label: 'Instructor Available' },
					].map((option) => (
						<Chip
							key={option.value}
							label={t(option.label)}
							aria-pressed={facilities.includes(option.value)}
							onClick={() =>
								setFacilities((current) =>
									current.includes(option.value)
										? current.filter((value) => value !== option.value)
										: [...current, option.value],
								)
							}
						/>
					))}
				</div>
			)}
		</form>
	);
};

export default HeaderFilter;
