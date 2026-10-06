import React, { useState } from 'react';
import Link from 'next/link';
import { Alert } from '@mui/material';
import AddShoppingCart from '@mui/icons-material/AddShoppingCart';
import CalendarToday from '@mui/icons-material/CalendarToday';
import Timer from '@mui/icons-material/Timer';
import { useTranslation } from 'next-i18next';
import { CatalogMember } from '../../types/catalog';
import { addCartLine, cartStorageError, todayInKorea, validDate, validPrice } from '../../demoCart';
import { homeImageUrl, homePrice } from '../homepage/homeUtils';

export default function InstructorPackagePanel({ instructor }: { instructor: CatalogMember }) {
	const { t, i18n } = useTranslation('common');
	const prices = [
		instructor.instructorPrice1Week,
		instructor.instructorPrice2Weeks,
		instructor.instructorPrice3Weeks,
		instructor.instructorPrice4Weeks,
	];
	const [weeks, setWeeks] = useState<1 | 2 | 3 | 4>(() => {
		const first = prices.findIndex(validPrice);
		return first < 0 ? 1 : ((first + 1) as 1 | 2 | 3 | 4);
	});
	const [start, setStart] = useState('');
	const [message, setMessage] = useState('');
	const price = prices[weeks - 1];
	const datesValid = validDate(start) && start >= todayInKorea();
	const end = validDate(start) ? new Date(Date.parse(start) + weeks * 7 * 86400000).toISOString().slice(0, 10) : '';
	const dateLabel = (value: string) =>
		value
			? new Date(value + 'T00:00:00Z').toLocaleDateString(i18n.language === 'kr' ? 'ko-KR' : i18n.language, {
					month: 'short',
					day: 'numeric',
					year: 'numeric',
					timeZone: 'UTC',
			  })
			: '—';
	const add = () => {
		if (!datesValid || !validPrice(price)) return;
		try {
			addCartLine({
				key: ['instructor', instructor._id, start, '', weeks].join('|'),
				kind: 'instructor',
				resourceId: instructor._id,
				title: instructor.memberFullName || instructor.memberNick,
				image: homeImageUrl(instructor.memberImage) || '',
				quantity: 1,
				unitPrice: price,
				start,
				weeks,
			});
			setMessage(t(cartStorageError() ? 'Unable to save cart' : 'Added to demo cart'));
		} catch {
			setMessage(t('Unable to save cart'));
		}
	};
	return (
		<aside className="instructor-package">
			<div className="instructor-detail-card">
				<h2>{t('Book Instructor')}</h2>
				<p className="instructor-package-subtitle">{t('Weekly structured coaching pass')}</p>
				<label htmlFor="instructor-start">
					<CalendarToday />
					{t('Start Date')}
				</label>
				<input
					id="instructor-start"
					type="date"
					min={todayInKorea()}
					value={start}
					onChange={(event) => {
						setStart(event.target.value);
						setMessage('');
					}}
				/>
				<fieldset>
					<legend>
						<Timer />
						{t('Choose Duration')}
					</legend>
					<div className="instructor-package-options">
						{prices.map((value, index) => (
							<button
								key={index}
								type="button"
								aria-pressed={weeks === index + 1}
								disabled={!validPrice(value)}
								title={!validPrice(value) ? t('Price not configured') : homePrice(value, i18n.language)}
								onClick={() => {
									setWeeks((index + 1) as 1 | 2 | 3 | 4);
									setMessage('');
								}}
							>
								{t('Weeks', { count: index + 1 })}
							</button>
						))}
					</div>
				</fieldset>
				<dl className="instructor-package-summary">
					<div>
						<dt>{t('Start Date')}</dt>
						<dd>{dateLabel(start)}</dd>
					</div>
					<div>
						<dt>{t('Duration')}</dt>
						<dd>{t('Weeks', { count: weeks })}</dd>
					</div>
					<div>
						<dt>{t('End Date')}</dt>
						<dd>{dateLabel(end)}</dd>
					</div>
					<div className="instructor-package-total">
						<dt>{t('Total Price')}</dt>
						<dd>{validPrice(price) ? homePrice(price, i18n.language) : t('Price not configured')}</dd>
					</div>
				</dl>
				<button className="instructor-add-cart" disabled={!datesValid || !validPrice(price)} onClick={add}>
					<AddShoppingCart />
					{t('Add to Cart')}
				</button>
				<p className="instructor-package-note">
					{t('Demo booking only. No reservation, payment or availability is confirmed.')}
				</p>
				{message && (
					<Alert severity="info" role="status">
						{message} <Link href="/cart">{t('View cart')}</Link>
					</Alert>
				)}
			</div>
		</aside>
	);
}
