const fs = require('fs'),
	path = require('path'),
	assert = require('node:assert/strict'),
	ts = require('typescript');
const root = path.resolve(__dirname, '..');
const compile = (m, f) =>
	m._compile(
		ts.transpileModule(fs.readFileSync(f, 'utf8'), {
			compilerOptions: { module: 1, target: 7, jsx: 2, esModuleInterop: true },
		}).outputText,
		f,
	);
require.extensions['.ts'] = compile;
require.extensions['.tsx'] = compile;
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: 'http://localhost/_admin/resort' });
Object.assign(global, {
	window: dom.window,
	document: dom.window.document,
	navigator: dom.window.navigator,
	HTMLElement: dom.window.HTMLElement,
	Element: dom.window.Element,
	self: dom.window,
	IS_REACT_ACT_ENVIRONMENT: true,
});
const React = require('react'),
	{ createRoot } = require('react-dom/client'),
	{ act, Simulate } = require('react-dom/test-utils');
const stub = (name, exports) => {
	const f = require.resolve(name);
	require.cache[f] = { id: f, filename: f, loaded: true, exports };
};
let mutations = [],
	queries = [],
	fail = false,
	hold = null,
	confirmation = false,
	uploads = [];
const actualApollo = require('@apollo/client');
const item = {
	_id: '507f1f77bcf86cd799439011',
	resortTitle: 'Snow Test',
	resortLocation: 'PYEONGCHANG',
	resortAddress: 'Mountain Road',
	resortStatus: 'ACTIVE',
	resortLevel: 'BEGINNER',
	resortPricePerDay: 70000,
	resortMinDays: 2,
	resortImages: ['uploads/resort/a.jpg', 'uploads/resort/b.jpg'],
	resortFacilities: ['PARKING'],
	resortViews: 4,
	resortLikes: 2,
};
stub('@apollo/client', {
	...actualApollo,
	useQuery: (doc, options) => {
		queries.push(options?.variables);
		if (options?.variables?.input?.limit === 100) {
			const page = options.variables.input.page;
			return {
				data: {
					getAllResortsByAdmin: {
						list: loaderMode === 'missing' || (loaderMode === 'second' && page === 1) ? [] : [item],
						metaCounter: [{ total: loaderMode === 'second' ? 101 : 1 }],
					},
				},
				loading: loaderMode === 'loading',
				error: loaderMode === 'error' ? new Error('Fixture query failure') : undefined,
				refetch: async () => {
					loaderMode = 'found';
				},
			};
		}
		const summary = doc.definitions[0].name.value === 'ResortAdminSummary';
		return {
			data: summary
				? Object.fromEntries(
						['all', 'active', 'deleted'].map((k, i) => [k, { metaCounter: [{ total: [3, 2, 1][i] }] }]),
				  )
				: { getAllResortsByAdmin: { list: [item], metaCounter: [{ total: 21 }] } },
			refetch: async () => {},
			loading: false,
		};
	},
	useMutation: (doc) => [
		async (options) => {
			mutations.push({ name: doc.definitions[0].name.value, ...options });
			if (fail) throw new Error('Fixture save failure');
			if (hold) await hold;
			return { data: { createResort: { _id: item._id } } };
		},
		{ loading: false },
	],
});
stub('next-i18next', { useTranslation: () => ({ t: (s) => s }) });
const routes = [];
let routeQuery = {},
	ready = true,
	loaderMode = 'found';
stub('next/router', {
	useRouter: () => ({
		isReady: ready,
		query: routeQuery,
		push: async (p) => {
			routes.push(p);
			return true;
		},
	}),
});
stub('next/link', {
	__esModule: true,
	default: ({ href, children, ...props }) =>
		React.createElement('a', { ...props, href: typeof href === 'string' ? href : href.pathname }, children),
});
stub(path.join(root, 'libs/uploadImages.ts'), {
	uploadImages: async (files, target) => {
		uploads.push({ files, target });
		return ['uploads/resort/test.jpg'];
	},
});
stub(path.join(root, 'libs/components/admin/CatalogEditor.tsx'), { __esModule: true, default: () => null });
window.confirm = () => confirmation;
const List = require('../libs/components/admin/AdminResorts.tsx').default,
	Create = require('../libs/components/admin/AdminResortCreate.tsx').default;
const app = createRoot(document.getElementById('root'));
const flush = async () =>
	act(async () => {
		await Promise.resolve();
	});
const click = async (el) => act(async () => Simulate.click(el));
const button = (label) => Array.from(document.querySelectorAll('button')).find((el) => el.textContent === label);
const change = async (el, value) =>
	act(async () => {
		el.value = value;
		Simulate.change(el, { target: { value } });
	});
(async () => {
	await act(async () => app.render(React.createElement(List)));
	assert(document.body.textContent.includes('Snow Test'));
	assert(document.body.textContent.includes('Current page average'));
	await change(document.querySelector('input[aria-label="Search resorts by title"]'), 'Snow.*');
	assert.equal(queries.filter(Boolean).at(-1).input.search.text, 'Snow.*');
	await change(document.querySelector('select[aria-label="All Locations"]'), 'MUJU');
	assert.deepEqual(queries.filter(Boolean).at(-1).input.search.locationList, ['MUJU']);
	await click(document.querySelector('button[aria-label="Photo 2"]'));
	assert(document.querySelector('.ar-cover img').src.endsWith('/b.jpg'));
	await click(button('Archive'));
	assert.equal(mutations.length, 0);
	confirmation = true;
	await click(button('Archive'));
	assert.deepEqual(mutations.at(-1).variables, { input: { _id: item._id, resortStatus: 'DELETE' } });
	await act(async () => app.render(React.createElement(Create)));
	mutations = [];
	assert.equal(document.querySelector('input[type=number][min="1"]').value, '1');
	const title = document.querySelector('.ar-form-section input');
	await change(title, 'New Mountain');
	assert(document.querySelector('.ar-preview-title').textContent.includes('New Mountain'));
	await change(document.querySelectorAll('.ar-form-section input')[1], 'Mountain Road');
	await change(document.querySelector('input[type=number][min="0"]'), '79000');
	await change(document.querySelector('input[min="1"]'), '0');
	await act(async () => Simulate.submit(document.querySelector('form')));
	assert.equal(mutations.length, 0);
	await change(document.querySelector('input[min="1"]'), '1');
	const file = { name: 'snow.webp', type: 'image/webp', size: 100 };
	await act(async () =>
		Simulate.change(document.querySelector('input[type=file]'), { target: { files: [file], value: '' } }),
	);
	assert.equal(uploads.length, 0);
	await act(async () =>
		Simulate.change(document.querySelector('input[type=file]'), {
			target: { files: [{ ...file, type: 'image/jpeg', name: 'snow.jpg' }], value: '' },
		}),
	);
	await flush();
	assert.equal(uploads[0].target, 'resort');
	assert(document.querySelector('.ar-image-grid img').src.endsWith('/test.jpg'));
	fail = true;
	await act(async () => Simulate.submit(document.querySelector('form')));
	assert(document.body.textContent.includes('Fixture save failure'));
	assert.equal(mutations[0].variables.input.resortMinDays, 1);
	assert(!('resortStatus' in mutations[0].variables.input));
	fail = false;
	let release;
	hold = new Promise((resolve) => (release = resolve));
	await act(async () => {
		Simulate.submit(document.querySelector('form'));
		Simulate.submit(document.querySelector('form'));
	});
	assert.equal(mutations.length, 2);
	await act(async () => {
		release();
		await hold;
	});
	assert.equal(routes.at(-1), '/_admin/resort');
	assert.deepEqual(mutations.at(-1).variables.input.resortImages, ['uploads/resort/test.jpg']);
	hold = null;
	mutations = [];
	routeQuery = { id: item._id };
	loaderMode = 'second';
	item.resortStatus = 'DELETE';
	await act(async () => app.render(React.createElement(Create, { key: 'update' })));
	await flush();
	assert.equal(document.querySelector('h1').textContent, 'Update Resort');
	assert.equal(document.querySelector('.ar-form-section input').value, item.resortTitle);
	assert.equal(document.querySelector('input[min="1"]').value, '2');
	assert.equal(document.querySelectorAll('.ar-image-grid img').length, 2);
	assert(queries.some((q) => q?.input?.limit === 100 && q.input.page === 2));
	assert.equal(document.querySelector('.ar-preview .ar-status').textContent, '● DELETE');
	await change(document.querySelector('.ar-form-section input'), 'Updated Mountain');
	await change(document.querySelector('input[min="1"]'), '1');
	const status = document.querySelector('.ar-published select');
	await change(status, 'SOLD_OUT');
	fail = true;
	await act(async () => Simulate.submit(document.querySelector('form')));
	assert(document.body.textContent.includes('Fixture save failure'));
	fail = false;
	await act(async () => Simulate.submit(document.querySelector('form')));
	assert.equal(mutations.at(-1).name, 'UpdateResortByAdmin');
	assert.equal(mutations.at(-1).variables.input._id, item._id);
	assert.equal(mutations.at(-1).variables.input.resortStatus, 'SOLD_OUT');
	assert.equal(mutations.at(-1).variables.input.resortTitle, 'Updated Mountain');
	assert.equal(mutations.at(-1).variables.input.resortMinDays, 1);
	assert.deepEqual(mutations.at(-1).variables.input.resortImages, item.resortImages);
	routeQuery = { id: 'bad' };
	await act(async () => app.render(React.createElement(Create, { key: 'invalid' })));
	assert(document.body.textContent.includes('Invalid resort ID'));
	assert(!document.querySelector('form'));
	routeQuery = { id: item._id };
	loaderMode = 'missing';
	await act(async () => app.render(React.createElement(Create, { key: 'missing' })));
	assert(document.body.textContent.includes('Resort not found'));
	assert(!document.querySelector('form'));
	loaderMode = 'error';
	await act(async () => app.render(React.createElement(Create, { key: 'error' })));
	assert(document.body.textContent.includes('Unable to load resorts'));
	assert(button('Retry'));
	loaderMode = 'loading';
	await act(async () => app.render(React.createElement(Create, { key: 'loading' })));
	assert(document.body.textContent.includes('Loading...'));
	assert(!document.querySelector('form'));
	routeQuery = {};
	await act(async () => app.render(React.createElement(Create, { key: 'new' })));
	assert.equal(document.querySelector('h1').textContent, 'Add Resort');
	assert.equal(document.querySelector('.ar-form-section input').value, '');
	await act(async () => app.unmount());
	console.log(
		'PASS admin Resort filters, photo switching, archive confirmation, create preview, contract validation, upload, retry, duplicate lock and redirect',
	);
})().catch((e) => {
	console.error(e);
	process.exitCode = 1;
});
