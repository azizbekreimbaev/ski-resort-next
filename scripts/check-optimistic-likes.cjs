const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const apollo = require('@apollo/client');

const source = ts.transpileModule(fs.readFileSync('libs/hooks/useOptimisticLike.ts', 'utf8'), {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

async function check(typename, field, counter, variable, initiallyLiked, failure) {
	let respond;
	const cache = new apollo.InMemoryCache();
	const client = new apollo.ApolloClient({
		cache,
		link: new apollo.ApolloLink(
			() =>
				new apollo.Observable((observer) => {
					respond = observer;
				}),
		),
	});
	const id = 'target';
	const fragment = apollo.gql`fragment ${typename}LikeState on ${typename} { _id ${counter} meLiked { memberId likeRefId myFavorite } }`;
	const cacheId = cache.identify({ __typename: typename, _id: id });
	cache.writeFragment({
		id: cacheId,
		fragment,
		data: {
			__typename: typename,
			_id: id,
			[counter]: 5,
			meLiked: initiallyLiked ? [{ __typename: 'MeLiked', memberId: 'viewer', likeRefId: id, myFavorite: true }] : [],
		},
	});
	const exports = {};
	vm.runInNewContext(source, {
		exports,
		require(name) {
			if (name === '@apollo/client')
				return {
					...apollo,
					useApolloClient: () => client,
					useReactiveVar: () => ({ _id: 'viewer' }),
					useMutation: (mutation) => [(options) => client.mutate({ mutation, ...options }), {}],
				};
			if (name === '../../apollo/store') return { userVar: {} };
			return require(name);
		},
	});
	const operation = field[0].toUpperCase() + field.slice(1);
	const mutation = apollo.gql`mutation ${operation}($${variable}: String!) {
		${field}(${variable}: $${variable}) { _id ${counter} }
	}`;
	const [toggle] = exports.default(mutation);
	const request = toggle({ variables: { [variable]: id } });
	const read = () => cache.readFragment({ id: cacheId, fragment, optimistic: true });
	assert.equal(read()[counter], initiallyLiked ? 4 : 6, 'count changes before the response');
	assert.equal(
		read().meLiked.some((item) => item.myFavorite),
		!initiallyLiked,
		'heart changes before the response',
	);
	if (failure) {
		respond.error(new Error('Save failed'));
		await assert.rejects(request, /Save failed/);
		assert.equal(read()[counter], 5, 'failed save restores count');
		assert.equal(
			read().meLiked.some((item) => item.myFavorite),
			initiallyLiked,
			'failed save restores heart',
		);
	} else {
		respond.next({ data: { [field]: { __typename: typename, _id: id, [counter]: 9 } } });
		respond.complete();
		await request;
		assert.equal(read()[counter], 9, 'server count replaces predicted count');
		assert.equal(
			read().meLiked.some((item) => item.myFavorite),
			!initiallyLiked,
			'heart remains updated',
		);
	}
	client.stop();
}

(async () => {
	for (const target of [
		['Resort', 'likeTargetResort', 'resortLikes', 'resortId'],
		['Equipment', 'likeTargetEquipment', 'equipmentLikes', 'equipmentId'],
		['Member', 'likeTargetMember', 'memberLikes', 'input'],
		['BoardArticle', 'likeTargetBoardArticle', 'articleLikes', 'input'],
	]) {
		for (const liked of [false, true]) for (const failure of [false, true]) await check(...target, liked, failure);
	}
	console.log('Passed 16 optimistic like/unlike scenarios: immediate updates, server reconciliation, and rollback.');
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
