import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { DarkModeOutlined, LightModeOutlined } from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { useColorMode } from '../../context/ColorMode';

export default function ThemeControl() {
	const { t } = useTranslation('common');
	const { palette } = useTheme();
	const { setPreference } = useColorMode();
	const isDark = palette.mode === 'dark';
	const nextMode = isDark ? 'light' : 'dark';
	const label = t(isDark ? 'Light mode' : 'Dark mode');

	return (
		<Tooltip title={label} arrow>
			<IconButton
				aria-label={label}
				onClick={() => setPreference(nextMode)}
				sx={{
					transition: (theme) =>
						theme.transitions.create(['background-color', 'color', 'transform'], {
							duration: theme.transitions.duration.shorter,
						}),
					'&:hover': { transform: 'rotate(8deg)' },
				}}
			>
				{isDark ? <LightModeOutlined /> : <DarkModeOutlined />}
			</IconButton>
		</Tooltip>
	);
}
