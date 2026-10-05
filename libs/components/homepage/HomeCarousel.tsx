import React, { ReactNode } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Navigation, Pagination } from 'swiper';

const HomeCarousel = ({ children, label }: { children: ReactNode[]; label: string }) => (
	<Swiper
		className="home-catalog-swiper"
		modules={[A11y, Navigation, Pagination]}
		navigation
		pagination={{ clickable: true }}
		slidesPerView={1.12}
		spaceBetween={18}
		breakpoints={{ 700: { slidesPerView: 2, spaceBetween: 24 }, 1100: { slidesPerView: 3, spaceBetween: 24 } }}
		watchOverflow
		role="region"
		aria-label={label}
	>
		{children.map((child, index) => (
			<SwiperSlide key={React.isValidElement(child) ? child.key ?? index : index}>{child}</SwiperSlide>
		))}
	</Swiper>
);

export default HomeCarousel;
