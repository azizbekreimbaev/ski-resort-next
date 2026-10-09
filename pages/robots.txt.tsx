import { GetServerSideProps } from 'next';
import { siteOrigin } from '../libs/components/common/Seo';

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
	const origin = siteOrigin();
	res.setHeader('Content-Type', 'text/plain; charset=utf-8');
	res.setHeader('Cache-Control', 'public, max-age=3600');
	// Allow crawlers to read the noindex directive on private pages.
	res.end(`User-agent: *\nAllow: /\nDisallow: /api/\n${origin ? `Sitemap: ${origin}/sitemap.xml\n` : ''}`);
	return { props: {} };
};
export default function Robots() {
	return null;
}
