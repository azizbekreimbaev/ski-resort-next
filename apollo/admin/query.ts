import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const GET_ALL_MEMBERS_BY_ADMIN = gql`
	query GetAllMembersByAdmin($input: MembersInquiry!) {
		getAllMembersByAdmin(input: $input) {
			list {
				_id
				memberType
				memberStatus
				memberAuthType
				memberPhone
				memberNick
				memberFullName
				memberImage
				memberAddress
				memberDesc
				memberWarnings
				memberBlocks
				memberProperties
				memberRank
				memberArticles
				memberPoints
				memberLikes
				memberViews
				deletedAt
				createdAt
				updatedAt
				accessToken
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *        CATALOG         *
 *************************/

/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const GET_ALL_BOARD_ARTICLES_BY_ADMIN = gql`
	query GetAllBoardArticlesByAdmin($input: AllBoardArticlesInquiry!) {
		getAllBoardArticlesByAdmin(input: $input) {
			list {
				_id
				articleCategory
				articleStatus
				articleTitle
				articleContent
				articleImage
				articleViews
				articleLikes
				memberId
				createdAt
				updatedAt
				memberData {
					_id
					memberType
					memberStatus
					memberAuthType
					memberPhone
					memberNick
					memberFullName
					memberImage
					memberAddress
					memberDesc
					memberWarnings
					memberBlocks
					memberProperties
					memberRank
					memberPoints
					memberLikes
					memberViews
					deletedAt
					createdAt
					updatedAt
					accessToken
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         COMMENT        *
 *************************/

export const GET_COMMENTS = gql`
	query GetComments($input: CommentsInquiry!) {
		getComments(input: $input) {
			list {
				_id
				commentStatus
				commentGroup
				commentContent
				commentRefId
				memberId
				createdAt
				updatedAt
				memberData {
					_id
					memberType
					memberStatus
					memberAuthType
					memberPhone
					memberNick
					memberFullName
					memberImage
					memberAddress
					memberDesc
					memberWarnings
					memberBlocks
					memberProperties
					memberRank
					memberPoints
					memberLikes
					memberViews
					deletedAt
					createdAt
					updatedAt
					accessToken
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

import { resortFields, equipmentFields, applicationFields } from '../user/query';
export const GET_ALL_RESORTS_BY_ADMIN = gql`query GetAllResortsByAdmin($input: AllResortsInquiry!) { getAllResortsByAdmin(input: $input) { list { ${resortFields} } metaCounter { total } } }`;
export const GET_ALL_EQUIPMENTS_BY_ADMIN = gql`query GetAllEquipmentsByAdmin($input: AllEquipmentsInquiry!) { getAllEquipmentsByAdmin(input: $input) { list { ${equipmentFields} } metaCounter { total } } }`;
export const GET_ALL_INSTRUCTOR_APPLICATIONS_BY_ADMIN = gql`query GetAllInstructorApplicationsByAdmin($input: InstructorApplicationsInquiry!) { getAllInstructorApplicationsByAdmin(input: $input) { list { ${applicationFields} } metaCounter { total } } }`;
export const GET_INSTRUCTOR_APPLICATION_BY_ADMIN = gql`query GetInstructorApplicationByAdmin($applicationId: String!) { getInstructorApplicationByAdmin(applicationId: $applicationId) { ${applicationFields} } }`;

export const MEMBER_SUMMARY = gql`
	query AdminMemberSummary(
		$all: MembersInquiry!
		$active: MembersInquiry!
		$instructors: MembersInquiry!
		$blocked: MembersInquiry!
		$archived: MembersInquiry!
	) {
		all: getAllMembersByAdmin(input: $all) {
			metaCounter {
				total
			}
		}
		active: getAllMembersByAdmin(input: $active) {
			metaCounter {
				total
			}
		}
		instructors: getAllMembersByAdmin(input: $instructors) {
			metaCounter {
				total
			}
		}
		blocked: getAllMembersByAdmin(input: $blocked) {
			metaCounter {
				total
			}
		}
		archived: getAllMembersByAdmin(input: $archived) {
			metaCounter {
				total
			}
		}
	}
`;

export const RESORT_ADMIN_SUMMARY = gql`
	query ResortAdminSummary {
		all: getAllResortsByAdmin(input: { page: 1, limit: 1, search: {} }) {
			metaCounter {
				total
			}
		}
		active: getAllResortsByAdmin(input: { page: 1, limit: 1, search: { resortStatus: ACTIVE } }) {
			metaCounter {
				total
			}
		}
		deleted: getAllResortsByAdmin(input: { page: 1, limit: 1, search: { resortStatus: DELETE } }) {
			metaCounter {
				total
			}
		}
	}
`;

export const EQUIPMENT_ADMIN_SUMMARY = gql`
	query EquipmentAdminSummary {
		all: getAllEquipmentsByAdmin(input: { page: 1, limit: 1, search: {} }) {
			metaCounter {
				total
			}
		}
		available: getAllEquipmentsByAdmin(input: { page: 1, limit: 1, search: { equipmentStatus: AVAILABLE } }) {
			metaCounter {
				total
			}
		}
		unavailable: getAllEquipmentsByAdmin(input: { page: 1, limit: 1, search: { equipmentStatus: MAINTENANCE } }) {
			metaCounter {
				total
			}
		}
		deleted: getAllEquipmentsByAdmin(input: { page: 1, limit: 1, search: { equipmentStatus: DELETE } }) {
			metaCounter {
				total
			}
		}
		purchasable: getAllEquipmentsByAdmin(input: { page: 1, limit: 1, search: { equipmentPurchasable: true } }) {
			metaCounter {
				total
			}
		}
	}
`;

export const EQUIPMENT_ADMIN_STOCK = gql`
	query EquipmentAdminStock($input: AllEquipmentsInquiry!) {
		getAllEquipmentsByAdmin(input: $input) {
			list {
				_id
				equipmentQuantity
				equipmentStatus
			}
			metaCounter {
				total
			}
		}
	}
`;
