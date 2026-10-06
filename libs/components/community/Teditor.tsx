import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { Editor } from '@toast-ui/react-editor';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import axios from 'axios';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { CREATE_BOARD_ARTICLE, UPDATE_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { GET_BOARD_ARTICLE } from '../../../apollo/user/query';
import { BoardArticle } from '../../types/board-article/board-article';
import { getJwtToken } from '../../auth';
import useMemberSession from '../../hooks/useMemberSession';
import { validId } from '../../catalogSearch';
import { homeImageUrl } from '../homepage/homeUtils';
import '@toast-ui/editor/dist/toastui-editor.css';

export interface ArticleContentEditorProps {
	editorRef: React.RefObject<Editor>;
	initialValue?: string;
	onChange: (html: string) => void;
	disabled?: boolean;
	onImage?: (blob: Blob, callback: (url: string, alt?: string) => void) => void;
}

export function ArticleContentEditor({
	editorRef,
	initialValue = '',
	onChange,
	disabled = false,
	onImage,
}: ArticleContentEditorProps) {
	const container = useRef<HTMLDivElement>(null);
	useEffect(() => {
		container.current?.toggleAttribute('inert', disabled);
	}, [disabled]);
	return (
		<div
			ref={container}
			className="article-content-editor"
			onKeyDownCapture={(event) => {
				if (disabled) event.preventDefault();
			}}
		>
			<Editor
				ref={editorRef}
				initialValue={initialValue}
				initialEditType="wysiwyg"
				previewStyle="vertical"
				height="360px"
				usageStatistics={false}
				toolbarItems={[['bold', 'italic', 'strike'], onImage ? ['image', 'link'] : ['link'], ['ul', 'ol', 'quote']]}
				onChange={() => onChange(editorRef.current?.getInstance().getHTML() ?? '')}
				hooks={{
					addImageBlobHook: (blob: Blob, callback: (url: string, alt?: string) => void) => {
						onImage?.(blob, callback);
						return false;
					},
				}}
			/>
		</div>
	);
}

export default function TuiEditor() {
	const router = useRouter();
	const { t } = useTranslation('common');
	const { user } = useMemberSession();
	const editorRef = useRef<Editor>(null);
	const lock = useRef(false);
	const id = router.query.articleId;
	const edit = typeof id === 'string';
	const [title, setTitle] = useState('');
	const [category, setCategory] = useState(BoardArticleCategory.GENERAL);
	const [image, setImage] = useState('');
	const [content, setContent] = useState('');
	const [failure, setFailure] = useState('');
	const [uploading, setUploading] = useState(false);
	const { data, loading, error } = useQuery<{ getBoardArticle: BoardArticle }>(GET_BOARD_ARTICLE, {
		variables: { input: id },
		skip: !edit || !validId(id),
		fetchPolicy: 'network-only',
	});
	const [create, createState] = useMutation(CREATE_BOARD_ARTICLE);
	const [update, updateState] = useMutation(UPDATE_BOARD_ARTICLE);
	const article = data?.getBoardArticle;
	useEffect(() => {
		if (article) {
			setTitle(article.articleTitle);
			setCategory(article.articleCategory);
			setImage(article.articleImage ?? '');
			setContent(article.articleContent);
			editorRef.current?.getInstance().setHTML(article.articleContent);
		} else if (!edit) {
			setTitle('');
			setImage('');
			setContent('');
			editorRef.current?.getInstance().setHTML('');
		}
	}, [article, edit]);
	const upload = async (blob: Blob, callback: (url: string, alt?: string) => void) => {
		if (!['image/jpeg', 'image/png'].includes(blob.type)) {
			setFailure(t('Only images with jpeg, jpg, png format allowed!'));
			return;
		}
		setUploading(true);
		try {
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
			form.append('0', blob, 'article.' + (blob.type === 'image/png' ? 'png' : 'jpg'));
			const response = await axios.post<{ data?: { imageUploader: string }; errors?: { message: string }[] }>(
				String(process.env.REACT_APP_API_GRAPHQL_URL),
				form,
				{ headers: { Authorization: 'Bearer ' + getJwtToken(), 'apollo-require-preflight': 'true' } },
			);
			const path = response.data.data?.imageUploader;
			if (!path || response.data.errors?.length) throw new Error(t('Upload failed'));
			setImage(path);
			callback(homeImageUrl(path));
			setFailure('');
		} catch {
			setFailure(t('Upload failed'));
		} finally {
			setUploading(false);
		}
	};
	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (lock.current || uploading) return;
		const html = editorRef.current?.getInstance().getHTML() ?? '';
		if (
			title.trim().length < 3 ||
			title.trim().length > 50 ||
			html.length < 3 ||
			html.length > 250 ||
			!html.replace(/<[^>]+>/g, '').trim()
		) {
			setFailure(t('Article title must be 3–50 characters and HTML content 3–250 characters.'));
			return;
		}
		lock.current = true;
		setFailure('');
		try {
			if (edit) {
				if (!article || article.memberId !== user._id) throw new Error(t('This resource is unavailable'));
				await update({
					variables: { input: { _id: id, articleTitle: title.trim(), articleContent: html, articleImage: image } },
				});
			} else
				await create({
					variables: {
						input: { articleCategory: category, articleTitle: title.trim(), articleContent: html, articleImage: image },
					},
				});
			await router.push('/mypage?category=myArticles');
		} catch (failure) {
			setFailure(failure instanceof Error ? failure.message : t('Unable to save article'));
		} finally {
			lock.current = false;
		}
	};
	if (edit && (loading || !router.isReady)) return <Typography>{t('Loading')}</Typography>;
	if (edit && (!validId(id) || error || !article || article.memberId !== user._id))
		return <Alert severity="error">{t('This resource is unavailable')}</Alert>;
	return (
		<Stack component="form" spacing={3} onSubmit={submit}>
			<TextField
				label={t('Title')}
				required
				inputProps={{ minLength: 3, maxLength: 50 }}
				value={title}
				onChange={(event) => setTitle(event.target.value)}
			/>
			<TextField
				select
				label={t('Category')}
				value={category}
				disabled={edit}
				onChange={(event) => setCategory(event.target.value as BoardArticleCategory)}
			>
				{Object.values(BoardArticleCategory).map((value) => (
					<MenuItem value={value} key={value}>
						{t(value)}
					</MenuItem>
				))}
			</TextField>
			<ArticleContentEditor
				key={edit ? id : 'new'}
				editorRef={editorRef}
				initialValue={article?.articleContent ?? ''}
				onChange={setContent}
				disabled={createState.loading || updateState.loading || uploading}
				onImage={(blob, callback) => {
					void upload(blob, callback);
				}}
			/>
			<Typography variant="caption">
				{t('HTML characters')}: {content.length}/250
			</Typography>
			{failure && <Alert severity="error">{failure}</Alert>}
			<Button type="submit" variant="contained" disabled={createState.loading || updateState.loading || uploading}>
				{t(edit ? 'Save article' : 'Publish article')}
			</Button>
		</Stack>
	);
}
