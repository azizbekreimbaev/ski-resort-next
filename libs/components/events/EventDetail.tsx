import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { Alert, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ChevronRight from '@mui/icons-material/ChevronRight';
import CalendarToday from '@mui/icons-material/CalendarToday';
import LocationOn from '@mui/icons-material/LocationOn';
import Share from '@mui/icons-material/Share';
import { useTranslation } from 'next-i18next';
import { GET_EVENT, GET_ADMIN_EVENT, REMOVE_EVENT } from '../../../apollo/events';
import { GET_RESORT } from '../../../apollo/user/query';
import { SkiEvent, isPastEvent } from '../../types/event';
import { ResortSearchResult } from '../../types/resort/resort';
import { MemberStatus, MemberType } from '../../enums/member.enum';
import { validId } from '../../catalogSearch';
import useMemberSession from '../../hooks/useMemberSession';
import { homeImageUrl } from '../homepage/homeUtils';
import EventEditor from './EventEditor';

function DetailImage({ path, title }: { path?: string; title: string }) {
	return (
		<Image
			unoptimized
			width={1400}
			height={600}
			src={homeImageUrl(path) || '/img/hero/winter-1.jpg'}
			alt={title}
			onError={(e) => {
				e.currentTarget.onerror = null;
				e.currentTarget.src = '/img/hero/winter-1.jpg';
			}}
		/>
	);
}

function EventResort({ id }: { id: string }) {
	const { t } = useTranslation('common');
	const { data, loading, error, refetch } = useQuery<{ getResort: ResortSearchResult }>(GET_RESORT, {
		variables: { resortId: id },
		skip: !validId(id),
	});
	const resort = data?.getResort;
	return (
		<section className="event-detail-panel event-host">
			{loading ? (
				<CircularProgress aria-label={t('Loading')} />
			) : error || !resort || resort.resortStatus === 'DELETE' ? (
				<Alert
					severity="info"
					action={<Button onClick={() => void refetch().catch(() => undefined)}>{t('Retry')}</Button>}
				>
					{t('Associated resort is unavailable')}
				</Alert>
			) : (
				<>
					<div className="event-host-image">
						<DetailImage path={resort.resortImages[0]} title={resort.resortTitle} />
						<span>{t('Event Resort')}</span>
					</div>
					<div className="event-host-body">
						<h2>{resort.resortTitle}</h2>
						<p>
							{t(resort.resortLocation)} · {resort.resortAddress}
						</p>
						{resort.resortDesc && <p className="event-host-description">{resort.resortDesc}</p>}
						<Button component={Link} href={`/resort/detail?id=${resort._id}`} fullWidth endIcon={<ChevronRight />}>
							{t('View Resort')}
						</Button>
					</div>
				</>
			)}
		</section>
	);
}

export default function EventDetail() {
	const router = useRouter();
	const { t, i18n } = useTranslation('common');
	const { user, ready } = useMemberSession();
	const admin = ready && user.memberType === MemberType.ADMIN && user.memberStatus === MemberStatus.ACTIVE;
	const id = router.query.id;
	const valid = validId(id);
	const { data, loading, error, refetch } = useQuery<{ getEvent?: SkiEvent; getEventByAdmin?: SkiEvent }>(
		admin ? GET_ADMIN_EVENT : GET_EVENT,
		{
			variables: { eventId: id },
			skip: !router.isReady || !ready || !valid,
			fetchPolicy: 'network-only',
			context: { queryDeduplication: false },
		},
	);
	const event = admin ? data?.getEventByAdmin : data?.getEvent;
	const [editing, setEditing] = useState(false);
	const [confirm, setConfirm] = useState(false);
	const [message, setMessage] = useState('');
	const [failure, setFailure] = useState('');
	const [now, setNow] = useState(() => Date.now());
	const lock = useRef(false);
	const [remove, removeState] = useMutation<{ removeEventByAdmin: { _id: string } }, { eventId: string }>(REMOVE_EVENT);
	useEffect(() => {
		setEditing(false);
		setConfirm(false);
		setFailure('');
		setMessage('');
	}, [id, user._id, admin]);
	useEffect(() => {
		const timer = window.setInterval(() => setNow(Date.now()), 60000);
		return () => window.clearInterval(timer);
	}, []);
	const reload = () => {
		setEditing(false);
		void refetch().catch(() => undefined);
	};
	const format = (date: string) =>
		new Intl.DateTimeFormat(i18n.language === 'kr' ? 'ko' : i18n.language, {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone: 'Asia/Seoul',
		}).format(new Date(date));
	const share = async () => {
		if (!event) return;
		setMessage('');
		setFailure('');
		try {
			if (navigator.share) await navigator.share({ title: event.eventTitle, url: window.location.href });
			else {
				await navigator.clipboard.writeText(window.location.href);
				setMessage(t('Event link copied'));
			}
		} catch (error) {
			if (!(error instanceof Error && error.name === 'AbortError'))
				setFailure(t('Could not share event. Copy the page URL from your browser.'));
		}
	};
	const deleteEvent = async () => {
		if (!admin || !event || lock.current) return;
		lock.current = true;
		setFailure('');
		try {
			await remove({ variables: { eventId: event._id } });
			await router.replace('/events');
		} catch (error) {
			setFailure(error instanceof Error ? error.message : t('Could not remove event.'));
		} finally {
			lock.current = false;
		}
	};
	if (!router.isReady || !ready || (valid && loading))
		return (
			<div className="event-detail-page event-detail-state">
				<CircularProgress aria-label={t('Loading')} />
			</div>
		);
	if (!valid || error || !event || (!admin && event.eventStatus !== 'PUBLISHED'))
		return (
			<div className="event-detail-page event-detail-state">
				<h1>{t('Event unavailable')}</h1>
				<p>{t('This event may have been removed or is not published.')}</p>
				{valid && <Button onClick={() => void refetch().catch(() => undefined)}>{t('Retry')}</Button>}
				<Button component={Link} href="/events">
					{t('Back to all events')}
				</Button>
			</div>
		);
	const status =
		event.eventStatus === 'DRAFT'
			? 'Draft'
			: isPastEvent(event, now)
			? 'Past Events'
			: new Date(event.eventStartDate).getTime() <= now
			? 'Ongoing'
			: 'Upcoming';
	return (
		<div className="event-detail-page">
			<Head>
				<title>{event.eventTitle} | SNOWAY</title>
				<meta name="description" content={event.eventDesc.slice(0, 160)} />
			</Head>
			<div className="event-detail-breadcrumb">
				<nav aria-label={t('Breadcrumb')}>
					<Link href="/">{t('Home')}</Link>
					<ChevronRight />
					<Link href="/events">{t('Events')}</Link>
					<ChevronRight />
					<span>{event.eventTitle}</span>
				</nav>
				<Button component={Link} href="/events" startIcon={<ArrowBack />}>
					{t('Back to all events')}
				</Button>
			</div>
			<div className="event-detail-hero">
				<DetailImage path={event.eventImages[0]} title={event.eventTitle} />
				<div className="event-detail-hero-caption">
					<span>{t(status)}</span>
					{event.eventLocation && <span>{event.eventLocation}</span>}
				</div>
			</div>
			<header className="event-detail-heading">
				<div>
					<span className="event-detail-tag">{t(status)}</span>
					<h1>{event.eventTitle}</h1>
					<div className="event-detail-meta">
						<span>
							<CalendarToday />
							{format(event.eventStartDate)} (KST)
						</span>
						{event.eventLocation && (
							<span>
								<LocationOn />
								{event.eventLocation}
							</span>
						)}
					</div>
				</div>
				<div className="event-detail-actions">
					<Button onClick={() => void share()} startIcon={<Share />}>
						{t('Share')}
					</Button>
					{admin && (
						<>
							<Button onClick={() => setEditing(true)}>{t('Edit Event')}</Button>
							<Button
								color="error"
								onClick={() => {
									setFailure('');
									setConfirm(true);
								}}
							>
								{t('Delete Event')}
							</Button>
						</>
					)}
				</div>
			</header>
			{message && (
				<Alert severity="success" onClose={() => setMessage('')}>
					{message}
				</Alert>
			)}
			{failure && !confirm && <Alert severity="error">{failure}</Alert>}
			<div className="event-detail-columns">
				<div className="event-detail-main">
					<section className="event-detail-panel">
						<h2>{t('About This Event')}</h2>
						<div className="event-detail-description">{event.eventDesc}</div>
					</section>
					<section className="event-detail-panel">
						<h2>{t('Event dates')}</h2>
						<ol className="event-detail-timeline">
							<li>
								<span>{t('Starts')}</span>
								<time dateTime={event.eventStartDate}>{format(event.eventStartDate)} (KST)</time>
							</li>
							<li>
								<span>{t('Ends')}</span>
								<time dateTime={event.eventEndDate}>{format(event.eventEndDate)} (KST)</time>
							</li>
						</ol>
					</section>
					<section className="event-detail-gallery">
						<h2>
							{t('Event Photos')} <small>{t('{{count}} photos', { count: event.eventImages.length })}</small>
						</h2>
						<div>
							{event.eventImages.map((path, index) => (
								<a
									key={path}
									href={homeImageUrl(path) || '/img/hero/winter-1.jpg'}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={`${t('Event image')} ${index + 1}`}
								>
									<DetailImage path={path} title={`${event.eventTitle} — ${index + 1}`} />
								</a>
							))}
						</div>
					</section>
				</div>
				<aside className="event-detail-sidebar">
					<section className="event-detail-panel">
						<h2>{t('Event Information')}</h2>
						<dl>
							<div>
								<dt>{t('Starts')}</dt>
								<dd>{format(event.eventStartDate)} (KST)</dd>
							</div>
							<div>
								<dt>{t('Ends')}</dt>
								<dd>{format(event.eventEndDate)} (KST)</dd>
							</div>
							{event.eventLocation && (
								<div>
									<dt>{t('Location')}</dt>
									<dd>{event.eventLocation}</dd>
								</div>
							)}
							<div>
								<dt>{t('Status')}</dt>
								<dd>{t(status)}</dd>
							</div>
						</dl>
						{event.resortId && (
							<Button component={Link} href={`/resort/detail?id=${event.resortId}`} fullWidth variant="contained">
								{t('View Resort')}
							</Button>
						)}
					</section>
					{event.resortId && <EventResort key={event.resortId} id={event.resortId} />}
				</aside>
			</div>
			{admin && editing && (
				<EventEditor
					key={event.updatedAt}
					event={event}
					onClose={() => setEditing(false)}
					onSaved={reload}
					onReload={reload}
				/>
			)}
			{admin && confirm && (
				<Dialog
					open
					onClose={() => {
						if (!lock.current) setConfirm(false);
					}}
				>
					<DialogTitle>{t('Delete Event')}</DialogTitle>
					<DialogContent>
						<p>{event.eventTitle}</p>
						<p>{t('This permanently deletes the event. Uploaded images are retained.')}</p>
						{failure && <Alert severity="error">{failure}</Alert>}
					</DialogContent>
					<DialogActions>
						<Button disabled={removeState.loading} onClick={() => setConfirm(false)}>
							{t('Cancel')}
						</Button>
						<Button disabled={removeState.loading} color="error" onClick={() => void deleteEvent()}>
							{t('Delete')}
						</Button>
					</DialogActions>
				</Dialog>
			)}
		</div>
	);
}
