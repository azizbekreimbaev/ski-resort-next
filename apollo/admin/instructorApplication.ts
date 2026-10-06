import { gql } from '@apollo/client';
export const APPLICATION_SEARCH_MEMBERS = gql`
	query ApplicationSearchMembers($input: MembersInquiry!) {
		getAllMembersByAdmin(input: $input) {
			list {
				_id
				memberNick
				memberFullName
				memberType
			}
			metaCounter {
				total
			}
		}
	}
`;
export const APPLICATION_MEMBER = gql`
	query ApplicationMember($memberId: String!) {
		getMember(memberId: $memberId) {
			_id
			memberNick
			memberFullName
			memberType
		}
	}
`;
export const APPLICATION_SUMMARY = gql`
	query ApplicationSummary {
		all: getAllInstructorApplicationsByAdmin(input: { page: 1, limit: 1, search: {} }) {
			metaCounter {
				total
			}
		}
		pending: getAllInstructorApplicationsByAdmin(input: { page: 1, limit: 1, search: { applicationStatus: PENDING } }) {
			metaCounter {
				total
			}
		}
		approved: getAllInstructorApplicationsByAdmin(
			input: { page: 1, limit: 1, search: { applicationStatus: APPROVED } }
		) {
			metaCounter {
				total
			}
		}
		rejected: getAllInstructorApplicationsByAdmin(
			input: { page: 1, limit: 1, search: { applicationStatus: REJECTED } }
		) {
			metaCounter {
				total
			}
		}
	}
`;
