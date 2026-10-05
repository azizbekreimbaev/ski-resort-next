import { CatalogDomain, CatalogInquiry } from './types/catalog';
import { ResortFacilities, ResortLevel, ResortLocation } from './enums/resort.enum';
import { EquipmentAudience, EquipmentCategory } from './enums/equipment.enum';

export const catalogSorts = {
	resort: [
		'createdAt',
		'updatedAt',
		'resortTitle',
		'resortPricePerDay',
		'resortLikes',
		'resortViews',
		'resortComments',
	],
	equipment: ['createdAt', 'updatedAt', 'equipmentName', 'equipmentLikes', 'equipmentViews', 'equipmentComments'],
	instructor: ['createdAt', 'updatedAt', 'memberLikes', 'memberViews', 'memberRank'],
};
export const defaultInquiry = (domain: CatalogDomain): CatalogInquiry => ({
	page: 1,
	limit: 9,
	sort: domain === 'instructor' ? 'memberRank' : 'createdAt',
	direction: 'DESC',
	search: {},
});
export const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);
export const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
export const parseCatalogInquiry = (domain: CatalogDomain, raw: string | string[] | undefined): CatalogInquiry => {
	const input = defaultInquiry(domain);
	try {
		const value: unknown = typeof raw === 'string' ? JSON.parse(raw) : null;
		if (!isObject(value)) return input;
		if (typeof value.page === 'number' && Number.isInteger(value.page) && value.page >= 1 && value.page <= 2147483647)
			input.page = value.page;
		if (typeof value.sort === 'string' && catalogSorts[domain].includes(value.sort)) input.sort = value.sort;
		if (value.direction === 'ASC' || value.direction === 'DESC') input.direction = value.direction;
		if (!isObject(value.search)) return input;
		const search = value.search;
		if (typeof search.text === 'string' && search.text.trim()) input.search.text = search.text.trim();
		const arrays: Record<string, string[]> =
			domain === 'resort'
				? {
						locationList: Object.values(ResortLocation),
						levelList: Object.values(ResortLevel),
						facilities: Object.values(ResortFacilities),
				  }
				: domain === 'equipment'
				? { categoryList: Object.values(EquipmentCategory), audienceList: Object.values(EquipmentAudience) }
				: {};
		Object.entries(arrays).forEach(([key, allowed]) => {
			const values = search[key];
			if (Array.isArray(values)) {
				const selected = values.filter((item): item is string => typeof item === 'string' && allowed.includes(item));
				if (selected.length) input.search[key] = Array.from(new Set(selected));
			}
		});
		if (domain === 'equipment') {
			if (validId(search.resortId)) input.search.resortId = search.resortId;
			if (typeof search.equipmentBrand === 'string' && search.equipmentBrand.trim())
				input.search.equipmentBrand = search.equipmentBrand.trim();
			if (Array.isArray(search.sizeList)) {
				const sizes = search.sizeList
					.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
					.map((item) => item.trim());
				if (sizes.length) input.search.sizeList = sizes;
			}
			if (typeof search.equipmentPurchasable === 'boolean')
				input.search.equipmentPurchasable = search.equipmentPurchasable;
			if (
				typeof search.rentalDurationHours === 'number' &&
				Number.isInteger(search.rentalDurationHours) &&
				search.rentalDurationHours >= 1 &&
				search.rentalDurationHours <= 2147483647
			)
				input.search.rentalDurationHours = search.rentalDurationHours;
		}
		for (const key of domain === 'resort'
			? ['pricesRange']
			: domain === 'equipment'
			? ['rentalPricesRange', 'purchasePricesRange']
			: []) {
			const range = search[key];
			if (
				isObject(range) &&
				typeof range.start === 'number' &&
				typeof range.end === 'number' &&
				Number.isFinite(range.start) &&
				Number.isFinite(range.end) &&
				range.start >= 0 &&
				range.end >= range.start &&
				(key !== 'rentalPricesRange' || input.search.rentalDurationHours)
			) {
				input.search[key] = { start: range.start, end: range.end };
				if (key === 'purchasePricesRange') input.search.equipmentPurchasable = true;
			}
		}
	} catch {
		return input;
	}
	return input;
};
