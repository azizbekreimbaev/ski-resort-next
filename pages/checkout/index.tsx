import React from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import CartPage from '../../libs/components/common/CartPage';
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});
function Page() {
	return <CartPage checkout />;
}
export default withLayoutFull(Page);
