import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/router';
import { Button, Card, CardContent, Chip, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { InstructorPreview } from '../../types/member/instructor';
import { homeImageUrl, homePrice } from './homeUtils';

export const InstructorImage = ({ instructor }: { instructor: InstructorPreview }) => (
	<img
		className="home-instructor-image"
		src={homeImageUrl(instructor.memberImage) || '/img/profile/defaultUser.svg'}
		alt={instructor.memberFullName || instructor.memberNick}
		loading="lazy"
		onError={(event) => {
			if (!event.currentTarget.src.endsWith('/img/profile/defaultUser.svg'))
				event.currentTarget.src = '/img/profile/defaultUser.svg';
		}}
	/>
);

const InstructorCard = ({ instructor }: { instructor: InstructorPreview }) => {
	const { t, i18n } = useTranslation('common');
	const router = useRouter();
	return (
		<Card
			className="home-discovery-card home-instructor-card"
			variant="outlined"
			onClick={(event) => {
				if (!(event.target as HTMLElement).closest('a,button'))
					void router.push(`/instructor/detail?instructorId=${encodeURIComponent(instructor._id)}`);
			}}
		>
			<Link href={`/instructor/detail?instructorId=${encodeURIComponent(instructor._id)}`}>
				<InstructorImage instructor={instructor} />
			</Link>
			<CardContent>
				<Typography component="h3" variant="h6">
					<Link href={`/instructor/detail?instructorId=${encodeURIComponent(instructor._id)}`}>
						{instructor.memberFullName || instructor.memberNick}
					</Link>
				</Typography>
				{instructor.instructorExperienceYears != null && (
					<Typography>{t('Instructor experience', { count: instructor.instructorExperienceYears })}</Typography>
				)}
				<div className="home-card-tags">
					{instructor.instructorLevel && (
						<Chip size="small" label={t(`Instructor level ${instructor.instructorLevel}`)} />
					)}
					{instructor.instructorAudience && (
						<Chip size="small" label={t(`Audience ${instructor.instructorAudience}`)} />
					)}
				</div>
				{Boolean(instructor.instructorLanguages?.length) && (
					<Typography className="home-card-muted">{instructor.instructorLanguages?.join(', ')}</Typography>
				)}
				{instructor.instructorPrice1Week != null && (
					<Typography variant="body2">
						{t('Weekly profile price', { count: 1, price: homePrice(instructor.instructorPrice1Week, i18n.language) })}
					</Typography>
				)}
				<Button component={Link} href={`/instructor/detail?instructorId=${encodeURIComponent(instructor._id)}`}>
					{t('View instructor')}
				</Button>
			</CardContent>
		</Card>
	);
};

export default InstructorCard;
