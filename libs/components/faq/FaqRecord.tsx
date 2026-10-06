import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import {
	Alert,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { useTranslation } from 'next-i18next';
import { CREATE_FAQ, GET_FAQ, GET_ADMIN_FAQ, UPDATE_FAQ, REMOVE_FAQ } from '../../../apollo/faq';
import { Faq, FaqInput, FaqStatus, FaqUpdate } from '../../types/faq';
function FaqEditor({ faq }: { faq?: Faq }) {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [question, setQuestion] = useState(faq?.faqQuestion ?? '');
	const [answer, setAnswer] = useState(faq?.faqAnswer ?? '');
	const [status, setStatus] = useState<FaqStatus>(faq?.faqStatus ?? 'DRAFT');
	const [failure, setFailure] = useState('');
	const [busy, setBusy] = useState(false);
	const lock = useRef(false);
	const [create] = useMutation<{ createFaq: Faq }, { input: FaqInput }>(CREATE_FAQ);
	const [update] = useMutation<{ updateFaqByAdmin: Faq }, { input: FaqUpdate }>(UPDATE_FAQ);
	const changed =
		!faq || question.trim() !== faq.faqQuestion || answer.trim() !== faq.faqAnswer || status !== faq.faqStatus;
	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (lock.current || !changed) return;
		if (!question.trim() || !answer.trim()) {
			setFailure(t('Enter a nonblank question and answer.'));
			return;
		}
		lock.current = true;
		setBusy(true);
		setFailure('');
		try {
			let id: string | undefined;
			if (faq) {
				const input: FaqUpdate = { _id: faq._id };
				if (question.trim() !== faq.faqQuestion) input.faqQuestion = question.trim();
				if (answer.trim() !== faq.faqAnswer) input.faqAnswer = answer.trim();
				if (status !== faq.faqStatus) input.faqStatus = status;
				const result = await update({ variables: { input } });
				id = result.data?.updateFaqByAdmin._id;
			} else {
				const result = await create({
					variables: { input: { faqQuestion: question.trim(), faqAnswer: answer.trim(), faqStatus: status } },
				});
				id = result.data?.createFaq._id;
			}
			if (!id) throw new Error(t('Could not save FAQ.'));
			await router.push(`/_admin/faq/detail?id=${id}`);
		} catch (error) {
			setFailure(error instanceof Error ? error.message : t('Could not save FAQ.'));
		} finally {
			lock.current = false;
			setBusy(false);
		}
	};
	return (
		<Stack
			component="form"
			className="faq-record faq-editor"
			spacing={3}
			onSubmit={submit}
			sx={{ maxWidth: 900, p: { xs: 2, sm: 4 }, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0' }}
		>
			{failure && <Alert severity="error">{failure}</Alert>}
			<TextField
				required
				multiline
				label={t('Question')}
				value={question}
				disabled={busy}
				onChange={(e) => setQuestion(e.target.value)}
			/>
			<TextField
				required
				multiline
				minRows={8}
				label={t('Answer')}
				helperText={t('Plain text only. Line breaks are preserved.')}
				value={answer}
				disabled={busy}
				onChange={(e) => setAnswer(e.target.value)}
			/>
			<TextField
				select
				label={t('Status')}
				value={status}
				disabled={busy}
				onChange={(e) => setStatus(e.target.value as FaqStatus)}
			>
				<MenuItem value="DRAFT">{t('Draft')}</MenuItem>
				<MenuItem value="PUBLISHED">{t('Published')}</MenuItem>
			</TextField>
			<Typography variant="body2">{t('Draft FAQs are visible only to administrators.')}</Typography>
			<Stack direction="row" gap={2}>
				<Button type="submit" variant="contained" disabled={busy || !changed}>
					{t(busy ? 'Saving...' : 'Save FAQ')}
				</Button>
				<Button component={Link} href="/_admin/faq" disabled={busy}>
					{t('Cancel')}
				</Button>
			</Stack>
		</Stack>
	);
}
export default function FaqRecord({
	admin = false,
	mode = 'detail',
}: {
	admin?: boolean;
	mode?: 'create' | 'edit' | 'detail';
}) {
	const router = useRouter();
	const { t, i18n } = useTranslation('common');
	const id = typeof router.query.id === 'string' ? router.query.id : '';
	const valid = /^[a-f\d]{24}$/i.test(id);
	const { data, loading, error, refetch } = useQuery<{ getFaq?: Faq; getFaqByAdmin?: Faq }, { faqId: string }>(
		admin ? GET_ADMIN_FAQ : GET_FAQ,
		{ variables: { faqId: id }, skip: mode === 'create' || !router.isReady || !valid, fetchPolicy: 'network-only' },
	);
	const faq = admin ? data?.getFaqByAdmin : data?.getFaq;
	const [confirm, setConfirm] = useState(false);
	const [failure, setFailure] = useState('');
	const [busy, setBusy] = useState(false);
	const lock = useRef(false);
	const [remove] = useMutation<{ removeFaqByAdmin: { _id: string } }, { faqId: string }>(REMOVE_FAQ);
	const deleteFaq = async () => {
		if (!admin || !faq || lock.current) return;
		lock.current = true;
		setBusy(true);
		setFailure('');
		try {
			const result = await remove({ variables: { faqId: faq._id } });
			if (!result.data?.removeFaqByAdmin._id) throw new Error(t('Could not delete FAQ.'));
			await router.push('/_admin/faq');
		} catch (error) {
			setFailure(error instanceof Error ? error.message : t('Could not delete FAQ.'));
		} finally {
			lock.current = false;
			setBusy(false);
		}
	};
	if (mode === 'create' && admin) return <FaqEditor />;
	if (!router.isReady || loading) return <CircularProgress aria-label={t('Loading')} />;
	if (!valid) return <Alert severity="error">{t('FAQ not found.')}</Alert>;
	if (error)
		return (
			<Alert severity="error" action={<Button onClick={() => void refetch()}>{t('Retry')}</Button>}>
				{error.message}
			</Alert>
		);
	if (!faq) return <Alert severity="info">{t('FAQ not found.')}</Alert>;
	if (admin && mode === 'edit') return <FaqEditor key={faq._id} faq={faq} />;
	const format = (date: string) =>
		new Intl.DateTimeFormat(i18n.language === 'kr' ? 'ko-KR' : i18n.language || 'en', {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone: 'Asia/Seoul',
		}).format(new Date(date));
	return (
		<Stack
			className="faq-record"
			spacing={3}
			sx={{ p: { xs: 2, sm: 4 }, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0' }}
		>
			<Typography component="h2" variant="h5" sx={{ overflowWrap: 'anywhere' }}>
				{faq.faqQuestion}
			</Typography>
			{admin && (
				<Stack spacing={1}>
					<Chip sx={{ alignSelf: 'flex-start' }} label={t(faq.faqStatus === 'DRAFT' ? 'Draft' : 'Published')} />
					<Typography variant="body2">
						{t('Created')}: {format(faq.createdAt)} (KST)
					</Typography>
					<Typography variant="body2">
						{t('Updated')}: {format(faq.updatedAt)} (KST)
					</Typography>
				</Stack>
			)}
			<Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{faq.faqAnswer}</Typography>
			<Stack direction="row" gap={2}>
				<Button component={Link} href={admin ? '/_admin/faq' : '/cs?tab=faq'}>
					{t('Back to FAQs')}
				</Button>
				{admin && (
					<>
						<Button component={Link} href={`/_admin/faq/edit?id=${faq._id}`} variant="contained">
							{t('Edit FAQ')}
						</Button>
						<Button
							color="error"
							onClick={() => {
								setFailure('');
								setConfirm(true);
							}}
						>
							{t('Delete FAQ')}
						</Button>
					</>
				)}
			</Stack>
			{admin && (
				<Dialog
					open={confirm}
					onClose={() => {
						if (!busy) setConfirm(false);
					}}
				>
					<DialogTitle>{t('Delete FAQ')}</DialogTitle>
					<DialogContent>
						<Typography sx={{ overflowWrap: 'anywhere', mb: 2 }}>{faq.faqQuestion}</Typography>
						<Typography>{t('This permanently deletes the FAQ. This action cannot be undone.')}</Typography>
						{failure && <Alert severity="error">{failure}</Alert>}
					</DialogContent>
					<DialogActions>
						<Button disabled={busy} onClick={() => setConfirm(false)}>
							{t('Cancel')}
						</Button>
						<Button disabled={busy} color="error" onClick={() => void deleteFaq()}>
							{t(busy ? 'Deleting...' : 'Delete')}
						</Button>
					</DialogActions>
				</Dialog>
			)}
		</Stack>
	);
}
