import React, { useState } from 'react';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { logIn, signUp } from '../../libs/auth';
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
		<Stack className="catalog-page" alignItems="center">
			<Stack component="form" onSubmit={submit} spacing={3} sx={{ width: '100%', maxWidth: 440 }}>
				<Typography variant="h3">SkiResort</Typography>
				<Typography component="h1" variant="h5">
					{t(login ? 'Login' : 'Register')}
				</Typography>
				<TextField
					label={t('Nickname')}
					required
					inputProps={{ minLength: 3, maxLength: 12 }}
					autoComplete="username"
					value={input.nick}
					onChange={(event) => setInput({ ...input, nick: event.target.value })}
				/>
				<TextField
					type="password"
					label={t('Password')}
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
