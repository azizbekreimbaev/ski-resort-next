import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	Button,
	Chip,
	CircularProgress,
	MenuItem,
	Pagination,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'next-i18next';
import { GET_FAQS, GET_ADMIN_FAQS } from '../../../apollo/faq';
import { FaqList as FaqResults, FaqStatus } from '../../types/faq';
export default function FaqList({ admin = false }: { admin?: boolean }) {
	const { t } = useTranslation('common');
	const [text, setText] = useState('');
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState<FaqStatus | ''>('');
	const [sort, setSort] = useState('createdAt');
	const [page, setPage] = useState(1);
	const { data, loading, error, refetch } = useQuery<{ getFaqs?: FaqResults; getAllFaqsByAdmin?: FaqResults }>(
		admin ? GET_ADMIN_FAQS : GET_FAQS,
		{
			variables: {
				input: {
					page,
					limit: 10,
					sort,
					direction: 'DESC',
					search: { ...(search ? { text: search } : {}), ...(admin && status ? { faqStatus: status } : {}) },
				},
			},
			fetchPolicy: 'network-only',
			notifyOnNetworkStatusChange: true,
		},
	);
	const result = admin ? data?.getAllFaqsByAdmin : data?.getFaqs;
	const total = result?.metaCounter[0]?.total ?? 0;
	const pages = Math.max(1, Math.ceil(total / 10));
	useEffect(() => {
		if (!loading && !error && result && page > pages) setPage(pages);
	}, [loading, error, result, page, pages]);
	return (
		<Stack className="faq-list" spacing={3}>
			<Stack
				component="form"
				className="faq-search"
				direction={{ xs: 'column', sm: 'row' }}
				gap={2}
				onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
					e.preventDefault();
					setSearch(text.trim());
					setPage(1);
				}}
			>
				<TextField
					fullWidth
					label={t('Search questions and answers')}
					value={text}
					onChange={(e) => setText(e.target.value)}
				/>
				<Button type="submit" variant="contained">
					{t('Search')}
				</Button>
				<Button
					onClick={() => {
						setText('');
						setSearch('');
						setStatus('');
						setSort('createdAt');
						setPage(1);
					}}
				>
					{t('Reset')}
				</Button>
			</Stack>
			<Stack className="faq-filters" direction={{ xs: 'column', sm: 'row' }} gap={2}>
				{admin && (
					<TextField
						select
						SelectProps={{ displayEmpty: true }}
						InputLabelProps={{ shrink: true }}
						label={t('Status')}
						sx={{ minWidth: 170 }}
						value={status}
						onChange={(e) => {
							setStatus(e.target.value as FaqStatus | '');
							setPage(1);
						}}
					>
						<MenuItem value="">{t('All statuses')}</MenuItem>
						<MenuItem value="DRAFT">{t('Draft')}</MenuItem>
						<MenuItem value="PUBLISHED">{t('Published')}</MenuItem>
					</TextField>
				)}
				<TextField
					select
					label={t('Sort')}
					sx={{ minWidth: 190 }}
					value={sort}
					onChange={(e) => {
						setSort(e.target.value);
						setPage(1);
					}}
				>
					<MenuItem value="createdAt">{t('Newest Added')}</MenuItem>
					<MenuItem value="updatedAt">{t('Recently Updated')}</MenuItem>
				</TextField>
				<Typography aria-live="polite">{t('FAQ results', { count: total })}</Typography>
			</Stack>
			{loading ? (
				<CircularProgress aria-label={t('Loading')} />
			) : error ? (
				<Alert severity="error" action={<Button onClick={() => void refetch()}>{t('Retry')}</Button>}>
					{error.message}
				</Alert>
			) : !result?.list.length ? (
				<Alert severity="info">{t('No FAQs found. Try another search or check back soon.')}</Alert>
			) : (
				<div className="faq-entries">
					{result.list.map((faq) => (
						<Accordion
							key={faq._id}
							disableGutters
							sx={{
								border: '1px solid #e2e8f0',
								boxShadow: 'none',
								mb: 2,
								borderRadius: '12px !important',
								'&:before': { display: 'none' },
							}}
						>
							<AccordionSummary
								expandIcon={<ExpandMore />}
								id={`faq-${faq._id}-heading`}
								aria-controls={`faq-${faq._id}-answer`}
							>
								<Stack direction="row" gap={2} alignItems="center">
									<Typography fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>
										{faq.faqQuestion}
									</Typography>
									{admin && (
										<Chip
											size="small"
											label={t(faq.faqStatus === 'DRAFT' ? 'Draft' : 'Published')}
											color={faq.faqStatus === 'PUBLISHED' ? 'success' : 'default'}
										/>
									)}
								</Stack>
							</AccordionSummary>
							<AccordionDetails>
								<Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', mb: 2 }}>
									{faq.faqAnswer}
								</Typography>
								<Stack direction="row" gap={1}>
									<Button component={Link} href={admin ? `/_admin/faq/detail?id=${faq._id}` : `/cs/faq?id=${faq._id}`}>
										{t('View FAQ')}
									</Button>
									{admin && (
										<Button component={Link} href={`/_admin/faq/edit?id=${faq._id}`}>
											{t('Edit')}
										</Button>
									)}
								</Stack>
							</AccordionDetails>
						</Accordion>
					))}
				</div>
			)}
			{!loading && !error && pages > 1 && (
				<Pagination page={page} count={pages} onChange={(_e, value) => setPage(value)} />
			)}
		</Stack>
	);
}
