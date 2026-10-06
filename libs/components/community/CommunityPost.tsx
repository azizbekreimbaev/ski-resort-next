import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { BoardArticle } from '../../types/board-article/board-article';
import ArticleCard from '../common/ArticleCard';
import { homeImageUrl } from '../homepage/homeUtils';

export const communityCategories = {
	GENERAL: 'General',
	NEWS: 'News',
	REVIEWS: 'Reviews',
	TIPS_GUIDES: 'Tips & Guides',
	QUESTIONS: 'Questions',
};

export default function CommunityPost({ article }: { article: BoardArticle }) {
	const { t, i18n } = useTranslation('common');
	const image = homeImageUrl(article.articleImage);
	const [failed, setFailed] = useState(false);
	useEffect(() => setFailed(false), [image]);
	const href = '/community/detail?id=' + article._id + '&articleCategory=' + article.articleCategory;
	const name = article.memberData?.memberNick ?? String(t('Member'));
	return (
		<div className="community-post">
			<div className="community-post-author">
				<Link href={'/member?memberId=' + article.memberId} className="community-avatar" aria-label={name}>
					{name.slice(0, 2).toUpperCase()}
				</Link>
				<div>
					<Link href={'/member?memberId=' + article.memberId}>{name}</Link>
					<time dateTime={new Date(article.createdAt).toISOString()}>
						{new Date(article.createdAt).toLocaleDateString(i18n.language === 'kr' ? 'ko-KR' : i18n.language)}
					</time>
				</div>
				<span className="community-category">{t(communityCategories[article.articleCategory])}</span>
			</div>
			<ArticleCard
				article={article}
				variant="community"
				image={
					image && !failed ? (
						<Link className="community-post-image" href={href}>
							<img src={image} alt={article.articleTitle} loading="lazy" onError={() => setFailed(true)} />
						</Link>
					) : undefined
				}
			/>
		</div>
	);
}
