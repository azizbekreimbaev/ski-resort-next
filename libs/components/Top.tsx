import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import { Avatar, Badge, IconButton, Menu, MenuItem, Drawer, Button } from '@mui/material';
import {
	FavoriteBorderRounded,
	ShoppingBagOutlined,
	AccountCircleOutlined,
	MenuRounded,
	CloseRounded,
} from '@mui/icons-material';
import { userVar } from '../../apollo/store';
import { logOut } from '../auth';
import { cartVar } from '../demoCart';
import CartDrawer from './common/CartDrawer';
import BrandLogo from './common/BrandLogo';
import ThemeControl from './common/ThemeControl';
import { homeImageUrl } from './homepage/homeUtils';
const navigation = [
	['/resort', 'Resorts'],
	['/instructor', 'Instructors'],
	['/equipment', 'Equipment'],
	['/community', 'Community'],
	['/events', 'Events'],
	['/about', 'About Us'],
	['/cs?tab=faq', 'FAQ'],
];
export default function Top() {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const cart = useReactiveVar(cartVar);
	const [drawer, setDrawer] = useState(false);
	const [cartOpen, setCartOpen] = useState(false);
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);
	const profileImage =
		user._id && user.memberImage && user.memberImage !== '/img/profile/defaultUser.svg'
			? homeImageUrl(user.memberImage)
			: '';
	const links = navigation.map(([href, label]) => (
		<Link
			key={href}
			href={href}
			className={
				(
					href === '/cs?tab=faq'
						? router.pathname.startsWith('/cs') && (!router.query.tab || router.query.tab === 'faq')
						: router.pathname.startsWith(href)
				)
					? 'active'
					: ''
			}
			onClick={() => setDrawer(false)}
		>
			{t(label)}
		</Link>
	));
	return (
		<header className="snowkr-header">
			<div className="snowkr-container snowkr-header-inner">
				<Link href="/" className="snowkr-logo" aria-label="SNOWAY home">
					<BrandLogo />
				</Link>
				<nav className="snowkr-desktop-nav" aria-label={t('Main navigation')}>
					{links}
				</nav>
				<div className="snowkr-header-actions">
					<ThemeControl />
					<div className="snowkr-language">
						{[
							['kr', 'KR'],
							['en', 'EN'],
						].map(([locale, label]) => (
							<button
								key={locale}
								className={router.locale === locale ? 'active' : ''}
								aria-label={label === 'KR' ? '한국어' : 'English'}
								aria-pressed={router.locale === locale}
								onClick={() => {
									try {
										localStorage.setItem('locale', locale);
									} catch {
										/* Navigation works without browser storage. */
									}
									void router.push(router.asPath, router.asPath, { locale });
								}}
							>
								{label}
							</button>
						))}
					</div>
					<IconButton component={Link} href="/mypage?category=myFavorites" aria-label={t('Favorites')}>
						<FavoriteBorderRounded />
					</IconButton>
					<IconButton
						onClick={() => setCartOpen(true)}
						aria-label={t('Cart')}
						aria-haspopup="dialog"
						aria-expanded={cartOpen}
					>
						<Badge badgeContent={cart.reduce((sum, line) => sum + line.quantity, 0)} color="primary">
							<ShoppingBagOutlined />
						</Badge>
					</IconButton>
					<IconButton
						aria-label={t('Account')}
						aria-haspopup="menu"
						aria-expanded={Boolean(anchor)}
						onClick={(event) => setAnchor(event.currentTarget)}
					>
						{profileImage ? (
							<Avatar src={profileImage} alt={user.memberNick} sx={{ width: 28, height: 28 }}>
								<AccountCircleOutlined />
							</Avatar>
						) : (
							<AccountCircleOutlined />
						)}
					</IconButton>
					<IconButton className="snowkr-menu-toggle" aria-label={t('Open navigation')} onClick={() => setDrawer(true)}>
						<MenuRounded />
					</IconButton>
				</div>
				<Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
					{user._id ? (
						[
							<MenuItem key="profile" component={Link} href="/mypage" onClick={() => setAnchor(null)}>
								{t('My Page')}
							</MenuItem>,
							user.memberType === 'ADMIN' ? (
								<MenuItem key="admin" component={Link} href="/_admin/users" onClick={() => setAnchor(null)}>
									{t('Admin')}
								</MenuItem>
							) : null,
							<MenuItem
								key="logout"
								onClick={() => {
									logOut();
									setAnchor(null);
									void router.push('/');
								}}
							>
								{t('Logout')}
							</MenuItem>,
						]
					) : (
						<MenuItem component={Link} href="/account/join" onClick={() => setAnchor(null)}>
							{t('Login / Sign up')}
						</MenuItem>
					)}
				</Menu>
				<CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
				<Drawer anchor="right" open={drawer} onClose={() => setDrawer(false)}>
					<div className="snowkr-mobile-nav">
						<Button onClick={() => setDrawer(false)} startIcon={<CloseRounded />}>
							{t('Close')}
						</Button>
						<nav aria-label={t('Main navigation')}>{links}</nav>
					</div>
				</Drawer>
			</div>
		</header>
	);
}
