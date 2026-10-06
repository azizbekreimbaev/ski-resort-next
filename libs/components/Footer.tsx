import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
const groups = [
	{
		title: 'Explore',
		links: [
			['Ski Resorts', '/resort'],
			['Instructors', '/instructor'],
			['Equipment Rental', '/equipment'],
			['Equipment Shop', '/equipment?input=%7B%22search%22%3A%7B%22equipmentPurchasable%22%3Atrue%7D%7D'],
			['Lift Pass Rates', '/cs?tab=lift-passes'],
		],
	},
	{
		title: 'Community & Events',
		links: [
			['Community Board', '/community'],
			['Snow Condition Reports', '/snow-reports'],
			['Competitions & Camps', '/events'],
			['Winter Festivals', '/events'],
		],
	},
	{
		title: 'Company',
		links: [
			['About Us', '/about'],
			['Terms of Service', '/cs?tab=terms'],
			['Privacy Policy', '/cs?tab=privacy'],
			['Help Center', '/cs?tab=faq'],
		],
	},
];
export default function Footer() {
	const { t } = useTranslation('common');
	const router = useRouter();
	return (
		<footer className="snowkr-footer">
			<div className="snowkr-container">
				<div className="snowkr-footer-grid">
					<div>
						<Link href="/" className="snowkr-logo">
							SNOWKR
						</Link>
						<p>
							{t(
								'The platform for discovering ski resorts, finding coaches, and renting or buying winter sports equipment across South Korea.',
							)}
						</p>
						<small>
							© {new Date().getFullYear()} SNOWKR Inc. {t('All rights reserved.')}
						</small>
					</div>
					{groups.map((group) => (
						<div key={group.title}>
							<h3>{t(group.title)}</h3>
							{group.links.map(([label, href]) => (
								<Link key={label} href={href}>
									{t(label)}
								</Link>
							))}
						</div>
					))}
				</div>
				<div className="snowkr-footer-bottom">
					<div>
						<button onClick={() => void router.push(router.asPath, router.asPath, { locale: 'en' })}>
							English (EN)
						</button>{' '}
						/ <button onClick={() => void router.push(router.asPath, router.asPath, { locale: 'kr' })}>한국어</button>
						<span>KRW (₩)</span>
					</div>
					<span>{t('Alpine Winter Sports Platform in Korea')}</span>
				</div>
			</div>
		</footer>
	);
}
