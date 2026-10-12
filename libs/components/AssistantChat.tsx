import React, { useEffect, useRef, useState } from 'react';
import { useApolloClient, useReactiveVar } from '@apollo/client';
import { Button, IconButton, Modal, TextField, Tooltip, useMediaQuery } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import TerrainRoundedIcon from '@mui/icons-material/TerrainRounded';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { userVar } from '../../apollo/store';
import { ASK_ASSISTANT } from '../../apollo/assistant';
import { AssistantMessage, AssistantResponse, assistantHistory, assistantSourceHref } from '../types/assistant';

function Conversation({ memberId, name }: { memberId: string; name: string }) {
	const { t } = useTranslation('common');
	const client = useApolloClient();
	const mobile = useMediaQuery('(max-width:599px), (max-height:479px)');
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState('');
	const [messages, setMessages] = useState<AssistantMessage[]>([]);
	const [pending, setPending] = useState(false);
	const [failed, setFailed] = useState<string | null>(null);
	const [error, setError] = useState(false);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const launcherRef = useRef<HTMLButtonElement>(null);
	const historyRef = useRef<HTMLDivElement>(null);
	const panelRef = useRef<HTMLElement>(null);
	const busy = useRef(false);
	const mounted = useRef(true);
	const interacted = useRef(false);
	const nearBottom = useRef(true);
	const requestId = useRef(0);
	const openedKey = `snoway.assistant.welcomed.${memberId}`;
	const markWelcomed = () => {
		interacted.current = true;
		try {
			sessionStorage.setItem(openedKey, '1');
		} catch {
			/* Storage is optional. */
		}
	};
	const show = (manual: boolean) => {
		markWelcomed();
		window.dispatchEvent(new window.Event('snoway:assistant-open'));
		setOpen(true);
		if (manual && !mobile) window.setTimeout(() => inputRef.current?.focus(), 100);
	};
	const close = () => {
		markWelcomed();
		setOpen(false);
		launcherRef.current?.focus();
	};
	useEffect(() => {
		mounted.current = true;
		const hide = () => {
			interacted.current = true;
			setOpen(false);
		};
		window.addEventListener('snoway:community-open', hide);
		return () => {
			mounted.current = false;
			window.removeEventListener('snoway:community-open', hide);
		};
	}, []);
	useEffect(() => {
		try {
			if (sessionStorage.getItem(openedKey)) return;
		} catch {
			/* Use in-memory guard. */
		}
		const timer = window.setTimeout(() => {
			if (interacted.current || document.visibilityState === 'hidden' || document.querySelector('[role="dialog"]'))
				return;
			// Do not interrupt someone already typing into another form.
			const active = document.activeElement;
			if (active instanceof HTMLElement && (active.matches('input, textarea') || active.isContentEditable)) return;
			interacted.current = true;
			try {
				sessionStorage.setItem(openedKey, '1');
			} catch {
				/* Storage is optional. */
			}
			window.dispatchEvent(new window.Event('snoway:assistant-open'));
			setOpen(true);
		}, 5000);
		return () => window.clearTimeout(timer);
	}, [openedKey]);
	useEffect(() => {
		if (nearBottom.current && historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
	}, [messages, pending, error, open]);
	useEffect(() => {
		if (!open || !mobile || !window.visualViewport) return;
		const viewport = window.visualViewport;
		const resize = () => {
			panelRef.current?.style.setProperty('--assistant-height', `${viewport.height}px`);
			panelRef.current?.style.setProperty('--assistant-top', `${viewport.offsetTop}px`);
		};
		resize();
		viewport.addEventListener('resize', resize);
		viewport.addEventListener('scroll', resize);
		return () => {
			viewport.removeEventListener('resize', resize);
			viewport.removeEventListener('scroll', resize);
		};
	}, [open, mobile]);
	const send = async (text: string, retry = false) => {
		const message = text.trim();
		if (!message || message.length > 2000 || busy.current) return;
		busy.current = true;
		const version = ++requestId.current;
		setPending(true);
		setError(false);
		setFailed(null);
		nearBottom.current = true;
		const context = retry ? messages.slice(0, -1) : messages;
		if (!retry) {
			setMessages([...messages, { id: version * 2, role: 'USER', message }]);
			setDraft('');
		}
		try {
			const result = await client.mutate<{ askAssistant: AssistantResponse }>({
				mutation: ASK_ASSISTANT,
				variables: { input: { message, history: assistantHistory(context, message) } },
				fetchPolicy: 'no-cache',
				errorPolicy: 'none',
			});
			if (!result.data?.askAssistant.answer?.trim()) throw new Error('Empty response');
			if (!mounted.current || version !== requestId.current) return;
			const response = result.data.askAssistant;
			setMessages((previous) => [
				...previous,
				{ id: version * 2 + 1, role: 'ASSISTANT', message: response.answer, sources: response.sources },
			]);
		} catch {
			if (!mounted.current || version !== requestId.current) return;
			setFailed(message);
			setError(true);
		} finally {
			if (mounted.current && version === requestId.current) {
				busy.current = false;
				setPending(false);
			}
		}
	};
	const reset = () => {
		setMessages([]);
		setDraft('');
		setFailed(null);
		setError(false);
		inputRef.current?.focus();
	};
	const panel = (
		<section
			ref={panelRef}
			className={`snoway-assistant__panel ${mobile ? 'snoway-assistant__panel--mobile' : ''}`}
			id="snoway-assistant-panel"
			role="dialog"
			aria-modal={mobile || undefined}
			aria-labelledby="snoway-assistant-title"
			onKeyDown={(event) => {
				if (event.key === 'Escape') {
					event.stopPropagation();
					close();
				}
			}}
		>
			<header className="snoway-assistant__header">
				<span className="snoway-assistant__mark">
					<AutoAwesomeRoundedIcon />
				</span>
				<div className="snoway-assistant__heading">
					<h2 id="snoway-assistant-title">{t('assistant.title')}</h2>
					<p>{t('assistant.subtitle')}</p>
				</div>
				<Tooltip title={t('assistant.reset')}>
					<span>
						<IconButton aria-label={t('assistant.reset')} disabled={pending || !messages.length} onClick={reset}>
							<RestartAltRoundedIcon />
						</IconButton>
					</span>
				</Tooltip>
				<IconButton aria-label={t('assistant.close')} onClick={close}>
					<CloseRoundedIcon />
				</IconButton>
			</header>
			<div
				ref={historyRef}
				className="snoway-assistant__history"
				role="log"
				aria-label={t('assistant.messages')}
				aria-live="polite"
				aria-relevant="additions"
				onScroll={() => {
					const el = historyRef.current;
					if (el) nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
				}}
			>
				{!messages.length && (
					<div className="snoway-assistant__welcome">
						<div className="snoway-assistant__mountain">
							<TerrainRoundedIcon />
							<span>{t('assistant.eyebrow')}</span>
						</div>
						<h3>{t('assistant.welcome', { name })}</h3>
						<p>{t('assistant.welcomeHint')}</p>
						<div className="snoway-assistant__suggestions">
							{['resorts', 'equipment', 'events', 'beginner'].map((key) => (
								<Button
									key={key}
									onClick={() => send(t(`assistant.prompt_${key}`))}
									endIcon={<ArrowOutwardRoundedIcon />}
								>
									<span>
										{t(`assistant.topic_${key}`)}
										<small>{t(`assistant.prompt_${key}`)}</small>
									</span>
								</Button>
							))}
						</div>
					</div>
				)}
				{messages.map((entry) => (
					<div
						key={entry.id}
						className={`snoway-assistant__message ${entry.role === 'USER' ? 'snoway-assistant__message--own' : ''}`}
					>
						<span className="snoway-assistant__sender">
							{t(entry.role === 'USER' ? 'assistant.you' : 'assistant.title')}
						</span>
						<div className="snoway-assistant__bubble">{entry.message}</div>
						{!!entry.sources?.length && (
							<div className="snoway-assistant__sources">
								<small>{t('assistant.sources')}</small>
								{entry.sources.map((source) => (
									<Link key={`${source.type}:${source.id}`} href={assistantSourceHref(source)} onClick={close}>
										<span>
											{t(`assistant.source_${source.type}`)} · {source.title}
										</span>
										<ArrowOutwardRoundedIcon />
									</Link>
								))}
							</div>
						)}
					</div>
				))}
				{pending && (
					<div className="snoway-assistant__thinking" role="status">
						<span />
						<span />
						<span />
						<p>{t('assistant.thinking')}</p>
					</div>
				)}
				{error && (
					<div className="snoway-assistant__error" role="alert">
						<p>{t('assistant.error')}</p>
						<Button onClick={() => failed && send(failed, true)}>{t('assistant.retry')}</Button>
					</div>
				)}
			</div>
			<form
				className="snoway-assistant__composer"
				onSubmit={(event) => {
					event.preventDefault();
					send(draft);
				}}
			>
				<div className="snoway-assistant__input-row">
					<TextField
						inputRef={inputRef}
						fullWidth
						multiline
						minRows={1}
						maxRows={4}
						value={draft}
						disabled={pending || !!failed}
						placeholder={t('assistant.placeholder')}
						inputProps={{
							maxLength: 2000,
							'aria-label': t('assistant.placeholder'),
							'aria-describedby': 'snoway-assistant-privacy',
						}}
						onChange={(event) => setDraft(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
								event.preventDefault();
								send(draft);
							}
						}}
					/>
					<IconButton
						type="submit"
						className="snoway-assistant__send"
						aria-label={t('assistant.send')}
						disabled={pending || !!failed || !draft.trim() || draft.trim().length > 2000}
					>
						<SendRoundedIcon />
					</IconButton>
				</div>
				{draft.length > 1800 && <small className="snoway-assistant__count">{draft.length}/2000</small>}
				{failed && (
					<Button
						size="small"
						onClick={() => {
							setDraft(failed);
							setMessages((previous) => previous.slice(0, -1));
							setFailed(null);
							setError(false);
							inputRef.current?.focus();
						}}
					>
						{t('assistant.edit')}
					</Button>
				)}
				<p id="snoway-assistant-privacy">{t('assistant.privacy')}</p>
			</form>
		</section>
	);
	return (
		<div className="snoway-assistant">
			{!(mobile && open) && (
				<Button
					ref={launcherRef}
					className="snoway-assistant__launcher"
					startIcon={<AutoAwesomeRoundedIcon />}
					aria-label={t(open ? 'assistant.close' : 'assistant.open')}
					aria-expanded={open}
					aria-controls={open ? 'snoway-assistant-panel' : undefined}
					onClick={() => (open ? close() : show(true))}
				>
					{t('assistant.launcher')}
				</Button>
			)}
			{mobile ? (
				<Modal open={open} onClose={close} className="snoway-assistant">
					{panel}
				</Modal>
			) : (
				open && panel
			)}
		</div>
	);
}

export default function AssistantChat() {
	const user = useReactiveVar(userVar);
	const router = useRouter();
	if (!user._id || router.pathname.startsWith('/_admin') || router.pathname.startsWith('/account')) return null;
	return <Conversation key={user._id} memberId={user._id} name={user.memberNick} />;
}
