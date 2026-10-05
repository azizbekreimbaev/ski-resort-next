import React, { useEffect, useState } from 'react';
import { Button, Dialog, Stack } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { homeImageUrl } from '../homepage/homeUtils';

export default function ResourceGallery({
	images,
	title,
	fallback = '/img/hero/winter-1.jpg',
}: {
	images: string[] | null;
	title: string;
	fallback?: string;
}) {
	const { t } = useTranslation('common');
	const [index, setIndex] = useState(0);
	const [open, setOpen] = useState(false);
	useEffect(() => {
		setIndex(0);
		setOpen(false);
	}, [title]);
	const sources = images?.length ? images : [fallback];
	const photo = (
		<img
			className="resource-gallery-main"
			src={homeImageUrl(sources[index]) || fallback}
			alt={title}
			onError={(event) => {
				if (!event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback;
			}}
		/>
	);
	return (
		<Stack spacing={2}>
			<Button className="resource-gallery-open" onClick={() => setOpen(true)} aria-label={t('Open gallery')}>
				{photo}
			</Button>
			<Stack direction="row" spacing={1} sx={{ overflowX: 'auto' }}>
				{sources.map((image, i) => (
					<Button
						key={`${image}-${i}`}
						aria-label={`${t('Image')} ${i + 1}`}
						aria-pressed={i === index}
						onClick={() => setIndex(i)}
					>
						<img
							className="resource-gallery-thumbnail"
							src={homeImageUrl(image) || fallback}
							alt=""
							onError={(event) => {
								if (!event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback;
							}}
						/>
					</Button>
				))}
			</Stack>
			<Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
				<Stack p={2} spacing={2}>
					<Button onClick={() => setOpen(false)}>{t('Close')}</Button>
					{photo}
					<Stack direction="row" justifyContent="space-between">
						<Button disabled={index === 0} onClick={() => setIndex(index - 1)}>
							{t('Previous')}
						</Button>
						<Button disabled={index >= sources.length - 1} onClick={() => setIndex(index + 1)}>
							{t('Next')}
						</Button>
					</Stack>
				</Stack>
			</Dialog>
		</Stack>
	);
}
