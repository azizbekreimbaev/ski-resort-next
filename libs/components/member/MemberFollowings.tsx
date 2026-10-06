import React from 'react';
import MemberFollows, { MemberFollowsProps } from './MemberFollows';
export default function MemberFollowings(props: MemberFollowsProps) {
	return <MemberFollows {...props} following />;
}
