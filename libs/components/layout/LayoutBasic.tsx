import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Head from 'next/head';
import Top from '../Top';
import Footer from '../Footer';
import { Stack } from '@mui/material';
import { getJwtToken, updateUserInfo } from '../../auth';
import Chat from '../Chat';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { useTranslation } from 'next-i18next';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const withLayoutBasic = (Component: any) => {
	return function LayoutBasic(props: any) {
		const router = useRouter();
		const { t, i18n } = useTranslation('common');
		const device = useDeviceDetect();
		const authHeader = router.pathname === '/account/join';
		const user = useReactiveVar(userVar);

		const memoizedValues = useMemo(() => {
			let title = '',
				desc = '';

			switch (router.pathname) {
				case '/resort/detail':
				case '/resort':
					title = 'Resort Search';
					desc = 'Home / Resorts';
					break;
				case '/instructor':
					title = 'Instructors';
					desc = 'Home / Instructors';
					break;
				case '/equipment/detail':
				case '/equipment':
					title = 'Equipments';
					desc = 'Home / Equipments';
					break;
				case '/instructor/detail':
					title = 'Instructor Profile';
					desc = 'Home / Instructors';
					break;
				case '/mypage':
					title = 'my page';
					desc = 'Home / My Page';
					break;
				case '/community':
					title = 'Community';
					desc = 'Home / Community';
					break;
				case '/community/detail':
					title = 'Community Detail';
					desc = 'Home / Community';
					break;
				case '/cs':
					title = 'CS';
					desc = 'We are glad to see you again!';
					break;
				case '/account/join':
					title = 'Login/Signup';
					desc = 'Authentication Process';
					break;
				case '/member':
					title = 'Member Page';
					desc = 'Home / Members';
					break;
				default:
					break;
			}

			return { title, desc };
		}, [router.pathname]);

		/** LIFECYCLES **/
		useEffect(() => {
			const jwt = getJwtToken();
			if (jwt) updateUserInfo(jwt);
		}, []);

		/** HANDLERS **/

		if (device == 'mobile') {
			return (
				<>
					<Head>
						<title>SkiResort</title>
						<meta name={'title'} content={`SkiResort`} />
					</Head>
					<Stack id="mobile-wrap">
						<Stack id={'top'}>
							<Top />
						</Stack>

						<Stack id={'main'}>
							<Component {...props} />
						</Stack>

						<Stack id={'footer'}>
							<Footer />
						</Stack>
					</Stack>
				</>
			);
		} else {
			return (
				<>
					<Head>
						<title>SkiResort</title>
						<meta name={'title'} content={`SkiResort`} />
					</Head>
					<Stack id="pc-wrap">
						<Stack id={'top'}>
							<Top />
						</Stack>

						<Stack className={`header-basic skiresort-banner ${authHeader ? 'auth' : ''}`}>
							<Stack className={'container'}>
								<strong>{t(memoizedValues.title)}</strong>
								<span>{t(memoizedValues.desc)}</span>
							</Stack>
						</Stack>

						<Stack id={'main'}>
							<Component {...props} />
						</Stack>

						<Chat />

						<Stack id={'footer'}>
							<Footer />
						</Stack>
					</Stack>
				</>
			);
		}
	};
};

export default withLayoutBasic;
