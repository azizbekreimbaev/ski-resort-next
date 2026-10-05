import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const UPDATE_MEMBER_BY_ADMIN = gql`
	mutation UpdateMemberByAdmin($input: MemberUpdate!) {
		updateMemberByAdmin(input: $input) {
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
			memberProperties
			memberRank
			memberArticles
			memberPoints
			memberLikes
			memberViews
			memberWarnings
			memberBlocks
			deletedAt
			createdAt
			updatedAt
			accessToken
		}
	}
`;

/**************************
 *        CATALOG         *
 *************************/

/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const UPDATE_BOARD_ARTICLE_BY_ADMIN = gql`
	mutation UpdateBoardArticleByAdmin($input: BoardArticleUpdate!) {
		updateBoardArticleByAdmin(input: $input) {
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
		}
	}
`;

export const REMOVE_BOARD_ARTICLE_BY_ADMIN = gql`
	mutation RemoveBoardArticleByAdmin($input: String!) {
		removeBoardArticleByAdmin(articleId: $input) {
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
		}
	}
`;

/**************************
 *         COMMENT        *
 *************************/

export const REMOVE_COMMENT_BY_ADMIN = gql`
	mutation RemoveCommentByAdmin($input: String!) {
		removeCommentByAdmin(commentId: $input) {
			_id
			commentStatus
			commentGroup
			commentContent
			commentRefId
			memberId
			createdAt
			updatedAt
		}
	}
`;

export const CREATE_RESORT = gql`
	mutation CreateResort($input: ResortInput!) {
		createResort(input: $input) {
			_id
		}
	}
`;
export const UPDATE_RESORT_BY_ADMIN = gql`
	mutation UpdateResortByAdmin($input: ResortUpdate!) {
		updateResortByAdmin(input: $input) {
			_id
			resortStatus
		}
	}
`;
export const REMOVE_RESORT_BY_ADMIN = gql`
	mutation RemoveResortByAdmin($resortId: String!) {
		removeResortByAdmin(resortId: $resortId) {
			_id
		}
	}
`;
export const CREATE_EQUIPMENT = gql`
	mutation CreateEquipment($input: EquipmentInput!) {
		createEquipment(input: $input) {
			_id
		}
	}
`;
export const UPDATE_EQUIPMENT_BY_ADMIN = gql`
	mutation UpdateEquipmentByAdmin($input: EquipmentUpdate!) {
		updateEquipmentByAdmin(input: $input) {
			_id
			equipmentStatus
		}
	}
`;
export const REMOVE_EQUIPMENT_BY_ADMIN = gql`
	mutation RemoveEquipmentByAdmin($equipmentId: String!) {
		removeEquipmentByAdmin(equipmentId: $equipmentId) {
			_id
		}
	}
`;
export const APPROVE_INSTRUCTOR_APPLICATION_BY_ADMIN = gql`
	mutation ApproveInstructorApplicationByAdmin($applicationId: String!) {
		approveInstructorApplicationByAdmin(applicationId: $applicationId) {
			_id
			applicationStatus
		}
	}
`;
export const REJECT_INSTRUCTOR_APPLICATION_BY_ADMIN = gql`
	mutation RejectInstructorApplicationByAdmin($input: InstructorApplicationReject!) {
		rejectInstructorApplicationByAdmin(input: $input) {
			_id
			applicationStatus
			rejectionReason
		}
	}
`;
