import { DocumentNode } from 'graphql';
import { NormalizedCacheObject, useApolloClient, useMutation, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';

const targets = {
	LikeTargetResort: ['Resort', 'likeTargetResort', 'resortLikes', 'resortId'],
	LikeTargetEquipment: ['Equipment', 'likeTargetEquipment', 'equipmentLikes', 'equipmentId'],
	LikeTargetMember: ['Member', 'likeTargetMember', 'memberLikes', 'input'],
	LikeTargetBoardArticle: ['BoardArticle', 'likeTargetBoardArticle', 'articleLikes', 'input'],
} as const;

export default function useOptimisticLike(document: DocumentNode) {
	const client = useApolloClient();
	const user = useReactiveVar(userVar);
	const [mutate, state] = useMutation(document);
	const toggle: typeof mutate = (options) => {
		const operation = document.definitions.find((definition) => definition.kind === 'OperationDefinition');
		const name = operation?.kind === 'OperationDefinition' ? operation.name?.value : undefined;
		const target = targets[name as keyof typeof targets];
		if (!target) return mutate(options);
		const [typename, field, counter, variable] = target;
		const variables = options?.variables as Record<string, string> | undefined;
		const id = variables?.[variable];
		const cacheId = client.cache.identify({ __typename: typename, _id: id });
		const snapshot = client.cache.extract(true) as NormalizedCacheObject;
		const existing = cacheId ? snapshot[cacheId] : undefined;
		const count = existing?.[counter];
		if (!existing || typeof count !== 'number') return mutate(options);
		const favorites = existing.meLiked as { myFavorite?: boolean }[] | undefined;
		const liked = !favorites?.some((item) => item.myFavorite);
		return mutate({
			...options,
			optimisticResponse: {
				[field]: { ...existing, [counter]: Math.max(0, count + (liked ? 1 : -1)) },
			},
			update(cache) {
				cache.modify({
					id: cacheId,
					fields: {
						meLiked: () =>
							liked ? [{ __typename: 'MeLiked', memberId: user._id, likeRefId: id, myFavorite: true }] : [],
					},
				});
			},
		});
	};
	return [toggle, state] as const;
}
