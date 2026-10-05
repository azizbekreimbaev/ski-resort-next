import { EquipmentAudience, EquipmentCategory } from '../../enums/equipment.enum';

export interface EquipmentPreview {
	resortId?: string | null;
	equipmentStatus?: string;
	equipmentQuantity?: number;
	equipmentLikes?: number;
	equipmentViews?: number;
	equipmentComments?: number;
	meLiked?: { myFavorite: boolean }[] | null;
	_id: string;
	equipmentName: string;
	equipmentCategory: EquipmentCategory;
	equipmentAudience: EquipmentAudience;
	equipmentBrand: string | null;
	equipmentSize: string | null;
	equipmentImages: string[] | null;
	equipmentDesc: string | null;
	equipmentRentalRates: { durationHours: number; price: number }[];
	equipmentPurchasable: boolean;
	equipmentPurchasePrice: number | null;
}

export interface EquipmentPreviewData {
	getEquipments: { list: EquipmentPreview[]; metaCounter: { total: number }[] };
}
