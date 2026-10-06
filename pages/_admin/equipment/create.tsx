import React from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import AdminEquipmentCreate from '../../../libs/components/admin/AdminEquipmentCreate';
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});
export default withAdminLayout(AdminEquipmentCreate, { membersDesign: true });
