import { parseCatalogInquiry, isObject } from './catalogSearch';
import { CatalogInquiry } from './types/catalog';
import { EquipmentPreview, EquipmentPreviewData } from './types/equipment/equipment';

export const equipmentSortOptions = [
	{ value: 'createdAt:DESC', label: 'Newest' },
	{ value: 'equipmentLikes:DESC', label: 'Popular' },
	{ value: 'equipmentViews:DESC', label: 'Most viewed' },
	{ value: 'purchasePrice:DESC', label: 'Price high to low' },
	{ value: 'purchasePrice:ASC', label: 'Price low to high' },
];

export function parseEquipmentInput(raw: string | string[] | undefined): CatalogInquiry {
	const input = parseCatalogInquiry('equipment', raw);
	try {
		const value: unknown = typeof raw === 'string' ? JSON.parse(raw) : null;
		if (isObject(value) && value.sort === 'purchasePrice') input.sort = 'purchasePrice';
	} catch {
		/* The shared parser already supplies safe defaults. */
	}
	if (!equipmentSortOptions.some((option) => option.value === `${input.sort}:${input.direction}`)) {
		input.sort = 'createdAt';
		input.direction = 'DESC';
	}
	if (!Array.isArray(input.search.categoryList) || input.search.categoryList.length !== 1) delete input.search.sizeList;
	return input;
}

// The API has no price sort. Collect every matching page before sorting and paginating.
// Rental-only records have no purchase price and always follow purchasable records.
export async function collectEquipmentPrices(
	request: (input: CatalogInquiry) => Promise<EquipmentPreviewData>,
	input: CatalogInquiry,
	cancelled: () => boolean = () => false,
): Promise<EquipmentPreview[]> {
	const items = new Map<string, EquipmentPreview>();
	for (let page = 1; ; page++) {
		if (cancelled()) return [];
		const data = await request({ ...input, page, limit: 100, sort: 'createdAt', direction: 'DESC' });
		if (cancelled()) return [];
		const result = data.getEquipments;
		result.list.forEach((item) => items.set(item._id, item));
		const total = result.metaCounter[0]?.total ?? 0;
		if (page * 100 >= total) break;
		if (!result.list.length) throw new Error('Incomplete equipment collection');
	}
	return Array.from(items.values()).sort((a, b) => {
		const left = a.equipmentPurchasable ? a.equipmentPurchasePrice : null;
		const right = b.equipmentPurchasable ? b.equipmentPurchasePrice : null;
		if (left == null && right != null) return 1;
		if (right == null && left != null) return -1;
		return (
			(left != null && right != null ? (left - right) * (input.direction === 'ASC' ? 1 : -1) : 0) ||
			a._id.localeCompare(b._id)
		);
	});
}
