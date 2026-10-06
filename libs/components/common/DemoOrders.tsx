import React, { useEffect, useState } from 'react';
import { Alert, Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import useMemberSession from '../../hooks/useMemberSession';
import { DemoReceipt, readReceipts } from '../../demoCart';
import { homePrice } from '../homepage/homeUtils';
import { CheckCircleRounded } from '@mui/icons-material';
export default function DemoOrders({ receiptId }: { receiptId?: string }) {
	const { user, ready } = useMemberSession();
	const { t, i18n } = useTranslation('common');
	const [receipts, setReceipts] = useState<DemoReceipt[]>([]);
	useEffect(() => {
		setReceipts(ready && user._id ? readReceipts(user._id).filter((item) => !receiptId || item.id === receiptId) : []);
	}, [ready, user._id, receiptId]);
	return (
		<Stack spacing={3}>
			{receiptId && receipts.length > 0 ? (
				<div className="snowkr-payment-success">
					<CheckCircleRounded />
					<h1>{t('Demo payment completed')}</h1>
					<p>{t('Your winter plans are ready to review.')}</p>
				</div>
			) : (
				<Typography component="h1" variant="h4">
					{t('Demo orders')}
				</Typography>
			)}
			<Alert severity="info">
				{t('Local demo receipts only. No payment was charged and no reservation was created.')}
			</Alert>
			{!receipts.length && <Typography>{t('No demo receipts found')}</Typography>}
			{receipts.map((receipt) => (
				<section className="snowkr-panel" key={receipt.id}>
					<h2>{t('Demo payment completed')}</h2>
					{receipt.paymentMethod && (
						<p>
							{t('Payment method')}: {receipt.paymentMethod === 'visa' ? 'VISA' : 'Mastercard'} · {t('Demo card')}
						</p>
					)}
					<p>
						{receipt.id} ·{' '}
						{new Date(receipt.createdAt).toLocaleString(i18n.language === 'kr' ? 'ko-KR' : i18n.language)}
					</p>
					{receipt.lines.map((line) => (
						<p key={line.key}>
							{line.title} × {line.quantity} · {t(line.kind)}
						</p>
					))}
					<Typography variant="h5">{homePrice(receipt.total, i18n.language)}</Typography>
				</section>
			))}
		</Stack>
	);
}
