import React from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import EventPage from '../../../libs/components/events/EventPage';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});
const Page = () => <EventPage adminPage />;
export default withAdminLayout(Page, { membersDesign: true });
