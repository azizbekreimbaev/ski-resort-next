import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useApolloClient, useReactiveVar } from '@apollo/client';
import { Alert, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { cartVar, cartTotal, cartStorageError, lineTotal, saveCart, saveReceipt } from '../../demoCart';
import { revalidateCart, checkoutBusy } from '../../demoCheckout';
import { userVar } from '../../../apollo/store';
import useMemberSession from '../../hooks/useMemberSession';
import { homePrice } from '../homepage/homeUtils';
export default function CartPage({ checkout = false }: { checkout?: boolean }) {
	const { t, i18n } = useTranslation('common');
	const router = useRouter();
	const client = useApolloClient();
	const { user, ready } = useMemberSession();
	const lines = useReactiveVar(cartVar);
	const storageError = useReactiveVar(cartStorageError);
	const busy = useReactiveVar(checkoutBusy);
	const [failure, setFailure] = useState('');
	const [outcome, setOutcome] = useState('success');
	const [mounted, setMounted] = useState(false);
	const mountedRef = useRef(true);
	useEffect(() => {
		setMounted(true);
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);
	useEffect(() => {
		if (checkout && ready && !user._id) void router.replace('/account/join?referrer=%2Fcheckout');
	}, [checkout, ready, user._id, router]);
	const process = async () => {
		if (checkoutBusy() || !lines.length || !user._id || !Number.isFinite(cartTotal(lines))) return;
		checkoutBusy(true);
		setFailure('');
		const snapshot = JSON.stringify(lines);
		const memberId = user._id;
		try {
			const result = await revalidateCart(client, lines);
			if (snapshot !== JSON.stringify(cartVar()) || memberId !== userVar()._id)
				throw new Error(t('Cart or account changed. Please review and retry.'));
			if (result.issues.length) throw new Error(t('Unavailable cart selections') + ': ' + result.issues.join(', '));
			if (result.changed) {
				saveCart(result.lines);
				throw new Error(t('Prices changed. Review the updated total and confirm again.'));
			}
			await new Promise((resolve) => setTimeout(resolve, 800));
			if (!mountedRef.current || memberId !== userVar()._id || snapshot !== JSON.stringify(cartVar()))
				throw new Error(t('Cart or account changed. Please review and retry.'));
			if (outcome === 'failure') throw new Error(t('Demo payment failed. Choose success and retry.'));
			const receipt = {
				id: 'demo-' + crypto.randomUUID(),
				memberId,
				createdAt: new Date().toISOString(),
				lines: result.lines,
				total: cartTotal(result.lines),
				status: 'DEMO_COMPLETED' as const,
			};
			saveReceipt(receipt);
			saveCart([]);
			await router.push('/checkout/success?id=' + encodeURIComponent(receipt.id));
		} catch (error) {
			if (mountedRef.current) setFailure(error instanceof Error ? error.message : t('Unable to complete demo payment'));
		} finally {
			checkoutBusy(false);
		}
	};
	if (!mounted || (checkout && (!ready || !user._id)))
		return (
			<div className="catalog-page">
				<Typography>{t('Loading')}</Typography>
			</div>
		);
	return (
		<div className="catalog-page">
			<div className="snowkr-page-heading">
				<h1>{t(checkout ? 'Checkout' : 'Cart')}</h1>
				<p>{t('Your winter plans, together in one place.')}</p>
			</div>
			<Alert severity="info" sx={{ mb: 3 }}>
				{t('Demo checkout only. No payment, reservation or stock allocation is performed.')}
			</Alert>
			{storageError && (
				<Alert severity="warning">{t('Browser storage is unavailable. Your cart may not survive a reload.')}</Alert>
			)}
			{failure && (
				<Alert severity="error" sx={{ mb: 3 }}>
					{failure}
				</Alert>
			)}
			{!lines.length ? (
				<Stack spacing={2}>
					<Typography>{t('Your cart is empty')}</Typography>
					<Button component={Link} href="/equipment">
						{t('Explore equipment')}
					</Button>
				</Stack>
			) : (
				<div className="snowkr-cart-layout">
					<Stack spacing={2}>
						{lines.map((line) => (
							<article className="snowkr-cart-line" key={line.key}>
								{line.image && (
									<img
										src={line.image}
										alt=""
										onError={(event) => {
											event.currentTarget.style.display = 'none';
										}}
									/>
								)}
								<div>
									<h3>
										<Link
											href={
												line.kind === 'instructor'
													? '/instructor/detail?instructorId=' + line.resourceId
													: '/' + (line.kind === 'resort' ? 'resort' : 'equipment') + '/detail?id=' + line.resourceId
											}
										>
											{line.title}
										</Link>
									</h3>
									<p>
										{t(line.kind)} {line.kind !== 'equipment-purchase' && '· ' + line.start}{' '}
										{line.kind === 'resort'
											? '→ ' + line.end
											: line.kind === 'instructor'
											? '· ' + t('Weeks', { count: line.weeks })
											: line.kind === 'equipment-rental'
											? '· ' + t('Hours', { count: line.durationHours })
											: ''}
									</p>
									<strong>{homePrice(lineTotal(line), i18n.language)}</strong>
								</div>
								<TextField
									label={t('Quantity')}
									type="number"
									sx={{ width: 90 }}
									inputProps={{ min: 1, max: 99 }}
									value={line.quantity}
									disabled={busy}
									onChange={(event) => {
										const quantity = Number(event.target.value);
										if (Number.isInteger(quantity) && quantity > 0 && quantity <= 99)
											saveCart(lines.map((item) => (item.key === line.key ? { ...item, quantity } : item)));
										setFailure('');
									}}
								/>
								<Button
									disabled={busy}
									onClick={() => {
										saveCart(lines.filter((item) => item.key !== line.key));
										setFailure('');
									}}
								>
									{t('Remove')}
								</Button>
							</article>
						))}
					</Stack>
					<Stack className="snowkr-panel" spacing={3}>
						<Typography component="h2" variant="h5">
							{t('Order summary')}
						</Typography>
						<Typography>
							{t('Total')}: <strong>{homePrice(cartTotal(lines), i18n.language)}</strong>
						</Typography>
						{checkout ? (
							<>
								<Typography>
									{t('Signed in as')}: {user.memberNick}
								</Typography>
								<TextField
									select
									label={t('Demo payment outcome')}
									value={outcome}
									disabled={busy}
									onChange={(event) => setOutcome(event.target.value)}
								>
									<MenuItem value="success">{t('Success')}</MenuItem>
									<MenuItem value="failure">{t('Failure / retry')}</MenuItem>
								</TextField>
								<Button variant="contained" disabled={busy} onClick={() => void process()}>
									{t(busy ? 'Processing demo payment' : 'Confirm demo payment')}
								</Button>
								<Button component={Link} href="/cart" disabled={busy}>
									{t('Back to cart')}
								</Button>
							</>
						) : (
							<Button component={Link} href="/checkout" variant="contained">
								{t('Continue to checkout')}
							</Button>
						)}
						<Typography variant="caption">
							{t('Prices are checked again before confirmation. No additional fees.')}
						</Typography>
					</Stack>
				</div>
			)}
		</div>
	);
}
