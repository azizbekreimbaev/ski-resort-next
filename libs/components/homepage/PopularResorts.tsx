import React from 'react';
import ResortCollection, { ResortInteractionProps } from './ResortCollection';

const PopularResorts = (props: ResortInteractionProps) => (
	<ResortCollection
		{...props}
		id="popular-resorts"
		title="Popular resorts"
		subtitle="Resorts most liked by the community."
		sort="resortLikes"
	/>
);

export default PopularResorts;
