import axios from 'axios';
import { getJwtToken } from './auth';

export async function uploadImages(files: File[], target: 'member' | 'resort' | 'equipment'): Promise<string[]> {
	if (!files.length) return [];
	const form = new FormData();
	form.append(
		'operations',
		JSON.stringify({
			query:
				'mutation ImagesUploader($files: [Upload!]!, $target: String!) { imagesUploader(files: $files, target: $target) }',
			variables: { files: files.map(() => null), target },
		}),
	);
	form.append(
		'map',
		JSON.stringify(Object.fromEntries(files.map((_file, index) => [String(index), [`variables.files.${index}`]]))),
	);
	files.forEach((file, index) => form.append(String(index), file));
	const { data } = await axios.post<{ data?: { imagesUploader: string[] }; errors?: { message: string }[] }>(
		String(process.env.REACT_APP_API_GRAPHQL_URL),
		form,
		{ headers: { Authorization: `Bearer ${getJwtToken()}`, 'apollo-require-preflight': 'true' } },
	);
	if (data.errors?.length || !data.data) throw new Error(data.errors?.[0]?.message ?? 'Upload failed');
	return data.data.imagesUploader;
}
