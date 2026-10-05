import { gql } from '@apollo/client';

export const GET_RESORTS = gql`
	query GetResorts($input: ResortsInquiry!) {
		getResorts(input: $input) {
			list {
				_id
				resortTitle
				resortLocation
				resortAddress
				resortStatus
				resortPricePerDay
				resortMinDays
				resortLevel
				resortImages
				resortDesc
				resortFacilities
				resortLikes
				resortViews
				resortComments
				meLiked {
					myFavorite
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_EQUIPMENTS = gql`
	query GetEquipments($input: EquipmentsInquiry!) {
		getEquipments(input: $input) {
			list {
				_id
				resortId
				equipmentStatus
				equipmentQuantity
				equipmentLikes
				equipmentViews
				equipmentComments
				meLiked {
					myFavorite
				}
				equipmentName
				equipmentCategory
				equipmentAudience
				equipmentBrand
				equipmentSize
				equipmentImages
				equipmentDesc
				equipmentRentalRates {
					durationHours
					price
				}
				equipmentPurchasable
				equipmentPurchasePrice
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_INSTRUCTORS = gql`
	query GetInstructors($input: InstructorsInquiry!) {
		getInstructors(input: $input) {
			list {
				_id
				memberNick
				memberFullName
				memberImage
				memberDesc
				memberType
				memberStatus
				memberLikes
				memberViews
				instructorResortId
				meLiked {
					myFavorite
				}
				meFollowed {
					myFollowing
				}
				instructorExperienceYears
				instructorLanguages
				instructorLevel
				instructorAudience
				instructorPrice1Week
				instructorPrice2Weeks
				instructorPrice3Weeks
				instructorPrice4Weeks
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         MEMBER         *
 *************************/

export const GET_MEMBER = gql(`
query GetMember($input: String!) {
    getMember(memberId: $input) {
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
        memberArticles
        memberPoints
        memberLikes
        memberViews
        memberFollowings
				memberFollowers
        memberRank
        memberWarnings
        memberBlocks
        deletedAt
        createdAt
        updatedAt
        accessToken
        meFollowed {
					followingId
					followerId
					myFollowing
				}
    }
}
`);

/**************************
 *        CATALOG         *
 *************************/

/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const GET_BOARD_ARTICLE = gql`
	query GetBoardArticle($input: String!) {
		getBoardArticle(articleId: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			articleComments
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
			}
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
		}
	}
`;

export const GET_BOARD_ARTICLES = gql`
	query GetBoardArticles($input: BoardArticlesInquiry!) {
		getBoardArticles(input: $input) {
			list {
				_id
				articleCategory
				articleStatus
				articleTitle
				articleContent
				articleImage
				articleViews
				articleLikes
				articleComments
				memberId
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
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

/**************************
 *         FOLLOW        *
 *************************/
export const GET_MEMBER_FOLLOWERS = gql`
	query GetMemberFollowers($input: FollowInquiry!) {
		getMemberFollowers(input: $input) {
			list {
				_id
				followingId
				followerId
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				meFollowed {
					followingId
					followerId
					myFollowing
				}
				followerData {
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
					memberArticles
					memberPoints
					memberLikes
					memberViews
					memberComments
					memberFollowings
					memberFollowers
					memberRank
					memberWarnings
					memberBlocks
					deletedAt
					createdAt
					updatedAt
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MEMBER_FOLLOWINGS = gql`
	query GetMemberFollowings($input: FollowInquiry!) {
		getMemberFollowings(input: $input) {
			list {
				_id
				followingId
				followerId
				createdAt
				updatedAt
				followingData {
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
					memberArticles
					memberPoints
					memberLikes
					memberViews
					memberComments
					memberFollowings
					memberFollowers
					memberRank
					memberWarnings
					memberBlocks
					deletedAt
					createdAt
					updatedAt
					accessToken
				}
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				meFollowed {
					followingId
					followerId
					myFollowing
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

// Shared selections keep catalog/detail/history documents aligned with the code-first API.
export const resortFields = `_id resortTitle resortLocation resortAddress resortStatus resortPricePerDay resortMinDays resortLevel resortImages resortDesc resortFacilities resortLikes resortViews resortComments meLiked { myFavorite }`;
export const equipmentFields = `_id resortId equipmentStatus equipmentName equipmentCategory equipmentAudience equipmentBrand equipmentSize equipmentImages equipmentDesc equipmentRentalRates { durationHours price } equipmentPurchasable equipmentPurchasePrice equipmentQuantity equipmentLikes equipmentViews equipmentComments meLiked { myFavorite }`;
export const instructorFields = `_id memberType memberStatus memberNick memberFullName memberImage memberDesc memberLikes memberViews instructorResortId instructorExperienceYears instructorLanguages instructorLevel instructorAudience instructorPrice1Week instructorPrice2Weeks instructorPrice3Weeks instructorPrice4Weeks meLiked { myFavorite } meFollowed { myFollowing }`;
export const applicationFields = `_id memberId applicationStatus instructorExperienceYears instructorLanguages instructorLevel instructorAudience instructorResortId memberDesc rejectionReason reviewedAt createdAt`;
export const GET_RESORT = gql`query GetResort($resortId: String!) { getResort(resortId: $resortId) { ${resortFields} } }`;
export const GET_EQUIPMENT = gql`query GetEquipment($equipmentId: String!) { getEquipment(equipmentId: $equipmentId) { ${equipmentFields} } }`;
export const GET_INSTRUCTOR = gql`query GetInstructor($memberId: String!) { getMember(memberId: $memberId) { ${instructorFields} } }`;
export const GET_FAVORITE_RESORTS = gql`query GetFavoriteResorts($input: ResortsInquiry!) { getFavoriteResorts(input: $input) { list { ${resortFields} } metaCounter { total } } }`;
export const GET_VISITED_RESORTS = gql`query GetVisitedResorts($input: ResortsInquiry!) { getVisitedResorts(input: $input) { list { ${resortFields} } metaCounter { total } } }`;
export const GET_FAVORITE_EQUIPMENTS = gql`query GetFavoriteEquipments($input: EquipmentHistoryInquiry!) { getFavoriteEquipments(input: $input) { list { ${equipmentFields} } metaCounter { total } } }`;
export const GET_VISITED_EQUIPMENTS = gql`query GetVisitedEquipments($input: EquipmentsInquiry!) { getVisitedEquipments(input: $input) { list { ${equipmentFields} } metaCounter { total } } }`;
export const GET_MY_INSTRUCTOR_APPLICATION = gql`query GetMyInstructorApplication { getMyInstructorApplication { ${applicationFields} } }`;
