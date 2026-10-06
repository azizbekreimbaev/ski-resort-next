import { ApolloClient } from '@apollo/client';
import { APPLICATION_SEARCH_MEMBERS } from '../../../apollo/admin/instructorApplication';
import { GET_ALL_INSTRUCTOR_APPLICATIONS_BY_ADMIN } from '../../../apollo/admin/query';
import { Application, CatalogList } from '../../types/catalog';

export interface ApplicantMember {
	_id: string;
	memberNick: string;
	memberFullName?: string | null;
	memberType: string;
}
export interface ApplicationSearchResult {
	rows: Application[];
	members: Record<string, ApplicantMember>;
}
export async function loadApplicationSearch(
	client: ApolloClient<object>,
	status: string,
	direction: string,
	cancelled: () => boolean,
): Promise<ApplicationSearchResult> {
	const rows = new Map<string, Application>();
	for (let page = 1; !cancelled(); page++) {
		const { data } = await client.query<{ getAllInstructorApplicationsByAdmin: CatalogList<Application> }>({
			query: GET_ALL_INSTRUCTOR_APPLICATIONS_BY_ADMIN,
			variables: {
				input: { page, limit: 100, sort: 'createdAt', direction, search: status ? { applicationStatus: status } : {} },
			},
			fetchPolicy: 'network-only',
		});
		const result = data.getAllInstructorApplicationsByAdmin;
		result.list.forEach((item) => rows.set(item._id, item));
		if (!result.list.length || page * 100 >= (result.metaCounter?.[0]?.total ?? 0)) break;
	}
	const needed = new Set(Array.from(rows.values(), (item) => item.memberId));
	const members: Record<string, ApplicantMember> = {};
	for (let page = 1; needed.size && !cancelled(); page++) {
		const { data } = await client.query<{ getAllMembersByAdmin: CatalogList<ApplicantMember> }>({
			query: APPLICATION_SEARCH_MEMBERS,
			variables: { input: { page, limit: 100, sort: 'createdAt', direction: 'DESC', search: {} } },
			fetchPolicy: 'network-only',
		});
		const result = data.getAllMembersByAdmin;
		result.list.forEach((member) => {
			if (needed.delete(member._id)) members[member._id] = member;
		});
		if (!result.list.length || page * 100 >= (result.metaCounter?.[0]?.total ?? 0)) break;
	}
	return { rows: Array.from(rows.values()), members };
}

export function filterApplications(result: ApplicationSearchResult, text: string): Application[] {
	const needle = text.trim().replace(/^@/, '').toLocaleLowerCase();
	return result.rows.filter((item) => {
		const member = result.members[item.memberId];
		return Boolean(
			member && [member.memberFullName, member.memberNick].some((name) => name?.toLocaleLowerCase().includes(needle)),
		);
	});
}
