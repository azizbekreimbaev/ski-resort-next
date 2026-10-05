import React, { useEffect, useState } from 'react';
import { useMutation, useReactiveVar } from '@apollo/client';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { userVar } from '../../../apollo/store';
import { UPDATE_MEMBER } from '../../../apollo/user/mutation';
import { updateStorage, updateUserInfo } from '../../auth';
import { uploadImages } from '../../uploadImages';
import { homeImageUrl } from '../homepage/homeUtils';
export default function MyProfile() {
	const user = useReactiveVar(userVar);
	const { t } = useTranslation('common');
	const [form, setForm] = useState({
		memberNick: '',
		memberPhone: '',
		memberFullName: '',
		memberAddress: '',
		memberDesc: '',
		memberImage: '',
	});
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);
	const [uploading, setUploading] = useState(false);
	useEffect(() => {
		setForm({
			memberNick: user.memberNick,
			memberPhone: user.memberPhone,
			memberFullName: user.memberFullName ?? '',
			memberAddress: user.memberAddress ?? '',
			memberDesc: user.memberDesc ?? '',
			memberImage: user.memberImage ?? '',
		});
	}, [user]);
	const [update, state] = useMutation<{ updateMember: { accessToken: string } }>(UPDATE_MEMBER);
	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError('');
		setSuccess(false);
		try {
			const result = await update({ variables: { input: { _id: user._id, ...form } } });
			const token = result.data?.updateMember.accessToken;
			if (!token) throw new Error(t('Unable to save'));
			updateStorage({ jwtToken: token });
			updateUserInfo(token);
			setSuccess(true);
		} catch (failure) {
			setError(failure instanceof Error ? failure.message : t('Unable to save'));
		}
	};
	const upload = async (files: FileList | null) => {
		if (!files?.length) return;
		setUploading(true);
		try {
			const images = await uploadImages([files[0]], 'member');
			setForm((previous) => ({ ...previous, memberImage: images[0] }));
			setError('');
		} catch {
			setError(t('Upload failed'));
		} finally {
			setUploading(false);
		}
	};
	return (
		<Stack component="form" spacing={3} onSubmit={submit}>
			<Typography component="h1" variant="h4">
				{t('My Profile')}
			</Typography>
			<img
				className="profile-avatar"
				src={homeImageUrl(form.memberImage) || '/img/profile/defaultUser.svg'}
				alt={form.memberNick}
			/>
			<Button component="label" disabled={uploading}>
				{t('Upload Profile Image')}
				<input hidden type="file" accept="image/jpeg,image/png" onChange={(event) => void upload(event.target.files)} />
			</Button>
			{(['memberNick', 'memberPhone', 'memberFullName', 'memberAddress', 'memberDesc'] as const).map((key) => (
				<TextField
					key={key}
					label={t(key)}
					required={key === 'memberNick' || key === 'memberPhone'}
					inputProps={key === 'memberNick' ? { minLength: 3, maxLength: 12 } : {}}
					multiline={key === 'memberDesc'}
					value={form[key]}
					onChange={(event) => setForm({ ...form, [key]: event.target.value })}
				/>
			))}
			{error && <Alert severity="error">{error}</Alert>}
			{success && <Alert severity="success">{t('Saved successfully')}</Alert>}
			<Button variant="contained" type="submit" disabled={state.loading || uploading}>
				{t('Update Profile')}
			</Button>
		</Stack>
	);
}
