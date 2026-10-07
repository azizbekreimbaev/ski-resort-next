import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html lang="en">
			<Head>
				<meta name="robots" content="index,follow" />
				<link rel="icon" type="image/svg+xml" href="/img/logo/snoway-icon.svg" />

				{/* SEO */}
				<meta name="keywords" content="SNOWAY, ski resorts, skiing, snowboarding, South Korea" />
				<meta
					name="description"
					content="Discover South Korea's ski resorts, explore ski and snowboard equipment, and meet instructors with SNOWAY."
				/>
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
