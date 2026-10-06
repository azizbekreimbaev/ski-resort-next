import React, { ReactNode } from 'react';
import { Typography } from '@mui/material';
import Link from 'next/link';

interface HomeSectionProps {
	id: string;
	title: string;
	titleHref?: string;
	subtitle: string;
	action?: ReactNode;
	children: ReactNode;
	eyebrow?: string;
}

const HomeSection = ({ id, title, titleHref, subtitle, action, children, eyebrow }: HomeSectionProps) => (
	<section id={id} className="home-discovery-section" aria-labelledby={`${id}-title`}>
		<div className="home-section-container">
			<div className="home-section-heading">
				<div>
					{eyebrow && <span className="home-section-eyebrow">{eyebrow}</span>}
					<Typography id={`${id}-title`} component="h2" variant="h4">
						{titleHref ? <Link href={titleHref}>{title}</Link> : title}
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
