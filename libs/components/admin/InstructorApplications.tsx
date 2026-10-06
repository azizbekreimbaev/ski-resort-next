import React, { useEffect, useRef, useState } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import {
	Alert,
	Button,
	Drawer,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	IconButton,
	Pagination,
	TextField,
	MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import { useTranslation } from 'next-i18next';
import {
	GET_ALL_INSTRUCTOR_APPLICATIONS_BY_ADMIN,
	GET_INSTRUCTOR_APPLICATION_BY_ADMIN,
} from '../../../apollo/admin/query';
import {
	APPROVE_INSTRUCTOR_APPLICATION_BY_ADMIN,
	REJECT_INSTRUCTOR_APPLICATION_BY_ADMIN,
} from '../../../apollo/admin/mutation';
import { APPLICATION_MEMBER, APPLICATION_SUMMARY } from '../../../apollo/admin/instructorApplication';
import { Application, CatalogList } from '../../types/catalog';
import HomeCollectionState from '../homepage/HomeCollectionState';
import {
	ApplicantMember,
	ApplicationSearchResult,
	filterApplications,
	loadApplicationSearch,
} from './applicationSearch';

const statuses = ['', 'PENDING', 'APPROVED', 'REJECTED'] as const;
const labels = ['All', 'Pending review', 'Approved', 'Rejected'];
type Summary = Record<'all' | 'pending' | 'approved' | 'rejected', { metaCounter: { total: number }[] | null }>;
function ApplicantIdentity({
	memberId,
	drawer = false,
	known,
}: {
	memberId: string;
	drawer?: boolean;
	known?: ApplicantMember;
}) {
	const { t } = useTranslation('common');
	const member = useQuery<{
		getMember: { _id: string; memberNick: string; memberFullName?: string | null; memberType: string };
	}>(APPLICATION_MEMBER, {
		variables: { memberId },
		fetchPolicy: 'cache-first',
		skip: Boolean(known) || !/^[a-f\d]{24}$/i.test(memberId),
	});
	const person =
		known ?? (!member.error && member.data?.getMember?._id === memberId ? member.data.getMember : undefined);
	const Heading = drawer ? 'h3' : 'h2';
	return (
		<>
			<Heading>{person?.memberFullName || person?.memberNick || `${t('Applicant')} ${memberId.slice(-6)}`}</Heading>
			{person && (
				<small className="ia-member-name">
					@{person.memberNick} · {t(person.memberType)}
				</small>
			)}
		</>
	);
}
const date = (value: string) =>
	new Date(value).toLocaleString(undefined, {
		timeZone: 'Asia/Seoul',
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}) + ' KST';

export default function InstructorApplications() {
	const { t } = useTranslation('common');
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState<string>('');
	const [searchText, setSearchText] = useState('');
	const [direction, setDirection] = useState('DESC');
	const client = useApolloClient();
	const searching = Boolean(searchText.trim());
	const [searchVersion, setSearchVersion] = useState(0);
	const searchKey = JSON.stringify([status, direction, searchVersion]);
	const [searchResult, setSearchResult] = useState<{
		key: string;
		result: ApplicationSearchResult;
		loading: boolean;
		error: boolean;
	}>({ key: '', result: { rows: [], members: {} }, loading: true, error: false });
	const [selected, setSelected] = useState<string | null>(null);
	const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
	const [reason, setReason] = useState('');
	const [failure, setFailure] = useState('');
	const [success, setSuccess] = useState('');
	useEffect(() => {
		if (!searching) return;
		let cancelled = false;
		setSearchResult({ key: searchKey, result: { rows: [], members: {} }, loading: true, error: false });
		void loadApplicationSearch(client, status, direction, () => cancelled)
			.then((result) => {
				if (!cancelled) setSearchResult({ key: searchKey, result, loading: false, error: false });
			})
			.catch(() => {
				if (!cancelled)
					setSearchResult({ key: searchKey, result: { rows: [], members: {} }, loading: false, error: true });
			});
		return () => {
			cancelled = true;
		};
	}, [client, searching, status, direction, searchKey]);
	const list = useQuery<{ getAllInstructorApplicationsByAdmin: CatalogList<Application> }>(
		GET_ALL_INSTRUCTOR_APPLICATIONS_BY_ADMIN,
		{
			variables: {
				input: {
					page,
					limit: 9,
					sort: 'createdAt',
					direction,
					search: status ? { applicationStatus: status } : {},
				},
			},
			skip: searching,
			fetchPolicy: 'network-only',
			notifyOnNetworkStatusChange: true,
		},
	);
	const summary = useQuery<Summary>(APPLICATION_SUMMARY, { fetchPolicy: 'network-only' });
	const detail = useQuery<{ getInstructorApplicationByAdmin: Application }>(GET_INSTRUCTOR_APPLICATION_BY_ADMIN, {
		variables: { applicationId: selected },
		skip: !selected,
		fetchPolicy: 'network-only',
	});
	const application = detail.data?.getInstructorApplicationByAdmin;
	const [approve, approveState] = useMutation(APPROVE_INSTRUCTOR_APPLICATION_BY_ADMIN);
	const [reject, rejectState] = useMutation(REJECT_INSTRUCTOR_APPLICATION_BY_ADMIN);
	const busy = approveState.loading || rejectState.loading;
	const reviewing = useRef(false);
	const matches = filterApplications(searchResult.result, searchText);
	const total = searching
		? matches.length
		: list.data?.getAllInstructorApplicationsByAdmin.metaCounter?.[0]?.total ?? 0;
	const visibleRows = searching
		? matches.slice((page - 1) * 9, page * 9)
		: list.data?.getAllInstructorApplicationsByAdmin.list ?? [];
	const loading = searching ? searchResult.key !== searchKey || searchResult.loading : list.loading;
	const error = searching ? searchResult.key === searchKey && searchResult.error : Boolean(list.error);
	const refresh = async () => {
		if (searching) setSearchVersion((version) => version + 1);
		else await list.refetch();
	};
	const counts = (['all', 'pending', 'approved', 'rejected'] as const).map((key) =>
		summary.error || summary.loading || !summary.data?.[key] ? '-' : summary.data[key].metaCounter?.[0]?.total ?? 0,
	);
	useEffect(() => {
		if (!loading && !error && page > Math.max(1, Math.ceil(total / 9))) setPage(Math.max(1, Math.ceil(total / 9)));
	}, [total, page, loading, error]);
	const open = (id: string) => {
		setSelected(id);
		setReason('');
		setFailure('');
		setDecision(null);
	};
	const review = async () => {
		if (
			!selected ||
			reviewing.current ||
			busy ||
			application?._id !== selected ||
			application.applicationStatus !== 'PENDING' ||
			!decision ||
			(decision === 'reject' && !reason.trim())
		)
			return;
		reviewing.current = true;
		try {
			await (decision === 'approve'
				? approve({ variables: { applicationId: selected } })
				: reject({ variables: { input: { _id: selected, rejectionReason: reason.trim() } } }));
			setSuccess(t(decision === 'approve' ? 'Application approved' : 'Application rejected'));
			setDecision(null);
			setFailure('');
			setReason('');
			await Promise.allSettled([refresh(), summary.refetch(), detail.refetch()]);
		} catch (error) {
			setFailure(error instanceof Error ? error.message : t('Unable to review application'));
			await Promise.allSettled([refresh(), summary.refetch(), detail.refetch()]);
		} finally {
			reviewing.current = false;
		}
	};
	const profile = (item: Application) => (
		<div className="ia-profile">
			<div>
				<small>{t('Experience level')}</small>
				<strong>{t(`Instructor level ${item.instructorLevel}`)}</strong>
			</div>
			<div>
				<small>{t('Target group')}</small>
				<strong>{t(`Audience ${item.instructorAudience}`)}</strong>
			</div>
			<div>
				<small>{t('Active experience')}</small>
				<strong>
					{item.instructorExperienceYears} {t('years')}
				</strong>
			</div>
			<div>
				<small>{t('Resort hub allocation')}</small>
				<strong>{item.instructorResortId || t('Not assigned')}</strong>
			</div>
			<div className="ia-languages">
				<small>{t('Supported teaching languages')}</small>
				<strong>{item.instructorLanguages.join(', ')}</strong>
			</div>
		</div>
	);
	return (
		<section className="instructor-applications">
			<header className="ia-heading">
				<span>{t('Verification queue')}</span>
				<h1>{t('Instructor applications')}</h1>
				<p>{t('Review instructor profiles, teaching experience, and winter season registration requests.')}</p>
			</header>
			{success && (
				<Alert severity="success" onClose={() => setSuccess('')}>
					{success}
				</Alert>
			)}
			{summary.error && (
				<Alert severity="warning" action={<Button onClick={() => void summary.refetch()}>{t('Retry')}</Button>}>
					{t('Unable to load application totals')}
				</Alert>
			)}
			<div className="ia-stats">
				{labels.map((label, i) => (
					<div key={label}>
						<small>{t(i === 0 ? 'Total applications' : label)}</small>
						<BadgeOutlinedIcon />
						<strong>{counts[i]}</strong>
					</div>
				))}
			</div>
			<div className="ia-controls">
				<div className="ia-tabs" role="group" aria-label={t('Status')}>
					{statuses.map((value, i) => (
						<Button
							key={value}
							aria-pressed={status === value}
							className={status === value ? 'active' : ''}
							onClick={() => {
								setStatus(value);
								setPage(1);
							}}
						>
							{t(labels[i])} <span>{counts[i]}</span>
						</Button>
					))}
				</div>
				<div className="ia-filters">
					<TextField
						size="small"
						label={t('Instructor name')}
						placeholder={t('Search by full name or nickname')}
						value={searchText}
						onChange={(e) => {
							setSearchText(e.target.value);
							setPage(1);
						}}
					/>
					<TextField
						size="small"
						select
						label={t('Sort')}
						value={direction}
						onChange={(e) => {
							setDirection(e.target.value);
							setPage(1);
						}}
					>
						<MenuItem value="DESC">{t('Latest applications')}</MenuItem>
						<MenuItem value="ASC">{t('Oldest applications')}</MenuItem>
					</TextField>
				</div>
			</div>
			{<HomeCollectionState loading={loading} error={error} empty={!visibleRows.length} retry={refresh} />}
			{!loading && !error && (
				<div className="ia-grid">
					{visibleRows.map((item) => (
						<article className="ia-card" key={item._id}>
							<div className="ia-cover">
								<img src="/img/hero/winter-1.jpg" alt="" />
								<span className={`ia-status ${item.applicationStatus.toLowerCase()}`}>
									{t(labels[statuses.indexOf(item.applicationStatus)])}
								</span>
								<div>
									<ApplicantIdentity
										memberId={item.memberId}
										known={searching ? searchResult.result.members[item.memberId] : undefined}
									/>
									<small>
										{t('Submitted')}: {date(item.createdAt)}
									</small>
								</div>
							</div>
							<div className="ia-card-body">
								{profile(item)}
								<div className="ia-statement">
									<small>{t('Applicant statement & philosophy')}</small>
									<p>{item.memberDesc || t('No statement provided')}</p>
								</div>
								<div className="ia-card-actions">
									<Button onClick={() => open(item._id)}>{t('View details')}</Button>
									{item.applicationStatus === 'PENDING' && (
										<>
											<Button color="error" onClick={() => open(item._id)}>
												{t('Reject')}
											</Button>
											<Button variant="contained" onClick={() => open(item._id)}>
												{t('Approve')}
											</Button>
										</>
									)}
								</div>
							</div>
						</article>
					))}
				</div>
			)}
			{total > 9 && !loading && !error && (
				<Pagination page={page} count={Math.ceil(total / 9)} onChange={(_, value) => setPage(value)} />
			)}
			<Drawer
				anchor="right"
				open={Boolean(selected)}
				onClose={() => {
					if (!busy) {
						setSelected(null);
						setDecision(null);
					}
				}}
				PaperProps={{ className: 'ia-drawer' }}
				BackdropProps={{ sx: { backdropFilter: 'blur(3px)', backgroundColor: 'rgba(19,27,46,.22)' } }}
			>
				<header>
					<BadgeOutlinedIcon />
					<div>
						<h2>{t('Instructor application details')}</h2>
						<small>{selected}</small>
					</div>
					<IconButton aria-label={t('Close')} disabled={busy} onClick={() => setSelected(null)}>
						<CloseIcon />
					</IconButton>
				</header>
				<div className="ia-drawer-body">
					<HomeCollectionState
						loading={detail.loading}
						error={Boolean(detail.error)}
						empty={false}
						retry={detail.refetch}
					/>
					{!detail.loading && !detail.error && application?._id === selected && (
						<>
							<div className="ia-identity">
								<BadgeOutlinedIcon />
								<div>
									<ApplicantIdentity
										memberId={application.memberId}
										drawer
										known={searching ? searchResult.result.members[application.memberId] : undefined}
									/>
									<small>
										{t('Member ID')}: {application.memberId}
									</small>
									<small>
										{t('Submitted')}: {date(application.createdAt)}
									</small>
								</div>
								<span className={`ia-status ${application.applicationStatus.toLowerCase()}`}>
									{t(application.applicationStatus)}
								</span>
							</div>
							<h4>{t('Instructor profile & credentials')}</h4>
							{profile(application)}
							<h4>{t('Applicant statement & philosophy')}</h4>
							<blockquote>{application.memberDesc || t('No statement provided')}</blockquote>
							<h4>{t('Weekly lesson pricing tiers')}</h4>
							<p className="ia-pricing-note">{t('Lesson pricing is not included in instructor applications.')}</p>
							{application.reviewedAt && (
								<p>
									{t('Reviewed')}: {date(application.reviewedAt)}
								</p>
							)}
							{application.rejectionReason && <Alert severity="error">{application.rejectionReason}</Alert>}
						</>
					)}
					{failure && <Alert severity="error">{failure}</Alert>}
				</div>
				<footer>
					{!detail.loading &&
						!detail.error &&
						application?._id === selected &&
						application.applicationStatus === 'PENDING' && (
							<>
								<Button
									color="error"
									disabled={busy}
									onClick={() => {
										setDecision('reject');
										setFailure('');
									}}
								>
									{t('Reject application')}
								</Button>
								<Button
									variant="contained"
									disabled={busy}
									onClick={() => {
										setDecision('approve');
										setFailure('');
									}}
								>
									{t('Approve application')}
								</Button>
							</>
						)}
				</footer>
			</Drawer>
			<Dialog
				open={Boolean(decision)}
				onClose={() => {
					if (!busy) setDecision(null);
				}}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>{t(decision === 'approve' ? 'Approve application' : 'Reject application')}</DialogTitle>
				<DialogContent>
					{decision === 'approve' ? (
						<p>{t('Approve this application and promote the Member?')}</p>
					) : (
						<TextField
							autoFocus
							fullWidth
							required
							multiline
							minRows={4}
							label={t('Rejection reason')}
							value={reason}
							disabled={busy}
							onChange={(e) => setReason(e.target.value)}
						/>
					)}
					{failure && <Alert severity="error">{failure}</Alert>}
				</DialogContent>
				<DialogActions>
					<Button disabled={busy} onClick={() => setDecision(null)}>
						{t('Cancel')}
					</Button>
					<Button
						variant="contained"
						color={decision === 'reject' ? 'error' : 'primary'}
						disabled={
							busy ||
							detail.loading ||
							application?.applicationStatus !== 'PENDING' ||
							(decision === 'reject' && !reason.trim())
						}
						onClick={() => void review()}
					>
						{t(busy ? 'Saving...' : decision === 'approve' ? 'Approve' : 'Reject')}
					</Button>
				</DialogActions>
			</Dialog>
		</section>
	);
}
