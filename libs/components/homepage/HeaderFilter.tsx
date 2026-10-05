import React, { useEffect, useMemo, useState } from 'react';
import { Button, MenuItem, TextField, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { ResortLevel, ResortLocation } from '../../enums/resort.enum';
import { defaultResortInquiry, parseTravelDates } from '../../resortSearch';
import { ResortsInquiry } from '../../types/resort/resort.input';
import TravelDateRange from './TravelDateRange';

interface HeaderFilterProps {
	initialInput?: ResortsInquiry;
}

const HeaderFilter = ({ initialInput }: HeaderFilterProps) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const tripDates = useMemo(
		() => parseTravelDates(router.query.arrival, router.query.departure),
		[router.query.arrival, router.query.departure],
	);
	const [arrival, setArrival] = useState(tripDates.arrival);
	const [departure, setDeparture] = useState(tripDates.departure);
	const [dateError, setDateError] = useState(false);
	const [location, setLocation] = useState<ResortLocation | ''>(initialInput?.search.locationList?.[0] ?? '');
	const [level, setLevel] = useState<ResortLevel | ''>(initialInput?.search.levelList?.[0] ?? '');

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
		if (location) input.search.locationList = [location];
		if (level) input.search.levelList = [level];
		void router.push({ pathname: '/resort', query: { input: JSON.stringify(input), ...(dates.arrival ? dates : {}) } });
	};

	return (
		<form className="resort-search-form" onSubmit={searchHandler} aria-label={t('Resort Search')}>
			<TravelDateRange
				arrival={arrival}
				departure={departure}
				error={dateError}
				onChange={(start, end) => {
					setArrival(start);
					setDeparture(end);
					setDateError(false);
				}}
			/>
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
			<Button type="submit" variant="contained" startIcon={<SearchRoundedIcon />}>
				{t('Search resorts')}
			</Button>
			<Typography className="travel-dates-note" variant="caption">
				{t('Dates are saved for your trip. Availability is not checked.')}
			</Typography>
		</form>
	);
};

export default HeaderFilter;
