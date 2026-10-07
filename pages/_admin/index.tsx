import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Alert, Button, CircularProgress } from '@mui/material';
import {
	GroupsOutlined,
	TerrainOutlined,
	SnowboardingOutlined,
	BadgeOutlined,
	ForumOutlined,
	EventOutlined,
	HelpOutline,
	ArrowForward,
	Add,
	OpenInNew,
} from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import withAdminLayout from '../../libs/components/layout/LayoutAdmin';
import useMemberSession from '../../libs/hooks/useMemberSession';

const sections = [
	{
		href: '/_admin/users',
		title: 'Members',
		description: 'Manage member profiles, roles and account status.',
		Icon: GroupsOutlined,
	},
	{
		href: '/_admin/resort',
		title: 'Resorts',
		description: 'Maintain resort listings, facilities and pricing.',
		Icon: TerrainOutlined,
	},
	{
		href: '/_admin/equipment',
		title: 'Equipment',
		description: 'Manage winter equipment and rental packages.',
		Icon: SnowboardingOutlined,
	},
	{
		href: '/_admin/instructor-applications',
		title: 'Instructor applications',
		description: 'Review applications from aspiring instructors.',
		Icon: BadgeOutlined,
	},
	{
		href: '/_admin/community',
		title: 'Community',
		description: 'Review articles shared by the winter sports community.',
		Icon: ForumOutlined,
	},
	{
		href: '/_admin/events',
		title: 'Events',
		description: 'Create and publish competitions and winter activities.',
		Icon: EventOutlined,
	},
	{
		href: '/_admin/faq',
		title: 'FAQ',
		description: 'Publish helpful answers and manage FAQ drafts.',
		Icon: HelpOutline,
	},
];
function AdminHome() {
	const { t } = useTranslation('common');
	const { user, ready } = useMemberSession();
	if (!ready) return <CircularProgress aria-label={t('Loading')} />;
	if (user.memberType !== 'ADMIN' || user.memberStatus !== 'ACTIVE')
		return <Alert severity="error">{t('Active admin access required')}</Alert>;
	return (
		<div className="admin-overview">
			<Head>
				<title>{t('Overview')} | SNOWAY Admin</title>
			</Head>
			<header className="admin-overview-heading">
				<div>
					<span>
						{t('Administration')} / {t('Overview')}
					</span>
					<h1>{t('Overview')}</h1>
					<p>{t('Your workspace for managing SNOWAY.')}</p>
				</div>
				<Button component={Link} href="/" variant="outlined" endIcon={<OpenInNew />}>
					{t('View Public Site')}
				</Button>
			</header>
			<section className="admin-overview-welcome">
				<div>
					<span>SNOWAY / {t('Admin Panel')}</span>
					<h2>{t('Welcome back, {{name}}', { name: user.memberFullName || user.memberNick })}</h2>
					<p>
						{t(
							'Keep the mountain experience up to date. Manage your catalog, support your community and help travelers plan their next winter trip.',
						)}
					</p>
				</div>
				<TerrainOutlined className="admin-overview-mountain" aria-hidden="true" />
			</section>
			<section className="admin-overview-actions" aria-labelledby="overview-actions-title">
				<div>
					<h2 id="overview-actions-title">{t('Quick actions')}</h2>
					<p>{t('Start with the content you want to add.')}</p>
				</div>
				<div className="admin-overview-action-links">
					<Button component={Link} href="/_admin/resort/create" startIcon={<Add />} variant="outlined">
						{t('Add resort')}
					</Button>
					<Button component={Link} href="/_admin/equipment/create" startIcon={<Add />} variant="outlined">
						{t('Add equipment')}
					</Button>
					<Button component={Link} href="/_admin/faq/create" startIcon={<Add />} variant="contained">
						{t('Create FAQ')}
					</Button>
				</div>
			</section>
			<section aria-labelledby="overview-management-title">
				<div className="admin-overview-section-heading">
					<h2 id="overview-management-title">{t('Manage your platform')}</h2>
					<p>{t('Choose an area to review and update.')}</p>
				</div>
				<div className="admin-overview-grid">
					{sections.map(({ href, title, description, Icon }) => (
						<Link className="admin-overview-card" href={href} key={href} passHref>
							<span className="admin-overview-icon">
								<Icon />
							</span>
							<h3>{t(title)}</h3>
							<p>{t(description)}</p>
							<span className="admin-overview-card-link">
								{t('Open management')}
								<ArrowForward />
							</span>
						</Link>
					))}
				</div>
			</section>
		</div>
	);
}

export default withAdminLayout(AdminHome, { membersDesign: true });

export { getStaticProps } from '../../libs/pageTranslations';
