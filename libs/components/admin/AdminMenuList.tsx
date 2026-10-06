import React from 'react';
import Link from 'next/link';
import { Button, Stack } from '@mui/material';
import { useTranslation } from 'next-i18next';
export default function AdminMenuList() {
	const { t } = useTranslation('common');
	return (
		<Stack spacing={2}>
			{[
				['/_admin/users', 'Members'],
				['/_admin/resort', 'Resorts'],
				['/_admin/equipment', 'Equipments'],
				['/_admin/instructor-applications', 'Instructor applications'],
				['/_admin/community', 'Community'],
				['/_admin/events', 'Events'],
				['/_admin/faq', 'FAQ'],
				['/', 'Home'],
			].map(([href, label]) => (
				<Button component={Link} href={href} key={href}>
					{t(label)}
				</Button>
			))}
		</Stack>
	);
}
