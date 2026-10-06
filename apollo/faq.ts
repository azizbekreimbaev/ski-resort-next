import { gql } from '@apollo/client';
const FIELDS = gql`
	fragment FaqFields on Faq {
		_id
		faqQuestion
		faqAnswer
		faqStatus
		memberId
		createdAt
		updatedAt
	}
`;
export const GET_FAQS = gql`
	query Faqs($input: FaqsInquiry!) {
		getFaqs(input: $input) {
			list {
				...FaqFields
			}
			metaCounter {
				total
			}
		}
	}
	${FIELDS}
`;
export const GET_ADMIN_FAQS = gql`
	query AdminFaqs($input: AllFaqsInquiry!) {
		getAllFaqsByAdmin(input: $input) {
			list {
				...FaqFields
			}
			metaCounter {
				total
			}
		}
	}
	${FIELDS}
`;
export const GET_FAQ = gql`
	query Faq($faqId: String!) {
		getFaq(faqId: $faqId) {
			...FaqFields
		}
	}
	${FIELDS}
`;
export const GET_ADMIN_FAQ = gql`
	query AdminFaq($faqId: String!) {
		getFaqByAdmin(faqId: $faqId) {
			...FaqFields
		}
	}
	${FIELDS}
`;
export const CREATE_FAQ = gql`
	mutation CreateFaq($input: FaqInput!) {
		createFaq(input: $input) {
			...FaqFields
		}
	}
	${FIELDS}
`;
export const UPDATE_FAQ = gql`
	mutation UpdateFaq($input: FaqUpdate!) {
		updateFaqByAdmin(input: $input) {
			...FaqFields
		}
	}
	${FIELDS}
`;
export const REMOVE_FAQ = gql`
	mutation RemoveFaq($faqId: String!) {
		removeFaqByAdmin(faqId: $faqId) {
			_id
		}
	}
`;
