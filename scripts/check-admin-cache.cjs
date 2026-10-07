const fs = require('fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
	module._compile(
		ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
		}).outputText,
		filename,
	);
};
const { gql, InMemoryCache } = require('@apollo/client');
const { createApolloCache } = require('../apollo/cache.ts');
const domains = [
	['getAllMembersByAdmin', 'Members', 'Member', 'MembersInquiry'],
	['getAllResortsByAdmin', 'Resorts', 'Resort', 'AllResortsInquiry'],
	['getAllEquipmentsByAdmin', 'Equipments', 'Equipment', 'AllEquipmentsInquiry'],
	['getAllInstructorApplicationsByAdmin', 'InstructorApplications', 'InstructorApplication', 'InstructorApplicationsInquiry'],
];
const originalWarn = console.warn;
let warnings = 0;
// Model Next's development console formatter, which stringifies warning arguments.
console.warn = (...args) => {
	warnings++;
	args.map(String);
};
try {
	for (const [field, envelope, entity, inputType] of domains) {
		const list = gql`query List($input: ${inputType}!) {
			${field}(input: $input) { list { _id } metaCounter { total } }
		}`;
		const summary = gql`query Summary($input: ${inputType}!) {
			all: ${field}(input: $input) { metaCounter { total } }
		}`;
		const variables = { input: { page: 1, limit: 1, search: {} } };
		const result = (ids, total) => ({
			[field]: {
				__typename: envelope,
				list: ids.map((_id) => ({ __typename: entity, _id })),
				metaCounter: [{ __typename: 'TotalCounter', total }],
			},
		});
		const counts = (total) => ({
			all: { __typename: envelope, metaCounter: [{ __typename: 'TotalCounter', total }] },
		});
		if (field === 'getAllMembersByAdmin') {
			const broken = new InMemoryCache();
			broken.writeQuery({ query: list, variables, data: result(['first'], 2) });
			assert.throws(
				() => broken.writeQuery({ query: summary, variables, data: counts(3) }),
				/Cannot convert object to primitive value/,
			);
		}
		warnings = 0;
		const cache = createApolloCache();
		for (let visit = 0; visit < 3; visit++) {
			cache.writeQuery({ query: list, variables, data: result(['first'], 2) });
			cache.writeQuery({ query: summary, variables, data: counts(3) });
			let cached = cache.readQuery({ query: list, variables })[field];
			assert.deepEqual(cached.list.map((row) => row._id), ['first']);
			assert.equal(cached.metaCounter[0].total, 3);
			cache.writeQuery({ query: list, variables, data: result(['replacement'], 1) });
			cached = cache.readQuery({ query: list, variables })[field];
			assert.deepEqual(cached.list.map((row) => row._id), ['replacement']);
			cache.writeQuery({ query: list, variables, data: result([], 0) });
			assert.deepEqual(cache.readQuery({ query: list, variables })[field].list, []);
		}
		for (const input of [{ page: 2, limit: 1, search: {} }, { page: 1, limit: 2, search: {} }]) {
			cache.writeQuery({ query: list, variables: { input }, data: result(['separate'], 1) });
			assert.deepEqual(cache.readQuery({ query: list, variables })[field].list, []);
		}
		const summaryFirst = createApolloCache();
		summaryFirst.writeQuery({ query: summary, variables, data: counts(2) });
		assert.equal(summaryFirst.readQuery({ query: list, variables }), null);
		summaryFirst.writeQuery({ query: list, variables, data: result(['first'], 2) });
		assert.equal(summaryFirst.readQuery({ query: list, variables })[field].list[0]._id, 'first');
		assert.equal(warnings, 0, `${field} must not emit cache data-loss warnings`);
	}
	for (const entity of ['Resort', 'Equipment']) {
		const query = gql`query Likes { item { _id meLiked { myFavorite } } }`;
		const data = (liked) => ({
			item: {
				__typename: entity,
				_id: 'liked-item',
				meLiked: liked ? [{ __typename: 'MeLiked', myFavorite: true }] : [],
			},
		});
		const broken = new InMemoryCache();
		broken.writeQuery({ query, data: data(true) });
		assert.throws(() => broken.writeQuery({ query, data: data(false) }), /Cannot convert object to primitive value/);
		warnings = 0;
		const cache = createApolloCache();
		for (let visit = 0; visit < 3; visit++) {
			cache.writeQuery({ query, data: data(true) });
			cache.writeQuery({ query, data: data(false) });
			assert.deepEqual(cache.readQuery({ query }).item.meLiked, []);
		}
		assert.equal(warnings, 0, `${entity}.meLiked must replace snapshots without warnings`);
	}
} finally {
	console.warn = originalWarn;
}
console.log('PASS: reproduced original crashes; admin list/summary writes, repeated visits, replacement/empty lists, argument isolation and cleared viewer likes.');
