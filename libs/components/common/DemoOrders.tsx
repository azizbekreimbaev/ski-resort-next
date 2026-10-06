import React, { useEffect, useState } from 'react';
import { Alert, Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import useMemberSession from '../../hooks/useMemberSession';
import { DemoReceipt, readReceipts } from '../../demoCart';
import { homePrice } from '../homepage/homeUtils';
export default function DemoOrders({ receiptId }: { receiptId?: string }) {
	const { user, ready } = useMemberSession();
	const { t, i18n } = useTranslation('common');
	const [receipts, setReceipts] = useState<DemoReceipt[]>([]);
	useEffect(() => {
		setReceipts(ready && user._id ? readReceipts(user._id).filter((item) => !receiptId || item.id === receiptId) : []);
	}, [ready, user._id, receiptId]);
	return (
		<Stack spacing={3}>
			<Typography component="h1" variant="h4">
				{t('Demo orders')}
			</Typography>
			<Alert severity="info">
				{t('Local demo receipts only. No payment was charged and no reservation was created.')}
			</Alert>
			{!receipts.length && <Typography>{t('No demo receipts found')}</Typography>}
			{receipts.map((receipt) => (
				<section className="snowkr-panel" key={receipt.id}>
					<h2>{t('Demo payment completed')}</h2>
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
