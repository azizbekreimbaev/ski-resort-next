import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
	Alert,
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	MenuItem,
	Pagination,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { useTranslation } from 'next-i18next';
import {
	GET_ALL_INSTRUCTOR_APPLICATIONS_BY_ADMIN,
	GET_INSTRUCTOR_APPLICATION_BY_ADMIN,
} from '../../../apollo/admin/query';
import {
	APPROVE_INSTRUCTOR_APPLICATION_BY_ADMIN,
	REJECT_INSTRUCTOR_APPLICATION_BY_ADMIN,
} from '../../../apollo/admin/mutation';
import { Application, CatalogList } from '../../types/catalog';
import HomeCollectionState from '../homepage/HomeCollectionState';

export default function InstructorApplications() {
	const { t } = useTranslation('common');
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState('PENDING');
	const [memberId, setMemberId] = useState('');
	const [selected, setSelected] = useState<string | null>(null);
	const [reason, setReason] = useState('');
	const [failure, setFailure] = useState('');
	const { data, loading, error, refetch } = useQuery<{ getAllInstructorApplicationsByAdmin: CatalogList<Application> }>(
		GET_ALL_INSTRUCTOR_APPLICATIONS_BY_ADMIN,
		{
			variables: {
				input: {
					page,
					limit: 10,
					sort: 'createdAt',
					direction: 'DESC',
					search: {
						...(status ? { applicationStatus: status } : {}),
						...(/^[a-f\d]{24}$/i.test(memberId) ? { memberId } : {}),
					},
				},
			},
			fetchPolicy: 'network-only',
		},
	);
	const detail = useQuery<{ getInstructorApplicationByAdmin: Application }>(GET_INSTRUCTOR_APPLICATION_BY_ADMIN, {
		variables: { applicationId: selected },
		skip: !selected,
		fetchPolicy: 'network-only',
	});
	const application = detail.data?.getInstructorApplicationByAdmin;
	const [approve, approveState] = useMutation(APPROVE_INSTRUCTOR_APPLICATION_BY_ADMIN);
	const [reject, rejectState] = useMutation(REJECT_INSTRUCTOR_APPLICATION_BY_ADMIN);
	const review = async (approval: boolean) => {
		if (!selected || (!approval && !reason.trim())) return;
		if (approval && !window.confirm(t('Approve this application and promote the Member?'))) return;
		try {
			await (approval ? approve : reject)({
				variables: approval
					? { applicationId: selected }
					: { input: { _id: selected, rejectionReason: reason.trim() } },
			});
			await refetch();
			await detail.refetch();
			setFailure('');
			setReason('');
		} catch (failure) {
			setFailure(failure instanceof Error ? failure.message : t('Unable to review application'));
			await Promise.allSettled([refetch(), detail.refetch()]);
		}
	};
	const total = data?.getAllInstructorApplicationsByAdmin.metaCounter?.[0]?.total ?? 0;
	return (
		<Stack className="catalog-admin" spacing={3}>
			<Typography component="h1" variant="h4">
				{t('Instructor applications')}
			</Typography>
			<TextField
				label={t('Member ID')}
				value={memberId}
				error={Boolean(memberId && !/^[a-f\d]{24}$/i.test(memberId))}
				onChange={(event) => {
					setMemberId(event.target.value);
					setPage(1);
				}}
			/>
			<TextField
				select
				label={t('Status')}
				value={status}
				onChange={(event) => {
					setStatus(event.target.value);
					setPage(1);
				}}
			>
				<MenuItem value="">{t('All')}</MenuItem>
				{['PENDING', 'APPROVED', 'REJECTED'].map((value) => (
					<MenuItem key={value} value={value}>
						{t(value)}
					</MenuItem>
				))}
			</TextField>
			<HomeCollectionState
				loading={loading}
				error={Boolean(error)}
				empty={!data?.getAllInstructorApplicationsByAdmin.list.length}
				retry={refetch}
			/>
			{data?.getAllInstructorApplicationsByAdmin.list.map((item) => (
				<Button
					key={item._id}
					onClick={() => {
						setSelected(item._id);
						setReason('');
						setFailure('');
					}}
				>
					{item.memberId} · {t(item.applicationStatus)} · {new Date(item.createdAt).toLocaleDateString()}
				</Button>
			))}
			{total > 10 && (
				<Pagination page={page} count={Math.ceil(total / 10)} onChange={(_event, next) => setPage(next)} />
			)}
			<Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth>
				<DialogTitle>{t('Instructor application')}</DialogTitle>
				<DialogContent>
					<Stack spacing={2}>
						<HomeCollectionState
							loading={detail.loading}
							error={Boolean(detail.error)}
							empty={false}
							retry={detail.refetch}
						/>
						{application && (
							<>
								<Typography>
									{t('Member ID')}: {application.memberId}
								</Typography>
								<Typography>{t(application.applicationStatus)}</Typography>
								<Typography>
									{t('Experience years')}: {application.instructorExperienceYears}
								</Typography>
								<Typography>{application.instructorLanguages.join(', ')}</Typography>
								<Typography>
									{t(`Instructor level ${application.instructorLevel}`)} ·{' '}
									{t(`Audience ${application.instructorAudience}`)}
								</Typography>
								<Typography>{application.memberDesc}</Typography>
								{application.instructorResortId && (
									<Typography>
										{t('Resort')}: {application.instructorResortId}
									</Typography>
								)}
								{application.rejectionReason && <Typography>{application.rejectionReason}</Typography>}
								{application.applicationStatus === 'PENDING' && (
									<>
										<Button
											variant="contained"
											disabled={approveState.loading || rejectState.loading}
											onClick={() => void review(true)}
										>
											{t('Approve')}
										</Button>
										<TextField
											label={t('Rejection reason')}
											multiline
											value={reason}
											onChange={(event) => setReason(event.target.value)}
										/>
										<Button
											color="error"
											disabled={!reason.trim() || approveState.loading || rejectState.loading}
											onClick={() => void review(false)}
										>
											{t('Reject')}
										</Button>
									</>
								)}
							</>
						)}
						{failure && <Alert severity="error">{failure}</Alert>}
						<Button onClick={() => setSelected(null)}>{t('Close')}</Button>
					</Stack>
				</DialogContent>
			</Dialog>
		</Stack>
	);
}
