import React from 'react';

export default function BrandLogo({ light = false }: { light?: boolean }) {
	return (
		<img
			className="snoway-brand-logo"
			src={light ? '/img/logo/snoway-logo-light.svg' : '/img/logo/snoway-logo.svg'}
			alt="SNOWAY"
			width={176}
			height={40}
			style={{ display: 'block', flexShrink: 0, objectFit: 'contain' }}
		/>
	);
}
