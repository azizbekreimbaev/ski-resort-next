import { InMemoryCache } from '@apollo/client';

export function createApolloCache() {
	return new InMemoryCache({
		typePolicies: {
			Query: {
				fields: {
					// List and count-only admin queries share these argument-keyed envelopes.
					// Preserve omitted fields; incoming lists still replace the previous page.
					getAllMembersByAdmin: { merge: true },
					getAllResortsByAdmin: { merge: true },
					getAllEquipmentsByAdmin: { merge: true },
					getAllInstructorApplicationsByAdmin: { merge: true },
				},
			},
			// Viewer-like results are complete snapshots, including an empty array.
			Resort: { fields: { meLiked: { merge: false } } },
			Equipment: { fields: { meLiked: { merge: false } } },
		},
	});
}
