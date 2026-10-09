import React, { ReactNode, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { Avatar, IconButton } from '@mui/material';
import ThemeControl from '../../common/ThemeControl';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import TerrainOutlinedIcon from '@mui/icons-material/TerrainOutlined';
import SnowboardingOutlinedIcon from '@mui/icons-material/SnowboardingOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { useTranslation } from 'next-i18next';
import { userVar } from '../../../../apollo/store';
import { logOut } from '../../../auth';
import { REACT_APP_API_URL } from '../../../config';
import BrandLogo from '../../common/BrandLogo';

export default function AdminMembersShell({ children }: { children: ReactNode }) {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [mobileOpen, setMobileOpen] = useState(false);
	const [jump, setJump] = useState('');
	const routes = [
		{ href: '/_admin', label: 'Overview', Icon: DashboardOutlinedIcon },
		{
			href: '/_admin/users',
			label: 'Members',
			Icon: GroupsOutlinedIcon,
		},
		{ href: '/_admin/resort', label: 'Resorts', Icon: TerrainOutlinedIcon },
		{ href: '/_admin/equipment', label: 'Equipment', Icon: SnowboardingOutlinedIcon },
		{ href: '/_admin/instructor-applications', label: 'Instructor applications', Icon: BadgeOutlinedIcon },
		{ href: '/_admin/community', label: 'Community', Icon: ForumOutlinedIcon },
		{ href: '/_admin/events', label: 'Events', Icon: EventOutlinedIcon },
		{ href: '/_admin/faq', label: 'FAQ', Icon: HelpOutlineIcon },
	];
	const avatar =
		user.memberImage && user.memberImage !== '/img/profile/defaultUser.svg'
			? /^https?:\/\//i.test(user.memberImage)
				? user.memberImage
				: `${REACT_APP_API_URL}/${user.memberImage.replace(/^\//, '')}`
			: '/img/profile/defaultUser.svg';
	return (
		<div className="admin-members-shell">
			<Head>
				<title>
					{t(
						router.pathname === '/_admin'
							? 'Overview'
							: router.pathname.startsWith('/_admin/equipment')
							? 'Equipment'
							: router.pathname.startsWith('/_admin/resort')
							? 'Resorts'
							: router.pathname.startsWith('/_admin/community')
							? 'Community'
							: router.pathname.startsWith('/_admin/events')
							? 'Events'
							: router.pathname.startsWith('/_admin/faq')
							? 'FAQ'
							: 'Members',
					)}{' '}
					| SNOWAY Admin
				</title>
			</Head>
			<a className="admin-shell-skip" href="#admin-members-main">
				{t('Skip to content')}
			</a>
			<header className="admin-shell-header">
				<div className="admin-shell-brand">
					<IconButton
						className="admin-shell-mobile-toggle"
						aria-label={t(mobileOpen ? 'Close navigation' : 'Open navigation')}
						aria-expanded={mobileOpen}
						onClick={() => setMobileOpen(!mobileOpen)}
					>
						{mobileOpen ? <CloseOutlinedIcon /> : <MenuOutlinedIcon />}
					</IconButton>
					<Link href="/_admin" aria-label="SNOWAY admin home">
						<BrandLogo />
					</Link>
					<span className="admin-shell-label">{t('Admin Panel')}</span>
				</div>
				<form
					className="admin-shell-jump"
					onSubmit={(event) => {
						event.preventDefault();
						const route = routes.find((item) => t(item.label).toLowerCase() === jump.trim().toLowerCase());
						if (route) void router.push(route.href);
					}}
				>
					<SearchOutlinedIcon />
					<input
						aria-label={t('Search admin pages')}
						placeholder={t('Search or jump to...')}
						list="admin-page-routes"
						value={jump}
						onChange={(event) => setJump(event.target.value)}
					/>
					<datalist id="admin-page-routes">
						{routes.map((item) => (
							<option key={item.href} value={t(item.label)} />
						))}
					</datalist>
				</form>
				<div className="admin-shell-account">
					<Link className="admin-shell-public" href="/">
						<OpenInNewOutlinedIcon />
						{t('View Public Site')}
					</Link>
					<ThemeControl />
					<Link href="/mypage" className="admin-shell-profile" aria-label={t('My Page')}>
						<Avatar src={avatar} alt={user.memberNick} />
						<div>
							<strong>{user.memberFullName || user.memberNick}</strong>
							<small>@{user.memberNick}</small>
						</div>
					</Link>
				</div>
			</header>
			{mobileOpen && (
				<button
					className="admin-shell-backdrop"
					aria-label={t('Close navigation')}
					onClick={() => setMobileOpen(false)}
				/>
			)}
			<aside className={`admin-shell-sidebar${mobileOpen ? ' is-open' : ''}`} aria-label={t('Administration')}>
				<div>
					<h2>{t('Operations')}</h2>
					<nav>
						{routes.map(({ href, label, Icon }) => (
							<Link
								href={href}
								key={href}
								aria-current={
									router.pathname === href || (href !== '/_admin' && router.pathname.startsWith(href + '/'))
										? 'page'
										: undefined
								}
								onClick={() => setMobileOpen(false)}
							>
								<Icon />
								<span>{t(label)}</span>
							</Link>
						))}
					</nav>
				</div>
				<button className="admin-shell-logout" onClick={logOut}>
					<LogoutOutlinedIcon />
					{t('Log Out')}
				</button>
			</aside>
			<main id="admin-members-main" tabIndex={-1}>
				{children}
			</main>
		</div>
	);
}
