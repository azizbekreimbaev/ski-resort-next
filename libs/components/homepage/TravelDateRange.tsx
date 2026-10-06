import React, { useState } from 'react';
import { Button, IconButton, InputAdornment, Popover, TextField, Typography } from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useTranslation } from 'next-i18next';

interface TravelDateRangeProps {
	arrival: string;
	departure: string;
	error: boolean;
	onChange: (arrival: string, departure: string) => void;
	homepage?: boolean;
	inputId?: string;
}

const dateKey = (year: number, month: number, day: number) =>
	`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const TravelDateRange = ({ arrival, departure, error, onChange, homepage = false, inputId }: TravelDateRangeProps) => {
	const { t, i18n } = useTranslation('common');
	const locale = i18n.language === 'kr' ? 'ko-KR' : i18n.language;
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);
	const [month, setMonth] = useState(() => {
		const today = new Date();
		return { year: today.getFullYear(), index: today.getMonth() };
	});
	const [hovered, setHovered] = useState('');
	const selectingDeparture = Boolean(arrival && !departure);
	const formatDate = (value: string) =>
		new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(
			new Date(`${value}T00:00:00Z`),
		);
	const firstDay = new Date(Date.UTC(month.year, month.index, 1));
	const daysInMonth = new Date(Date.UTC(month.year, month.index + 1, 0)).getUTCDate();
	const rangeEnd = departure || (hovered > arrival ? hovered : '');
	const displayValue = arrival ? `${formatDate(arrival)} - ${departure ? formatDate(departure) : t('Departure')}` : '';

	const openCalendar = (element: HTMLElement) => {
		if (arrival) {
			const selected = new Date(`${arrival}T00:00:00Z`);
			setMonth({ year: selected.getUTCFullYear(), index: selected.getUTCMonth() });
		}
		setHovered('');
		setAnchor(element);
	};
	const changeMonth = (offset: number) => {
		const next = new Date(Date.UTC(month.year, month.index + offset, 1));
		if (next.getUTCFullYear() < 1000 || next.getUTCFullYear() > 9999) return;
		setMonth({ year: next.getUTCFullYear(), index: next.getUTCMonth() });
		setHovered('');
	};
	const selectDay = (value: string) => {
		if (!arrival || departure || value <= arrival) {
			onChange(value, '');
		} else {
			onChange(arrival, value);
			setAnchor(null);
		}
		setHovered('');
	};

	return (
		<>
			<TextField
				id={inputId}
				label={homepage ? undefined : t('Travel dates')}
				placeholder={t('Arrival - Departure')}
				value={displayValue}
				fullWidth
				onClick={(event) => openCalendar(event.currentTarget)}
				onKeyDown={(event) => {
					if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
						event.preventDefault();
						openCalendar(event.currentTarget);
					}
				}}
				InputProps={{
					readOnly: true,
					...(homepage
						? {
								startAdornment: (
									<InputAdornment position="start">
										<CalendarMonthOutlinedIcon />
									</InputAdornment>
								),
						  }
						: {}),
					endAdornment: !homepage ? (
						<InputAdornment position="end">
							<CalendarMonthOutlinedIcon />
						</InputAdornment>
					) : undefined,
				}}
				inputProps={{
					'aria-haspopup': 'dialog',
					'aria-expanded': Boolean(anchor),
					...(homepage ? { 'aria-label': t('Trip Dates') } : {}),
				}}
				error={error}
				helperText={error ? t('Choose a departure after arrival.') : undefined}
			/>
			<Popover
				open={Boolean(anchor)}
				anchorEl={anchor}
				onClose={() => setAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				transformOrigin={{ vertical: 'top', horizontal: 'left' }}
				PaperProps={{ className: 'travel-range-calendar', role: 'dialog', 'aria-label': t('Travel dates') }}
			>
				<div className="calendar-month-navigation">
					<IconButton onClick={() => changeMonth(-1)} aria-label={t('Previous month')}>
						<ChevronLeftRoundedIcon />
					</IconButton>
					<Typography component="h2" variant="subtitle1" aria-live="polite">
						{new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(firstDay)}
					</Typography>
					<IconButton onClick={() => changeMonth(1)} aria-label={t('Next month')}>
						<ChevronRightRoundedIcon />
					</IconButton>
				</div>
				<Typography className="calendar-instruction" variant="body2" role="status">
					{t(selectingDeparture ? 'Select departure date' : 'Select arrival date')}
				</Typography>
				<div className="calendar-days" onMouseLeave={() => setHovered('')}>
					{Array.from({ length: 7 }, (_, index) => (
						<span className="calendar-weekday" key={`weekday-${index}`}>
							{new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(
								new Date(Date.UTC(2026, 0, 4 + index)),
							)}
						</span>
					))}
					{Array.from({ length: firstDay.getUTCDay() }, (_, index) => (
						<span key={`empty-${index}`} />
					))}
					{Array.from({ length: daysInMonth }, (_, index) => {
						const value = dateKey(month.year, month.index, index + 1);
						const endpoint = value === arrival || value === departure;
						const inRange = Boolean(arrival && rangeEnd && value > arrival && value < rangeEnd);
						return (
							<Button
								key={value}
								className={`calendar-day ${endpoint ? 'range-endpoint' : ''} ${inRange ? 'in-range' : ''}`}
								onClick={() => selectDay(value)}
								onMouseEnter={() => setHovered(value)}
								onFocus={() => setHovered(value)}
								aria-label={formatDate(value)}
								aria-pressed={endpoint || inRange}
							>
								{index + 1}
							</Button>
						);
					})}
				</div>
				<div className="calendar-actions">
					<Button
						onClick={() => {
							onChange('', '');
							setHovered('');
						}}
					>
						{t('Clear dates')}
					</Button>
					<Button onClick={() => setAnchor(null)}>{t('Close')}</Button>
				</div>
			</Popover>
		</>
	);
};

export default TravelDateRange;
