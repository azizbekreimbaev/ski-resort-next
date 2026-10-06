import React, { ComponentType } from 'react';
import AppLayout from './AppLayout';
export default function withLayoutFull<P extends object>(Component: ComponentType<P>) {
	return function Layout(props: P) {
		return (
			<AppLayout>
				<Component {...props} />
			</AppLayout>
		);
	};
}
