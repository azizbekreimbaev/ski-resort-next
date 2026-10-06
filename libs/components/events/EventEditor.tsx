import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { useMutation } from '@apollo/client';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { CREATE_EVENT, UPDATE_EVENT, UPLOAD_EVENT_IMAGES } from '../../../apollo/events';
import { EventInput, EventStatus, SkiEvent, eventDateISO, koreaDateInput, validateEventFiles } from '../../types/event';
import { homeImageUrl as imageUrl } from '../homepage/homeUtils';

export default function EventEditor({
	event,
	onClose,
	onSaved,
	onReload,
}: {
	event: SkiEvent | null;
	onClose: () => void;
	onSaved: () => void;
	onReload: () => void;
}) {
	const { t } = useTranslation('common');
	const [title, setTitle] = useState(event?.eventTitle ?? '');
	const [description, setDescription] = useState(event?.eventDesc ?? '');
	const [start, setStart] = useState(event ? koreaDateInput(event.eventStartDate) : '');
	const [end, setEnd] = useState(event ? koreaDateInput(event.eventEndDate) : '');
	const [location, setLocation] = useState(event?.eventLocation ?? '');
	const [resort, setResort] = useState(event?.resortId ?? '');
	const [status, setStatus] = useState<EventStatus>(event?.eventStatus ?? 'DRAFT');
	const [images, setImages] = useState(event?.eventImages ?? []);
	const [busy, setBusy] = useState(false);
	const [failure, setFailure] = useState('');
	const lock = useRef(false);
	const [upload] = useMutation<{ uploadEventImages: string[] }, { files: File[] }>(UPLOAD_EVENT_IMAGES);
	const [create] = useMutation<{ createEvent: SkiEvent }, { input: EventInput }>(CREATE_EVENT);
	const [update] = useMutation<{ updateEventByAdmin: SkiEvent }, { input: EventInput & { _id: string } }>(UPDATE_EVENT);
	const choose = async (files: File[]) => {
		if (lock.current) return;
		if (!validateEventFiles(files) || images.length + files.length > 5) {
			setFailure(t('Choose 1–5 JPG or PNG images, up to 15 MB each.'));
			return;
		}
		lock.current = true;
		setBusy(true);
		setFailure('');
		try {
			const result = await upload({
				variables: { files },
				context: { headers: { 'Apollo-Require-Preflight': 'true' } },
			});
			if (!result.data?.uploadEventImages.length) throw new Error(t('Image upload failed.'));
			setImages((current) => [...current, ...result.data!.uploadEventImages]);
		} catch (error) {
			setFailure(error instanceof Error ? error.message : t('Image upload failed.'));
		} finally {
			lock.current = false;
			setBusy(false);
		}
	};
	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (lock.current) return;
		if (
			!title.trim() ||
			!description.trim() ||
			!start ||
			!end ||
			end <= start ||
			!images.length ||
			(resort && !/^[a-f\d]{24}$/i.test(resort.trim()))
		) {
			setFailure(t('Enter a title, description, images and valid dates. End must follow start.'));
			return;
		}
		lock.current = true;
		setBusy(true);
		setFailure('');
		try {
			const input: EventInput = {
				eventTitle: title.trim(),
				eventDesc: description.trim(),
				eventImages: images,
				eventStartDate: eventDateISO(start),
				eventEndDate: eventDateISO(end),
				eventLocation: location.trim() || null,
				resortId: resort.trim() || null,
				eventStatus: status,
			};
			if (event) await update({ variables: { input: { ...input, _id: event._id } } });
			else await create({ variables: { input } });
			onSaved();
		} catch (error) {
			setFailure(error instanceof Error ? error.message : t('Could not save event.'));
		} finally {
			lock.current = false;
			setBusy(false);
		}
	};
	return (
		<Dialog
			open
			fullWidth
			maxWidth="md"
			onClose={() => {
				if (!lock.current) onClose();
			}}
			className="event-dialog"
		>
			<form onSubmit={submit}>
				<DialogTitle>{t(event ? 'Edit Event' : 'Create Event')}</DialogTitle>
				<DialogContent>
					<div className="event-editor">
						{failure && (
							<Alert
								severity="error"
								action={
									event && (
										<Button disabled={busy} onClick={onReload}>
											{t('Reload Event')}
										</Button>
									)
								}
							>
								{failure}
							</Alert>
						)}
						<TextField
							label={t('Title')}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							required
							disabled={busy}
						/>
						<TextField
							label={t('Description')}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							multiline
							minRows={4}
							required
							disabled={busy}
						/>
						<div className="event-date-fields">
							<TextField
								label={t('Start (Korea time)')}
								type="datetime-local"
								value={start}
								onChange={(e) => setStart(e.target.value)}
								InputLabelProps={{ shrink: true }}
								required
								disabled={busy}
							/>
							<TextField
								label={t('End (Korea time)')}
								type="datetime-local"
								value={end}
								onChange={(e) => setEnd(e.target.value)}
								InputLabelProps={{ shrink: true }}
								required
								disabled={busy}
							/>
						</div>
						<TextField
							label={t('Location')}
							value={location}
							onChange={(e) => setLocation(e.target.value)}
							disabled={busy}
						/>
						<TextField
							label={t('Resort ID (optional)')}
							helperText={t('Use an active or sold-out resort ID. Leave empty to clear.')}
							value={resort}
							onChange={(e) => setResort(e.target.value)}
							disabled={busy}
						/>
						<TextField
							label={t('Status')}
							select
							value={status}
							onChange={(e) => setStatus(e.target.value as EventStatus)}
							disabled={busy}
						>
							<MenuItem value="DRAFT">{t('Draft')}</MenuItem>
							<MenuItem value="PUBLISHED">{t('Published')}</MenuItem>
						</TextField>
						<p>{t('Images are public, including draft images. Uploaded files are retained after removal.')}</p>
						<div className="event-image-editor">
							{images.map((path, index) => (
								<div key={path}>
									<Image
										unoptimized
										width={110}
										height={80}
										src={imageUrl(path) || '/img/hero/winter-1.jpg'}
										alt={`${t('Event image')} ${index + 1}`}
									/>
									<Button disabled={busy} onClick={() => setImages(images.filter((value) => value !== path))}>
										{t('Remove')}
									</Button>
								</div>
							))}
						</div>
						<Button component="label" variant="outlined" disabled={busy || images.length >= 5}>
							{t('Upload images')}
							<input
								type="file"
								hidden
								multiple
								accept="image/png,image/jpeg"
								onChange={(e) => {
									void choose(Array.from(e.target.files ?? []));
									e.target.value = '';
								}}
							/>
						</Button>
					</div>
				</DialogContent>
				<DialogActions>
					<Button disabled={busy} onClick={onClose}>
						{t('Cancel')}
					</Button>
					<Button type="submit" variant="contained" disabled={busy}>
						{t(busy ? 'Saving...' : 'Save')}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
