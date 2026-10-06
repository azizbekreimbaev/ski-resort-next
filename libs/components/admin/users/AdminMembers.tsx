import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@apollo/client';
import {
	Alert,
	Checkbox,
	InputAdornment,
	Avatar,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Drawer,
	IconButton,
	LinearProgress,
	MenuItem,
	Menu,
	TextField,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TablePagination,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import CloseIcon from '@mui/icons-material/Close';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { useTranslation } from 'next-i18next';
import { GET_ALL_MEMBERS_BY_ADMIN, MEMBER_SUMMARY } from '../../../../apollo/admin/query';
import { UPDATE_MEMBER_BY_ADMIN } from '../../../../apollo/admin/mutation';
import { MembersInquiry } from '../../../types/member/member.input';
import { Member, Members } from '../../../types/member/member';
import { AdminMemberUpdate } from '../../../types/member/member.update';
import { MemberStatus, MemberType } from '../../../enums/member.enum';
import { Direction } from '../../../enums/common.enum';
import { REACT_APP_API_URL } from '../../../config';

const initialInquiry: MembersInquiry = { page: 1, limit: 10, sort: 'createdAt', direction: Direction.DESC, search: {} };
const countInput = (search: MembersInquiry['search']): MembersInquiry => ({ ...initialInquiry, limit: 1, search });
const summaryVariables = {
	all: countInput({}),
	active: countInput({ memberStatus: MemberStatus.ACTIVE }),
	instructors: countInput({ memberType: MemberType.INSTRUCTOR }),
	blocked: countInput({ memberStatus: MemberStatus.BLOCK }),
	archived: countInput({ memberStatus: MemberStatus.DELETE }),
};
type Summary = Record<'all' | 'active' | 'instructors' | 'blocked' | 'archived', Pick<Members, 'metaCounter'>>;
type EditForm = {
	memberNick: string;
	memberFullName: string;
	memberPhone: string;
	memberAddress: string;
	memberDesc: string;
	memberType: MemberType;
};
const statusLabel = (status: string) => ({ ACTIVE: 'Active', BLOCK: 'Blocked', DELETE: 'Archived' }[status] || status);
const roleLabel = (role: string) => ({ USER: 'User', INSTRUCTOR: 'Instructor', ADMIN: 'Admin' }[role] || role);
const imageUrl = (member: Member) =>
	member.memberImage
		? /^https?:\/\//i.test(member.memberImage)
			? member.memberImage
			: `${REACT_APP_API_URL}/${member.memberImage.replace(/^\//, '')}`
		: '/img/profile/defaultUser.svg';
export const csvCell = (value: unknown) => {
	const text = String(value ?? '');
	return `"${(/^[\s]*[=+@-]/.test(text) ? "'" : '') + text.replace(/"/g, '""')}"`;
};

export default function AdminMembers() {
	const { t, i18n } = useTranslation('common');
	const [inquiry, setInquiry] = useState<MembersInquiry>(initialInquiry);
	const [searchText, setSearchText] = useState('');
	const [checkedIds, setCheckedIds] = useState<string[]>([]);
	useEffect(() => setCheckedIds([]), [inquiry]);
	const [selected, setSelected] = useState<Member | null>(null);
	const [editing, setEditing] = useState(false);
	const [form, setForm] = useState<EditForm | null>(null);
	const [confirmation, setConfirmation] = useState<AdminMemberUpdate | null>(null);
	const [confirmationMember, setConfirmationMember] = useState<Member | null>(null);
	const [badgeMenu, setBadgeMenu] = useState<{ anchor: HTMLElement; member: Member; field: 'role' | 'status' } | null>(
		null,
	);
	useEffect(() => setBadgeMenu(null), [inquiry]);
	const [busy, setBusy] = useState(false);
	const lock = useRef(false);
	const [notice, setNotice] = useState<{ message: string; error: boolean } | null>(null);
	const list = useQuery<{ getAllMembersByAdmin: Members }>(GET_ALL_MEMBERS_BY_ADMIN, {
		variables: { input: inquiry },
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	const summary = useQuery<Summary>(MEMBER_SUMMARY, { variables: summaryVariables, fetchPolicy: 'network-only' });
	const [update] = useMutation<{ updateMemberByAdmin: Member }>(UPDATE_MEMBER_BY_ADMIN);
	const members = list.data?.getAllMembersByAdmin.list || [];
	const total = list.data?.getAllMembersByAdmin.metaCounter[0]?.total || 0;
	useEffect(() => {
		if (!list.loading && !list.error && inquiry.page > 1 && list.data && (inquiry.page - 1) * inquiry.limit >= total)
			setInquiry((current) => ({ ...current, page: Math.max(1, Math.ceil(total / current.limit)) }));
	}, [list.loading, list.error, list.data, total, inquiry.page, inquiry.limit]);
	const dateLabel = (value: Date) => {
		const date = new Date(value);
		return Number.isNaN(date.getTime())
			? '—'
			: date.toLocaleDateString(i18n.language, {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
					timeZone: 'Asia/Seoul',
			  });
	};
	const filter = (search: MembersInquiry['search']) =>
		setInquiry((current) => ({ ...current, page: 1, search: { ...current.search, ...search } }));
	const open = (member: Member) => {
		setConfirmationMember(null);
		setSelected(member);
		setEditing(false);
		setForm({
			memberNick: member.memberNick,
			memberFullName: member.memberFullName || '',
			memberPhone: member.memberPhone || '',
			memberAddress: member.memberAddress || '',
			memberDesc: member.memberDesc || '',
			memberType: member.memberType,
		});
	};
	const save = async (input: AdminMemberUpdate) => {
		if (lock.current) return;
		lock.current = true;
		setBusy(true);
		setNotice(null);
		try {
			const result = await update({ variables: { input } });
			if (!result.data?.updateMemberByAdmin) throw new Error(t('Member update failed'));
			if (selected?._id === input._id) open(result.data.updateMemberByAdmin);
			setConfirmation(null);
			setConfirmationMember(null);
			setNotice({ message: t('Member updated'), error: false });
			try {
				await Promise.all([list.refetch(), summary.refetch()]);
			} catch {
				setNotice({ message: t('Member saved; refresh failed. Retry loading members.'), error: true });
			}
		} catch (error) {
			setNotice({ message: error instanceof Error ? error.message : t('Member update failed'), error: true });
		} finally {
			lock.current = false;
			setBusy(false);
		}
	};
	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!selected || !form) return;
		const nick = form.memberNick.trim(),
			name = form.memberFullName.trim();
		if (
			nick.length < 3 ||
			nick.length > 12 ||
			((name || selected.memberFullName) && (name.length < 3 || name.length > 100))
		) {
			setNotice({ message: t('Nickname must be 3–12 characters; full name must be 3–100 characters.'), error: true });
			return;
		}
		const input: AdminMemberUpdate = {
			_id: selected._id,
			memberNick: nick,
			memberPhone: form.memberPhone.trim(),
			memberAddress: form.memberAddress.trim(),
			memberDesc: form.memberDesc.trim(),
		};
		if (name) input.memberFullName = name;
		if (form.memberType !== selected.memberType) input.memberType = form.memberType;
		if (input.memberType) setConfirmation(input);
		else void save(input);
	};
	const confirmBadgeChange = (input: AdminMemberUpdate) => {
		if (!badgeMenu || busy) return;
		setConfirmationMember(badgeMenu.member);
		setNotice(null);
		setConfirmation(input);
		setBadgeMenu(null);
	};
	const exportPage = () => {
		const rows = [
			['ID', 'Nickname', 'Full name', 'Phone', 'Role', 'Status', 'Warnings', 'Blocks', 'Joined date'],
			...members
				.filter((m) => !checkedIds.length || checkedIds.includes(m._id))
				.map((m) => [
					m._id,
					m.memberNick,
					m.memberFullName,
					m.memberPhone,
					m.memberType,
					m.memberStatus,
					m.memberWarnings,
					m.memberBlocks,
					m.createdAt,
				]),
		];
		const url = URL.createObjectURL(
			new Blob(['\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n')], {
				type: 'text/csv;charset=utf-8',
			}),
		);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `snowkr-members-page-${inquiry.page}.csv`;
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
		URL.revokeObjectURL(url);
	};
	const cards = [
		{ key: 'all' as const, label: 'Total members', Icon: GroupsOutlinedIcon },
		{ key: 'active' as const, label: 'Active riders', Icon: VerifiedUserOutlinedIcon },
		{ key: 'instructors' as const, label: 'Instructors', Icon: BadgeOutlinedIcon },
		{ key: 'blocked' as const, label: 'Restricted', Icon: BlockOutlinedIcon },
	];
	return (
		<div className="admin-members">
			<div className="admin-members-heading">
				<div>
					<h1>{t('Members')}</h1>
					<p>{t('Manage ski & snowboard enthusiasts, instructors, and system administrators.')}</p>
				</div>
				<div className="admin-members-heading-actions">
					<Button
						variant="outlined"
						startIcon={<FileDownloadOutlinedIcon />}
						onClick={exportPage}
						disabled={list.loading || !!list.error || !members.length}
					>
						{t(checkedIds.length ? 'Export selected' : 'Export current page')}
					</Button>
					<span title={t('Member invitations are not available yet.')}>
						<Button variant="contained" disabled startIcon={<PersonAddOutlinedIcon />}>
							{t('Add Member')}
						</Button>
					</span>
				</div>
			</div>
			{notice && (
				<Alert severity={notice.error ? 'error' : 'success'} onClose={() => setNotice(null)}>
					{notice.message}
				</Alert>
			)}
			<div className="admin-members-stats">
				{cards.map(({ key, label, Icon }) => (
					<div className={`admin-members-stat ${key}`} key={key}>
						<div>
							<span>{t(label)}</span>
							<strong>{summary.error || !summary.data ? '—' : summary.data[key].metaCounter[0]?.total || 0}</strong>
							<small>{t('Platform total')}</small>
						</div>
						<Icon />
					</div>
				))}
			</div>
			{summary.error && (
				<Alert severity="error" action={<Button onClick={() => void summary.refetch()}>{t('Retry')}</Button>}>
					{t('Unable to load member totals')}
				</Alert>
			)}
			<div className="admin-members-results">
				<div className="admin-members-tabs" role="group" aria-label={t('Member status')}>
					{['ALL', ...Object.values(MemberStatus)].map((status) => (
						<Button
							key={status}
							aria-pressed={(inquiry.search.memberStatus || 'ALL') === status}
							className={(inquiry.search.memberStatus || 'ALL') === status ? 'selected' : ''}
							onClick={() => filter({ memberStatus: status === 'ALL' ? undefined : (status as MemberStatus) })}
						>
							{t(status === 'ALL' ? 'All Members' : statusLabel(status))}
							<span className="admin-members-tab-count">
								{summary.error || !summary.data
									? '—'
									: summary.data[
											status === 'ALL'
												? 'all'
												: status === 'ACTIVE'
												? 'active'
												: status === 'BLOCK'
												? 'blocked'
												: 'archived'
									  ].metaCounter[0]?.total || 0}
							</span>
						</Button>
					))}
				</div>
				<form
					className="admin-members-filters"
					onSubmit={(event) => {
						event.preventDefault();
						filter({ text: searchText.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') });
					}}
				>
					<TextField
						size="small"
						placeholder={t('Search members by nickname...')}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon />
								</InputAdornment>
							),
						}}
						value={searchText}
						onChange={(event) => setSearchText(event.target.value)}
						inputProps={{ maxLength: 100, 'aria-label': t('Search nickname') }}
					/>
					<IconButton className="admin-members-search-submit" type="submit" aria-label={t('Search')}>
						<SearchIcon />
					</IconButton>
					<TextField
						select
						size="small"
						SelectProps={{ displayEmpty: true, inputProps: { 'aria-label': t('Role') } }}
						value={inquiry.search.memberType || 'ALL'}
						onChange={(event) =>
							filter({ memberType: event.target.value === 'ALL' ? undefined : (event.target.value as MemberType) })
						}
					>
						<MenuItem value="ALL">{t('All roles')}</MenuItem>
						{Object.values(MemberType).map((role) => (
							<MenuItem key={role} value={role}>
								{t(roleLabel(role))}
							</MenuItem>
						))}
					</TextField>
					<TextField
						select
						size="small"
						value={inquiry.search.memberStatus || 'ALL'}
						SelectProps={{ inputProps: { 'aria-label': t('Status') } }}
						onChange={(event) =>
							filter({ memberStatus: event.target.value === 'ALL' ? undefined : (event.target.value as MemberStatus) })
						}
					>
						<MenuItem value="ALL">{t('All statuses')}</MenuItem>
						{Object.values(MemberStatus).map((status) => (
							<MenuItem value={status} key={status}>
								{t(statusLabel(status))}
							</MenuItem>
						))}
					</TextField>
					<TextField
						select
						size="small"
						SelectProps={{ inputProps: { 'aria-label': t('Sort') } }}
						value={`${inquiry.sort}:${inquiry.direction}`}
						onChange={(event) => {
							const [sort, direction] = event.target.value.split(':');
							setInquiry((current) => ({ ...current, page: 1, sort, direction: direction as Direction }));
						}}
					>
						{[
							['createdAt:DESC', 'Newest'],
							['createdAt:ASC', 'Oldest'],
							['updatedAt:DESC', 'Recently updated'],
							['memberLikes:DESC', 'Most liked'],
							['memberViews:DESC', 'Most viewed'],
						].map(([value, label]) => (
							<MenuItem key={value} value={value}>
								{t(label)}
							</MenuItem>
						))}
					</TextField>
					<Button
						onClick={() => {
							setSearchText('');
							setInquiry(initialInquiry);
						}}
					>
						{t('Reset')}
					</Button>
				</form>
				{list.loading && <LinearProgress aria-label={t('Loading members')} />}
				{list.error ? (
					<Alert severity="error" action={<Button onClick={() => void list.refetch()}>{t('Retry')}</Button>}>
						{t('Unable to load members')}
					</Alert>
				) : !list.loading && !members.length ? (
					<div className="admin-members-empty">
						<GroupsOutlinedIcon />
						<h3>{t('No members found')}</h3>
						<p>{t('Try another nickname or reset the filters.')}</p>
					</div>
				) : (
					!list.loading && (
						<TableContainer>
							<Table aria-label={t('Members')} className="admin-members-table">
								<TableHead>
									<TableRow>
										<TableCell padding="checkbox">
											<Checkbox
												size="small"
												inputProps={{ 'aria-label': t('Select all members on this page') }}
												checked={members.length > 0 && checkedIds.length === members.length}
												indeterminate={checkedIds.length > 0 && checkedIds.length < members.length}
												onChange={(event) =>
													setCheckedIds(event.target.checked ? members.map((member) => member._id) : [])
												}
											/>
										</TableCell>
										{['Member', 'Contact info', 'Role', 'Status', 'Warnings & flags', 'Joined date', 'Actions'].map(
											(label) => (
												<TableCell key={label}>{t(label)}</TableCell>
											),
										)}
									</TableRow>
								</TableHead>
								<TableBody>
									{members.map((member) => (
										<TableRow
											key={member._id}
											hover
											className={`member-row-${member.memberStatus.toLowerCase()}`}
											selected={checkedIds.includes(member._id)}
										>
											<TableCell padding="checkbox">
												<Checkbox
													size="small"
													inputProps={{ 'aria-label': `${t('Select member')} ${member.memberNick}` }}
													checked={checkedIds.includes(member._id)}
													onChange={(event) =>
														setCheckedIds((current) =>
															event.target.checked
																? [...current, member._id]
																: current.filter((id) => id !== member._id),
														)
													}
												/>
											</TableCell>
											<TableCell>
												<button className="admin-member-identity" onClick={() => open(member)}>
													<Avatar src={imageUrl(member)} alt={member.memberNick} />
													<span>
														<strong>{member.memberNick}</strong>
														<small>{member.memberFullName || `@${member.memberNick}`}</small>
													</span>
												</button>
											</TableCell>
											<TableCell>
												<span className="admin-member-contact">
													{member.memberPhone || '—'}
													<small title={member._id}>{member._id}</small>
												</span>
											</TableCell>
											<TableCell>
												<Chip
													size="small"
													className={`member-role ${member.memberType.toLowerCase()}`}
													label={t(roleLabel(member.memberType))}
													component="button"
													type="button"
													disabled={busy}
													aria-label={`${t('Role')} ${member.memberNick}`}
													aria-haspopup="menu"
													aria-expanded={badgeMenu?.member._id === member._id && badgeMenu.field === 'role'}
													onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
														setBadgeMenu({ anchor: event.currentTarget, member, field: 'role' })
													}
												/>
											</TableCell>
											<TableCell>
												<Chip
													size="small"
													className={`member-status ${member.memberStatus.toLowerCase()}`}
													label={t(statusLabel(member.memberStatus))}
													component="button"
													type="button"
													disabled={busy}
													aria-label={`${t('Status')} ${member.memberNick}`}
													aria-haspopup="menu"
													aria-expanded={badgeMenu?.member._id === member._id && badgeMenu.field === 'status'}
													onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
														setBadgeMenu({ anchor: event.currentTarget, member, field: 'status' })
													}
												/>
											</TableCell>
											<TableCell>
												<span className={member.memberWarnings ? 'member-warning' : ''}>
													{t('Warnings')}: {member.memberWarnings}
												</span>
												<small className="member-blocks">
													{t('Blocks')}: {member.memberBlocks}
												</small>
											</TableCell>
											<TableCell>{dateLabel(member.createdAt)}</TableCell>
											<TableCell>
												<IconButton
													size="small"
													onClick={() => open(member)}
													aria-label={`${t('Manage member')} ${member.memberNick}`}
												>
													<MoreVertIcon />
												</IconButton>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)
				)}
				<TablePagination
					component="div"
					count={total}
					page={Math.max(0, Math.min(inquiry.page - 1, Math.ceil(total / inquiry.limit) - 1))}
					rowsPerPage={inquiry.limit}
					rowsPerPageOptions={[10, 20, 40, 60]}
					onPageChange={(_, page) => setInquiry((current) => ({ ...current, page: page + 1 }))}
					onRowsPerPageChange={(event) =>
						setInquiry((current) => ({ ...current, page: 1, limit: Number(event.target.value) }))
					}
					labelRowsPerPage={t('Rows per page')}
				/>
			</div>
			<Menu
				anchorEl={badgeMenu?.anchor}
				open={!!badgeMenu}
				onClose={() => setBadgeMenu(null)}
				MenuListProps={{ 'aria-label': t(badgeMenu?.field === 'role' ? 'Role' : 'Status') }}
			>
				{badgeMenu?.field === 'role' &&
					(badgeMenu.member.memberType === MemberType.INSTRUCTOR
						? [
								<MenuItem key="instructor" disabled>
									{t('Instructor roles are managed through instructor applications.')}
								</MenuItem>,
								<MenuItem
									key="applications"
									component={Link}
									href="/_admin/instructor-applications"
									onClick={() => setBadgeMenu(null)}
								>
									{t('Instructor applications')}
								</MenuItem>,
						  ]
						: [MemberType.USER, MemberType.ADMIN].map((role) => (
								<MenuItem
									key={role}
									disabled={busy || role === badgeMenu.member.memberType}
									onClick={() => confirmBadgeChange({ _id: badgeMenu.member._id, memberType: role })}
								>
									{t(roleLabel(role))}
								</MenuItem>
						  )))}
				{badgeMenu?.field === 'status' &&
					Object.values(MemberStatus).map((status) => (
						<MenuItem
							key={status}
							disabled={busy || status === badgeMenu.member.memberStatus}
							onClick={() => confirmBadgeChange({ _id: badgeMenu.member._id, memberStatus: status })}
						>
							{t(statusLabel(status))}
						</MenuItem>
					))}
			</Menu>
			<Drawer
				anchor="right"
				open={!!selected}
				onClose={() => {
					if (!busy) setSelected(null);
				}}
				PaperProps={{ className: 'admin-member-drawer' }}
			>
				{selected && form && (
					<>
						<div className="admin-member-drawer-heading">
							<h2>{t('Member details')}</h2>
							<IconButton disabled={busy} aria-label={t('Close')} onClick={() => setSelected(null)}>
								<CloseIcon />
							</IconButton>
						</div>
						<div className="admin-member-drawer-body">
							{notice?.error && <Alert severity="error">{notice.message}</Alert>}
							<div className="admin-member-profile">
								<Avatar src={imageUrl(selected)} alt={selected.memberNick} />
								<h2>{selected.memberFullName || selected.memberNick}</h2>
								<p>@{selected.memberNick}</p>
								<Chip label={t(roleLabel(selected.memberType))} />
								<Chip
									className={`member-status ${selected.memberStatus.toLowerCase()}`}
									label={t(statusLabel(selected.memberStatus))}
								/>
							</div>
							{editing ? (
								<form onSubmit={submit} className="admin-member-edit">
									{(['memberNick', 'memberFullName', 'memberPhone', 'memberAddress', 'memberDesc'] as const).map(
										(field, index) => (
											<TextField
												key={field}
												label={t(['Nickname', 'Full name', 'Phone', 'Address', 'Description'][index])}
												value={form[field]}
												required={field === 'memberNick'}
												multiline={field === 'memberDesc'}
												inputProps={{
													maxLength: field === 'memberNick' ? 12 : field === 'memberFullName' ? 100 : undefined,
												}}
												disabled={busy}
												onChange={(event) => setForm({ ...form, [field]: event.target.value })}
											/>
										),
									)}
									<TextField
										select
										label={t('Role')}
										value={form.memberType}
										disabled={busy || selected.memberType === MemberType.INSTRUCTOR}
										onChange={(event) => setForm({ ...form, memberType: event.target.value as MemberType })}
									>
										{(selected.memberType === MemberType.INSTRUCTOR
											? [MemberType.INSTRUCTOR]
											: [MemberType.USER, MemberType.ADMIN]
										).map((role) => (
											<MenuItem key={role} value={role}>
												{t(roleLabel(role))}
											</MenuItem>
										))}
									</TextField>
									<p>{t('Instructor roles are managed through instructor applications.')}</p>
									<Button component={Link} href="/_admin/instructor-applications">
										{t('Instructor applications')}
									</Button>
									<Button disabled={busy} type="submit" variant="contained">
										{t('Save changes')}
									</Button>
									<Button disabled={busy} onClick={() => open(selected)}>
										{t('Cancel')}
									</Button>
								</form>
							) : (
								<>
									<dl>
										{[
											[t('Member ID'), selected._id],
											[t('Phone'), selected.memberPhone || '—'],
											[t('Address'), selected.memberAddress || '—'],
											[t('Joined date'), dateLabel(selected.createdAt)],
											[t('Warnings'), selected.memberWarnings],
											[t('Blocks'), selected.memberBlocks],
											[t('Articles'), selected.memberArticles],
											[t('Likes'), selected.memberLikes],
											[t('Views'), selected.memberViews],
										].map(([label, value]) => (
											<div key={label}>
												<dt>{label}</dt>
												<dd>{value}</dd>
											</div>
										))}
									</dl>
									{selected.memberDesc && <p>{selected.memberDesc}</p>}
									<Button disabled={busy} variant="outlined" onClick={() => setEditing(true)}>
										{t('Edit member information')}
									</Button>
									<div className="admin-member-status-actions">
										{Object.values(MemberStatus)
											.filter((status) => status !== selected.memberStatus)
											.map((status) => (
												<Button
													key={status}
													disabled={busy}
													color={status === MemberStatus.ACTIVE ? 'primary' : 'error'}
													onClick={() => setConfirmation({ _id: selected._id, memberStatus: status })}
												>
													{t(
														status === MemberStatus.ACTIVE
															? 'Restore access'
															: status === MemberStatus.BLOCK
															? 'Block member'
															: 'Archive member',
													)}
												</Button>
											))}
									</div>
								</>
							)}
						</div>
					</>
				)}
			</Drawer>
			<Dialog
				open={!!confirmation}
				onClose={() => {
					if (!busy) setConfirmation(null);
				}}
			>
				<DialogTitle>{t('Confirm member change')}</DialogTitle>
				<DialogContent>
					<p>{confirmationMember?.memberNick || selected?.memberNick}</p>
					<p>
						{confirmation?.memberType
							? `${t('Role')}: ${t(roleLabel(confirmation.memberType))}`
							: `${t('Status')}: ${t(statusLabel(confirmation?.memberStatus || ''))}`}
					</p>
					<p>{t('This updates the member account. Continue?')}</p>
					{notice?.error && <Alert severity="error">{notice.message}</Alert>}
				</DialogContent>
				<DialogActions>
					<Button disabled={busy} onClick={() => setConfirmation(null)}>
						{t('Cancel')}
					</Button>
					<Button
						variant="contained"
						disabled={busy}
						onClick={() => {
							if (confirmation) void save(confirmation);
						}}
					>
						{t('Confirm')}
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}
