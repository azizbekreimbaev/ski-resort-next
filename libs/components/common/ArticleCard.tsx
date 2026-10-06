import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Chip, Typography } from '@mui/material';
import { useApolloClient, useMutation, useReactiveVar } from '@apollo/client';
import { LIKE_TARGET_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { useTranslation } from 'next-i18next';
import { BoardArticle } from '../../types/board-article/board-article';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
export default function ArticleCard({
	article,
	variant,
	image,
}: {
	article: BoardArticle;
	variant?: 'community';
	image?: React.ReactNode;
}) {
	const { t, i18n } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const client = useApolloClient();
	const [like, state] = useMutation(LIKE_TARGET_BOARD_ARTICLE);
	const lock = useRef(false);
	const [failure, setFailure] = useState('');
	const toggle = async () => {
		if (lock.current) return;
		if (!user._id) {
			setFailure(t('Please login first!'));
			return;
		}
		lock.current = true;
		try {
			await like({ variables: { input: article._id } });
			await client.refetchQueries({ include: ['GetBoardArticles'] });
			setFailure('');
		} catch {
			setFailure(t('Unable to update profile interaction'));
		} finally {
			lock.current = false;
		}
	};
	const liked = article.meLiked?.some((item) => item.myFavorite);
	if (variant === 'community')
		return (
			<article className="community-post-body">
				<h3>
					<Link href={'/community/detail?id=' + article._id + '&articleCategory=' + article.articleCategory}>
						{article.articleTitle}
					</Link>
				</h3>
				<p>
					{article.articleContent
						.replace(/<[^>]*>/g, '')
						.replace(/&nbsp;/g, ' ')
						.slice(0, 250)}
				</p>
				{image}
				<div className="community-post-footer">
					<div className="community-interactions">
						<span aria-label={t('Views') + ': ' + article.articleViews}>
							<VisibilityOutlinedIcon />
							{article.articleViews.toLocaleString()}
						</span>
						<button
							type="button"
							disabled={state.loading}
							aria-pressed={Boolean(liked)}
							aria-label={t(liked ? 'Unlike' : 'Like')}
							onClick={() => void toggle()}
						>
							{liked ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
							{article.articleLikes.toLocaleString()}
						</button>
						<Link
							href={'/community/detail?id=' + article._id + '&articleCategory=' + article.articleCategory}
							aria-label={t('Comments') + ': ' + article.articleComments}
						>
							<ChatBubbleOutlineRoundedIcon />
							{article.articleComments.toLocaleString()}
						</Link>
					</div>
					<Link
						className="community-read-more"
						href={'/community/detail?id=' + article._id + '&articleCategory=' + article.articleCategory}
					>
						{t('Read More')}
						<ArrowForwardRoundedIcon />
					</Link>
				</div>
				{failure && <Alert severity="error">{failure}</Alert>}
			</article>
		);
	return (
		<article className="snowkr-article-card">
			<Chip size="small" label={t(article.articleCategory)} />
			<h3>
				<Link href={'/community/detail?id=' + article._id + '&articleCategory=' + article.articleCategory}>
					{article.articleTitle}
				</Link>
			</h3>
			<Typography>{article.articleContent.replace(/<[^>]*>/g, '').slice(0, 160)}</Typography>
			<div className="snowkr-meta">
				<span>{article.memberData?.memberNick ?? t('Member')}</span>
				<span>{new Date(article.createdAt).toLocaleDateString(i18n.language === 'kr' ? 'ko-KR' : i18n.language)}</span>
				<span>
					{t('Views')}: {article.articleViews}
				</span>
				<span>
					{t('Likes')}: {article.articleLikes}
				</span>
				<span>
					{t('Comments')}: {article.articleComments}
				</span>
			</div>
			<Button disabled={state.loading} onClick={() => void toggle()}>
				{t(article.meLiked?.some((item) => item.myFavorite) ? 'Unlike' : 'Like')}
			</Button>
			{failure && <Alert severity="error">{failure}</Alert>}
		</article>
	);
}
