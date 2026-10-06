import React, { useState } from 'react';
import Link from 'next/link';
import { Alert, Button } from '@mui/material';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { useTranslation } from 'next-i18next';
import { EquipmentPreview } from '../../types/equipment/equipment';
import { addCartLine, CartLine, todayInKorea, validDate, validPrice } from '../../demoCart';
import { homeImageUrl, homePrice } from '../homepage/homeUtils';

// Presentation for the existing local demo cart; the API supplies catalog prices only.
export default function EquipmentActionDesk({ equipment }: { equipment: EquipmentPreview }) {
	const { t, i18n } = useTranslation('common');
	const rates = [...equipment.equipmentRentalRates].sort((a, b) => a.durationHours - b.durationHours);
	const [mode, setMode] = useState<'rent' | 'purchase'>('rent');
	const [duration, setDuration] = useState(rates[0]?.durationHours ?? 0);
	const [date, setDate] = useState('');
	const [quantity, setQuantity] = useState(1);
	const [message, setMessage] = useState('');
	const purchasable = equipment.equipmentPurchasable && validPrice(equipment.equipmentPurchasePrice);
	const buy = mode === 'purchase' && purchasable;
	const rate = rates.find((item) => item.durationHours === duration) ?? rates[0];
	const price = buy ? equipment.equipmentPurchasePrice : rate?.price;
	const total = validPrice(price) ? price * quantity : null;
	const valid =
		validPrice(price) &&
		Number.isInteger(quantity) &&
		quantity >= 1 &&
		quantity <= 99 &&
		(buy || (Boolean(rate) && validDate(date) && date >= todayInKorea())) &&
		total != null &&
		Number.isFinite(total);
	const changeMode = (value: 'rent' | 'purchase') => {
		setMode(value);
		setMessage('');
	};
	const add = () => {
		if (!valid || !validPrice(price)) return;
		const base = {
			resourceId: equipment._id,
			title: equipment.equipmentName,
			image: homeImageUrl(equipment.equipmentImages?.[0]),
			quantity,
			unitPrice: price,
		};
		const line: CartLine = buy
			? { ...base, kind: 'equipment-purchase', key: `equipment-purchase|${equipment._id}` }
			: {
					...base,
					kind: 'equipment-rental',
					start: date,
					durationHours: rate.durationHours,
					key: ['equipment-rental', equipment._id, date, '', rate.durationHours].join('|'),
			  };
		try {
			addCartLine(line);
			setMessage(t('Added to demo cart'));
		} catch {
			setMessage(t('Unable to save cart'));
		}
	};
	return (
		<div className="equipment-detail-panel equipment-action-desk">
			<div className="equipment-desk-heading">
				<h2>{t('Rent or Buy')}</h2>
				<span>{t('Demo cart')}</span>
			</div>
			<Alert severity="info" className="equipment-demo-notice">
				{t('Demo booking only. No reservation, payment or availability is confirmed.')}
			</Alert>
			<div className="equipment-mode-tabs" role="group" aria-label={t('Rental or purchase')}>
				<button type="button" aria-pressed={!buy} onClick={() => changeMode('rent')}>
					{t('Rent')}
				</button>
				<button type="button" aria-pressed={buy} disabled={!purchasable} onClick={() => changeMode('purchase')}>
					{t('Buy Outright')}
				</button>
			</div>
			{buy ? (
				<div className="equipment-retail-price">
					<span>{t('Purchase price')}</span>
					<strong>{homePrice(price as number, i18n.language)}</strong>
					<small>{t('KRW per item')}</small>
				</div>
			) : (
				<>
					<fieldset className="equipment-rate-selection">
						<legend>{t('Rental packages')}</legend>
						<div className="equipment-rate-grid">
							{rates.map((item) => (
								<button
									type="button"
									key={item.durationHours}
									aria-pressed={rate?.durationHours === item.durationHours}
									disabled={!validPrice(item.price)}
									onClick={() => {
										setDuration(item.durationHours);
										setMessage('');
									}}
								>
									<span>{t('Equipment package hours', { hours: item.durationHours })}</span>
									<strong>{homePrice(item.price, i18n.language)}</strong>
								</button>
							))}
						</div>
						{!rates.length && <p>{t('Price not configured')}</p>}
					</fieldset>
					<label className="equipment-desk-label">
						{t('Rental Date')}
						<input
							type="date"
							min={todayInKorea()}
							value={date}
							onChange={(event) => {
								setDate(event.target.value);
								setMessage('');
							}}
						/>
					</label>
				</>
			)}
			<label className="equipment-desk-label" htmlFor="equipment-detail-quantity">
				{t('Quantity')}
			</label>
			<div className="equipment-desk-quantity">
				<span>{t('Items')}</span>
				<div>
					<button
						type="button"
						aria-label={t('Decrease quantity')}
						disabled={quantity <= 1}
						onClick={() => {
							setQuantity((value) => value - 1);
							setMessage('');
						}}
					>
						−
					</button>
					<input
						id="equipment-detail-quantity"
						type="number"
						min="1"
						max="99"
						step="1"
						value={quantity}
						onChange={(event) => {
							setQuantity(Number(event.target.value));
							setMessage('');
						}}
					/>
					<button
						type="button"
						aria-label={t('Increase quantity')}
						disabled={quantity >= 99}
						onClick={() => {
							setQuantity((value) => value + 1);
							setMessage('');
						}}
					>
						+
					</button>
				</div>
			</div>
			<dl className="equipment-price-summary">
				<div>
					<dt>{t('Mode')}</dt>
					<dd>{t(buy ? 'Purchase option' : 'Rental')}</dd>
				</div>
				{!buy && rate && (
					<div>
						<dt>{t('Selected Duration')}</dt>
						<dd>{t('Equipment package hours', { hours: rate.durationHours })}</dd>
					</div>
				)}
				<div>
					<dt>{t('Unit Price')}</dt>
					<dd>{validPrice(price) ? homePrice(price, i18n.language) : '—'}</dd>
				</div>
				<div>
					<dt>{t('Quantity')}</dt>
					<dd>{quantity}</dd>
				</div>
				<div className="equipment-summary-total">
					<dt>{t('Total Amount')}</dt>
					<dd>{total != null && Number.isFinite(total) ? homePrice(total, i18n.language) : '—'}</dd>
				</div>
			</dl>
			<Button
				fullWidth
				variant="contained"
				disableElevation
				startIcon={<ShoppingBagOutlinedIcon />}
				disabled={!valid}
				onClick={add}
			>
				{t('Add to demo cart')}
			</Button>
			{message && (
				<Alert severity="info" role="status">
					{message} <Link href="/cart">{t('View cart')}</Link>
				</Alert>
			)}
			<p className="equipment-desk-footnote">
				{t('Package prices are per item. Catalog quantity does not confirm date availability.')}
			</p>
		</div>
	);
}
