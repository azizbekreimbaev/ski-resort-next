import React, { useState } from 'react';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { Alert, Backdrop, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { googleLogIn, logIn, signUp } from '../../libs/auth';
import { getGoogleIdToken, googleLoginEnabled } from '../../libs/auth/firebase';
import { ApolloError } from '@apollo/client';
import { FirebaseError } from 'firebase/app';
import BrandLogo from '../../libs/components/common/BrandLogo';
import ThemeControl from '../../libs/components/common/ThemeControl';
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});
function Join() {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [login, setLogin] = useState(true);
	const [input, setInput] = useState({ nick: '', password: '', phone: '' });
	const [pending, setPending] = useState(false);
	const [loadingMessage, setLoadingMessage] = useState('Signing in...');
	const [redirecting, setRedirecting] = useState(false);
	const [error, setError] = useState('');
	const [googleToken, setGoogleToken] = useState('');
	const redirect = async () => {
		setLoadingMessage('You are signed in. Opening your account...');
		setRedirecting(true);
		const referrer = router.query.referrer;
		await router.push(
			typeof referrer === 'string' && referrer.startsWith('/') && !referrer.startsWith('//') ? referrer : '/mypage',
		);
	};
	const startGoogleLogin = async () => {
		if (pending) return;
		setPending(true);
		setLoadingMessage('Waiting for Google...');
		setError('');
		let idToken = '';
		try {
			idToken = await getGoogleIdToken();
			setLoadingMessage('Signing in...');
			await googleLogIn({ idToken });
			await redirect();
		} catch (failure) {
			if (
				failure instanceof ApolloError &&
				failure.graphQLErrors.some((item) => item.message === 'GOOGLE_PROFILE_REQUIRED')
			) {
				setGoogleToken(idToken);
			} else if (
				!(
					failure instanceof FirebaseError &&
					(failure.code === 'auth/popup-closed-by-user' || failure.code === 'auth/cancelled-popup-request')
				)
			) {
				setError(failure instanceof Error ? failure.message : t('Authentication failed'));
			}
		} finally {
			setRedirecting(false);
			setPending(false);
		}
	};
	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (pending) return;
		setPending(true);
		setLoadingMessage(
			googleToken ? 'Completing your profile...' : login ? 'Signing in...' : 'Creating your account...',
		);
		setError('');
		try {
			if (googleToken) {
				await googleLogIn({ idToken: googleToken, memberNick: input.nick.trim(), memberPhone: input.phone.trim() });
				setGoogleToken('');
			} else if (login) await logIn(input.nick, input.password);
			else await signUp(input.nick, input.password, input.phone, 'USER');
			await redirect();
		} catch (failure) {
			setError(failure instanceof Error ? failure.message : t('Authentication failed'));
		} finally {
			setRedirecting(false);
			setPending(false);
		}
	};
	return (
		<Stack className="catalog-page auth-page">
			<Backdrop open={redirecting} sx={{ zIndex: (theme) => theme.zIndex.modal + 1, backdropFilter: 'blur(6px)' }}>
				<Stack
					role="status"
					alignItems="center"
					spacing={2}
					sx={{ p: 4, mx: 2, borderRadius: 3, bgcolor: 'background.paper', color: 'text.primary', boxShadow: 8 }}
				>
					<CircularProgress size={36} />
					<Typography>{t('You are signed in. Opening your account...')}</Typography>
				</Stack>
			</Backdrop>
			<div className="auth-visual">
				<h2>{t('Your next winter escape')}</h2>
				<p>{t('Discover ski resorts for your next adventure in South Korea.')}</p>
			</div>
			<Stack
				component="form"
				className="auth-form"
				onSubmit={submit}
				aria-busy={pending}
				sx={{ width: '100%', maxWidth: 440 }}
			>
				<Stack className="auth-heading">
					<BrandLogo />
					<ThemeControl />
					<Typography component="h1" variant="h5">
						{t(googleToken ? 'Complete your Google profile' : login ? 'Login' : 'Register')}
					</Typography>
				</Stack>
				<TextField
					disabled={pending}
					label={t('Nickname')}
					InputLabelProps={{ shrink: true }}
					required
					inputProps={{ minLength: 3, maxLength: 12 }}
					autoComplete="username"
					value={input.nick}
					onChange={(event) => setInput({ ...input, nick: event.target.value })}
				/>
				{!googleToken && (
					<TextField
						disabled={pending}
						type="password"
						label={t('Password')}
						InputLabelProps={{ shrink: true }}
						required
						inputProps={{ minLength: 3, maxLength: 12 }}
						autoComplete={login ? 'current-password' : 'new-password'}
						value={input.password}
						onChange={(event) => setInput({ ...input, password: event.target.value })}
					/>
				)}
				{(!login || googleToken) && (
					<TextField
						disabled={pending}
						required
						label={t('Phone')}
						InputLabelProps={{ shrink: true }}
						autoComplete="tel"
						value={input.phone}
						onChange={(event) => setInput({ ...input, phone: event.target.value })}
					/>
				)}
				{error && <Alert severity="error">{error}</Alert>}
				{pending && !redirecting && (
					<Stack
						role="status"
						direction="row"
						alignItems="center"
						spacing={1.5}
						sx={{ color: 'text.secondary', py: 1 }}
					>
						<CircularProgress size={20} />
						<Typography variant="body2">{t(loadingMessage)}</Typography>
					</Stack>
				)}
				<Button
					type="submit"
					variant="contained"
					disabled={pending}
					startIcon={pending ? <CircularProgress size={18} color="inherit" /> : undefined}
				>
					{t(googleToken ? 'Complete profile' : login ? 'Login' : 'Register')}
				</Button>
				{googleToken ? (
					<Button
						disabled={pending}
						onClick={() => {
							setGoogleToken('');
							setError('');
						}}
					>
						{t('Cancel')}
					</Button>
				) : (
					<Button
						type="button"
						variant="outlined"
						disabled={pending || !googleLoginEnabled}
						onClick={startGoogleLogin}
						sx={{
							minHeight: 48,
							borderRadius: 2,
							textTransform: 'none',
							fontWeight: 600,
							borderColor: 'divider',
							color: 'text.primary',
							bgcolor: 'background.paper',
							'&:hover': { borderColor: 'text.secondary', bgcolor: 'action.hover' },
						}}
						startIcon={
							<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
								<path
									fill="#4285F4"
									d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.42h11c-.47 2.39-1.87 4.42-3.96 5.78v4.8h6.4c3.74-3.45 6.17-8.54 6.17-14.08z"
								/>
								<path
									fill="#34A853"
									d="M24 44c5.4 0 9.93-1.79 13.24-4.85l-6.4-4.8c-1.78 1.2-4.07 1.93-6.84 1.93-5.22 0-9.65-3.52-11.24-8.26H6.15v4.96A20 20 0 0 0 24 44z"
								/>
								<path
									fill="#FBBC05"
									d="M12.76 28.02A12 12 0 0 1 12.13 24c0-1.4.23-2.75.63-4.02v-4.96H6.15A20 20 0 0 0 4 24c0 3.23.77 6.28 2.15 8.98z"
								/>
								<path
									fill="#EA4335"
									d="M24 11.72c2.94 0 5.58 1.01 7.65 3l5.74-5.74A19.2 19.2 0 0 0 24 4 20 20 0 0 0 6.15 15.02l6.61 4.96C14.35 15.24 18.78 11.72 24 11.72z"
								/>
							</svg>
						}
					>
						{t('Continue with Google')}
					</Button>
				)}
				{!googleLoginEnabled && <Typography variant="caption">{t('Google login is not available yet')}</Typography>}
				<Button
					disabled={pending || Boolean(googleToken)}
					onClick={() => {
						setLogin(!login);
						setError('');
					}}
				>
					{t(login ? 'Register' : 'Login')}
				</Button>
			</Stack>
		</Stack>
	);
}
export default withLayoutBasic(Join);
