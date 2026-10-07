import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import type { Editor } from '@toast-ui/react-editor';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation } from '@apollo/client';
import { Alert, Button } from '@mui/material';
import { useTranslation } from 'next-i18next';
import CategoryOutlined from '@mui/icons-material/CategoryOutlined';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import CloseRounded from '@mui/icons-material/CloseRounded';
import SendOutlined from '@mui/icons-material/SendOutlined';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import axios from 'axios';
import { CREATE_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { BoardArticleInput } from '../../types/board-article/board-article.input';
import { getJwtToken } from '../../auth';
import useMemberSession from '../../hooks/useMemberSession';
import { communityCategories } from './CommunityPost';
import type { ArticleContentEditorProps } from './Teditor';

const TuiEditor = dynamic<ArticleContentEditorProps>(
	() => import('./Teditor').then((module) => module.ArticleContentEditor),
	{ ssr: false },
);
const TViewer = dynamic(() => import('./TViewer'), { ssr: false });

export default function CreatePost() {
	const { t } = useTranslation('common');
	const router = useRouter();
	const { user, ready } = useMemberSession();
	const [category, setCategory] = useState<BoardArticleCategory | ''>('');
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [showPreview, setShowPreview] = useState(false);
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState('');
	const [failedPreview, setFailedPreview] = useState(false);
	const [failure, setFailure] = useState('');
	const [imageFailure, setImageFailure] = useState('');
	const [attempted, setAttempted] = useState(false);
	const [pending, setPending] = useState(false);
	const [published, setPublished] = useState('');
	const lock = useRef(false);
	const uploaded = useRef<{ file: File; path: string } | null>(null);
	const fileInput = useRef<HTMLInputElement>(null);
	const editorRef = useRef<Editor>(null);
	const categoryInput = useRef<HTMLSelectElement>(null);
	const titleInput = useRef<HTMLInputElement>(null);
	const [create] = useMutation<{ createBoardArticle: { _id: string } }, { input: BoardArticleInput }>(
		CREATE_BOARD_ARTICLE,
	);
	const busy = pending || Boolean(published);
	const validTitle = title.trim().length >= 3 && title.trim().length <= 50;
	const validContent =
		content.length >= 3 &&
		content.length <= 250 &&
		Boolean(
			content
				.replace(/<[^>]+>/g, '')
				.replace(/&nbsp;/g, ' ')
				.trim(),
		);
	useEffect(() => {
		if (ready && !user._id) void router.replace('/account/join?referrer=%2Fcommunity%2Fcreate');
	}, [ready, user._id, router]);
	useEffect(() => {
		if (!file) {
			setPreview('');
			return;
		}
		const url = URL.createObjectURL(file);
		setPreview(url);
		setFailedPreview(false);
		return () => URL.revokeObjectURL(url);
	}, [file]);
	const choose = (files: FileList | null) => {
		if (busy || !files?.length) return;
		if (files.length !== 1) {
			setImageFailure(t('Choose one cover image.'));
			return;
		}
		const next = files[0];
		if (!['image/jpeg', 'image/jpg', 'image/png'].includes(next.type) || !/\.(jpe?g|png)$/i.test(next.name)) {
			setImageFailure(t('Choose a JPG or PNG image.'));
			return;
		}
		if (next.size > 10 * 1024 * 1024 || next.size === 0) {
			setImageFailure(t('Choose an image up to 10 MB.'));
			return;
		}
		uploaded.current = null;
		setFile(next);
		setImageFailure('');
	};
	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (lock.current || busy || !ready || !user._id) return;
		setAttempted(true);
		if (!category || !validTitle || !validContent) {
			if (!category) categoryInput.current?.focus();
			else if (!validTitle) titleInput.current?.focus();
			else editorRef.current?.getInstance().focus();
			return;
		}
		lock.current = true;
		setPending(true);
		setFailure('');
		try {
			let image = '';
			if (file) {
				if (uploaded.current?.file === file) image = uploaded.current.path;
				else {
					const form = new FormData();
					form.append(
						'operations',
						JSON.stringify({
							query:
								'mutation ImageUploader($file: Upload!, $target: String!) { imageUploader(file: $file, target: $target) }',
							variables: { file: null, target: 'articles' },
						}),
					);
					form.append('map', JSON.stringify({ '0': ['variables.file'] }));
					form.append('0', file);
					const response = await axios.post<{ data?: { imageUploader: string }; errors?: { message: string }[] }>(
						String(process.env.REACT_APP_API_GRAPHQL_URL),
						form,
						{ headers: { Authorization: `Bearer ${getJwtToken()}`, 'apollo-require-preflight': 'true' } },
					);
					const path = response.data.data?.imageUploader;
					if (!path || response.data.errors?.length) throw new Error(t('Upload failed'));
					image = path;
					uploaded.current = { file, path };
				}
			}
			// The backend derives the author from the authenticated member.
			const result = await create({
				variables: {
					input: {
						articleCategory: category,
						articleTitle: title.trim(),
						articleContent: content,
						articleImage: image,
					},
				},
			});
			const id = result.data?.createBoardArticle._id;
			if (!id) throw new Error(t('Unable to save article'));
			setPublished(id);
			await router.push('/community/detail?id=' + id);
		} catch (error) {
			setFailure(error instanceof Error ? error.message : t('Unable to save article'));
		} finally {
			lock.current = false;
			setPending(false);
		}
	};
	if (!ready || !user._id)
		return (
			<div className="community-create" role="status">
				{t('Loading')}
			</div>
		);
	return (
		<div className="community-create">
			<Head>
				<title>{t('Create a Post')} | SNOWAY</title>
			</Head>
			<nav className="create-breadcrumb" aria-label={t('Breadcrumb')}>
				<Link href="/">
					<HomeOutlined />
					{t('Home')}
				</Link>
				<ChevronRightRounded />
				<Link href="/community">{t('Community')}</Link>
				<ChevronRightRounded />
				<span aria-current="page">{t('Create a Post')}</span>
			</nav>
			<div className="create-container">
				<header className="create-heading">
					<div>
						<div className="create-eyebrow">
							<span>01</span> SNOWAY {t('Board')}
						</div>
						<h1>{t('Create a Post')}</h1>
						<p>{t('Share your experience, question, news, review, or useful tips with the SNOWAY community.')}</p>
					</div>
					<div className="create-author">
						<span className="create-avatar">{user.memberNick.slice(0, 2).toUpperCase()}</span>
						<div>
							<small>{t('Author')}</small>
							<strong>{user.memberNick}</strong>
						</div>
					</div>
				</header>
				<form className="create-form" onSubmit={submit} noValidate aria-busy={pending}>
					<fieldset disabled={busy}>
						<div className="create-field">
							<div className="create-label">
								<label htmlFor="post-category">
									{t('Category')} <b>*</b>
								</label>
								<small>{t('Select standard board section')}</small>
							</div>
							<div className="create-select">
								<CategoryOutlined />
								<select
									ref={categoryInput}
									id="post-category"
									required
									value={category}
									aria-invalid={attempted && !category}
									aria-describedby={attempted && !category ? 'category-error' : undefined}
									onChange={(e) => setCategory(e.target.value as BoardArticleCategory | '')}
								>
									<option value="" disabled>
										{t('Select a category')}
									</option>
									{Object.values(BoardArticleCategory).map((value) => (
										<option key={value} value={value}>
											{t(communityCategories[value])}
										</option>
									))}
								</select>
							</div>
							{attempted && !category && (
								<small id="category-error" className="create-error">
									{t('Select a category.')}
								</small>
							)}
						</div>
						<div className="create-field">
							<div className="create-label">
								<label htmlFor="post-title">
									{t('Post Title')} <b>*</b>
								</label>
								<small>{title.length}/50</small>
							</div>
							<input
								ref={titleInput}
								id="post-title"
								required
								minLength={3}
								maxLength={50}
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder={t('Enter a clear, descriptive title...')}
								aria-invalid={attempted && !validTitle}
								aria-describedby="title-hint"
							/>
							<small id="title-hint" className={attempted && !validTitle ? 'create-error' : ''}>
								{t('Title must be 3–50 characters.')}
							</small>
						</div>
						<div className="create-field">
							<div className="create-label">
								<label id="content-label">
									{t('Content')} <b>*</b>
								</label>
								<small>{t('Rich text editor')}</small>
							</div>
							<div
								className="create-editor"
								id="post-content"
								role="group"
								aria-labelledby="content-label"
								aria-describedby="content-hint"
								aria-invalid={attempted && !validContent}
							>
								<TuiEditor editorRef={editorRef} onChange={setContent} disabled={busy} />
							</div>
							<div className="create-label">
								<small id="content-hint" className={attempted && !validContent ? 'create-error' : ''}>
									{t('HTML content must be 3–250 characters.')}
								</small>
								<small>{content.length}/250</small>
							</div>
							<Button type="button" className="create-preview-toggle" onClick={() => setShowPreview((value) => !value)}>
								{t(showPreview ? 'Hide preview' : 'Preview post')}
							</Button>
							{showPreview && (
								<section className="create-content-preview" aria-label={t('Post preview')}>
									<TViewer markdown={content} />
								</section>
							)}
						</div>
						<div className="create-field">
							<div className="create-label">
								<label htmlFor="post-image">
									{t('Add Image')} <small>({t('Optional')})</small>
								</label>
								<small>{file ? '1' : '0'}/1</small>
							</div>
							<small id="image-hint">{t('Upload one cover image (JPG or PNG). Max 10 MB.')}</small>
							<input
								ref={fileInput}
								id="post-image"
								className="create-file-input"
								type="file"
								accept="image/jpeg,image/png,image/jpg"
								onChange={(e) => {
									choose(e.target.files);
									e.target.value = '';
								}}
								tabIndex={-1}
							/>
							<button
								type="button"
								className="create-dropzone"
								aria-describedby="image-hint"
								onClick={() => fileInput.current?.click()}
								onDragOver={(e) => e.preventDefault()}
								onDrop={(e) => {
									e.preventDefault();
									choose(e.dataTransfer.files);
								}}
							>
								<CloudUploadOutlined />
								<span>
									{t('Drag and drop an image here, or')} <u>{t('Browse Files')}</u>
								</span>
								<small>{t('Slope photos, equipment setups, or resort maps welcome')}</small>
							</button>
							{imageFailure && <Alert severity="error">{imageFailure}</Alert>}
							{file && (
								<div className="create-image-preview">
									{preview && !failedPreview ? (
										<img src={preview} alt={t('Selected cover image')} onError={() => setFailedPreview(true)} />
									) : (
										<span>{t('Image preview unavailable')}</span>
									)}
									<small>{file.name}</small>
									<button
										type="button"
										aria-label={t('Remove image')}
										onClick={() => {
											setFile(null);
											uploaded.current = null;
											setImageFailure('');
										}}
									>
										<CloseRounded />
									</button>
								</div>
							)}
						</div>
						<aside className="create-guidelines">
							<VerifiedOutlined />
							<div>
								<h2>{t('SNOWAY Community Posting Guidelines')}</h2>
								<ul>
									<li>{t('Respect fellow riders, instructors, and community members with polite etiquette.')}</li>
									<li>{t('Include specific dates, snow quality, or lift status when publishing reviews.')}</li>
									<li>{t('Keep equipment suggestions verified and avoid unauthorized marketing.')}</li>
								</ul>
							</div>
						</aside>
					</fieldset>
					{failure && <Alert severity="error">{failure}</Alert>}
					{published && (
						<Alert severity="success">
							{t('Post published.')} <Link href={'/community/detail?id=' + published}>{t('View post')}</Link>
						</Alert>
					)}
					<div className="create-actions">
						<Button component={Link} href="/community" disabled={pending}>
							{t('Cancel')}
						</Button>
						<Button type="submit" variant="contained" startIcon={<SendOutlined />} disabled={busy}>
							{t(pending ? 'Publishing...' : 'Publish Post')}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
