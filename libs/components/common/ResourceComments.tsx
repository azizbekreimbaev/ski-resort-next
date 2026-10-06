import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Avatar, Button, Pagination, Stack, TextField, Typography } from '@mui/material';
import Link from 'next/link';
import { homeImageUrl } from '../homepage/homeUtils';
import { useTranslation } from 'next-i18next';
import { GET_COMMENTS } from '../../../apollo/user/query';
import { CREATE_COMMENT, UPDATE_COMMENT } from '../../../apollo/user/mutation';
import { REMOVE_COMMENT_BY_ADMIN } from '../../../apollo/admin/mutation';
import { userVar } from '../../../apollo/store';
import HomeCollectionState from '../homepage/HomeCollectionState';

interface ResourceComment {
	_id: string;
	memberId: string;
	commentContent: string;
	createdAt: string;
	memberData?: { memberNick: string; memberImage?: string } | null;
}
export default function ResourceComments({
	id,
	group,
	onChange,
	onTotalChange,
	variant,
}: {
	id: string;
	group: 'RESORT' | 'EQUIPMENT' | 'MEMBER' | 'ARTICLE';
	onChange?: () => Promise<unknown>;
	onTotalChange?: (total: number) => void;
	variant?: 'community';
}) {
	const { t, i18n } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [page, setPage] = useState(1);
	const [content, setContent] = useState('');
	const [editing, setEditing] = useState<string | null>(null);
	const [failure, setFailure] = useState('');
	const lock = useRef(false);
	const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
	const { data, loading, error, refetch } = useQuery<{
		getComments: { list: ResourceComment[]; metaCounter: { total: number }[] };
	}>(GET_COMMENTS, {
		variables: {
			input: {
				page,
				limit: 5,
				sort: 'createdAt',
				direction: 'DESC',
				search: { commentRefId: id, commentGroup: group },
			},
		},
		fetchPolicy: 'network-only',
	});
	useEffect(() => {
		if (data?.getComments && !error) onTotalChange?.(data.getComments.metaCounter?.[0]?.total ?? 0);
	}, [data, error, onTotalChange]);
	const [create, createState] = useMutation(CREATE_COMMENT);
	const [update, updateState] = useMutation(UPDATE_COMMENT);
	const [remove, removeState] = useMutation(REMOVE_COMMENT_BY_ADMIN);
	const pending = createState.loading || updateState.loading || removeState.loading;
	const submit = async () => {
		if (!user._id || !content.trim() || content.trim().length > 100 || pending || lock.current) return;
		lock.current = true;
		try {
			if (editing) await update({ variables: { input: { _id: editing, commentContent: content.trim() } } });
			else
				await create({
					variables: { input: { commentRefId: id, commentGroup: group, commentContent: content.trim() } },
				});
			setContent('');
			setEditing(null);
			setPage(1);
			await refetch({
				input: {
					page: 1,
					limit: 5,
					sort: 'createdAt',
					direction: 'DESC',
					search: { commentRefId: id, commentGroup: group },
				},
			});
			await onChange?.();
			setFailure('');
		} catch {
			setFailure(t('Unable to save comment'));
		} finally {
			lock.current = false;
		}
	};
	const deleteComment = async (comment: ResourceComment) => {
		if (lock.current || pending || !user._id || (comment.memberId !== user._id && user.memberType !== 'ADMIN')) return;
		if (!window.confirm(t('Delete this comment?'))) return;
		lock.current = true;
		try {
			if (comment.memberId === user._id)
				await update({ variables: { input: { _id: comment._id, commentStatus: 'DELETE' } } });
			else await remove({ variables: { input: comment._id } });
			if (editing === comment._id) {
				setEditing(null);
				setContent('');
			}
			const nextPage = Math.max(
				1,
				Math.min(page, Math.ceil(((data?.getComments.metaCounter?.[0]?.total ?? 1) - 1) / 5)),
			);
			setPage(nextPage);
			await refetch({
				input: {
					page: nextPage,
					limit: 5,
					sort: 'createdAt',
					direction: 'DESC',
					search: { commentRefId: id, commentGroup: group },
				},
			});
			await onChange?.();
			setFailure('');
		} catch {
			setFailure(t('Unable to save comment'));
		} finally {
			lock.current = false;
		}
	};
	const composer = user._id ? (
		<Stack spacing={1} className={variant === 'community' ? 'detail-comment-composer' : undefined}>
			{variant === 'community' && (
				<>
					<Typography component="h3">{t(editing ? 'Edit comment' : 'Write a Comment')}</Typography>
					<div className="detail-comment-identity">
						<Avatar src={homeImageUrl(user.memberImage)}>{user.memberNick?.slice(0, 2).toUpperCase()}</Avatar>
						<strong>
							{user.memberNick} ({t('You')})
						</strong>
					</div>
				</>
			)}
			<TextField
				multiline
				minRows={variant === 'community' ? 3 : undefined}
				label={t('Comment')}
				inputRef={inputRef}
				inputProps={{ maxLength: 100 }}
				value={content}
				disabled={pending}
				onChange={(event) => setContent(event.target.value)}
				helperText={`${content.length}/100`}
			/>
			<Button variant="contained" disabled={pending || !content.trim()} onClick={() => void submit()}>
				{t(editing ? 'Save' : 'Post comment')}
			</Button>
			{editing && (
				<Button
					disabled={pending}
					onClick={() => {
						setEditing(null);
						setContent('');
					}}
				>
					{t('Cancel')}
				</Button>
			)}
		</Stack>
	) : (
		<Alert severity="info">
			{t('Sign in to comment')}
			{variant === 'community' && (
				<Button component={Link} href={'/account/join?referrer=' + encodeURIComponent('/community/detail?id=' + id)}>
					{t('Login')}
				</Button>
			)}
		</Alert>
	);
	return (
		<Stack spacing={2}>
			<Typography component="h2" variant="h5">
				{t('Comments')}
				{variant === 'community' && data?.getComments && !error
					? ` (${data.getComments.metaCounter?.[0]?.total ?? 0})`
					: ''}
			</Typography>
			<HomeCollectionState
				loading={loading}
				error={Boolean(error)}
				empty={!data?.getComments.list.length}
				retry={refetch}
			/>
			{failure && <Alert severity="error">{failure}</Alert>}
			{data?.getComments.list.map((comment) => (
				<Stack key={comment._id} className="resource-comment" spacing={1}>
					{variant === 'community' && (
						<Avatar src={homeImageUrl(comment.memberData?.memberImage)}>
							{(comment.memberData?.memberNick ?? String(t('Member'))).slice(0, 2).toUpperCase()}
						</Avatar>
					)}
					<Typography variant="subtitle2">
						{comment.memberData?.memberNick ?? t('Member')} ·{' '}
						{new Date(comment.createdAt).toLocaleDateString(i18n.language === 'kr' ? 'ko-KR' : i18n.language)}
					</Typography>
					<Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{comment.commentContent}</Typography>
					<Stack direction="row">
						{comment.memberId === user._id && (
							<Button
								disabled={pending}
								onClick={() => {
									setEditing(comment._id);
									setContent(comment.commentContent);
									inputRef.current?.focus();
								}}
							>
								{t('Edit')}
							</Button>
						)}
						{(comment.memberId === user._id || user.memberType === 'ADMIN') && (
							<Button disabled={pending} onClick={() => void deleteComment(comment)}>
								{t('Delete')}
							</Button>
						)}
					</Stack>
				</Stack>
			))}
			{(data?.getComments.metaCounter?.[0]?.total ?? 0) > 5 && (
				<Pagination
					page={page}
					count={Math.ceil((data?.getComments.metaCounter?.[0]?.total ?? 0) / 5)}
					onChange={(_event, value) => setPage(value)}
				/>
			)}
			{composer}
		</Stack>
	);
}
