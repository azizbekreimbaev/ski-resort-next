import React from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import EquipmentCatalog from '../../libs/components/equipment/EquipmentCatalog';
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});
const Page = () => <EquipmentCatalog />;
export default withLayoutBasic(Page);
