import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useApolloClient, useMutation } from '@apollo/client';
import {
	Alert,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Pagination,
} from '@mui/material';
import CalendarToday from '@mui/icons-material/CalendarToday';
import LocationOn from '@mui/icons-material/LocationOn';
import Search from '@mui/icons-material/Search';
import { useTranslation } from 'next-i18next';
import { GET_EVENTS, GET_ADMIN_EVENTS, REMOVE_EVENT } from '../../../apollo/events';
import { EventList, SkiEvent, isPastEvent } from '../../types/event';
import { MemberStatus, MemberType } from '../../enums/member.enum';
import useMemberSession from '../../hooks/useMemberSession';
import { homeImageUrl } from '../homepage/homeUtils';
import EventEditor from './EventEditor';

function EventImage({ path, title }: { path: string; title: string }) {
	return (
		<Image
			unoptimized
			width={800}
			height={450}
			src={homeImageUrl(path) || '/img/hero/winter-1.jpg'}
			alt={title}
			onError={(e) => {
				if (!e.currentTarget.src.endsWith('/img/hero/winter-1.jpg')) e.currentTarget.src = '/img/hero/winter-1.jpg';
			}}
		/>
	);
}
export default function EventPage({ adminPage = false }: { adminPage?: boolean }) {
	const client = useApolloClient();
	const { user, ready } = useMemberSession();
	const { t, i18n } = useTranslation('common');
	const admin = ready && user.memberType === MemberType.ADMIN && user.memberStatus === MemberStatus.ACTIVE;
	const [manage, setManage] = useState(false);
	const management = admin && (adminPage || manage);
	const [events, setEvents] = useState<SkiEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [failure, setFailure] = useState('');
	const [revision, setRevision] = useState(0);
	const [text, setText] = useState('');
	const [search, setSearch] = useState('');
	const [period, setPeriod] = useState('upcoming');
	const [location, setLocation] = useState('');
	const [status, setStatus] = useState('');
	const [sort, setSort] = useState('eventStartDate');
	const [page, setPage] = useState(1);
	const [now, setNow] = useState(() => Date.now());
	const [editor, setEditor] = useState<{ event: SkiEvent | null } | null>(null);
	const [remove, setRemove] = useState<SkiEvent | null>(null);
	const [removing, setRemoving] = useState(false);
	const [actionFailure, setActionFailure] = useState('');
	const removeLock = useRef(false);
	const [deleteEvent] = useMutation<{ removeEventByAdmin: { _id: string } }, { eventId: string }>(REMOVE_EVENT);
	useEffect(() => {
		const timer = window.setInterval(() => setNow(Date.now()), 60000);
		return () => window.clearInterval(timer);
	}, []);
	useEffect(() => {
		setEditor(null);
		setRemove(null);
		setActionFailure('');
	}, [management, user._id]);
	useEffect(() => {
		let active = true;
		setEvents([]);
		setLoading(true);
		setFailure('');
		setPage(1);
		if (adminPage && !admin) return;
		const load = async () => {
			const all: SkiEvent[] = [];
			for (let batch = 1; active; batch++) {
				const { data } = await client.query<{ getEvents?: EventList; getAllEventsByAdmin?: EventList }>({
					query: management ? GET_ADMIN_EVENTS : GET_EVENTS,
					fetchPolicy: 'network-only',
					variables: {
						input: {
							page: batch,
							limit: 100,
							sort,
							direction: sort === 'eventStartDate' ? 'ASC' : 'DESC',
							search: { ...(search ? { text: search } : {}), ...(management && status ? { eventStatus: status } : {}) },
						},
					},
				});
				const result = management ? data.getAllEventsByAdmin : data.getEvents;
				if (!result) throw new Error(t('Could not load events.'));
				all.push(...result.list);
				if (!result.list.length || all.length >= (result.metaCounter[0]?.total ?? 0)) break;
			}
			if (active) setEvents(Array.from(new Map(all.map((event) => [event._id, event])).values()));
		};
		void load()
			.catch((error: unknown) => {
				if (active) setFailure(error instanceof Error ? error.message : t('Could not load events.'));
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, [client, management, adminPage, admin, user._id, search, status, sort, revision, t]);
	const locations = useMemo(
		() =>
			Array.from(
				new Set(events.map((event) => event.eventLocation).filter((value): value is string => Boolean(value))),
			).sort(),
		[events],
	);
	const filtered = events.filter(
		(event) =>
			(management || isPastEvent(event, now) === (period === 'past')) &&
			(!location || event.eventLocation === location),
	);
	const pages = Math.ceil(filtered.length / 6);
	const currentPage = Math.min(page, Math.max(1, pages));
	const visible = filtered.slice((currentPage - 1) * 6, currentPage * 6);
	const format = (date: string) =>
		new Intl.DateTimeFormat(i18n.language === 'kr' ? 'ko-KR' : i18n.language || 'en', {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone: 'Asia/Seoul',
		}).format(new Date(date));
	const refresh = () => {
		setEditor(null);
		setRevision((value) => value + 1);
	};
	const confirmRemove = async () => {
		if (!management || !remove || removeLock.current) return;
		removeLock.current = true;
		setRemoving(true);
		setActionFailure('');
		try {
			await deleteEvent({ variables: { eventId: remove._id } });
			setRemove(null);
			refresh();
		} catch (error) {
			setActionFailure(error instanceof Error ? error.message : t('Could not remove event.'));
		} finally {
			removeLock.current = false;
			setRemoving(false);
		}
	};
	if (adminPage && !ready) return <CircularProgress aria-label={t('Loading')} />;
	if (adminPage && !admin) return <Alert severity="error">{t('Active admin access required')}</Alert>;
	return (
		<div className={`events-page${adminPage ? ' admin-events-page' : ''}`}>
			<Head>
				<title>
					{t('Events')} | SNOWKR{adminPage ? ' Admin' : ''}
				</title>
			</Head>
			{adminPage ? (
				<header className="admin-events-heading">
					<div>
						<span>
							{t('Administration')} / {t('Events')}
						</span>
						<h1>{t('Manage events')}</h1>
						<p>{t('Create, publish and manage winter events across Korea.')}</p>
					</div>
					<div className="events-admin-actions">
						<Button component={Link} href="/events" variant="outlined">
							{t('Public events')}
						</Button>
						<Button variant="contained" onClick={() => setEditor({ event: null })}>
							{t('Create Event')}
						</Button>
					</div>
				</header>
			) : (
				<section className="events-hero">
					<span>{t('Korea winter calendar')}</span>
					<h1>{t('Ski & Snow Events in Korea')}</h1>
					<p>{t('Discover upcoming competitions, festivals and winter activities across Korea.')}</p>
				</section>
			)}
			{admin && !adminPage && (
				<div className="events-admin-actions">
					<Button
						variant="outlined"
						onClick={() => {
							setManage(!manage);
							setStatus('');
							setLocation('');
						}}
					>
						{t(management ? 'Public events' : 'Manage events')}
					</Button>
					{management && (
						<Button variant="contained" onClick={() => setEditor({ event: null })}>
							{t('Create Event')}
						</Button>
					)}
				</div>
			)}
			<form
				className="events-search"
				onSubmit={(e) => {
					e.preventDefault();
					setSearch(text.trim());
					setLocation('');
				}}
			>
				<Search />
				<input
					aria-label={t('Search events by title or description')}
					placeholder={t('Search events by title or description')}
					value={text}
					onChange={(e) => setText(e.target.value)}
				/>
				<Button type="submit" variant="contained">
					{t('Search')}
				</Button>
			</form>
			<div className="events-controls">
				<div className="events-filters">
					{management ? (
						<select aria-label={t('Status')} value={status} onChange={(e) => setStatus(e.target.value)}>
							<option value="">{t('All statuses')}</option>
							<option value="DRAFT">{t('Draft')}</option>
							<option value="PUBLISHED">{t('Published')}</option>
						</select>
					) : (
						<div className="events-tabs">
							<button
								aria-pressed={period === 'upcoming'}
								onClick={() => {
									setPeriod('upcoming');
									setPage(1);
								}}
							>
								{t('Upcoming')}
							</button>
							<button
								aria-pressed={period === 'past'}
								onClick={() => {
									setPeriod('past');
									setPage(1);
								}}
							>
								{t('Past Events')}
							</button>
						</div>
					)}
					<select
						aria-label={t('Location')}
						value={location}
						onChange={(e) => {
							setLocation(e.target.value);
							setPage(1);
						}}
					>
						<option value="">{t('All Locations')}</option>
						{locations.map((value) => (
							<option key={value}>{value}</option>
						))}
					</select>
					<Button
						onClick={() => {
							setText('');
							setSearch('');
							setLocation('');
							setStatus('');
							setPeriod('upcoming');
							setSort('eventStartDate');
							setPage(1);
						}}
					>
						{t('Reset')}
					</Button>
				</div>
				<div className="events-sort">
					<span aria-live="polite">{loading ? t('Loading') : t('{{count}} events', { count: filtered.length })}</span>
					<select aria-label={t('Sort events')} value={sort} onChange={(e) => setSort(e.target.value)}>
						<option value="eventStartDate">{t('Upcoming Soonest')}</option>
						<option value="createdAt">{t('Newest Added')}</option>
						<option value="updatedAt">{t('Recently Updated')}</option>
					</select>
				</div>
			</div>
			{loading ? (
				<div className="events-state">
					<CircularProgress aria-label={t('Loading')} />
				</div>
			) : failure ? (
				<Alert severity="error" action={<Button onClick={() => setRevision(revision + 1)}>{t('Retry')}</Button>}>
					{failure}
				</Alert>
			) : !visible.length ? (
				<div className="events-state">
					<h2>{t('No events found')}</h2>
					<p>{t('Try another search or check back for upcoming events.')}</p>
				</div>
			) : (
				<div className="events-grid">
					{visible.map((event) => (
						<article className="event-card" key={event._id}>
							<div className="event-cover">
								<EventImage path={event.eventImages[0]} title={event.eventTitle} />
								<span>
									{t(
										management
											? event.eventStatus === 'DRAFT'
												? 'Draft'
												: 'Published'
											: isPastEvent(event, now)
											? 'Past Events'
											: new Date(event.eventStartDate).getTime() <= now
											? 'Ongoing'
											: 'Upcoming',
									)}
								</span>
							</div>
							<div className="event-card-body">
								<h2>
									<Link href={`/events/detail?id=${event._id}`}>{event.eventTitle}</Link>
								</h2>
								<div className="event-meta">
									<CalendarToday />
									<span>{format(event.eventStartDate)} (KST)</span>
								</div>
								{adminPage && (
									<div className="event-meta">
										<CalendarToday />
										<span>
											{t('Ends')}: {format(event.eventEndDate)} (KST)
										</span>
									</div>
								)}
								{event.eventLocation && (
									<div className="event-meta">
										<LocationOn />
										<span>{event.eventLocation}</span>
									</div>
								)}
								<p>{event.eventDesc}</p>
								<div className="event-card-actions">
									{management && (
										<>
											<Button onClick={() => setEditor({ event })}>{t('Edit')}</Button>
											<Button
												color="error"
												onClick={() => {
													setActionFailure('');
													setRemove(event);
												}}
											>
												{t('Delete')}
											</Button>
										</>
									)}
									<Button component={Link} href={`/events/detail?id=${event._id}`} variant="contained">
										{t('View Event')}
									</Button>
								</div>
							</div>
						</article>
					))}
				</div>
			)}
			{!loading && !failure && pages > 1 && (
				<div className="events-pagination">
					<Pagination page={currentPage} count={pages} onChange={(_e, value) => setPage(value)} />
				</div>
			)}
			{management && editor && (
				<EventEditor
					key={editor.event?._id ?? 'new'}
					event={editor.event}
					onClose={() => setEditor(null)}
					onSaved={refresh}
					onReload={refresh}
				/>
			)}
			{management && remove && (
				<Dialog
					open
					onClose={() => {
						if (!removing) setRemove(null);
					}}
				>
					<DialogTitle>{t('Delete Event')}</DialogTitle>
					<DialogContent>
						<p>{remove.eventTitle}</p>
						<p>{t('This permanently deletes the event. Uploaded images are retained.')}</p>
						{actionFailure && <Alert severity="error">{actionFailure}</Alert>}
					</DialogContent>
					<DialogActions>
						<Button disabled={removing} onClick={() => setRemove(null)}>
							{t('Cancel')}
						</Button>
						<Button color="error" disabled={removing} onClick={() => void confirmRemove()}>
							{t('Delete')}
						</Button>
					</DialogActions>
				</Dialog>
			)}
		</div>
	);
}
