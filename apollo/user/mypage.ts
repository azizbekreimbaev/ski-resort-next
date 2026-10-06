import { gql } from '@apollo/client';

export const GET_MY_PAGE_SUMMARY = gql`
	query GetMyPageSummary(
		$memberId: String!
		$followers: FollowInquiry!
		$followings: FollowInquiry!
		$resorts: ResortsInquiry!
		$equipment: EquipmentHistoryInquiry!
		$articles: BoardArticlesInquiry!
	) {
		getMember(memberId: $memberId) {
			_id
			createdAt
			memberComments
		}
		getMemberFollowers(input: $followers) {
			metaCounter {
				total
			}
		}
		getMemberFollowings(input: $followings) {
			metaCounter {
				total
			}
		}
		getFavoriteResorts(input: $resorts) {
			metaCounter {
				total
			}
		}
		getFavoriteEquipments(input: $equipment) {
			metaCounter {
				total
			}
		}
		getBoardArticles(input: $articles) {
			metaCounter {
				total
			}
		}
	}
`;
