import type { AppProps } from 'next/app';
import { CssBaseline } from '@mui/material';
import React from 'react';
import ColorModeProvider from '../libs/context/ColorMode';
import Seo from '../libs/components/common/Seo';
import { ApolloProvider } from '@apollo/client';
import { useApollo } from '../apollo/client';
import { appWithTranslation } from 'next-i18next';
import '../scss/app.scss';
import '../scss/pc/main.scss';
import '../scss/mobile/main.scss';
import '../scss/home-discovery.scss';
import '../scss/snowkr.scss';
import '../scss/instructor-directory.scss';
import '../scss/instructor-detail.scss';
import '../scss/events.scss';
import '../scss/faq.scss';
import '../scss/admin-overview.scss';
import '../scss/cart-checkout.scss';
import '../scss/chat.scss';
import '../scss/dark-palette.css';
import '../scss/color-mode.scss';
import Chat from '../libs/components/Chat';
const App = ({ Component, pageProps }: AppProps) => {
	const client = useApollo(pageProps.initialApolloState);
	return (
		<ApolloProvider client={client}>
			<ColorModeProvider>
				<Seo />
				<CssBaseline />
				<Component {...pageProps} />
				<Chat />
			</ColorModeProvider>
		</ApolloProvider>
	);
};
export default appWithTranslation(App);
