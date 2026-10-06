import React from 'react';
import ResortCollection, { ResortInteractionProps } from './ResortCollection';

const PopularResorts = (props: ResortInteractionProps) => (
	<ResortCollection
		{...props}
		id="popular-resorts"
		title="Popular Ski Resorts"
		subtitle="Explore Korea’s premier alpine ski and snowboarding destinations."
		sort="resortLikes"
	/>
);

export default PopularResorts;
