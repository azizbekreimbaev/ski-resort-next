import React from 'react';
import ResortCollection, { ResortInteractionProps } from './ResortCollection';

const TrendResorts = (props: ResortInteractionProps) => (
	<ResortCollection
		{...props}
		id="trending-resorts"
		title="Trending resorts"
		subtitle="Ordered by resort views."
		sort="resortViews"
	/>
);

export default TrendResorts;
