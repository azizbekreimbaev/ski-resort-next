import Link from 'next/link';
import React, { ReactNode } from 'react';
import { Typography } from '@mui/material';

interface HomeSectionProps {
	id: string;
	title: string;
	subtitle: string;
	action?: ReactNode;
	children: ReactNode;
}

const HomeSection = ({ id, title, subtitle, action, children }: HomeSectionProps) => (
	<section id={id} className="home-discovery-section" aria-labelledby={`${id}-title`}>
		<div className="home-section-container">
			<div className="home-section-heading">
				<div>
					<Typography id={`${id}-title`} component="h2" variant="h4">
						<Link href={id === 'instructors' ? '/instructor' : id === 'equipment-preview' ? '/equipment' : '/resort'}>
							{title}
						</Link>
					</Typography>
					<Typography component="p" color="text.secondary">
						{subtitle}
					</Typography>
				</div>
				{action}
			</div>
			{children}
		</div>
	</section>
);

export default HomeSection;
