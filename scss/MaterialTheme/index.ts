import { ThemeOptions } from '@mui/material/styles';
export const light: ThemeOptions = {
	palette: {
		mode: 'light',
		primary: { main: '#0284c7', contrastText: '#fff' },
		secondary: { main: '#0ea5e9' },
		background: { default: '#f8fafc', paper: '#fff' },
		text: { primary: '#0f172a', secondary: '#64748b' },
		divider: '#e2e8f0',
	},
	shape: { borderRadius: 12 },
	typography: {
		fontFamily: 'Inter, sans-serif',
		h1: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '3rem' },
		h2: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '2.25rem' },
		h3: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '2rem' },
		h4: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.75rem' },
		h5: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.25rem' },
		h6: { fontWeight: 600, fontSize: '1rem' },
		body1: { fontSize: '0.9375rem', lineHeight: 1.7 },
		button: { textTransform: 'none', fontWeight: 600 },
	},
	components: {
		MuiButton: { styleOverrides: { root: { borderRadius: 9999, padding: '9px 20px', boxShadow: 'none' } } },
		MuiOutlinedInput: { styleOverrides: { root: { background: '#fff' } } },
		MuiCard: { styleOverrides: { root: { border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(15,23,42,.04)' } } },
		MuiChip: { styleOverrides: { root: { background: '#e0f2fe', color: '#075985', border: 'none' } } },
		MuiCssBaseline: {
			styleOverrides: {
				body: { margin: 0 },
				'*': { boxSizing: 'border-box' },
				a: { color: 'inherit', textDecoration: 'none' },
			},
		},
	},
};
