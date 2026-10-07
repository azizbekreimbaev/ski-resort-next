import React, { useEffect, useRef, useState } from 'react';
import { Avatar, Button, IconButton, Modal, TextField, useMediaQuery } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { useTranslation } from 'next-i18next';
import useSocketChat from '../hooks/useSocketChat';
import { CHAT_TEXT_LIMIT } from '../types/chat';

const Chat = () => {
	const { t } = useTranslation('common');
	const { connection, messages, online, selfMember, historyVersion, send, retry } = useSocketChat();
	const mobile = useMediaQuery('(max-width:599px), (max-height:479px)');
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState('');
	const [sendError, setSendError] = useState(false);
	const [newMessages, setNewMessages] = useState(false);
	const launcherRef = useRef<HTMLButtonElement>(null);
	const closeRef = useRef<HTMLButtonElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const historyRef = useRef<HTMLDivElement>(null);
	const panelRef = useRef<HTMLElement>(null);
	const nearBottom = useRef(true);
	const revealOwn = useRef(false);
	const previousHistory = useRef(historyVersion);
	const connected = connection === 'connected';
	const name = selfMember?.memberNick ?? t('chat.guest');
	const invalid = draft.trim().length > CHAT_TEXT_LIMIT;
	const scrollDown = () => {
		const history = historyRef.current;
		if (history) history.scrollTop = history.scrollHeight;
		nearBottom.current = true;
		setNewMessages(false);
	};
	const close = () => {
		setOpen(false);
		window.setTimeout(() => launcherRef.current?.focus(), 0);
	};
	useEffect(() => {
		if (!open || !mobile || !window.visualViewport) return;
		const viewport = window.visualViewport;
		const resize = () => {
			panelRef.current?.style.setProperty('--snowkr-chat-height', `${viewport.height}px`);
			panelRef.current?.style.setProperty('--snowkr-chat-top', `${viewport.offsetTop}px`);
		};
		resize();
		viewport.addEventListener('resize', resize);
		viewport.addEventListener('scroll', resize);
		return () => {
			viewport.removeEventListener('resize', resize);
			viewport.removeEventListener('scroll', resize);
		};
	}, [open, mobile]);
	useEffect(() => {
		if (!open) return;
		const timer = window.setTimeout(() => {
			if (mobile) closeRef.current?.focus();
			else inputRef.current?.focus();
			const history = historyRef.current;
			if (history) history.scrollTop = history.scrollHeight;
			nearBottom.current = true;
			setNewMessages(false);
		}, 0);
		return () => window.clearTimeout(timer);
	}, [open, mobile]);
	useEffect(() => {
		const replaced = previousHistory.current !== historyVersion;
		previousHistory.current = historyVersion;
		if (nearBottom.current || revealOwn.current || replaced) {
			const history = historyRef.current;
			if (history) history.scrollTop = history.scrollHeight;
			nearBottom.current = true;
			setNewMessages(false);
			revealOwn.current = false;
		} else setNewMessages(true);
	}, [messages, historyVersion]);
	const submit = () => {
		if (!draft.trim() || invalid) return;
		if (!send(draft)) {
			setSendError(true);
			return;
		}
		setDraft('');
		setSendError(false);
		revealOwn.current = true;
		inputRef.current?.focus();
	};
	const panel = (
		<section
			ref={panelRef}
			className={`snowkr-chat__panel ${mobile ? 'snowkr-chat__panel--mobile' : ''}`}
			id="snowkr-chat-panel"
			role="dialog"
			aria-modal={mobile || undefined}
			aria-labelledby="snowkr-chat-title"
			onKeyDown={(event) => {
				if (event.key === 'Escape' && !mobile) {
					event.stopPropagation();
					close();
				}
			}}
		>
			<header className="snowkr-chat__header">
				<div className="snowkr-chat__heading">
					<ChatBubbleOutlineIcon />
					<div>
						<h2 id="snowkr-chat-title">{t('chat.title')}</h2>
						<p>{t('chat.subtitle')}</p>
					</div>
				</div>
				<div className="snowkr-chat__header-actions">
					<span className={`snowkr-chat__presence ${online === null ? 'snowkr-chat__presence--unknown' : ''}`}>
						{online === null ? t('chat.presenceUnavailable') : t('chat.online', { count: online })}
					</span>
					<IconButton ref={closeRef} aria-label={t('chat.close')} onClick={close}>
						<CloseIcon />
					</IconButton>
				</div>
			</header>
			<div className="snowkr-chat__status" role="status">
				<span>{t(`chat.${connection}`)}</span>
				{(connection === 'disconnected' || connection === 'unconfigured') && (
					<Button size="small" onClick={retry}>
						{t('chat.retry')}
					</Button>
				)}
			</div>
			<p className="snowkr-chat__notice">{t('chat.historyNotice')}</p>
			<div
				className="snowkr-chat__history"
				ref={historyRef}
				role="log"
				aria-label={t('chat.messages')}
				aria-live="polite"
				aria-relevant="additions"
				aria-atomic="false"
				onScroll={() => {
					const element = historyRef.current;
					if (!element) return;
					nearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 64;
					if (nearBottom.current) setNewMessages(false);
				}}
			>
				{messages.length === 0 && (
					<div className="snowkr-chat__empty">
						<ChatBubbleOutlineIcon />
						<strong>{t('chat.empty')}</strong>
						<p>{t('chat.emptyHint')}</p>
					</div>
				)}
				{messages.map((message) => {
					const member = message.memberData !== null;
					const sender = message.memberData?.memberNick ?? t('chat.guest') ?? 'Guest';
					const own = member && Boolean(selfMember?._id) && message.memberData?._id === selfMember?._id;
					return (
						<div key={message.id} className={`snowkr-chat__message ${own ? 'snowkr-chat__message--own' : ''}`}>
							<Avatar className="snowkr-chat__avatar">{sender.slice(0, 1).toUpperCase()}</Avatar>
							<div className="snowkr-chat__group">
								<div className="snowkr-chat__sender">
									{sender}
									{own ? ` (${t('chat.you')})` : ''}
									<span> · {t(member ? 'chat.member' : 'chat.guest')}</span>
								</div>
								<div className="snowkr-chat__bubble">{message.text}</div>
							</div>
						</div>
					);
				})}
			</div>
			{newMessages && (
				<Button className="snowkr-chat__new" onClick={scrollDown}>
					{t('chat.newMessages')}
				</Button>
			)}
			<form
				className="snowkr-chat__composer"
				onSubmit={(event) => {
					event.preventDefault();
					submit();
				}}
			>
				<p>{connected ? t('chat.chattingAs', { name }) : t('chat.waitToSend')}</p>
				<div className="snowkr-chat__input-row">
					<TextField
						inputRef={inputRef}
						multiline
						minRows={1}
						maxRows={3}
						fullWidth
						value={draft}
						placeholder={t('chat.placeholder')}
						error={invalid}
						inputProps={{ 'aria-label': t('chat.placeholder'), 'aria-describedby': 'snowkr-chat-feedback' }}
						onChange={(event) => {
							setDraft(event.target.value);
							setSendError(false);
						}}
						onKeyDown={(event) => {
							if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
								event.preventDefault();
								if (connected) submit();
							}
						}}
					/>
					<IconButton
						type="submit"
						className="snowkr-chat__send"
						aria-label={t('chat.send')}
						disabled={!connected || !draft.trim() || invalid}
					>
						<SendIcon />
					</IconButton>
				</div>
				<div id="snowkr-chat-feedback" className="snowkr-chat__feedback" role="status">
					{sendError
						? t('chat.sendFailed')
						: draft.length >= CHAT_TEXT_LIMIT - 100
						? t('chat.limit', { count: draft.trim().length, limit: CHAT_TEXT_LIMIT })
						: ''}
				</div>
			</form>
		</section>
	);
	return (
		<div className="snowkr-chat">
			{!(mobile && open) && (
				<IconButton
					ref={launcherRef}
					className="snowkr-chat__launcher"
					aria-label={t(open ? 'chat.close' : 'chat.open')}
					aria-expanded={open}
					aria-controls={open ? 'snowkr-chat-panel' : undefined}
					onClick={() => (open ? close() : setOpen(true))}
				>
					{open ? <CloseIcon /> : <ChatBubbleOutlineIcon />}
				</IconButton>
			)}
			{mobile ? (
				<Modal open={open} onClose={close} className="snowkr-chat snowkr-chat__modal">
					{panel}
				</Modal>
			) : (
				open && panel
			)}
		</div>
	);
};

export default Chat;
