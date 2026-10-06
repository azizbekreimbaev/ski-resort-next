import React from 'react';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import AdminCommunity from '../../../libs/components/admin/community/AdminCommunity';

const Page = () => <AdminCommunity />;
export default withAdminLayout(Page, { membersDesign: true });
export { getStaticProps } from '../../../libs/pageTranslations';
