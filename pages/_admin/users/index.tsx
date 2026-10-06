import React from 'react';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import AdminMembers from '../../../libs/components/admin/users/AdminMembers';
export default withAdminLayout(AdminMembers, { membersDesign: true });
export { getStaticProps } from '../../../libs/pageTranslations';
