import { BoardArticle } from '../../../types/board-article/board-article';

export interface CommunityBatch {
	list: BoardArticle[];
	metaCounter: { total: number }[] | null;
}

// Admin has no title/author filter or comment sum. Read bounded batches before
// local search/pagination, so these controls cover the complete catalog.
export async function loadCommunityCatalog(
	fetchPage: (page: number) => Promise<CommunityBatch>,
	isCurrent: () => boolean = () => true,
): Promise<BoardArticle[]> {
	const articles = new Map<string, BoardArticle>();
	for (let page = 1; ; page++) {
		const batch = await fetchPage(page);
		if (!isCurrent()) return [];
		batch.list.forEach((article) => articles.set(article._id, article));
		if (!batch.list.length || page * 100 >= (batch.metaCounter?.[0]?.total ?? 0)) break;
	}
	return Array.from(articles.values());
}

export const articleExcerpt = (content: string) =>
	content
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

export function communityCsv(articles: BoardArticle[]): string {
	const cell = (value: string | number) =>
		`"${String(value)
			.replace(/^[\s]*[=+@-]/, "'$&")
			.replace(/"/g, '""')}"`;
	return [
		['ID', 'Title', 'Category', 'Author', 'Status', 'Views', 'Likes', 'Comments', 'Created'],
		...articles.map((article) => [
			article._id,
			article.articleTitle,
			article.articleCategory,
			article.memberData?.memberNick ?? article.memberId,
			article.articleStatus,
			article.articleViews,
			article.articleLikes,
			article.articleComments,
			new Date(article.createdAt).toISOString(),
		]),
	]
		.map((row) => row.map(cell).join(','))
		.join('\r\n');
}
