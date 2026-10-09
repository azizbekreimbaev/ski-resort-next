import { GetServerSideProps } from 'next';
import { siteOrigin } from '../libs/components/common/Seo';

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
	const origin = siteOrigin();
	if (!origin) {
		res.statusCode = 503;
		res.end('Configure NEXT_PUBLIC_SITE_URL before publishing the sitemap.');
		return { props: {} };
	}
	const paths = [
		'/',
		'/resort',
		'/instructor',
		'/equipment',
		'/community',
		'/events',
		'/about',
		'/cs/faq',
		'/snow-reports',
	];
	const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
	const urls = ['en', 'kr', 'ru'].flatMap((locale) =>
		paths.map((path) => `<url><loc>${escape(`${origin}${locale === 'en' ? '' : `/${locale}`}${path}`)}</loc></url>`),
	);
	res.setHeader('Content-Type', 'application/xml; charset=utf-8');
	res.setHeader('Cache-Control', 'public, max-age=3600');
	res.end(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join(
			'',
		)}</urlset>`,
	);
	return { props: {} };
};
export default function Sitemap() {
	return null;
}
