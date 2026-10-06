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
const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: 'http://localhost/_admin/equipment' });
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
	routes = [],
	uploads = [],
	query = {},
	mode = 'found',
	fail = false,
	hold = null,
	confirm = false;
const item = {
	_id: '507f1f77bcf86cd799439011',
	equipmentName: 'Test Skis',
	equipmentCategory: 'SKI',
	equipmentAudience: 'ALL',
	equipmentBrand: 'Alpine',
	equipmentSize: '160 CM',
	equipmentStatus: 'AVAILABLE',
	resortId: null,
	equipmentQuantity: 3,
	equipmentImages: ['uploads/equipment/a.png', 'uploads/equipment/b.png'],
	equipmentDesc: 'Mountain skis',
	equipmentRentalRates: [
		{ durationHours: 3, price: 25000 },
		{ durationHours: 6, price: 40000 },
	],
	equipmentPurchasable: true,
	equipmentPurchasePrice: 500000,
	equipmentViews: 7,
	equipmentLikes: 2,
	equipmentComments: 1,
};
const apollo = require('@apollo/client');
const stockPages = [];
const fixtureClient = {
	query: async (options) => {
		stockPages.push(options.variables.input.page);
		return {
			data: {
				getAllEquipmentsByAdmin: {
					list:
						options.variables.input.page === 1
							? [item]
							: [
									{ ...item, equipmentQuantity: 1, equipmentStatus: 'MAINTENANCE' },
									{ ...item, equipmentQuantity: 0, equipmentStatus: 'DELETE' },
									{ ...item, equipmentQuantity: 5 },
							  ],
					metaCounter: [{ total: 101 }],
				},
			},
		};
	},
};
stub('@apollo/client', {
	...apollo,
	useApolloClient: () => fixtureClient,
	useQuery: (doc, options) => {
		const name = doc.definitions[0].name.value;
		queries.push({ name, variables: options?.variables });
		if (name === 'GetAllResortsByAdmin') return { data: { getAllResortsByAdmin: { list: [] } }, loading: false };
		if (name === 'EquipmentAdminSummary')
			return {
				data: Object.fromEntries(
					['all', 'available', 'unavailable', 'deleted', 'purchasable'].map((k) => [
						k,
						{ metaCounter: [{ total: 3 }] },
					]),
				),
				refetch: async () => {},
				loading: false,
			};
		const loader = options?.variables?.input?.limit === 100,
			page = options?.variables?.input?.page;
		return {
			data: {
				getAllEquipmentsByAdmin: {
					list: loader && (mode === 'missing' || (mode === 'second' && page === 1)) ? [] : [item],
					metaCounter: [{ total: loader && mode === 'second' ? 101 : loader ? 1 : 20 }],
				},
			},
			loading: loader && mode === 'loading',
			error: loader && mode === 'error' ? new Error('Fixture query error') : undefined,
			refetch: async () => {
				mode = 'found';
			},
		};
	},
	useMutation: (doc) => [
		async (options) => {
			mutations.push({ name: doc.definitions[0].name.value, ...options });
			if (fail) throw new Error('Fixture save error');
			if (hold) await hold;
			return { data: {} };
		},
		{ loading: false },
	],
});
stub('next-i18next', { useTranslation: () => ({ t: (s) => ({ SNOWBOARD: 'Snowboard', ADULTS: 'Adults' }[s] ?? s) }) });
stub('next/router', {
	useRouter: () => ({
		isReady: true,
		query,
		push: async (p) => {
			routes.push(p);
			return true;
		},
	}),
});
stub('next/link', {
	__esModule: true,
	default: ({ href, children, ...props }) =>
		React.createElement(
			'a',
			{ ...props, href: typeof href === 'string' ? href : `${href.pathname}?id=${href.query.id}` },
			children,
		),
});
stub(path.join(root, 'libs/components/common/ResortSelect.tsx'), {
	__esModule: true,
	default: ({ value, onChange }) =>
		React.createElement('input', {
			'aria-label': 'Resort assignment',
			value,
			onChange: (e) => onChange(e.target.value),
		}),
});
stub(path.join(root, 'libs/uploadImages.ts'), {
	uploadImages: async (files, target) => {
		uploads.push({ files, target });
		return ['uploads/equipment/new.png'];
	},
});
window.confirm = () => confirm;
const List = require('../libs/components/admin/AdminEquipment.tsx').default,
	Create = require('../libs/components/admin/AdminEquipmentCreate.tsx').default;
const app = createRoot(document.getElementById('root'));
const render = async (component, key) => act(async () => app.render(React.createElement(component, { key })));
const click = async (el) => {
	assert(el);
	await act(async () => Simulate.click(el));
};
const button = (label) => Array.from(document.querySelectorAll('button')).find((el) => el.textContent === label);
const change = async (el, value) => {
	assert(el);
	await act(async () => {
		el.value = value;
		Simulate.change(el, { target: { value } });
	});
};
const field = (label) =>
	Array.from(document.querySelectorAll('label'))
		.find((el) => el.textContent.startsWith(label))
		?.querySelector('input');
const submit = async () => act(async () => Simulate.submit(document.querySelector('form')));
(async () => {
	await render(List, 'list');
	assert(document.body.textContent.includes('Test Skis'));
	assert.deepEqual(stockPages.slice(0, 2), [1, 2]);
	assert.equal(document.querySelectorAll('.ar-summary strong')[3].textContent, '2');
	assert(document.body.textContent.includes('Excludes archived'));
	assert.equal(document.querySelector('.ae-edit').getAttribute('href'), '/_admin/equipment/create?id=' + item._id);
	await click(document.querySelector('[aria-label="Next photo"]'));
	assert(document.querySelector('.ar-cover img').src.endsWith('/uploads/equipment/b.png'));
	await change(document.querySelector('[aria-label="All Categories"]'), 'SKI');
	await change(document.querySelector('[aria-label="Size filter"]'), '160 CM');
	assert.deepEqual(queries.filter((q) => q.name === 'GetAllEquipmentsByAdmin').at(-1).variables.input.search, {
		categoryList: ['SKI'],
		sizeList: ['160 CM'],
	});
	await change(document.querySelector('[aria-label="All Categories"]'), 'BOOTS');
	assert(!queries.filter((q) => q.name === 'GetAllEquipmentsByAdmin').at(-1).variables.input.search.sizeList);
	await click(button('Archive'));
	assert.equal(mutations.length, 0);
	confirm = true;
	await click(button('Archive'));
	assert.deepEqual(mutations.at(-1).variables.input, { _id: item._id, equipmentStatus: 'DELETE' });
	await render(Create, 'create');
	mutations = [];
	const categorySelect = Array.from(document.querySelectorAll('label')).find((el) => el.textContent.startsWith('Category'))?.querySelector('select');
	const audienceSelect = Array.from(document.querySelectorAll('label')).find((el) => el.textContent.startsWith('Audience'))?.querySelector('select');
	assert.equal(Array.from(categorySelect.options).find((option) => option.textContent === 'Snowboard').value, 'SNOWBOARD');
	assert.equal(Array.from(audienceSelect.options).find((option) => option.textContent === 'Adults').value, 'ADULTS');
	await change(categorySelect, 'SNOWBOARD');
	await change(audienceSelect, 'ADULTS');
	await change(field('Equipment Name'), 'Fresh Skis');
	await change(field('Stock Units'), '5');
	await click(button('+ Add Rental Rate Tier'));
	let durations = document.querySelectorAll('.ae-rate input');
	await change(durations[2], '3');
	await change(durations[3], '100');
	await submit();
	assert.equal(mutations.length, 0);
	assert(document.body.textContent.includes('unique rental durations'));
	await change(durations[2], '6');
	await change(durations[3], '40000');
	await act(async () => Simulate.change(document.querySelector('[role="switch"]'), { target: { checked: true } }));
	await submit();
	assert.equal(mutations.length, 0);
	await change(field('Retail Price (KRW)'), '0');
	const bad = new window.File(['x'], 'bad.webp', { type: 'image/webp' });
	await act(async () =>
		Simulate.change(document.querySelector('input[type=file]'), { target: { files: [bad], value: '' } }),
	);
	assert.equal(uploads.length, 0);
	const good = new window.File(['x'], 'good.png', { type: 'image/png' });
	await act(async () =>
		Simulate.change(document.querySelector('input[type=file]'), { target: { files: [good], value: '' } }),
	);
	assert.equal(uploads[0].target, 'equipment');
	fail = true;
	await submit();
	assert(document.body.textContent.includes('Fixture save error'));
	fail = false;
	let release;
	hold = new Promise((r) => (release = r));
	await act(async () => {
		Simulate.submit(document.querySelector('form'));
		Simulate.submit(document.querySelector('form'));
	});
	assert.equal(mutations.length, 2);
	await act(async () => {
		release();
		await hold;
	});
	hold = null;
	assert.equal(mutations.at(-1).name, 'CreateEquipment');
	assert.equal(mutations.at(-1).variables.input.equipmentCategory, 'SNOWBOARD');
	assert.equal(mutations.at(-1).variables.input.equipmentAudience, 'ADULTS');
	assert.equal(mutations.at(-1).variables.input.equipmentPurchasePrice, 0);
	assert.equal(mutations.at(-1).variables.input.equipmentQuantity, 5);
	assert.deepEqual(mutations.at(-1).variables.input.equipmentImages, ['uploads/equipment/new.png']);
	assert.equal(routes.at(-1), '/_admin/equipment');
	query = { id: item._id };
	mode = 'second';
	await render(Create, 'edit');
	assert.equal(document.querySelector('h1').textContent, 'Update Equipment');
	assert.equal(field('Equipment Name').value, item.equipmentName);
	await act(async () => Simulate.change(document.querySelector('[role="switch"]'), { target: { checked: false } }));
	await submit();
	assert.equal(mutations.at(-1).name, 'UpdateEquipmentByAdmin');
	assert.equal(mutations.at(-1).variables.input._id, item._id);
	assert.equal(mutations.at(-1).variables.input.equipmentPurchasePrice, null);
	assert.deepEqual(mutations.at(-1).variables.input.equipmentImages, item.equipmentImages);
	assert(!('resortId' in mutations.at(-1).variables.input));
	query = { id: 'bad' };
	await render(Create, 'invalid');
	assert(document.body.textContent.includes('Invalid equipment ID'));
	assert(!document.querySelector('form'));
	query = { id: item._id };
	for (const state of ['missing', 'loading', 'error']) {
		mode = state;
		await render(Create, state);
		assert(!document.querySelector('form'));
		assert(
			document.body.textContent.includes(
				state === 'missing' ? 'Equipment not found' : state === 'loading' ? 'Loading...' : 'Fixture query error',
			),
		);
	}
	mode = 'found';
	item.equipmentStatus = 'DELETE';
	query = { id: item._id };
	await render(Create, 'archived-edit');
	await submit();
	assert.equal(mutations.at(-1).variables.input.equipmentStatus, 'DELETE');
	await render(List, 'archived-list');
	assert(!document.querySelector('a[href^="/equipment/detail"]'));
	await click(button('Restore Equipment'));
	assert.deepEqual(mutations.at(-1).variables.input, { _id: item._id, equipmentStatus: 'AVAILABLE' });
	await act(async () => app.unmount());
	console.log(
		'PASS Equipment list filters, photo navigation, archive, create validation, purchase state, uploads, duplicate-submit lock, update prefill/pagination, and invalid/error/loading IDs',
	);
})().catch((e) => {
	console.error(e);
	process.exitCode = 1;
});
