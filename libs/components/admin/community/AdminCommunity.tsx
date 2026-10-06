import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useApolloClient, useMutation } from '@apollo/client';
import {
	Alert,
	Avatar,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Drawer,
	IconButton,
	Pagination,
	TextField,
	Tooltip,
} from '@mui/material';
import ForumOutlined from '@mui/icons-material/ForumOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import Add from '@mui/icons-material/Add';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import RestartAlt from '@mui/icons-material/RestartAlt';
import Close from '@mui/icons-material/Close';
import { useTranslation } from 'next-i18next';
import { ADMIN_COMMUNITY_ARTICLES } from '../../../../apollo/admin/community';
import { UPDATE_BOARD_ARTICLE_BY_ADMIN } from '../../../../apollo/admin/mutation';
import { BoardArticle } from '../../../types/board-article/board-article';
import { BoardArticleStatus, BoardArticleCategory } from '../../../enums/board-article.enum';
import { Direction } from '../../../enums/common.enum';
import { REACT_APP_API_URL } from '../../../config';
import { communityCategories } from '../../community/CommunityPost';
import { articleExcerpt, communityCsv, CommunityBatch, loadCommunityCatalog } from './communityCatalog';

const imageUrl = (path: string) =>
	/^https?:\/\//i.test(path) ? path : `${REACT_APP_API_URL}/${path.replace(/^\//, '')}`;

function ArticleCard({
	article,
	busy,
	details,
	edit,
	archive,
}: {
	article: BoardArticle;
	busy: boolean;
	details: () => void;
	edit: () => void;
	archive: () => void;
}) {
	const { t, i18n } = useTranslation('common');
	const [failedImage, setFailedImage] = useState(false);
	useEffect(() => setFailedImage(false), [article.articleImage]);
	const deleted = article.articleStatus === BoardArticleStatus.DELETE;
	const author = article.memberData?.memberFullName || article.memberData?.memberNick || String(t('Member'));
	const badge = (
		<span className={`ac-status ${deleted ? 'is-deleted' : ''}`}>{deleted ? t('Deleted') : t('Active')}</span>
	);
	return (
		<article className={`ac-card ${deleted ? 'is-deleted' : ''}`}>
			{article.articleImage && !failedImage && (
				<div className="ac-cover">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={imageUrl(article.articleImage)}
						alt={article.articleTitle}
						loading="lazy"
						onError={() => setFailedImage(true)}
					/>
					{badge}
					<span className="ac-photo-count">1 / 1</span>
				</div>
			)}
			<div className="ac-card-body">
				<div className="ac-card-labels">
					<span className="ac-category">{t(communityCategories[article.articleCategory])}</span>
					{(!article.articleImage || failedImage) && badge}
					<small title={article._id}>#{article._id.slice(-8)}</small>
				</div>
				<h2>{article.articleTitle}</h2>
				<div className="ac-author">
					<Link href={{ pathname: '/member', query: { memberId: article.memberId } }}>
						<Avatar
							src={article.memberData?.memberImage ? imageUrl(article.memberData.memberImage) : undefined}
							alt={author}
						>
							{author.slice(0, 2).toUpperCase()}
						</Avatar>
						{author}
					</Link>
					<span>·</span>
					<time dateTime={new Date(article.createdAt).toISOString()}>
						{new Date(article.createdAt).toLocaleDateString(i18n.language === 'kr' ? 'ko-KR' : i18n.language, {
							month: 'short',
							day: 'numeric',
							year: 'numeric',
						})}
					</time>
					<small title={article.memberId}>
						· {t('Member ID')}: #{article.memberId.slice(-6)}
					</small>
				</div>
				<p className="ac-excerpt">{articleExcerpt(article.articleContent)}</p>
				<div className="ac-engagement">
					<span title={t('Views')}>
						<VisibilityOutlined />
						{article.articleViews.toLocaleString()}
					</span>
					<span title={t('Likes')}>
						<FavoriteBorder />
						{article.articleLikes.toLocaleString()}
					</span>
					<span title={t('Comments')}>
						<ChatBubbleOutline />
						{article.articleComments.toLocaleString()}
					</span>
					<small>{t(communityCategories[article.articleCategory])}</small>
				</div>
				<footer>
					<Button size="small" startIcon={<VisibilityOutlined />} onClick={details}>
						{t('View Details')}
					</Button>
					{!deleted ? (
						<>
							<Button size="small" startIcon={<EditOutlined />} disabled={busy} onClick={edit}>
								{t('Edit')}
							</Button>
							<Button
								className="ac-delete"
								size="small"
								color="error"
								startIcon={<DeleteOutline />}
								disabled={busy}
								onClick={archive}
							>
								{t('Delete')}
							</Button>
						</>
					) : (
						<Tooltip title={t('The backend does not support restoring deleted posts.')}>
							<span>
								<Button size="small" disabled>
									{t('Restore Post')}
								</Button>
							</span>
						</Tooltip>
					)}
				</footer>
			</div>
		</article>
	);
}

export default function AdminCommunity() {
	const { t } = useTranslation('common');
	const client = useApolloClient();
	const [articles, setArticles] = useState<BoardArticle[]>([]);
	const [loading, setLoading] = useState(true),
		[error, setError] = useState('');
	const [text, setText] = useState(''),
		[category, setCategory] = useState(''),
		[status, setStatus] = useState(''),
		[sort, setSort] = useState('newest'),
		[page, setPage] = useState(1);
	const [selected, setSelected] = useState<BoardArticle | null>(null),
		[editing, setEditing] = useState<BoardArticle | null>(null);
	const [title, setTitle] = useState(''),
		[content, setContent] = useState(''),
		[saveError, setSaveError] = useState(''),
		[saving, setSaving] = useState(false);
	const [update] = useMutation(UPDATE_BOARD_ARTICLE_BY_ADMIN);
	const generation = useRef(0),
		lock = useRef(false);
	const refresh = useCallback(async () => {
		const request = ++generation.current;
		setLoading(true);
		setError('');
		try {
			const result = await loadCommunityCatalog(
				async (batchPage) => {
					const response = await client.query<{ getAllBoardArticlesByAdmin: CommunityBatch }>({
						query: ADMIN_COMMUNITY_ARTICLES,
						variables: {
							input: { page: batchPage, limit: 100, sort: 'createdAt', direction: Direction.DESC, search: {} },
						},
						fetchPolicy: 'network-only',
					});
					return response.data.getAllBoardArticlesByAdmin;
				},
				() => generation.current === request,
			);
			if (generation.current === request) setArticles(result);
		} catch (err) {
			if (generation.current === request)
				setError(err instanceof Error ? err.message : t('Unable to load community posts'));
		} finally {
			if (generation.current === request) setLoading(false);
		}
	}, [client, t]);
	useEffect(() => {
		void refresh();
		return () => {
			generation.current++;
		};
	}, [refresh]);
	const search = text.trim().toLocaleLowerCase();
	const filtered = articles
		.filter(
			(article) =>
				(!category || article.articleCategory === category) &&
				(!status || article.articleStatus === status) &&
				(!search ||
					[article.articleTitle, article.memberData?.memberNick, article.memberData?.memberFullName].some((value) =>
						value?.toLocaleLowerCase().includes(search),
					)),
		)
		.sort((a, b) =>
			sort === 'views'
				? b.articleViews - a.articleViews
				: sort === 'likes'
				? b.articleLikes - a.articleLikes
				: sort === 'oldest'
				? +new Date(a.createdAt) - +new Date(b.createdAt)
				: +new Date(b.createdAt) - +new Date(a.createdAt),
		);
	const pages = Math.max(1, Math.ceil(filtered.length / 4));
	useEffect(() => {
		if (page > pages) setPage(pages);
	}, [page, pages]);
	const currentPage = Math.min(page, pages),
		visible = filtered.slice((currentPage - 1) * 4, currentPage * 4);
	const active = articles.filter((a) => a.articleStatus === BoardArticleStatus.ACTIVE).length;
	const deleted = articles.filter((a) => a.articleStatus === BoardArticleStatus.DELETE).length;
	const comments = articles.reduce((sum, a) => sum + a.articleComments, 0);
	const ready = !loading && !error,
		busy = saving || !ready;
	const openEdit = (article: BoardArticle) => {
		setEditing(article);
		setTitle(article.articleTitle);
		setContent(article.articleContent);
		setSaveError('');
	};
	const save = async () => {
		if (lock.current || !editing) return;
		if (
			title.trim().length < 3 ||
			title.trim().length > 50 ||
			content.trim().length < 3 ||
			content.length > 250 ||
			!articleExcerpt(content)
		) {
			setSaveError(t('Use 3–50 characters for the title and 3–250 for the content.'));
			return;
		}
		lock.current = true;
		setSaving(true);
		setSaveError('');
		try {
			await update({ variables: { input: { _id: editing._id, articleTitle: title.trim(), articleContent: content } } });
			setEditing(null);
			setSelected(null);
			await refresh();
		} catch (err) {
			setSaveError(err instanceof Error ? err.message : t('Unable to save article'));
		} finally {
			lock.current = false;
			setSaving(false);
		}
	};
	const archive = async (article: BoardArticle) => {
		if (
			lock.current ||
			!window.confirm(t('Delete this post and hide it from the public community? This backend cannot restore it.'))
		)
			return;
		lock.current = true;
		setSaving(true);
		setError('');
		try {
			await update({ variables: { input: { _id: article._id, articleStatus: BoardArticleStatus.DELETE } } });
			setSelected(null);
			await refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : t('Unable to save article'));
		} finally {
			lock.current = false;
			setSaving(false);
		}
	};
	const exportLog = () => {
		const url = URL.createObjectURL(new Blob(['\uFEFF' + communityCsv(filtered)], { type: 'text/csv;charset=utf-8' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = 'community-posts.csv';
		link.click();
		URL.revokeObjectURL(url);
	};
	const stats = [
		{
			label: 'Total Posts',
			value: articles.length,
			note: t('All community posts'),
			Icon: ForumOutlined,
			progress: 100,
		},
		{
			label: 'Active Posts',
			value: active,
			note: `${articles.length ? ((active / articles.length) * 100).toFixed(1) : '0'}% ${t('public')}`,
			Icon: CheckCircleOutline,
			progress: articles.length ? (active / articles.length) * 100 : 0,
		},
		{
			label: 'Deleted / Archived',
			value: deleted,
			note: t('Moderated / Hidden'),
			Icon: DeleteOutline,
			progress: articles.length ? (deleted / articles.length) * 100 : 0,
		},
		{
			label: 'Total Comments',
			value: comments,
			note: `${articles.length ? (comments / articles.length).toFixed(1) : '0'} ${t('avg / post')}`,
			Icon: ChatBubbleOutline,
			progress: 100,
		},
	];
	return (
		<section className="admin-community">
			<div className="ac-heading">
				<div>
					<div className="ac-breadcrumb">
						{t('Console')} <span>›</span> <b>{t('Community Management')}</b>
					</div>
					<h1>{t('Community')}</h1>
					<p>{t('Manage community articles, categories, status, engagement metrics, and thread moderation.')}</p>
				</div>
				<div className="ac-heading-actions">
					<Button onClick={exportLog} disabled={!ready || !filtered.length} startIcon={<DownloadOutlined />}>
						{t('Export Log')}
					</Button>
					<Link href="/community/create" className="ac-primary">
						<Add />
						{t('Create Post')}
					</Link>
				</div>
			</div>
			<div className="ac-summary">
				{stats.map(({ label, value, note, Icon, progress }, index) => (
					<div className={`ac-stat ac-stat-${index}`} key={label}>
						<div>
							<small>{t(label)}</small>
							<Icon />
						</div>
						<div>
							<strong>{ready ? value.toLocaleString() : '—'}</strong>
							<span>{ready ? note : t('Loading...')}</span>
						</div>
						<div className="ac-progress">
							<span style={{ width: ready ? `${progress}%` : '0%' }} />
						</div>
					</div>
				))}
			</div>
			<p className="ac-counter-note">
				{t('Comment totals use stored article counters. Deleted comments may still be included.')}
			</p>
			<div className="ac-tabs-row">
				<div className="ac-tabs" role="group" aria-label={t('Post status')}>
					{[
						['', 'All', articles.length],
						[BoardArticleStatus.ACTIVE, 'Active', active],
						[BoardArticleStatus.DELETE, 'Deleted', deleted],
					].map(([value, label, count]) => (
						<button
							key={value}
							className={status === value ? 'is-active' : ''}
							aria-pressed={status === value}
							onClick={() => {
								setStatus(String(value));
								setPage(1);
							}}
						>
							{t(String(label))}
							<span>{ready ? count : '—'}</span>
						</button>
					))}
				</div>
				<small>
					{ready
						? t('Showing {{shown}} of {{total}} articles', { shown: visible.length, total: filtered.length })
						: t('Loading...')}
				</small>
			</div>
			<div className="ac-filters">
				<label className="ac-search">
					<SearchOutlined />
					<input
						aria-label={t('Search posts by title or author')}
						placeholder={t('Search posts by title or author...')}
						value={text}
						onChange={(e) => {
							setText(e.target.value);
							setPage(1);
						}}
					/>
				</label>
				<select
					aria-label={t('Category')}
					value={category}
					onChange={(e) => {
						setCategory(e.target.value);
						setPage(1);
					}}
				>
					<option value="">{t('All Categories')}</option>
					{Object.values(BoardArticleCategory).map((value) => (
						<option value={value} key={value}>
							{t(communityCategories[value])}
						</option>
					))}
				</select>
				<select
					aria-label={t('Status')}
					value={status}
					onChange={(e) => {
						setStatus(e.target.value);
						setPage(1);
					}}
				>
					<option value="">{t('All Status')}</option>
					<option value="ACTIVE">{t('Active')}</option>
					<option value="DELETE">{t('Deleted')}</option>
				</select>
				<select
					aria-label={t('Sort posts')}
					value={sort}
					onChange={(e) => {
						setSort(e.target.value);
						setPage(1);
					}}
				>
					{[
						['newest', 'Newest First'],
						['oldest', 'Oldest First'],
						['views', 'Most Viewed'],
						['likes', 'Most Liked'],
					].map(([value, label]) => (
						<option value={value} key={value}>
							{t(label)}
						</option>
					))}
				</select>
				<Button
					startIcon={<RestartAlt />}
					onClick={() => {
						setText('');
						setCategory('');
						setStatus('');
						setSort('newest');
						setPage(1);
					}}
				>
					{t('Reset')}
				</Button>
			</div>
			{error && (
				<Alert
					severity="error"
					action={
						<Button disabled={saving} onClick={() => void refresh()}>
							{t('Retry')}
						</Button>
					}
				>
					{error}
				</Alert>
			)}
			{loading && (
				<div className="ac-empty" role="status">
					{t('Loading community posts...')}
				</div>
			)}
			{ready &&
				(!visible.length ? (
					<div className="ac-empty">{t('No community posts match these filters.')}</div>
				) : (
					<div className="ac-grid">
						{visible.map((article) => (
							<ArticleCard
								key={article._id}
								article={article}
								busy={busy}
								details={() => setSelected(article)}
								edit={() => openEdit(article)}
								archive={() => void archive(article)}
							/>
						))}
					</div>
				))}
			{ready && (
				<div className="ac-pagination">
					<span>
						{t('Showing {{start}} to {{end}} of {{total}} articles', {
							start: filtered.length ? (currentPage - 1) * 4 + 1 : 0,
							end: Math.min(currentPage * 4, filtered.length),
							total: filtered.length,
						})}
					</span>
					<Pagination
						count={pages}
						page={currentPage}
						shape="rounded"
						color="primary"
						onChange={(_, value) => setPage(value)}
					/>
				</div>
			)}
			<Drawer anchor="right" open={Boolean(selected)} onClose={() => setSelected(null)}>
				<div className="ac-details">
					<header>
						<h2>{t('Post Details')}</h2>
						<IconButton aria-label={t('Close')} onClick={() => setSelected(null)}>
							<Close />
						</IconButton>
					</header>
					{selected && (
						<>
							<span className="ac-category">{t(communityCategories[selected.articleCategory])}</span>
							<h2>{selected.articleTitle}</h2>
							<p className="ac-detail-content">{articleExcerpt(selected.articleContent)}</p>
							<dl>
								{[
									['Article ID', selected._id],
									['Member ID', selected.memberId],
									['Status', t(selected.articleStatus === 'ACTIVE' ? 'Active' : 'Deleted')],
									['Views', selected.articleViews],
									['Likes', selected.articleLikes],
									['Comments', selected.articleComments],
									['Created', new Date(selected.createdAt).toLocaleString()],
									['Updated', new Date(selected.updatedAt).toLocaleString()],
								].map(([label, value]) => (
									<div key={label}>
										<dt>{t(String(label))}</dt>
										<dd>{value}</dd>
									</div>
								))}
							</dl>
							{selected.articleStatus === BoardArticleStatus.ACTIVE ? (
								<>
									<Link
										className="ac-primary"
										href={{
											pathname: '/community/detail',
											query: { id: selected._id, articleCategory: selected.articleCategory },
										}}
									>
										{t('Open Public Post')}
									</Link>
									<Button disabled={busy} onClick={() => openEdit(selected)} startIcon={<EditOutlined />}>
										{t('Edit')}
									</Button>
								</>
							) : (
								<Alert severity="info">{t('The backend does not support restoring deleted posts.')}</Alert>
							)}
						</>
					)}
				</div>
			</Drawer>
			<Dialog
				open={Boolean(editing)}
				onClose={() => {
					if (!saving) setEditing(null);
				}}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>{t('Edit Post')}</DialogTitle>
				<DialogContent>
					<form
						id="admin-community-edit"
						onSubmit={(e) => {
							e.preventDefault();
							void save();
						}}
						className="ac-edit-form"
					>
						{saveError && <Alert severity="error">{saveError}</Alert>}
						<TextField
							label={t('Title')}
							value={title}
							disabled={saving}
							onChange={(e) => setTitle(e.target.value)}
							inputProps={{ maxLength: 50 }}
							helperText={`${title.length} / 50`}
						/>
						<TextField
							label={t('Content')}
							value={content}
							disabled={saving}
							onChange={(e) => setContent(e.target.value)}
							multiline
							minRows={5}
							helperText={`${content.length} / 250`}
						/>
					</form>
				</DialogContent>
				<DialogActions>
					<Button disabled={saving} onClick={() => setEditing(null)}>
						{t('Cancel')}
					</Button>
					<Button form="admin-community-edit" type="submit" disabled={saving}>
						{t(saving ? 'Saving...' : 'Save Changes')}
					</Button>
				</DialogActions>
			</Dialog>
		</section>
	);
}
