import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { Brightness6Rounded } from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { useColorMode } from '../../context/ColorMode';

export default function ThemeControl() {
	const { t } = useTranslation('common');
	const { preference, setPreference } = useColorMode();
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);
	return (
		<>
			<Tooltip title={t('Appearance')}>
				<IconButton
					aria-label={t('Appearance')}
					aria-haspopup="menu"
					aria-expanded={Boolean(anchor)}
					onClick={(event) => setAnchor(event.currentTarget)}
				>
					<Brightness6Rounded />
				</IconButton>
			</Tooltip>
			<Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
				{(['light', 'dark', 'system'] as const).map((value) => (
					<MenuItem
						key={value}
						selected={preference === value}
						onClick={() => {
							setPreference(value);
							setAnchor(null);
						}}
					>
						{t({ light: 'Light mode', dark: 'Dark mode', system: 'Use device theme' }[value])}
					</MenuItem>
				))}
			</Menu>
		</>
	);
}
