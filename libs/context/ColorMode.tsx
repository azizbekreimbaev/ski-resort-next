import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { light, dark } from '../../scss/MaterialTheme';

type Preference = 'light' | 'dark' | 'system';
const storageKey = 'snoway.color-mode';
const ColorMode = createContext<{ preference: Preference; setPreference: (value: Preference) => void }>({
	preference: 'system',
	setPreference: () => undefined,
});
export const useColorMode = () => useContext(ColorMode);

export default function ColorModeProvider({ children }: { children: ReactNode }) {
	const [preference, setPreferenceState] = useState<Preference>('system');
	const [systemDark, setSystemDark] = useState(false);
	const [ready, setReady] = useState(false);
	useEffect(() => {
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const syncSystem = () => setSystemDark(media.matches);
		const read = () => {
			let saved: string | null = null;
			try {
				saved = localStorage.getItem(storageKey);
			} catch {
				/* Storage is optional. */
			}
			setPreferenceState(saved === 'dark' || saved === 'light' ? saved : 'system');
		};
		const syncStorage = (event: StorageEvent) => {
			if (event.key === storageKey || event.key === null) read();
		};
		read();
		syncSystem();
		setReady(true);
		media.addEventListener('change', syncSystem);
		window.addEventListener('storage', syncStorage);
		return () => {
			media.removeEventListener('change', syncSystem);
			window.removeEventListener('storage', syncStorage);
		};
	}, []);
	const mode = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
	useEffect(() => {
		if (ready) document.documentElement.dataset.theme = mode;
	}, [mode, ready]);
	const theme = useMemo(() => createTheme(mode === 'dark' ? dark : light), [mode]);
	const setPreference = (value: Preference) => {
		setPreferenceState(value);
		try {
			localStorage.setItem(storageKey, value);
		} catch {
			/* Keep working without storage. */
		}
	};
	return (
		<ColorMode.Provider value={{ preference, setPreference }}>
			<ThemeProvider theme={theme}>{children}</ThemeProvider>
		</ColorMode.Provider>
	);
}
