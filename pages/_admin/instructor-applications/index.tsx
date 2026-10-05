import React from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import InstructorApplications from '../../../libs/components/admin/InstructorApplications';
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});
const Page = () => <InstructorApplications />;
export default withAdminLayout(Page);
