import React, { useState } from 'react';
import Link from 'next/link';
import { Alert, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { ResortSearchResult } from '../../types/resort/resort';
import { EquipmentPreview } from '../../types/equipment/equipment';
import { CatalogMember } from '../../types/catalog';
import { addCartLine, CartLine, dateDays, lineTotal, validDate, validPrice, todayInKorea } from '../../demoCart';
import { homeImageUrl, homePrice } from '../homepage/homeUtils';
export default function DemoBookingPanel({
	resort,
	equipment,
	instructor,
	initialDates,
}: {
	resort?: ResortSearchResult;
	equipment?: EquipmentPreview;
	instructor?: CatalogMember;
	initialDates?: { arrival: string; departure: string };
}) {
	const { t, i18n } = useTranslation('common');
	const [start, setStart] = useState(initialDates?.arrival ?? '');
	const [end, setEnd] = useState(initialDates?.departure ?? '');
	const [quantity, setQuantity] = useState(1);
	const [selection, setSelection] = useState('');
	const [message, setMessage] = useState('');
	const weeks = Number(selection);
	const duration = Number(selection);
	const prices = instructor
		? [
				instructor.instructorPrice1Week,
				instructor.instructorPrice2Weeks,
				instructor.instructorPrice3Weeks,
				instructor.instructorPrice4Weeks,
		  ]
		: [];
	const price =
		resort?.resortPricePerDay ??
		(instructor
			? prices[weeks - 1]
			: selection === 'purchase'
			? equipment?.equipmentPurchasePrice
			: equipment?.equipmentRentalRates.find((rate) => rate.durationHours === duration)?.price);
	const days = dateDays(start, end);
	const datesValid = validDate(start) && start >= todayInKorea();
	const valid =
		validPrice(price) &&
		Number.isInteger(quantity) &&
		quantity >= 1 &&
		quantity <= 99 &&
		(resort
			? datesValid && days >= resort.resortMinDays && days <= 365 && resort.resortStatus !== 'SOLD_OUT'
			: instructor
			? datesValid && [1, 2, 3, 4].includes(weeks)
			: selection === 'purchase'
			? equipment?.equipmentPurchasable
			: datesValid && Boolean(equipment?.equipmentRentalRates.some((rate) => rate.durationHours === duration)));
	const add = () => {
		if (!valid || !validPrice(price)) return;
		const base = {
			key: '',
			resourceId: resort?._id ?? equipment?._id ?? instructor?._id ?? '',
			title:
				resort?.resortTitle ?? equipment?.equipmentName ?? instructor?.memberFullName ?? instructor?.memberNick ?? '',
			image:
				homeImageUrl(resort?.resortImages?.[0] ?? equipment?.equipmentImages?.[0] ?? instructor?.memberImage) || '',
			quantity,
			unitPrice: price,
		};
		const line: CartLine = resort
			? { ...base, kind: 'resort', start, end, days }
			: instructor
			? { ...base, kind: 'instructor', start, weeks: weeks as 1 | 2 | 3 | 4 }
			: selection === 'purchase'
			? { ...base, kind: 'equipment-purchase' }
			: { ...base, kind: 'equipment-rental', start, durationHours: duration };
		line.key =
			line.kind === 'equipment-purchase'
				? [line.kind, line.resourceId].join('|')
				: [line.kind, line.resourceId, start, end, selection].join('|');
		try {
			addCartLine(line);
			setMessage(t('Added to demo cart'));
		} catch {
			setMessage(t('Unable to save cart'));
		}
	};
	const total = validPrice(price) ? price * quantity * (resort ? days : 1) : null;
	return (
		<Stack className="snowkr-panel demo-booking-panel" spacing={2}>
			<Typography component="h2" variant="h5">
				{t(resort ? 'Resort Booking' : instructor ? 'Book Instructor' : 'Rent or Buy')}
			</Typography>
			{resort && (
				<div className="resort-booking-rate">
					<span>{t('Resort price per day')}</span>
					<strong>{homePrice(resort.resortPricePerDay, i18n.language)} <small>/ {t('day')}</small></strong>
				</div>
			)}
			<Alert severity="info">{t('Demo booking only. No reservation, payment or availability is confirmed.')}</Alert>
			{!resort && (
				<TextField
					select
					label={t(instructor ? 'Choose Duration' : 'Rental or purchase')}
					value={selection}
					onChange={(event) => {
						setSelection(event.target.value);
						setMessage('');
					}}
				>
					<MenuItem value="">{t('Choose a package')}</MenuItem>
					{instructor
						? prices.map((value, index) => (
								<MenuItem key={index} value={index + 1} disabled={!validPrice(value)}>
									{t('Weeks', { count: index + 1 })} ·{' '}
									{validPrice(value) ? homePrice(value, i18n.language) : t('Price not configured')}
								</MenuItem>
						  ))
						: equipment?.equipmentRentalRates.map((rate) => (
								<MenuItem key={rate.durationHours} value={rate.durationHours} disabled={!validPrice(rate.price)}>
									{t('Hours', { count: rate.durationHours })} · {homePrice(rate.price, i18n.language)}
								</MenuItem>
						  ))}
					{equipment?.equipmentPurchasable && (
						<MenuItem value="purchase" disabled={!validPrice(equipment.equipmentPurchasePrice)}>
							{t('Purchase option')} ·{' '}
							{validPrice(equipment.equipmentPurchasePrice)
								? homePrice(equipment.equipmentPurchasePrice, i18n.language)
								: t('Price not configured')}
						</MenuItem>
					)}
				</TextField>
			)}
			{selection !== 'purchase' && (
				<TextField
					label={t('Start Date')}
					type="date"
					InputLabelProps={{ shrink: true }}
					inputProps={{ min: todayInKorea() }}
					value={start}
					onChange={(event) => {
						setStart(event.target.value);
						setMessage('');
					}}
				/>
			)}
			{resort && (
				<>
					<TextField
						label={t('End Date')}
						type="date"
						InputLabelProps={{ shrink: true }}
						inputProps={{ min: start || todayInKorea() }}
						value={end}
						onChange={(event) => {
							setEnd(event.target.value);
							setMessage('');
						}}
					/>
					<Typography variant="body2">{t('Minimum stay', { count: resort.resortMinDays })}</Typography>
				</>
			)}
			<TextField
				label={t('Quantity')}
				type="number"
				inputProps={{ min: 1, max: 99 }}
				value={quantity}
				onChange={(event) => {
					setQuantity(Number(event.target.value));
					setMessage('');
				}}
			/>
			<Typography variant="h5">
				{t('Total')}: {valid && total != null ? homePrice(total, i18n.language) : '—'}
			</Typography>
			<Button variant="contained" disabled={!valid || total == null || !Number.isFinite(total)} onClick={add}>
				{t('Add to Cart')}
			</Button>
			{message && (
				<Alert severity="info" role="status">
					{message} <Link href="/cart">{t('View cart')}</Link>
				</Alert>
			)}
		</Stack>
	);
}
