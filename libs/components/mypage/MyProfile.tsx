import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useReactiveVar } from '@apollo/client';
import { Alert, Button, TextField } from '@mui/material';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
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
	const lock = useRef(false);
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
		if (lock.current) return;
		setError('');
		setSuccess(false);
		if (
			form.memberNick.trim().length < 3 ||
			form.memberNick.trim().length > 12 ||
			!form.memberPhone.trim() ||
			(form.memberFullName.trim() && (form.memberFullName.trim().length < 3 || form.memberFullName.trim().length > 100))
		) {
			setError(t('Please check the form values'));
			return;
		}
		lock.current = true;
		try {
			const result = await update({
				variables: {
					input: {
						_id: user._id,
						...form,
						memberNick: form.memberNick.trim(),
						memberPhone: form.memberPhone.trim(),
						memberFullName: form.memberFullName.trim() || null,
					},
				},
			});
			const token = result.data?.updateMember.accessToken;
			if (!token) throw new Error(t('Unable to save'));
			updateStorage({ jwtToken: token });
			updateUserInfo(token);
			setSuccess(true);
		} catch (failure) {
			setError(failure instanceof Error ? failure.message : t('Unable to save'));
		} finally {
			lock.current = false;
		}
	};
	const upload = async (file?: File) => {
		if (!file || lock.current) return;
		setSuccess(false);
		if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
			setError(t('Choose a JPG or PNG image up to 5 MB.'));
			return;
		}
		lock.current = true;
		setUploading(true);
		try {
			const images = await uploadImages([file], 'member');
			if (!images[0]) throw new Error();
			setForm((previous) => ({ ...previous, memberImage: images[0] }));
			setError('');
		} catch {
			setError(t('Upload failed'));
		} finally {
			lock.current = false;
			setUploading(false);
		}
	};
	const busy = state.loading || uploading;
	const labels = {
		memberNick: 'Handle / Nickname',
		memberFullName: 'Full Name',
		memberAddress: 'Address',
		memberPhone: 'Phone Number',
		memberDesc: 'Bio Statement',
	};
	return (
		<form className="account-profile-form" onSubmit={submit}>
			<div className="account-section-heading">
				<div>
					<h2>{t('Member Profile & Security')}</h2>
					<p>{t('Manage your public information, avatar, and contact details.')}</p>
				</div>
				<Button variant="contained" type="submit" startIcon={<SaveOutlined />} disabled={busy}>
					{t('Save Changes')}
				</Button>
			</div>
			<div className="account-photo">
				<img src={homeImageUrl(form.memberImage) || '/img/profile/defaultUser.svg'} alt={form.memberNick} />
				<div>
					<h3>{t('Profile Picture')}</h3>
					<p>{t('PNG or JPG. Recommended 400×400. Max 5 MB.')}</p>
					<Button component="label" variant="outlined" disabled={busy}>
						{t(uploading ? 'Uploading...' : 'Change Photo')}
						<input
							hidden
							type="file"
							accept="image/jpeg,image/png"
							onChange={(event) => {
								void upload(event.target.files?.[0]);
								event.target.value = '';
							}}
						/>
					</Button>
					<Button
						color="error"
						disabled={busy}
						onClick={() => {
							setSuccess(false);
							setForm((previous) => ({ ...previous, memberImage: '' }));
						}}
					>
						{t('Remove')}
					</Button>
				</div>
			</div>
			<div className="account-form-grid">
				{(['memberNick', 'memberFullName', 'memberAddress', 'memberPhone', 'memberDesc'] as const).map((key) => (
					<TextField
						key={key}
						label={t(labels[key])}
						disabled={busy}
						required={key === 'memberNick' || key === 'memberPhone'}
						inputProps={
							key === 'memberNick'
								? { minLength: 3, maxLength: 12 }
								: key === 'memberFullName'
								? { minLength: 3, maxLength: 100 }
								: {}
						}
						multiline={key === 'memberDesc'}
						minRows={key === 'memberDesc' ? 3 : undefined}
						className={key === 'memberDesc' ? 'account-full-field' : ''}
						value={form[key]}
						onChange={(event) => {
							setSuccess(false);
							setForm({ ...form, [key]: event.target.value });
						}}
					/>
				))}
			</div>
			{error && <Alert severity="error">{error}</Alert>}
			{success && <Alert severity="success">{t('Saved successfully')}</Alert>}
		</form>
	);
}
