import React from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import DemoOrders from '../../libs/components/common/DemoOrders';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button } from '@mui/material';
import { useEffect } from 'react';
import useMemberSession from '../../libs/hooks/useMemberSession';
import { useTranslation } from 'next-i18next';
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});
function Page() {
	const router = useRouter();
	const { t } = useTranslation('common');
	const { user, ready } = useMemberSession();
	useEffect(() => {
		if (ready && !user._id) void router.replace('/account/join?referrer=%2Fmypage%3Fcategory%3DdemoOrders');
	}, [ready, user._id, router]);
	if (!ready || !user._id) return null;
	return (
		<div className="catalog-page">
			<DemoOrders receiptId={typeof router.query.id === 'string' ? router.query.id : 'missing'} />
			<Button component={Link} href="/mypage?category=demoOrders">
				{t('Demo orders')}
			</Button>
			<Button component={Link} href="/resort" variant="contained" sx={{ ml: 2 }}>
				{t('Resorts')}
			</Button>
		</div>
	);
}
export default withLayoutFull(Page);
