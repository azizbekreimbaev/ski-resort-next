import React from 'react';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import AdminFaqPage from '../../../libs/components/faq/AdminFaqPage';
const Page = () => <AdminFaqPage mode="edit" />;
export default withAdminLayout(Page, { membersDesign: true });
export { getStaticProps } from '../../../libs/pageTranslations';
