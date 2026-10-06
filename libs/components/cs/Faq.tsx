import React from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'next-i18next';
export default function Faq() {
	const { t } = useTranslation('common');
	const entries = [
		[
			'How do I save favorites?',
			'Sign in and select the heart on a Resort or Equipment card. Your saved items appear in My Favorites.',
		],
		[
			'Do trip dates check availability?',
			'Dates are trip preferences. Catalog pages do not check availability or create bookings.',
		],
		[
			'How can I become an Instructor?',
			'Submit an Instructor application from My Page. An administrator reviews your application.',
		],
		[
			'How are rental prices displayed?',
			'Each rental package shows its configured duration and price. Checkout is a local demo and does not charge or reserve items.',
		],
	];
	return (
		<Stack spacing={2}>
			{entries.map(([question, answer]) => (
				<Accordion key={question}>
					<AccordionSummary expandIcon={<ExpandMoreIcon />}>
						<Typography>{t(question)}</Typography>
					</AccordionSummary>
					<AccordionDetails>
						<Typography>{t(answer)}</Typography>
					</AccordionDetails>
				</Accordion>
			))}
		</Stack>
	);
}
