import React, { useState } from 'react';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { logIn, signUp } from '../../libs/auth';
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
	const [error, setError] = useState('');
	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (pending) return;
		setPending(true);
		setError('');
		try {
			if (login) await logIn(input.nick, input.password);
			else await signUp(input.nick, input.password, input.phone, 'USER');
			const referrer = router.query.referrer;
			await router.push(
				typeof referrer === 'string' && referrer.startsWith('/') && !referrer.startsWith('//') ? referrer : '/mypage',
			);
		} catch (failure) {
			setError(failure instanceof Error ? failure.message : t('Authentication failed'));
		} finally {
			setPending(false);
		}
	};
	return (
		<Stack className="catalog-page auth-page">
			<div className="auth-visual">
				<h2>{t('Your next winter escape')}</h2>
				<p>{t('Discover ski resorts for your next adventure in South Korea.')}</p>
			</div>
			<Stack component="form" className="auth-form" onSubmit={submit} sx={{ width: '100%', maxWidth: 440 }}>
				<Stack className="auth-heading">
					<BrandLogo />
					<ThemeControl />
					<Typography component="h1" variant="h5">
						{t(login ? 'Login' : 'Register')}
					</Typography>
				</Stack>
				<TextField
					label={t('Nickname')}
					InputLabelProps={{ shrink: true }}
					required
					inputProps={{ minLength: 3, maxLength: 12 }}
					autoComplete="username"
					value={input.nick}
					onChange={(event) => setInput({ ...input, nick: event.target.value })}
				/>
				<TextField
					type="password"
					label={t('Password')}
					InputLabelProps={{ shrink: true }}
					required
					inputProps={{ minLength: 3, maxLength: 12 }}
					autoComplete={login ? 'current-password' : 'new-password'}
					value={input.password}
					onChange={(event) => setInput({ ...input, password: event.target.value })}
				/>
				{!login && (
					<TextField
						required
						label={t('Phone')}
						InputLabelProps={{ shrink: true }}
						autoComplete="tel"
						value={input.phone}
						onChange={(event) => setInput({ ...input, phone: event.target.value })}
					/>
				)}
				{error && <Alert severity="error">{error}</Alert>}
				<Button type="submit" variant="contained" disabled={pending}>
					{t(login ? 'Login' : 'Register')}
				</Button>
				<Button
					disabled={pending}
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
