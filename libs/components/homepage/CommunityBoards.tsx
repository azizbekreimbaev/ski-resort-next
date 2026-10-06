import React from 'react';
import Link from 'next/link';
import { Button, Chip } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { BoardArticles } from '../../types/board-article/board-article';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { Direction } from '../../enums/common.enum';
import HomeSection from './HomeSection';
import HomeCollectionState from './HomeCollectionState';
import { homeImageUrl } from './homeUtils';

interface HomeArticlesInquiry {
	page: number;
	limit: number;
	sort: 'createdAt';
	direction: Direction;
	search: { articleCategory?: BoardArticleCategory };
}

export default function CommunityBoards({ news = false }: { news?: boolean }) {
	const { t, i18n } = useTranslation('common');
	const input: HomeArticlesInquiry = {
		page: 1,
		limit: 3,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: news ? { articleCategory: BoardArticleCategory.NEWS } : {},
	};
	const { data, loading, error, refetch } = useQuery<
		{ getBoardArticles: BoardArticles },
		{ input: HomeArticlesInquiry }
	>(GET_BOARD_ARTICLES, {
		variables: { input },
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
	});
	const articles = data?.getBoardArticles.list ?? [];
	const href = news ? `/community?articleCategory=${BoardArticleCategory.NEWS}` : '/community';
	return (
		<HomeSection
			id={news ? 'news-preview' : 'community-preview'}
			eyebrow={t(news ? 'Mountain updates' : 'Together on the mountain')}
			title={t(news ? 'Latest winter news' : 'From the Community')}
			subtitle={t(
				news
					? 'The latest news shared by our winter sports community.'
					: 'Stories, advice and discussions from winter sports enthusiasts.',
			)}
			action={
				<Button component={Link} href={href} endIcon={<ArrowForwardRoundedIcon />}>
					{t(news ? 'View news' : 'Explore Board')}
				</Button>
			}
		>
			<HomeCollectionState
				skeleton
				loading={loading && !articles.length}
				error={Boolean(error)}
				empty={!articles.length}
				retry={refetch}
			/>
			{!error && articles.length > 0 && (
				<div className="home-article-grid">
					{articles.map((article) => (
						<article className="home-preview-card home-article-preview" key={article._id}>
							<Link
								className="home-article-image"
								href={`/community/detail?id=${encodeURIComponent(article._id)}&articleCategory=${article.articleCategory}`}
							>
								<img
									key={article.articleImage}
									src={homeImageUrl(article.articleImage) || '/img/hero/winter-1.jpg'}
									alt={article.articleTitle}
									loading="lazy"
									onError={(event) => {
										if (!event.currentTarget.src.endsWith('/img/hero/winter-1.jpg'))
											event.currentTarget.src = '/img/hero/winter-1.jpg';
									}}
								/>
							</Link>
							<Chip size="small" label={t(article.articleCategory)} />
							<h3>
								<Link
									href={`/community/detail?id=${encodeURIComponent(article._id)}&articleCategory=${
										article.articleCategory
									}`}
								>
									{article.articleTitle}
								</Link>
							</h3>
							<p>{article.articleContent.replace(/<[^>]*>/g, '').slice(0, 160)}</p>
							<div className="home-article-author">
								<span>{article.memberData?.memberNick ?? t('Member')}</span>
								<time dateTime={new Date(article.createdAt).toISOString()}>
									{new Date(article.createdAt).toLocaleDateString(i18n.language === 'kr' ? 'ko-KR' : i18n.language)}
								</time>
							</div>
							<div className="home-article-footer">
								<span>
									{t('Views')}: {article.articleViews}
								</span>
								<span>
									<ChatBubbleOutlineRoundedIcon />
									{article.articleComments}
								</span>
								<Button
									component={Link}
									href={`/community/detail?id=${encodeURIComponent(article._id)}&articleCategory=${
										article.articleCategory
									}`}
									aria-label={`${t('Read article')}: ${article.articleTitle}`}
								>
									<ArrowForwardRoundedIcon />
								</Button>
							</div>
						</article>
					))}
				</div>
			)}
		</HomeSection>
	);
}
