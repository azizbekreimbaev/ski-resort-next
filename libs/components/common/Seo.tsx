import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const description =
	'Discover South Korea’s ski resorts, find ski and snowboard equipment, and meet instructors. Plan your next winter adventure with SNOWAY.';
const sections: Record<string, string> = {
	resort: 'Ski Resorts',
	instructor: 'Ski & Snowboard Instructors',
	equipment: 'Ski & Snowboard Equipment',
	community: 'Winter Sports Community',
	events: 'Winter Events',
	about: 'About SNOWAY',
	cs: 'Help & FAQ',
};
export function siteOrigin() {
	try {
		const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || '');
		return /^https?:$/.test(url.protocol) ? url.origin : '';
	} catch {
		return '';
	}
}

export default function Seo({
	title,
	summary = description,
	image = '/img/social/snoway-share.jpg',
	imageAlt = 'SNOWAY — your next winter adventure in South Korea',
}: {
	title?: string;
	summary?: string;
	image?: string;
	imageAlt?: string;
}) {
	const router = useRouter();
	const path = router.asPath.split(/[?#]/)[0];
	const section = router.pathname.split('/')[1];
	const pageTitle = title || (sections[section] ? `${sections[section]} | SNOWAY` : 'SNOWAY | Winter in South Korea');
	const privatePage =
		/^\/(?:_admin|mypage|account|checkout|cart|booking|payment)(?:\/|$)/.test(path) ||
		/\/create[^/]*(?:\/|$)/.test(path) ||
		section === '404' ||
		section === '500';
	const origin = siteOrigin();
	const locale = router.locale || 'en';
	// Detail routes identify records by query string; keep identity while dropping tracking and filters.
	const identity = new URLSearchParams();
	if (/\/detail$/.test(path))
		['id', 'instructorId', 'articleId'].forEach((key) => {
			const value = router.query[key];
			if (typeof value === 'string') identity.set(key, value);
		});
	const canonicalPath = `${path}${identity.toString() ? `?${identity.toString()}` : ''}`;
	const localizedPath = `${locale !== router.defaultLocale ? `/${locale}` : ''}${canonicalPath}`;
	const url = origin ? `${origin}${localizedPath}` : '';
	const socialImage = /^https?:\/\//.test(image) ? image : `${origin}${image}`;
	return (
		<Head>
			<title>{pageTitle}</title>
			<meta name="viewport" content="width=device-width, initial-scale=1" />
			<meta name="description" content={summary} key="description" />
			<meta
				name="robots"
				content={
					privatePage ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
				}
				key="robots"
			/>
			{url && !privatePage && <link rel="canonical" href={url} key="canonical" />}
			{origin &&
				!privatePage &&
				(router.locales || ['en']).map((language) => (
					<link
						key={`alternate-${language}`}
						rel="alternate"
						hrefLang={language === 'kr' ? 'ko' : language}
						href={`${origin}${language !== router.defaultLocale ? `/${language}` : ''}${canonicalPath}`}
					/>
				))}
			{origin && !privatePage && (
				<link rel="alternate" hrefLang="x-default" href={`${origin}${canonicalPath}`} key="alternate-default" />
			)}
			<meta property="og:type" content="website" key="og:type" />
			<meta property="og:site_name" content="SNOWAY" key="og:site_name" />
			<meta property="og:title" content={pageTitle} key="og:title" />
			<meta property="og:description" content={summary} key="og:description" />
			{url && <meta property="og:url" content={url} key="og:url" />}
			<meta
				property="og:locale"
				content={locale === 'kr' ? 'ko_KR' : locale === 'ru' ? 'ru_RU' : 'en_US'}
				key="og:locale"
			/>
			<meta property="og:image" content={socialImage} key="og:image" />
			<meta property="og:image:alt" content={imageAlt} key="og:image:alt" />
			{image === '/img/social/snoway-share.jpg' && (
				<meta property="og:image:width" content="1200" key="og:image:width" />
			)}
			{image === '/img/social/snoway-share.jpg' && (
				<meta property="og:image:height" content="630" key="og:image:height" />
			)}
			<meta name="twitter:card" content="summary_large_image" key="twitter:card" />
			<meta name="twitter:title" content={pageTitle} key="twitter:title" />
			<meta name="twitter:description" content={summary} key="twitter:description" />
			<meta name="twitter:image" content={socialImage} key="twitter:image" />
			<meta name="twitter:image:alt" content={imageAlt} key="twitter:image:alt" />
		</Head>
	);
}
