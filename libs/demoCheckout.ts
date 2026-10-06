import { ApolloClient, makeVar } from '@apollo/client';
import { GET_RESORT, GET_EQUIPMENT, GET_INSTRUCTOR } from '../apollo/user/query';
import { CatalogMember } from './types/catalog';
import { ResortSearchResult } from './types/resort/resort';
import { EquipmentPreview } from './types/equipment/equipment';
import { CartLine, isCartLine, validPrice, validDate, todayInKorea } from './demoCart';

export const checkoutBusy = makeVar(false);
export async function revalidateCart(
	client: ApolloClient<object>,
	lines: CartLine[],
): Promise<{ lines: CartLine[]; issues: string[]; changed: boolean }> {
	const issues: string[] = [];
	const updated = await Promise.all(
		lines.map(async (line) => {
			if (
				!isCartLine(line) ||
				(line.kind !== 'equipment-purchase' && (!validDate(line.start) || line.start < todayInKorea()))
			) {
				issues.push(line.title);
				return line;
			}
			try {
				let price: number | null | undefined;
				let title: string;
				if (line.kind === 'resort') {
					const { data } = await client.query<{ getResort: ResortSearchResult }>({
						query: GET_RESORT,
						variables: { resortId: line.resourceId },
						fetchPolicy: 'network-only',
					});
					const resource = data.getResort;
					if (
						resource.resortStatus === 'SOLD_OUT' ||
						resource.resortStatus === 'DELETE' ||
						line.days < resource.resortMinDays ||
						line.days > 365
					)
						throw new Error('Unavailable selection');
					price = resource.resortPricePerDay;
					title = resource.resortTitle;
				} else if (line.kind === 'instructor') {
					const { data } = await client.query<{ getMember: CatalogMember }>({
						query: GET_INSTRUCTOR,
						variables: { memberId: line.resourceId },
						fetchPolicy: 'network-only',
					});
					const resource = data.getMember;
					if (resource.memberType !== 'INSTRUCTOR' || resource.memberStatus !== 'ACTIVE')
						throw new Error('Unavailable instructor');
					price = [
						resource.instructorPrice1Week,
						resource.instructorPrice2Weeks,
						resource.instructorPrice3Weeks,
						resource.instructorPrice4Weeks,
					][line.weeks - 1];
					title = resource.memberFullName || resource.memberNick;
				} else {
					const { data } = await client.query<{ getEquipment: EquipmentPreview }>({
						query: GET_EQUIPMENT,
						variables: { equipmentId: line.resourceId },
						fetchPolicy: 'network-only',
					});
					const resource = data.getEquipment;
					if (resource.equipmentStatus !== 'AVAILABLE') throw new Error('Unavailable equipment');
					price =
						line.kind === 'equipment-purchase'
							? resource.equipmentPurchasable
								? resource.equipmentPurchasePrice
								: null
							: resource.equipmentRentalRates.find((rate) => rate.durationHours === line.durationHours)?.price;
					title = resource.equipmentName;
				}
				if (!validPrice(price)) throw new Error('Missing price');
				return { ...line, unitPrice: price, title };
			} catch {
				issues.push(line.title);
				return line;
			}
		}),
	);
	return {
		lines: updated,
		issues,
		changed: updated.some(
			(line, index) => line.unitPrice !== lines[index].unitPrice || line.title !== lines[index].title,
		),
	};
}
