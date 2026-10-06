import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Alert, Button, CircularProgress, Stack } from '@mui/material';
import { useTranslation } from 'next-i18next';
import useMemberSession from '../../hooks/useMemberSession';
import FaqList from './FaqList';
import FaqRecord from './FaqRecord';
export default function AdminFaqPage({ mode = 'list' }: { mode?: 'list' | 'create' | 'edit' | 'detail' }) {
	const { t } = useTranslation('common');
	const { user, ready } = useMemberSession();
	if (!ready) return <CircularProgress aria-label={t('Loading')} />;
	if (user.memberType !== 'ADMIN' || user.memberStatus !== 'ACTIVE')
		return <Alert severity="error">{t('Active admin access required')}</Alert>;
	return (
		<div className="faq-admin-page">
			<Head>
				<title>{t('FAQ')} | SNOWKR Admin</title>
			</Head>
			<header className="faq-admin-heading">
				<div>
					<span>
						{t('Administration')} / {t('FAQ')}
					</span>
					<h1>
						{t(
							mode === 'list'
								? 'Manage FAQs'
								: mode === 'create'
									? 'Create FAQ'
									: mode === 'edit'
										? 'Edit FAQ'
										: 'View FAQ',
						)}
					</h1>
					<p>{t('Help winter travelers with clear answers. Publish when ready.')}</p>
				</div>
				<Stack direction="row" gap={1.5} flexWrap="wrap">
					<Button component={Link} href="/cs?tab=faq" variant="outlined">
						{t('Public FAQs')}
					</Button>
					{mode === 'list' ? (
						<Button component={Link} href="/_admin/faq/create" variant="contained">
							{t('Create FAQ')}
						</Button>
					) : (
						<Button component={Link} href="/_admin/faq">
							{t('Back to FAQs')}
						</Button>
					)}
				</Stack>
			</header>
			{mode === 'list' ? <FaqList admin /> : <FaqRecord key={mode} admin mode={mode} />}
		</div>
	);
}
