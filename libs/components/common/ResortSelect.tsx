import React, { useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { GET_RESORTS } from '../../../apollo/user/query';
import { ResortSearchData } from '../../types/resort/resort';

export default function ResortSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
	const { t } = useTranslation('common');
	const [text, setText] = useState('');
	const { data, loading, error } = useQuery<ResortSearchData>(GET_RESORTS, {
		variables: { input: { page: 1, limit: 30, sort: 'resortTitle', direction: 'ASC', search: text ? { text } : {} } },
	});
	const options = data?.getResorts.list ?? [];
	const selected = options.find((item) => item._id === value) ?? (value ? { _id: value, resortTitle: value } : null);
	return (
		<Autocomplete
			options={options}
			value={selected}
			filterOptions={(items) => items}
			loading={loading}
			isOptionEqualToValue={(a, b) => a._id === b._id}
			getOptionLabel={(item) => item.resortTitle}
			onInputChange={(_event, input, reason) => {
				if (reason === 'input') setText(input);
			}}
			onChange={(_event, item) => onChange(item?._id ?? '')}
			renderInput={(params) => (
				<TextField {...params} label={t('Resort')} helperText={error ? t('Unable to load results') : undefined} />
			)}
		/>
	);
}
