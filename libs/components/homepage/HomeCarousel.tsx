import React, { ReactNode, useEffect, useId, useRef, useState } from 'react';
import { IconButton } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useTranslation } from 'next-i18next';

const HomeCarousel = ({ children, label }: { children: ReactNode[]; label: string }) => {
	const { t } = useTranslation('common');
	const track = useRef<HTMLDivElement>(null);
	const id = useId();
	const [position, setPosition] = useState({ start: true, end: true });
	useEffect(() => {
		const element = track.current;
		if (!element) return;
		const update = () =>
			setPosition({
				start: element.scrollLeft <= 2,
				end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2,
			});
		update();
		const observer = new ResizeObserver(update);
		observer.observe(element);
		element.addEventListener('scroll', update, { passive: true });
		return () => {
			observer.disconnect();
			element.removeEventListener('scroll', update);
		};
	}, [children.length]);
	const scroll = (direction: number) => {
		const element = track.current;
		if (!element) return;
		element.scrollBy({
			left: direction * element.clientWidth,
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
		});
	};
	return (
		<div className="home-snap-carousel">
			<div className="home-carousel-controls">
				<IconButton
					aria-label={`${t('Previous')}: ${label}`}
					aria-controls={id}
					disabled={position.start}
					onClick={() => scroll(-1)}
				>
					<ChevronLeftRoundedIcon />
				</IconButton>
				<IconButton
					aria-label={`${t('Next')}: ${label}`}
					aria-controls={id}
					disabled={position.end}
					onClick={() => scroll(1)}
				>
					<ChevronRightRoundedIcon />
				</IconButton>
			</div>
			<div id={id} ref={track} className="home-snap-track" role="region" aria-label={label} tabIndex={0}>
				{children.map((child, index) => (
					<div className="home-snap-item" key={React.isValidElement(child) ? child.key ?? index : index}>
						{child}
					</div>
				))}
			</div>
		</div>
	);
};

export default HomeCarousel;
