import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html lang="en">
			<Head>
				<meta name="robots" content="index,follow" />
				<link rel="icon" type="image/svg+xml" href="/img/logo/favicon.svg" />

				{/* SEO */}
				<meta name="keywords" content="SkiResort, ski resorts, skiing, snowboarding, South Korea" />
				<meta
					name="description"
					content="Discover South Korea's ski resorts, explore ski and snowboard equipment, and meet instructors with SkiResort."
				/>
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
