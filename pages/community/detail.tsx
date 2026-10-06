/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useReactiveVar } from '@apollo/client';
import { Alert, Avatar, Button, IconButton, Menu, MenuItem } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import MoreVert from '@mui/icons-material/MoreVert';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { GET_BOARD_ARTICLE } from '../../apollo/user/query';
import { LIKE_TARGET_BOARD_ARTICLE, UPDATE_BOARD_ARTICLE } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { validId } from '../../libs/catalogSearch';
import ResourceComments from '../../libs/components/common/ResourceComments';
import HomeCollectionState from '../../libs/components/homepage/HomeCollectionState';
import { communityCategories } from '../../libs/components/community/CommunityPost';
import { homeImageUrl } from '../../libs/components/homepage/homeUtils';
const Viewer = dynamic(() => import('../../libs/components/community/TViewer'), { ssr: false });
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});
function CommunityDetail() {
	const router = useRouter();
	const { t, i18n } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const id = router.query.id;
	const valid = validId(id);
	const { data, loading, error, refetch } = useQuery<{ getBoardArticle: BoardArticle }>(GET_BOARD_ARTICLE, {
		variables: { input: id },
		skip: !router.isReady || !valid,
		fetchPolicy: 'network-only',
	});
	const [like, state] = useMutation(LIKE_TARGET_BOARD_ARTICLE);
	const [update, updateState] = useMutation(UPDATE_BOARD_ARTICLE);
	const lock = useRef(false);
	const [failure, setFailure] = useState('');
	const [menu, setMenu] = useState<HTMLElement | null>(null);
	const [imageFailed, setImageFailed] = useState(false);
	const article = data?.getBoardArticle;
	useEffect(() => {
		setFailure('');
		setMenu(null);
		setImageFailed(false);
	}, [id]);
	const toggle = async () => {
		if (lock.current || !article) return;
		if (!user._id) {
			setFailure(t('Please login first!'));
			return;
		}
		lock.current = true;
		try {
			await like({ variables: { input: article._id } });
			await refetch();
			setFailure('');
		} catch {
			setFailure(t('Unable to update profile interaction'));
		} finally {
			lock.current = false;
		}
	};
	const deleteArticle = async () => {
		setMenu(null);
		if (!article || article.memberId !== user._id || lock.current || !window.confirm(t('Delete this article?'))) return;
		lock.current = true;
		try {
			await update({ variables: { input: { _id: article._id, articleStatus: 'DELETE' } } });
			await router.push('/community');
		} catch {
			setFailure(t('Unable to delete article'));
		} finally {
			lock.current = false;
		}
	};
	if (!router.isReady || loading)
		return (
			<div className="community-detail community-detail-state">
				<HomeCollectionState loading error={false} empty={false} retry={refetch} />
			</div>
		);
	if (!valid || error || !article)
		return (
			<div className="community-detail community-detail-state">
				<Alert severity="error">{t('This resource is unavailable')}</Alert>
				{valid && <Button onClick={() => void refetch()}>{t('Retry')}</Button>}
				<Button component={Link} href="/community">
					{t('Community')}
				</Button>
			</div>
		);
	const category = t(communityCategories[article.articleCategory]);
	const name = article.memberData?.memberNick ?? String(t('Member'));
	const liked = Boolean(user._id && article.meLiked?.some((item) => item.myFavorite));
	const image = homeImageUrl(article.articleImage);
	const categoryHref = '/community?articleCategory=' + article.articleCategory;
	return (
		<div className="community-detail">
			<div className="community-detail-inner">
				<nav className="detail-breadcrumb" aria-label={t('Breadcrumb')}>
					<Link href="/">{t('Home')}</Link>
					<ChevronRight />
					<Link href="/community">{t('Community')}</Link>
					<ChevronRight />
					<Link href={categoryHref}>{category}</Link>
					<ChevronRight />
					<span aria-current="page">{article.articleTitle}</span>
				</nav>
				<Link href={categoryHref} className="detail-back" passHref>
					<ArrowBack />
					{t('Back to Community')}
				</Link>
				<article>
					<header className="detail-article-header">
						<Link href={categoryHref} className="detail-category">
							{category}
						</Link>
						<h1>{article.articleTitle}</h1>
						<div className="detail-author-row">
							<Link href={'/member?memberId=' + article.memberId} className="detail-author" passHref>
								<Avatar src={homeImageUrl(article.memberData?.memberImage)}>{name.slice(0, 2).toUpperCase()}</Avatar>
								<strong>{name}</strong>
							</Link>
							<time dateTime={new Date(article.createdAt).toISOString()}>
								{new Date(article.createdAt).toLocaleDateString(i18n.language === 'kr' ? 'ko-KR' : i18n.language, {
									month: 'short',
									day: 'numeric',
									year: 'numeric',
								})}
							</time>
							<span>
								<VisibilityOutlined />
								{article.articleViews} {t('Views')}
							</span>
							<span>
								<FavoriteBorder />
								{article.articleLikes} {t('Likes')}
							</span>
							{article.memberId === user._id && (
								<IconButton
									className="detail-options"
									aria-label={t('Post options')}
									aria-haspopup="menu"
									aria-expanded={Boolean(menu)}
									disabled={state.loading || updateState.loading}
									onClick={(event) => setMenu(event.currentTarget)}
								>
									<MoreVert />
								</IconButton>
							)}
						</div>
						<Menu anchorEl={menu} open={Boolean(menu) && article.memberId === user._id} onClose={() => setMenu(null)}>
							<MenuItem component={Link} href={'/mypage?category=writeArticle&articleId=' + article._id}>
								<EditOutlined fontSize="small" />
								&nbsp;{t('Edit article')}
							</MenuItem>
							<MenuItem onClick={() => void deleteArticle()}>
								<DeleteOutline fontSize="small" />
								&nbsp;{t('Delete')}
							</MenuItem>
						</Menu>
					</header>
					{image && !imageFailed && (
						<figure className="detail-cover">
							<img src={image} alt={article.articleTitle} onError={() => setImageFailed(true)} />
						</figure>
					)}
					<div className="detail-body">
						<Viewer markdown={article.articleContent} />
					</div>
					{failure && <Alert severity="error">{failure}</Alert>}
					<div className="detail-like-row">
						<Button
							className="detail-like"
							aria-pressed={liked}
							disabled={state.loading || updateState.loading}
							onClick={() => void toggle()}
							startIcon={liked ? <Favorite /> : <FavoriteBorder />}
						>
							{t(liked ? 'Unlike' : 'Like')}
							<span className="detail-like-count">{article.articleLikes}</span>
						</Button>
					</div>
				</article>
				<section className="detail-comments">
					<ResourceComments key={article._id} id={article._id} group="ARTICLE" variant="community" />
				</section>
			</div>
		</div>
	);
}
export default withLayoutBasic(CommunityDetail);
