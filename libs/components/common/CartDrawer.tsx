import React from 'react';
import Link from 'next/link';
import { useReactiveVar } from '@apollo/client';
import { Button, Drawer, IconButton, Stack, Typography } from '@mui/material';
import { CloseRounded, ShoppingBagOutlined } from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { cartVar, cartTotal, lineTotal, saveCart } from '../../demoCart';
import { checkoutBusy } from '../../demoCheckout';
import { homePrice } from '../homepage/homeUtils';

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
	const { t, i18n } = useTranslation('common');
	const lines = useReactiveVar(cartVar);
	const busy = useReactiveVar(checkoutBusy);
	return (
		<Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: 3 } }}>
			<Stack direction="row" justifyContent="space-between" alignItems="center">
				<Typography variant="h5" component="h2">
					{t('Cart')} ({lines.reduce((sum, line) => sum + line.quantity, 0)})
				</Typography>
				<IconButton aria-label={t('Close')} onClick={onClose}>
					<CloseRounded />
				</IconButton>
			</Stack>
			<Stack spacing={2} sx={{ flex: 1, overflowY: 'auto', py: 3 }}>
				{!lines.length && (
					<Stack spacing={2} alignItems="center" sx={{ py: 6 }}>
						<ShoppingBagOutlined sx={{ fontSize: 56, color: '#94a3b8' }} />
						<Typography>{t('Your cart is empty')}</Typography>
						<Button component={Link} href="/equipment" onClick={onClose}>
							{t('Explore equipment')}
						</Button>
					</Stack>
				)}
				{lines.map((line) => (
					<article className="snowkr-drawer-line" key={line.key}>
						{line.image && <img src={line.image} alt="" />}
						<div>
							<h3>{line.title}</h3>
							<p>
								{t(line.kind)} · {t('Quantity')}: {line.quantity}
							</p>
							<strong>{homePrice(lineTotal(line), i18n.language)}</strong>
							<Button
								size="small"
								disabled={busy}
								onClick={() => saveCart(lines.filter((item) => item.key !== line.key))}
							>
								{t('Remove')}
							</Button>
						</div>
					</article>
				))}
			</Stack>
			<Stack spacing={2} sx={{ borderTop: '1px solid #e2e8f0', pt: 3 }}>
				<Stack direction="row" justifyContent="space-between">
					<Typography>{t('Total')}</Typography>
					<Typography fontWeight={700}>{homePrice(cartTotal(lines), i18n.language)}</Typography>
				</Stack>
				<Button component={Link} href="/cart" variant="contained" onClick={onClose}>
					{t('View cart')}
				</Button>
				<Button component={Link} href="/checkout" variant="outlined" disabled={!lines.length || busy} onClick={onClose}>
					{t('Continue to checkout')}
				</Button>
				<Typography variant="caption" color="text.secondary">
					{t('Demo checkout only. No payment, reservation or stock allocation is performed.')}
				</Typography>
			</Stack>
		</Drawer>
	);
}
