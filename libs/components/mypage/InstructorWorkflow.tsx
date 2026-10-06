import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Alert, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { GET_INSTRUCTOR, GET_MY_INSTRUCTOR_APPLICATION } from '../../../apollo/user/query';
import { CREATE_INSTRUCTOR_APPLICATION, UPDATE_INSTRUCTOR_PROFILE } from '../../../apollo/user/mutation';
import { Application, CatalogMember } from '../../types/catalog';
import { InstructorAudience, InstructorLevel } from '../../enums/instructor.enum';
import { updateStorage, updateUserInfo } from '../../auth';
import useMemberSession from '../../hooks/useMemberSession';
import ResortSelect from '../common/ResortSelect';
import HomeCollectionState from '../homepage/HomeCollectionState';

export default function InstructorWorkflow() {
	const { t } = useTranslation('common');
	const { user, ready } = useMemberSession();
	const profile = user.memberType === 'INSTRUCTOR';
	const [form, setForm] = useState({
		experience: '',
		languages: '',
		level: '',
		audience: '',
		resort: '',
		bio: '',
		prices: ['', '', '', ''],
	});
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);
	const submitting = useRef(false);
	const application = useQuery<{ getMyInstructorApplication: Application | null }>(GET_MY_INSTRUCTOR_APPLICATION, {
		skip: !ready || !user._id || profile,
		fetchPolicy: 'network-only',
	});
	const member = useQuery<{ getMember: CatalogMember }>(GET_INSTRUCTOR, {
		variables: { memberId: user._id },
		skip: !ready || !profile,
	});
	useEffect(() => {
		const current = member.data?.getMember;
		if (current)
			setForm({
				experience: current.instructorExperienceYears == null ? '' : String(current.instructorExperienceYears),
				languages: current.instructorLanguages?.join(', ') ?? '',
				level: current.instructorLevel ?? '',
				audience: current.instructorAudience ?? '',
				resort: current.instructorResortId ?? '',
				bio: '',
				prices: [
					current.instructorPrice1Week,
					current.instructorPrice2Weeks,
					current.instructorPrice3Weeks,
					current.instructorPrice4Weeks,
				].map((price) => (price == null ? '' : String(price))),
			});
	}, [member.data]);
	const [create, createState] = useMutation(CREATE_INSTRUCTOR_APPLICATION);
	const [update, updateState] = useMutation<{ updateInstructorProfile: { accessToken: string } }>(
		UPDATE_INSTRUCTOR_PROFILE,
	);
	const current = application.data?.getMyInstructorApplication;
	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (submitting.current) return;
		setError('');
		setSuccess(false);
		const languages = form.languages
			.split(',')
			.map((value) => value.trim())
			.filter(Boolean);
		const experience = form.experience === '' ? null : Number(form.experience);
		if (
			(!profile && (experience == null || !languages.length || !form.level || !form.audience)) ||
			(experience != null && (!Number.isInteger(experience) || experience < 0)) ||
			form.prices.some((price) => price !== '' && (!Number.isFinite(Number(price)) || Number(price) < 0))
		) {
			setError(t('Please check the form values'));
			return;
		}
		const input = {
			instructorExperienceYears: experience,
			instructorLanguages: languages.length ? languages : null,
			instructorLevel: form.level || null,
			instructorAudience: form.audience || null,
			instructorResortId: form.resort || null,
		};
		submitting.current = true;
		try {
			if (profile) {
				const result = await update({
					variables: {
						input: {
							...input,
							...Object.fromEntries(
								['instructorPrice1Week', 'instructorPrice2Weeks', 'instructorPrice3Weeks', 'instructorPrice4Weeks'].map(
									(key, index) => [key, form.prices[index] === '' ? null : Number(form.prices[index])],
								),
							),
						},
					},
				});
				const token = result.data?.updateInstructorProfile.accessToken;
				if (token) {
					updateStorage({ jwtToken: token });
					updateUserInfo(token);
				}
				await member.refetch();
			} else {
				await create({ variables: { input: { ...input, memberDesc: form.bio || null } } });
				await application.refetch();
			}
			setSuccess(true);
		} catch (failure) {
			setError(failure instanceof Error ? failure.message : t('Unable to save'));
		} finally {
			submitting.current = false;
		}
	};
	if (!ready || !user._id) return null;
	return (
		<Stack spacing={3}>
			<Typography component="h1" variant="h4">
				{t(profile ? 'Instructor profile' : 'Instructor application')}
			</Typography>
			<HomeCollectionState
				loading={profile ? member.loading : application.loading}
				error={Boolean(profile ? member.error : application.error)}
				empty={false}
				retry={profile ? member.refetch : application.refetch}
			/>
			{current && (
				<Alert severity={current.applicationStatus === 'REJECTED' ? 'warning' : 'info'}>
					{t(current.applicationStatus)}
					{current.rejectionReason ? `: ${current.rejectionReason}` : ''}
					{current.applicationStatus === 'APPROVED' && ` — ${t('Sign in again to activate your Instructor role.')}`}
				</Alert>
			)}
			{!(profile ? member.loading || member.error : application.loading || application.error) &&
				(profile ||
					(user.memberType === 'USER' &&
						current?.applicationStatus !== 'PENDING' &&
						current?.applicationStatus !== 'APPROVED')) && (
					<Stack component="form" onSubmit={submit} spacing={2}>
						<TextField
							type="number"
							inputProps={{ min: 0, step: 1 }}
							required={!profile}
							label={t('Experience years')}
							value={form.experience}
							onChange={(event) => setForm({ ...form, experience: event.target.value })}
						/>
						<TextField
							required={!profile}
							label={t('Languages separated by commas')}
							value={form.languages}
							onChange={(event) => setForm({ ...form, languages: event.target.value })}
						/>
						<TextField
							select
							required={!profile}
							label={t('Instructor level')}
							value={form.level}
							onChange={(event) => setForm({ ...form, level: event.target.value })}
						>
							<MenuItem value="">{t('Not configured')}</MenuItem>
							{Object.values(InstructorLevel).map((level) => (
								<MenuItem key={level} value={level}>
									{t(`Instructor level ${level}`)}
								</MenuItem>
							))}
						</TextField>
						<TextField
							select
							required={!profile}
							label={t('Audience')}
							value={form.audience}
							onChange={(event) => setForm({ ...form, audience: event.target.value })}
						>
							<MenuItem value="">{t('Not configured')}</MenuItem>
							{Object.values(InstructorAudience).map((audience) => (
								<MenuItem key={audience} value={audience}>
									{t(`Audience ${audience}`)}
								</MenuItem>
							))}
						</TextField>
						<ResortSelect value={form.resort} onChange={(resort) => setForm({ ...form, resort })} />
						{profile ? (
							form.prices.map((price, index) => (
								<TextField
									key={index}
									type="number"
									inputProps={{ min: 0 }}
									label={`${t('Weekly price')} (${index + 1})`}
									value={price}
									onChange={(event) =>
										setForm({
											...form,
											prices: form.prices.map((value, i) => (i === index ? event.target.value : value)),
										})
									}
								/>
							))
						) : (
							<TextField
								multiline
								label={t('Biography')}
								value={form.bio}
								onChange={(event) => setForm({ ...form, bio: event.target.value })}
							/>
						)}
						{error && <Alert severity="error">{error}</Alert>}
						{success && <Alert severity="success">{t('Saved successfully')}</Alert>}
						<Button variant="contained" type="submit" disabled={createState.loading || updateState.loading}>
							{t(profile ? 'Save' : 'Submit application')}
						</Button>
					</Stack>
				)}
		</Stack>
	);
}
