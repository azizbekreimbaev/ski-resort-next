// Uses the project's existing TypeScript compiler and Node assertions; no test dependency.
const fs = require('fs'),
	path = require('path'),
	assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const compile = (module, file) =>
	module._compile(
		ts.transpileModule(fs.readFileSync(file, 'utf8'), {
			compilerOptions: {
				module: ts.ModuleKind.CommonJS,
				target: ts.ScriptTarget.ES2020,
				jsx: ts.JsxEmit.React,
				esModuleInterop: true,
			},
		}).outputText,
		file,
	);
require.extensions['.ts'] = compile;
require.extensions['.tsx'] = compile;
const memory = new Map();
global.localStorage = { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
const cart = require('../libs/demoCart.ts');
const { revalidateCart } = require('../libs/demoCheckout.ts');
const id = '000000000000000000000001';
const base = { key: 'fixture', resourceId: id, title: 'Fixture', image: '', quantity: 2, unitPrice: 100 };
const resort = { ...base, kind: 'resort', start: '2099-01-01', end: '2099-01-03', days: 2 };
const instructor = { ...base, key: 'instructor', kind: 'instructor', start: '2099-01-01', weeks: 1 };
const rental = { ...base, key: 'rental', kind: 'equipment-rental', start: '2099-01-01', durationHours: 3 };
const purchase = { ...base, key: 'purchase', kind: 'equipment-purchase' };
const resortResource = { resortStatus: 'AVAILABLE', resortMinDays: 2, resortPricePerDay: 100, resortTitle: 'Fixture' };
const instructorResource = {
	memberType: 'INSTRUCTOR',
	memberStatus: 'ACTIVE',
	memberNick: 'Fixture',
	memberFullName: null,
	instructorPrice1Week: 100,
};
const equipmentResource = {
	equipmentStatus: 'AVAILABLE',
	equipmentName: 'Fixture',
	equipmentPurchasable: true,
	equipmentPurchasePrice: 100,
	equipmentQuantity: 0,
	equipmentRentalRates: [{ durationHours: 3, price: 100 }],
};
const queries = [];
const client = {
	query: async (request) => {
		queries.push(request);
		if (request.variables.resortId) return { data: { getResort: resortResource } };
		if (request.variables.memberId) return { data: { getMember: instructorResource } };
		return { data: { getEquipment: equipmentResource } };
	},
};
(async () => {
	assert.equal(cart.validDate('2026-02-30'), false);
	assert.equal(cart.validDate('2028-02-29'), true);
	assert.equal(cart.dateDays('2099-01-01', '2099-01-03'), 2);
	assert.equal(cart.isCartLine({ ...instructor, weeks: '1' }), false);
	assert.equal(cart.isCartLine({ ...rental, durationHours: 1.5 }), false);
	assert.equal(cart.isCartLine({ ...resort, days: 3 }), false);
	assert.equal(cart.isCartLine({ ...purchase, quantity: 0 }), false);
	assert.equal(cart.isCartLine({ ...purchase, unitPrice: NaN }), false);
	assert.equal(cart.isCartLine({ ...purchase, unitPrice: 0 }), true);
	assert.equal(cart.cartTotal([resort, instructor, rental, purchase]), 1000);
	cart.saveCart([]);
	cart.addCartLine(purchase);
	cart.addCartLine(purchase);
	assert.equal(cart.cartVar()[0].quantity, 4);
	cart.hydrateCart();
	assert.equal(cart.cartVar()[0].quantity, 4);
	memory.set('snowkr.demo.cart.v1', JSON.stringify([purchase, { ...purchase, quantity: -1 }]));
	cart.hydrateCart();
	assert.equal(cart.cartVar().length, 1);
	memory.set('snowkr.demo.cart.v1', 'broken');
	cart.hydrateCart();
	assert.equal(cart.cartVar().length, 0);
	const valid = await revalidateCart(client, [resort, instructor, rental, purchase]);
	assert.deepEqual(valid.issues, []);
	assert.equal(valid.changed, false);
	assert.equal(queries.length, 4);
	assert.ok(queries.every((request) => request.query.definitions.every((def) => def.operation === 'query')));
	equipmentResource.equipmentPurchasePrice = 0;
	const zero = await revalidateCart(client, [purchase]);
	assert.equal(zero.changed, true);
	assert.equal(zero.lines[0].unitPrice, 0);
	equipmentResource.equipmentPurchasable = false;
	assert.equal((await revalidateCart(client, [purchase])).issues.length, 1);
	equipmentResource.equipmentPurchasable = true;
	equipmentResource.equipmentRentalRates = [];
	assert.equal((await revalidateCart(client, [rental])).issues.length, 1);
	instructorResource.memberType = 'USER';
	assert.equal((await revalidateCart(client, [instructor])).issues.length, 1);
	instructorResource.memberType = 'INSTRUCTOR';
	instructorResource.instructorPrice1Week = null;
	assert.equal((await revalidateCart(client, [instructor])).issues.length, 1);
	resortResource.resortMinDays = 3;
	assert.equal((await revalidateCart(client, [resort])).issues.length, 1);
	resortResource.resortMinDays = 2;
	resortResource.resortStatus = 'SOLD_OUT';
	assert.equal((await revalidateCart(client, [resort])).issues.length, 1);
	assert.equal(
		(
			await revalidateCart(
				{
					query: async () => {
						throw new Error('gone');
					},
				},
				[resort],
			)
		).issues.length,
		1,
	);
	assert.equal((await revalidateCart(client, [{ ...rental, start: '2020-01-01' }])).issues.length, 1);
	const receipt = {
		id: 'demo-fixture',
		memberId: id,
		createdAt: '2026-10-05T00:00:00Z',
		lines: [purchase],
		total: cart.cartTotal([purchase]),
		status: 'DEMO_COMPLETED',
	};
	cart.saveReceipt(receipt);
	cart.saveReceipt(receipt);
	assert.equal(cart.readReceipts(id).length, 1);
	assert.equal(cart.readReceipts('another-member').length, 0);
	localStorage.setItem = () => {
		throw new Error('quota');
	};
	cart.saveCart([purchase]);
	assert.equal(cart.cartStorageError(), true);
	assert.equal(cart.cartVar().length, 1);
	assert.throws(() => cart.saveReceipt(receipt), /quota/);
	console.log(
		'PASS: demo cart pricing, invalid/corrupt storage, persistence, duplicate merge, member receipt isolation, zero prices, changed/removed/ineligible selections, missing packages, dates, storage failure, query-only checkout validation.',
	);
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
