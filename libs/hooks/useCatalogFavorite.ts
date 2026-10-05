import { makeVar, useApolloClient, useMutation, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { userVar } from '../../apollo/store';
import { LIKE_TARGET_RESORT, LIKE_TARGET_EQUIPMENT } from '../../apollo/user/mutation';
import { sweetMixinErrorAlert } from '../sweetAlert';

const pendingFavorites = makeVar(new Set<string>());

export default function useCatalogFavorite(domain: 'resort' | 'equipment') {
	const user = useReactiveVar(userVar);
	const client = useApolloClient();
	const { t } = useTranslation('common');
	const active = useReactiveVar(pendingFavorites);
	const pending = new Set(
		Array.from(active)
			.filter((key) => key.startsWith(`${domain}:`))
			.map((key) => key.slice(domain.length + 1)),
	);
	const [mutate] = useMutation(domain === 'resort' ? LIKE_TARGET_RESORT : LIKE_TARGET_EQUIPMENT);
	const toggle = async (id: string) => {
		const key = `${domain}:${id}`;
		if (pendingFavorites().has(key)) return;
		if (!user._id) {
			await sweetMixinErrorAlert(t('Please sign in to save favorites.'));
			return;
		}
		pendingFavorites(new Set(pendingFavorites()).add(key));
		try {
			await mutate({ variables: domain === 'resort' ? { resortId: id } : { equipmentId: id } });
			const affected =
				domain === 'resort'
					? ['GetResorts', 'GetResort', 'GetFavoriteResorts', 'GetVisitedResorts']
					: ['GetEquipments', 'GetEquipment', 'GetFavoriteEquipments', 'GetVisitedEquipments'];
			const active = Array.from(client.getObservableQueries('active').values())
				.map((query) => query.queryName)
				.filter((name): name is string => Boolean(name && affected.includes(name)));
			await client.refetchQueries({ include: Array.from(new Set(active)) });
		} catch {
			await sweetMixinErrorAlert(t('Unable to update favorites. Please try again.'));
		} finally {
			const remaining = new Set(pendingFavorites());
			remaining.delete(key);
			pendingFavorites(remaining);
		}
	};
	return { pending, toggle };
}
