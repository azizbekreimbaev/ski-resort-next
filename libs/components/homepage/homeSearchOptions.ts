import { ResortLocation } from '../../enums/resort.enum';

export const homeRegions = [
	{
		value: 'gangwon',
		label: 'Gangwon-do',
		locations: [
			ResortLocation.PYEONGCHANG,
			ResortLocation.JEONGSEON,
			ResortLocation.HONGCHEON,
			ResortLocation.CHUNCHEON,
			ResortLocation.WONJU,
			ResortLocation.HOENGSEONG,
			ResortLocation.YANGYANG,
		],
	},
	{
		value: 'gyeonggi',
		label: 'Gyeonggi-do',
		locations: [ResortLocation.GWANGJU_GYEONGGI, ResortLocation.ICHEON, ResortLocation.POCHEON],
	},
	{ value: 'jeonbuk', label: 'Jeonbuk', locations: [ResortLocation.MUJU] },
];

export const homeRegionLabel = (location: ResortLocation) =>
	homeRegions.find((region) => region.locations.includes(location))?.label ?? location;
