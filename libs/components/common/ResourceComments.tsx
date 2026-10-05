import React, { useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Button, Pagination, Stack, TextField, Typography } from '@mui/material';
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
	memberData?: { memberNick: string } | null;
}
export default function ResourceComments({ id, group }: { id: string; group: 'RESORT' | 'EQUIPMENT' | 'MEMBER' }) {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [page, setPage] = useState(1);
	const [content, setContent] = useState('');
	const [editing, setEditing] = useState<string | null>(null);
	const [failure, setFailure] = useState('');
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
	const [create, createState] = useMutation(CREATE_COMMENT);
	const [update, updateState] = useMutation(UPDATE_COMMENT);
	const [remove, removeState] = useMutation(REMOVE_COMMENT_BY_ADMIN);
	const pending = createState.loading || updateState.loading || removeState.loading;
	const submit = async () => {
		if (!content.trim() || content.trim().length > 100 || pending) return;
		try {
			if (editing) await update({ variables: { input: { _id: editing, commentContent: content.trim() } } });
			else
				await create({
					variables: { input: { commentRefId: id, commentGroup: group, commentContent: content.trim() } },
				});
			setContent('');
			setEditing(null);
			setPage(1);
			await refetch();
			setFailure('');
		} catch {
			setFailure(t('Unable to save comment'));
		}
	};
	const deleteComment = async (comment: ResourceComment) => {
		if (!window.confirm(t('Delete this comment?'))) return;
		try {
			if (comment.memberId === user._id)
				await update({ variables: { input: { _id: comment._id, commentStatus: 'DELETE' } } });
			else await remove({ variables: { input: comment._id } });
			await refetch();
			setFailure('');
		} catch {
			setFailure(t('Unable to save comment'));
		}
	};
	return (
		<Stack spacing={2}>
			<Typography component="h2" variant="h5">
				{t('Comments')}
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
					<Typography variant="subtitle2">
						{comment.memberData?.memberNick ?? t('Member')} · {new Date(comment.createdAt).toLocaleDateString()}
					</Typography>
					<Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{comment.commentContent}</Typography>
					<Stack direction="row">
						{comment.memberId === user._id && (
							<Button
								disabled={pending}
								onClick={() => {
									setEditing(comment._id);
									setContent(comment.commentContent);
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
			{user._id ? (
				<Stack spacing={1}>
					<TextField
						multiline
						label={t('Comment')}
						inputProps={{ maxLength: 100 }}
						value={content}
						onChange={(event) => setContent(event.target.value)}
						helperText={`${content.length}/100`}
					/>
					<Button variant="contained" disabled={pending || !content.trim()} onClick={() => void submit()}>
						{t(editing ? 'Save' : 'Post comment')}
					</Button>
					{editing && (
						<Button
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
				<Alert severity="info">{t('Sign in to comment')}</Alert>
			)}
		</Stack>
	);
}
