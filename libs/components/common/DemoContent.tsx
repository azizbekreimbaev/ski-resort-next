import React from 'react';
import Link from 'next/link';
import { Alert, Button, Chip } from '@mui/material';
import { useTranslation } from 'next-i18next';
import HomeSection from '../homepage/HomeSection';
export const demoEvents = [
	{
		id: 'festival',
		title: 'Pyeongchang Snow Festival',
		date: '2027-01-10 – 2027-01-18',
		category: 'Festival',
		image: '/img/hero/winter-1.jpg',
		description: 'A sample winter festival with mountain scenery and snow sculptures.',
	},
	{
		id: 'camp',
		title: 'Junior Alpine Ski Camp',
		date: '2027-01-15 – 2027-01-18',
		category: 'Camp',
		image: '/img/hero/winter-2.jpg',
		description: 'A sample ski camp focused on beginner technique and slope safety.',
	},
	{
		id: 'race',
		title: 'Korea Banked Slalom Open',
		date: '2027-02-01',
		category: 'Competition',
		image: '/img/hero/winter-3.jpg',
		description: 'A sample community snowboard competition for the winter season.',
	},
];
export function EventCards() {
	const { t } = useTranslation('common');
	return (
		<div className="snowkr-grid">
			{demoEvents.map((event) => (
				<article className="snowkr-article-card" key={event.id}>
					<img className="snowkr-demo-image" src={event.image} alt={t('Winter mountains')} />
					<Chip label={t(event.category)} size="small" />
					<h3>{t(event.title)}</h3>
					<div className="snowkr-meta">
						{event.date} · {t('Demo event')}
					</div>
					<p>{t(event.description)}</p>
					<Button component={Link} href={'/events#' + event.id}>
						{t('Event Info')}
					</Button>
				</article>
			))}
		</div>
	);
}
export function EventsPreview() {
	const { t } = useTranslation('common');
	return (
		<HomeSection
			id="events-preview"
			title={t('Upcoming Events')}
			subtitle={t('Sample festivals, camps and competitions. Demo content only.')}
			action={
				<Button component={Link} href="/events">
					{t('View All Events')}
				</Button>
			}
		>
			<EventCards />
		</HomeSection>
	);
}
export default function DemoContent({ reports = false }: { reports?: boolean }) {
	const { t } = useTranslation('common');
	return (
		<div className="catalog-page">
			<div className="snowkr-page-heading">
				<h1>{t(reports ? 'Snow Condition Reports' : 'Events')}</h1>
				<p>
					{t(
						reports
							? 'Explore sample mountain condition reports.'
							: 'Winter festivals, camps and competitions in Korea.',
					)}
				</p>
			</div>
			<Alert severity="info" sx={{ mb: 3 }}>
				{t('Demo content. These are fictional samples, not live reports or confirmed events.')}
			</Alert>
			{reports ? (
				<div className="snowkr-grid">
					{[
						{ title: 'Sample mountain report A', snow: '35 cm', temperature: '−4°C', image: '/img/hero/winter-1.jpg' },
						{ title: 'Sample mountain report B', snow: '22 cm', temperature: '−2°C', image: '/img/hero/winter-2.jpg' },
						{ title: 'Sample mountain report C', snow: '48 cm', temperature: '−7°C', image: '/img/hero/winter-3.jpg' },
					].map((report) => (
						<article className="snowkr-article-card" key={report.title}>
							<img className="snowkr-demo-image" src={report.image} alt={t('Winter mountains')} />
							<Chip label={t('Demo report')} />
							<h2>{t(report.title)}</h2>
							<p>
								{t('Sample snow depth')}: {report.snow}
							</p>
							<p>
								{t('Sample temperature')}: {report.temperature}
							</p>
							<p>{t('Check official resort sources before planning your trip.')}</p>
						</article>
					))}
				</div>
			) : (
				<>
					<EventCards />
					<section className="snowkr-panel" style={{ marginTop: 32 }}>
						{demoEvents.map((event) => (
							<div id={event.id} key={event.id} style={{ scrollMarginTop: 100, padding: '16px 0' }}>
								<h2>{t(event.title)}</h2>
								<p>{t(event.description)}</p>
								<p>{t('Demo event. Registration is not available.')}</p>
							</div>
						))}
					</section>
				</>
			)}
		</div>
	);
}
