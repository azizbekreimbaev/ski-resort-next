import React from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutFull from '../libs/components/layout/LayoutFull';
import DemoContent from '../libs/components/common/DemoContent';
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});
function Page() {
	return <DemoContent reports />;
}
export default withLayoutFull(Page);
