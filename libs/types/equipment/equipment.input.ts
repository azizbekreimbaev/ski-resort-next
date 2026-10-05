import { EquipmentCategory } from '../../enums/equipment.enum';
import { Direction } from '../../enums/common.enum';

export interface EquipmentPreviewInquiry {
	page: number;
	limit: number;
	sort: 'createdAt';
	direction: Direction;
	search: { categoryList?: EquipmentCategory[] };
}
