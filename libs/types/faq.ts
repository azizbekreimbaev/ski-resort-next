export type FaqStatus = 'DRAFT' | 'PUBLISHED';
export interface Faq {
	_id: string;
	faqQuestion: string;
	faqAnswer: string;
	faqStatus: FaqStatus;
	memberId: string;
	createdAt: string;
	updatedAt: string;
}
export interface FaqList {
	list: Faq[];
	metaCounter: { total: number }[];
}
export interface FaqInput {
	faqQuestion: string;
	faqAnswer: string;
	faqStatus?: FaqStatus;
}
export type FaqUpdate = Partial<FaqInput> & { _id: string };
