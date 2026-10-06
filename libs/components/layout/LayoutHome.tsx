import React, { ComponentType } from 'react';
import AppLayout from './AppLayout';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
export default function withLayoutHome<P extends object>(Component: ComponentType<P>) {
	return function LayoutHome(props: P) {
		return (
			<AppLayout>
				<Component {...props} />
			</AppLayout>
		);
	};
}
