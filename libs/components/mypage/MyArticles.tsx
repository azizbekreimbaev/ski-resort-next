import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@apollo/client';
import { Alert, Button, Pagination, Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { UPDATE_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { BoardArticles } from '../../types/board-article/board-article';
import useMemberSession from '../../hooks/useMemberSession';
import ArticleCard from '../common/ArticleCard';
import HomeCollectionState from '../homepage/HomeCollectionState';
export default function MyArticles({ onChanged }: { onChanged?: () => Promise<unknown> }) {
	const { user, ready } = useMemberSession();
	const { t } = useTranslation('common');
	const [page, setPage] = useState(1);
	const [failure, setFailure] = useState('');
	const { data, loading, error, refetch } = useQuery<{ getBoardArticles: BoardArticles }>(GET_BOARD_ARTICLES, {
		variables: { input: { page, limit: 6, sort: 'createdAt', direction: 'DESC', search: { memberId: user._id } } },
		skip: !ready || !user._id,
		fetchPolicy: 'network-only',
	});
	const [update, state] = useMutation(UPDATE_BOARD_ARTICLE);
	const articles = data?.getBoardArticles.list ?? [];
	const total = data?.getBoardArticles.metaCounter?.[0]?.total ?? 0;
	const remove = async (id: string) => {
		if (state.loading || !window.confirm(t('Delete this article?'))) return;
		try {
			await update({ variables: { input: { _id: id, articleStatus: 'DELETE' } } });
			if (articles.length === 1 && page > 1) setPage(page - 1);
			else await refetch();
			await onChanged?.();
		} catch {
			setFailure(t('Unable to save article'));
		}
	};
	return (
		<Stack spacing={3}>
			<Typography component="h1" variant="h4">
				{t('My Articles')}
			</Typography>
			<Button component={Link} href="/mypage?category=writeArticle">
				{t('Write Post')}
			</Button>
			<HomeCollectionState loading={loading} error={Boolean(error)} empty={!articles.length} retry={refetch} />
			{failure && <Alert severity="error">{failure}</Alert>}
			<div className="account-article-grid">
				{!error &&
					articles.map((article) => (
						<div key={article._id}>
							<ArticleCard article={article} />
							<Button component={Link} href={'/mypage?category=writeArticle&articleId=' + article._id}>
								{t('Edit')}
							</Button>
							<Button disabled={state.loading} onClick={() => void remove(article._id)}>
								{t('Delete')}
							</Button>
						</div>
					))}
			</div>
			{total > 6 && (
				<Pagination page={page} count={Math.ceil(total / 6)} onChange={(_event, value) => setPage(value)} />
			)}
		</Stack>
	);
}
