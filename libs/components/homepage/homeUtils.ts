import { REACT_APP_API_URL } from '../../config';

export const homeImageUrl = (image: string | null | undefined): string => {
	if (!image) return '';
	if (/^https?:\/\//i.test(image)) return image;
	if (!REACT_APP_API_URL || REACT_APP_API_URL === 'undefined') return '';
	return `${REACT_APP_API_URL.replace(/\/$/, '')}/${image.replace(/^\//, '')}`;
};

export const homePrice = (value: number, language: string): string =>
	new Intl.NumberFormat(language === 'kr' ? 'ko-KR' : language, {
		style: 'currency',
		currency: 'KRW',
		maximumFractionDigits: 0,
	}).format(value);
