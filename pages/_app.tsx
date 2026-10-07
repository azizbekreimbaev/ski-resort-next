import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import React, { useState } from 'react';
import { light } from '../scss/MaterialTheme';
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
import Chat from '../libs/components/Chat';
const App = ({ Component, pageProps }: AppProps) => {
	// @ts-ignore
	const [theme, setTheme] = useState(createTheme(light));
	const client = useApollo(pageProps.initialApolloState);
	return (
		<ApolloProvider client={client}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<Component {...pageProps} />
				<Chat />
			</ThemeProvider>
		</ApolloProvider>
	);
};
export default appWithTranslation(App);
