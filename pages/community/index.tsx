import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { Button, Pagination } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import AcUnitRoundedIcon from '@mui/icons-material/AcUnitRounded';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { GET_BOARD_ARTICLES } from '../../apollo/user/query';
import { BoardArticles } from '../../libs/types/board-article/board-article';
import { BoardArticlesInquiry } from '../../libs/types/board-article/board-article.input';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';
import { Direction } from '../../libs/enums/common.enum';
import CommunityPost, { communityCategories } from '../../libs/components/community/CommunityPost';
import HomeCollectionState from '../../libs/components/homepage/HomeCollectionState';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});
const limit = 6;
const sorts = {
	createdAt: 'Newest',
	updatedAt: 'Recently updated',
	articleLikes: 'Most liked',
	articleViews: 'Most viewed',
};
function Community() {
	const router = useRouter();
	const { t } = useTranslation('common');
	const category = Object.values(BoardArticleCategory).find((value) => value === router.query.articleCategory) ?? '';
	const page =
		typeof router.query.page === 'string' && /^[1-9]\d*$/.test(router.query.page)
			? Math.min(Number(router.query.page), 10000)
			: 1;
	const text = typeof router.query.text === 'string' ? router.query.text.slice(0, 100) : '';
	const sort = Object.keys(sorts).find((value) => value === router.query.sort) ?? 'createdAt';
	const [draft, setDraft] = useState(text);
	const searchRef = useRef<HTMLInputElement>(null);
	useEffect(() => setDraft(text), [text]);
	useEffect(() => {
		const focusSearch = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				searchRef.current?.focus();
			}
		};
		window.addEventListener('keydown', focusSearch);
		return () => window.removeEventListener('keydown', focusSearch);
	}, []);
	const navigate = (changes: Record<string, string | number>) =>
		void router.push({ pathname: '/community', query: { ...router.query, ...changes } });
	const input: BoardArticlesInquiry = {
		page,
		limit,
		sort,
		direction: Direction.DESC,
		search: { ...(category ? { articleCategory: category } : {}), ...(text ? { text } : {}) },
	};
	const { data, loading, error, refetch } = useQuery<{ getBoardArticles: BoardArticles }>(GET_BOARD_ARTICLES, {
		variables: { input },
		skip: !router.isReady,
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
	});
	const popular = useQuery<{ getBoardArticles: BoardArticles }>(GET_BOARD_ARTICLES, {
		variables: { input: { page: 1, limit: 4, sort: 'articleViews', direction: Direction.DESC, search: {} } },
		skip: !router.isReady,
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
	});
	const articles = data?.getBoardArticles.list ?? [];
	const total = data?.getBoardArticles.metaCounter?.[0]?.total ?? 0;
	const showFeed = !loading && !error;
	const range = showFeed && articles.length ? `${(page - 1) * limit + 1}–${(page - 1) * limit + articles.length}` : '0';
	return (
		<div className="community-directory">
			<Head>
				<title>{t('SNOWAY Community')} | SNOWAY</title>
			</Head>
			<section className="community-hero">
				<div>
					<span className="community-eyebrow">
						<ForumOutlinedIcon />
						{t('Alpine Forum & Snow Community')}
					</span>
					<h1>{t('SNOWAY Community')}</h1>
					<p>{t('Share experiences, ask questions, and connect with skiers and snowboarders across Korea.')}</p>
				</div>
				<Button component={Link} href="/community/create" startIcon={<AddRoundedIcon />}>
					{t('Create Post')}
				</Button>
			</section>
			<form
				className="community-search"
				onSubmit={(event) => {
					event.preventDefault();
					navigate({ text: draft.trim(), page: 1 });
				}}
			>
				<SearchRoundedIcon />
				<input
					ref={searchRef}
					aria-label={t('Search post titles')}
					placeholder={t('Search post titles...')}
					value={draft}
					maxLength={100}
					onChange={(event) => setDraft(event.target.value)}
				/>
				<kbd>⌘ / Ctrl K</kbd>
				<button type="submit">{t('Search')}</button>
			</form>
			<div className="community-columns">
				<aside className="community-left">
					<nav className="community-panel community-categories" aria-label={t('Categories')}>
						<h2>
							<TuneRoundedIcon />
							{t('Categories')}
						</h2>
						<button
							className={!category ? 'selected' : ''}
							aria-pressed={!category}
							onClick={() => navigate({ articleCategory: '', page: 1 })}
						>
							<GridViewRoundedIcon />
							{t('All Posts')}
						</button>
						{Object.values(BoardArticleCategory).map((value) => (
							<button
								className={category === value ? 'selected' : ''}
								aria-pressed={category === value}
								key={value}
								onClick={() => navigate({ articleCategory: value, page: 1 })}
							>
								<ForumOutlinedIcon />
								{t(communityCategories[value])}
							</button>
						))}
					</nav>
					<div className="community-panel community-snow">
						<h2>
							<AcUnitRoundedIcon />
							{t('Plan your next snow day')}
						</h2>
						<p>{t('Explore Korean mountains and find your next winter adventure.')}</p>
						<Link href="/resort">{t('Explore resorts')} →</Link>
					</div>
				</aside>
				<section className="community-feed" aria-label={t('Community Posts')} aria-busy={loading}>
					<div className="community-panel community-feed-heading">
						<div>
							<h2>{t('Community Posts')}</h2>
							<p aria-live="polite">
								{showFeed
									? t('Showing {{range}} of {{total}} posts', { range, total })
									: t('Stories, advice and discussions from winter sports enthusiasts.')}
							</p>
						</div>
						<label>
							{t('Sort By:')}
							<select
								aria-label={t('Sort')}
								value={sort}
								onChange={(event) => navigate({ sort: event.target.value, page: 1 })}
							>
								{Object.entries(sorts).map(([value, label]) => (
									<option key={value} value={value}>
										{t(label)}
									</option>
								))}
							</select>
						</label>
					</div>
					<HomeCollectionState
						loading={loading || !router.isReady}
						error={Boolean(error)}
						empty={!articles.length}
						retry={refetch}
					/>
					{showFeed && articles.map((article) => <CommunityPost key={article._id} article={article} />)}
					{showFeed && total > limit && (
						<div className="community-panel community-pagination">
							<span>{t('Showing {{range}} of {{total}} posts', { range, total })}</span>
							<Pagination
								page={page}
								count={Math.ceil(total / limit)}
								onChange={(_event, value) => navigate({ page: value })}
								shape="rounded"
								size="small"
							/>
						</div>
					)}
					{showFeed && page > 1 && !articles.length && (
						<Button onClick={() => navigate({ page: 1 })}>{t('Back to first page')}</Button>
					)}
				</section>
				<aside className="community-right">
					<section className="community-panel">
						<h2>
							<TrendingUpRoundedIcon />
							{t('Popular Posts')}
						</h2>
						<HomeCollectionState
							loading={popular.loading || !router.isReady}
							error={Boolean(popular.error)}
							empty={!popular.data?.getBoardArticles.list.length}
							retry={popular.refetch}
						/>
						{!popular.loading && !popular.error && (
							<ol className="community-popular">
								{popular.data?.getBoardArticles.list.map((article, index) => (
									<li key={article._id}>
										<span>{index + 1}</span>
										<Link passHref href={'/community/detail?id=' + article._id + '&articleCategory=' + article.articleCategory}>
											<strong>{article.articleTitle}</strong>
											<small>
												{t('Views')}: {article.articleViews.toLocaleString()} · {t('Likes')}:{' '}
												{article.articleLikes.toLocaleString()}
											</small>
										</Link>
									</li>
								))}
							</ol>
						)}
					</section>
					<section className="community-panel">
						<h2># {t('Explore Topics')}</h2>
						<div className="community-topics">
							{['Yongpyong', 'Beginner', 'Snowboard', 'Gear', 'High1', 'Powder'].map((topic) => (
								<button key={topic} onClick={() => navigate({ text: topic, articleCategory: '', page: 1 })}>
									#{topic}
								</button>
							))}
						</div>
					</section>
					<section className="community-panel community-etiquette">
						<h2>
							<VerifiedUserOutlinedIcon />
							{t('Snow Etiquette')}
						</h2>
						<ul>
							{[
								'Be respectful and verify slope conditions before sharing alerts.',
								'Follow FIS safety codes when discussing speed carving.',
								'Keep feedback constructive for beginners and students.',
							].map((rule) => (
								<li key={rule}>
									<CheckCircleOutlineRoundedIcon />
									<span>{t(rule)}</span>
								</li>
							))}
						</ul>
					</section>
				</aside>
			</div>
		</div>
	);
}
export default withLayoutBasic(Community);
