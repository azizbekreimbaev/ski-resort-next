import { Html, Head, Main, NextScript, DocumentProps } from 'next/document';

export default function Document({ locale }: DocumentProps) {
	return (
		<Html lang={locale === 'kr' ? 'ko' : locale || 'en'}>
			<Head>
				<link rel="icon" type="image/svg+xml" href="/img/logo/snoway-icon.svg" />
				<meta name="application-name" content="SNOWAY" />
				<meta name="theme-color" content="#182435" media="(prefers-color-scheme: dark)" />
				<meta name="theme-color" content="#f8fafc" media="(prefers-color-scheme: light)" />
				<script dangerouslySetInnerHTML={{ __html: `(function(){var p='system';try{p=localStorage.getItem('snoway.color-mode')||'system'}catch(e){}document.documentElement.dataset.theme=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'})()` }} />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
 