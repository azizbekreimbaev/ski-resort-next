import React, { ReactNode } from 'react';
import Head from 'next/head';
import Top from '../Top';
import Footer from '../Footer';
import useMemberSession from '../../hooks/useMemberSession';
import { hydrateCart } from '../../demoCart';
import { useTranslation } from 'next-i18next';
export default function AppLayout({ children }: { children: ReactNode }) {
	const { t } = useTranslation('common');
	useMemberSession();
	React.useEffect(() => {
		hydrateCart();
		const sync = (event: StorageEvent) => {
			if (event.key === 'snowkr.demo.cart.v1') hydrateCart();
		};
		window.addEventListener('storage', sync);
		return () => window.removeEventListener('storage', sync);
	}, []);
	return (
		<div id="pc-wrap" className="snowkr-app">
			<Head>
				<title>SNOWKR | Winter in South Korea</title>
				<meta
					name="description"
					content="Discover Korean ski resorts, instructors and winter sports equipment with SNOWKR."
				/>
			</Head>
			<a className="skip-link" href="#main">
				{t('Skip to content')}
			</a>
			<Top />
			<main id="main" tabIndex={-1}>{children}</main>
			<Footer />
		</div>
	);
}
