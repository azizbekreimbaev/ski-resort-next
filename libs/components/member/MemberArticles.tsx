import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { Pagination, Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { BoardArticles } from '../../types/board-article/board-article';
import { validId } from '../../catalogSearch';
import ArticleCard from '../common/ArticleCard';
import HomeCollectionState from '../homepage/HomeCollectionState';
export default function MemberArticles() {
	const router = useRouter();
	const { t } = useTranslation('common');
	const id = router.query.memberId;
	const [page, setPage] = useState(1);
	useEffect(() => setPage(1), [id]);
	const { data, loading, error, refetch } = useQuery<{ getBoardArticles: BoardArticles }>(GET_BOARD_ARTICLES, {
		variables: { input: { page, limit: 6, sort: 'createdAt', direction: 'DESC', search: { memberId: id } } },
		skip: !validId(id),
		fetchPolicy: 'network-only',
	});
	const articles = data?.getBoardArticles.list ?? [];
	const total = data?.getBoardArticles.metaCounter?.[0]?.total ?? 0;
	return (
		<Stack spacing={3}>
			<Typography component="h2" variant="h4">
				{t('Articles')}
			</Typography>
			<HomeCollectionState loading={loading} error={Boolean(error)} empty={!articles.length} retry={refetch} />
			{!error && articles.map((article) => <ArticleCard key={article._id} article={article} />)}
			{total > 6 && (
				<Pagination page={page} count={Math.ceil(total / 6)} onChange={(_event, value) => setPage(value)} />
			)}
		</Stack>
	);
}
