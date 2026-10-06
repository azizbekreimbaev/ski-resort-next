import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useApolloClient, useMutation, useReactiveVar } from '@apollo/client';
import { Alert, Button, CircularProgress, Pagination } from '@mui/material';
import {
	Favorite,
	FavoriteBorder,
	Search,
	Tune,
	Schedule,
	Translate,
	Visibility,
	LocationOn,
} from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { GET_INSTRUCTORS, GET_RESORTS } from '../../../apollo/user/query';
import { LIKE_TARGET_MEMBER } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { CatalogData, CatalogMember } from '../../types/catalog';
import { InstructorAudience, InstructorLevel } from '../../enums/instructor.enum';
import { InstructorImage } from '../homepage/InstructorCard';
import { homePrice } from '../homepage/homeUtils';

export const weeklyPrice = (member: CatalogMember, weeks: number) =>
	[
		member.instructorPrice1Week,
		member.instructorPrice2Weeks,
		member.instructorPrice3Weeks,
		member.instructorPrice4Weeks,
	][weeks - 1];

export default function InstructorDirectory() {
	const client = useApolloClient();
	const user = useReactiveVar(userVar);
	const { t, i18n } = useTranslation('common');
	const [members, setMembers] = useState<CatalogMember[]>([]);
	const [resorts, setResorts] = useState<{ _id: string; resortTitle: string }[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [resortError, setResortError] = useState(false);
	const [revision, setRevision] = useState(0);
	const [text, setText] = useState('');
	const [sort, setSort] = useState('createdAt');
	const [audience, setAudience] = useState('');
	const [level, setLevel] = useState('');
	const [languages, setLanguages] = useState<string[]>([]);
	const [experience, setExperience] = useState('');
	const [resort, setResort] = useState('');
	const [weeks, setWeeks] = useState(1);
	const [budget, setBudget] = useState<number | null>(null);
	const [page, setPage] = useState(1);
	const [pending, setPending] = useState<string[]>([]);
	const [like] = useMutation(LIKE_TARGET_MEMBER);
	useEffect(() => {
		let active = true;
		setLoading(true);
		setError('');
		setMembers([]);
		const load = async () => {
			const all: CatalogMember[] = [];
			for (let batch = 1; active; batch++) {
				const { data } = await client.query<CatalogData>({
					query: GET_INSTRUCTORS,
					fetchPolicy: 'network-only',
					variables: {
						input: { page: batch, limit: 100, sort, direction: 'DESC', search: {} },
					},
				});
				const result = data.getInstructors;
				if (!result) throw new Error('Unable to load instructors.');
				all.push(...result.list);
				if (all.length >= (result.metaCounter?.[0]?.total ?? 0)) break;
				if (!result.list.length) throw new Error('The directory changed. Please retry.');
			}
			if (active) setMembers(Array.from(new Map(all.map((member) => [member._id, member])).values()));
		};
		void load()
			.catch(() => {
				if (active) setError(t('Unable to load instructors. Please try again.'));
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, [client, sort, user._id, revision, t]);
	useEffect(() => {
		let active = true;
		setResortError(false);
		void (async () => {
			const all: { _id: string; resortTitle: string }[] = [];
			for (let batch = 1; active; batch++) {
				const { data } = await client.query<CatalogData>({
					query: GET_RESORTS,
					variables: {
						input: {
							page: batch,
							limit: 100,
							sort: 'resortTitle',
							direction: 'ASC',
							search: {},
						},
					},
				});
				const result = data.getResorts;
				if (!result) throw new Error('Unable to load resorts');
				all.push(...result.list);
				if (all.length >= (result.metaCounter?.[0]?.total ?? 0)) break;
				if (!result.list.length) throw new Error('Resort directory changed');
			}
			if (active) setResorts(all);
		})().catch(() => {
			if (active) setResortError(true);
		});
		return () => {
			active = false;
		};
	}, [client, revision]);
	useEffect(() => {
		setPage(1);
	}, [text, sort, audience, level, languages, experience, resort, weeks, budget]);
	const availableLanguages = useMemo(
		() => {
			const preferred = ['Korean', 'English', 'Russian', 'Chinese'];
			const additional = Array.from(new Set(members.flatMap((member) => member.instructorLanguages ?? [])))
				.filter((language) => !preferred.includes(language))
				.sort();
			return [...preferred, ...additional];
		},
		[members],
	);
	const maxPrice = Math.max(0, ...members.map((member) => weeklyPrice(member, weeks) ?? 0));
	const filtered = members.filter((member) => {
		const years = member.instructorExperienceYears;
		const price = weeklyPrice(member, weeks);
		return (
			(!text.trim() ||
				`${member.memberNick} ${member.memberFullName ?? ''}`.toLowerCase().includes(text.trim().toLowerCase())) &&
			(!audience || member.instructorAudience === audience) &&
			(!level || member.instructorLevel === level || member.instructorLevel === InstructorLevel.ALL) &&
			(!languages.length || languages.some((language) => member.instructorLanguages?.includes(language))) &&
			(!experience ||
				(years != null &&
					(experience === '0-2'
						? years <= 2
						: experience === '3-5'
						? years >= 3 && years <= 5
						: experience === '6-10'
						? years >= 6 && years <= 10
						: years >= 10))) &&
			(!resort || member.instructorResortId === resort) &&
			price != null &&
			(budget == null || price <= budget)
		);
	});
	const clear = () => {
		setText('');
		setAudience('');
		setLevel('');
		setLanguages([]);
		setExperience('');
		setResort('');
		setWeeks(1);
		setBudget(null);
		setPage(1);
	};
	const toggleLike = async (member: CatalogMember) => {
		if (!user._id) {
			setError(t('Please log in to like an instructor.'));
			return;
		}
		if (pending.includes(member._id)) return;
		setPending((current) => [...current, member._id]);
		try {
			await like({ variables: { input: member._id } });
			setRevision((current) => current + 1);
		} catch {
			setError(t('Unable to update like. Please try again.'));
		} finally {
			setPending((current) => current.filter((id) => id !== member._id));
		}
	};
	const radioGroup = (
		title: string,
		value: string,
		options: { value: string; label: string }[],
		update: (value: string) => void,
	) => (
		<fieldset>
			<legend>{t(title)}</legend>
			{[{ value: '', label: 'All' }, ...options].map((option) => (
				<label key={option.value}>
					<input type="radio" name={title} checked={value === option.value} onChange={() => update(option.value)} />
					{t(option.label)}
					{title === 'Audience' && (
						<span className="filter-count">
							{members.filter((member) => !option.value || member.instructorAudience === option.value).length}
						</span>
					)}
				</label>
			))}
		</fieldset>
	);
	const totalPages = Math.ceil(filtered.length / 9);
	const currentPage = Math.min(page, Math.max(1, totalPages));
	return (
		<div className="instructor-directory">
			<section className="instructor-hero">
				<span>{t('Winter Season Discovery')}</span>
				<h1>{t('Find Your Ski Instructor')}</h1>
				<p>{t('Browse instructors by level, audience, language, experience, resort, and lesson duration.')}</p>
			</section>
			<div className="instructor-search">
				<Search />
				<input
					aria-label={t('Search instructors by name')}
					placeholder={t('Search instructors by name...')}
					value={text}
					onChange={(event) => setText(event.target.value)}
				/>
			</div>
			<div className="instructor-discovery-layout">
				<aside className="instructor-filters">
					<div className="filter-heading">
						<h2>
							<Tune />
							{t('Filters')}
						</h2>
						<button onClick={clear}>{t('Clear all')}</button>
					</div>
					{radioGroup(
						'Audience',
						audience,
						Object.values(InstructorAudience).map((value) => ({ value, label: `Audience ${value}` })),
						setAudience,
					)}
					{radioGroup(
						'Instructor Level',
						level,
						Object.values(InstructorLevel)
							.filter((value) => value !== InstructorLevel.ALL)
							.map((value) => ({ value, label: `Instructor level ${value}` })),
						setLevel,
					)}
					<fieldset>
						<legend>{t('Languages')}</legend>
						{availableLanguages.map((language) => (
							<label key={language}>
								<input
									type="checkbox"
									checked={languages.includes(language)}
									onChange={() =>
										setLanguages((current) =>
											current.includes(language) ? current.filter((item) => item !== language) : [...current, language],
										)
									}
								/>
								{language}
							</label>
						))}
						{!availableLanguages.length && <small>{t('No languages listed')}</small>}
					</fieldset>
					{radioGroup(
						'Experience',
						experience,
						['0-2', '3-5', '6-10', '10+'].map((value) => ({ value, label: `${value} years` })),
						setExperience,
					)}
					<fieldset>
						<legend>
							<label htmlFor="instructor-resort">{t('Resort')}</label>
						</legend>
						<select id="instructor-resort" value={resort} onChange={(event) => setResort(event.target.value)}>
							<option value="">{t('All Resorts')}</option>
							{resorts.map((item) => (
								<option key={item._id} value={item._id}>
									{item.resortTitle}
								</option>
							))}
						</select>
						{resortError && (
							<small>
								{t('Resorts could not be loaded.')}{' '}
								<button onClick={() => setRevision((current) => current + 1)}>{t('Retry')}</button>
							</small>
						)}
					</fieldset>
					<fieldset>
						<legend>{t('Lesson Duration')}</legend>
						<div className="duration-tabs">
							{[1, 2, 3, 4].map((value) => (
								<button
									key={value}
									aria-pressed={weeks === value}
									onClick={() => {
										setWeeks(value);
										setBudget(null);
									}}
								>
									{value} {t(value === 1 ? 'Wk' : 'Wks')}
								</button>
							))}
						</div>
						<div className="price-range">
							<span>{homePrice(0, i18n.language)}</span>
							<strong>{budget == null ? t('Any price') : homePrice(budget, i18n.language)}</strong>
						</div>
						<input
							aria-label={t('Maximum weekly price')}
							type="range"
							min={0}
							max={maxPrice || 1}
							step={1}
							value={budget ?? maxPrice}
							disabled={!maxPrice}
							onChange={(event) =>
								setBudget(Number(event.target.value) >= maxPrice ? null : Number(event.target.value))
							}
						/>
					</fieldset>
				</aside>
				<section className="instructor-results" aria-busy={loading}>
					<div className="instructor-results-heading">
						<div>
							<h2>
								{filtered.length} {t('Instructors')}
							</h2>
							<span>
								{filtered.length
									? `${(currentPage - 1) * 9 + 1}–${Math.min(currentPage * 9, filtered.length)} ${t('of')} ${
											filtered.length
									  }`
									: t('No results')}
							</span>
						</div>
						<label>
							{t('Sort By')}{' '}
							<select value={sort} onChange={(event) => setSort(event.target.value)}>
								<option value="createdAt">{t('Newest')}</option>
								<option value="memberViews">{t('Most Viewed')}</option>
								<option value="memberLikes">{t('Most Liked')}</option>
							</select>
						</label>
					</div>
					{error && (
						<Alert
							severity="error"
							action={<Button onClick={() => setRevision((current) => current + 1)}>{t('Retry')}</Button>}
						>
							{error}
						</Alert>
					)}
					{loading ? (
						<div className="instructor-state">
							<CircularProgress />
							<p>{t('Loading instructors...')}</p>
						</div>
					) : (
						<>
							{!error && !filtered.length && (
								<div className="instructor-state">
									<h3>{t('No instructors found')}</h3>
									<p>{t('Try a different search or clear your filters.')}</p>
									<Button onClick={clear}>{t('Clear all')}</Button>
								</div>
							)}
							<div className="instructor-grid">
								{filtered.slice((currentPage - 1) * 9, currentPage * 9).map((member) => {
									const href = `/instructor/detail?instructorId=${encodeURIComponent(member._id)}`;
									const price = weeklyPrice(member, weeks);
									const resortName = resorts.find((item) => item._id === member.instructorResortId)?.resortTitle;
									const liked = Boolean(member.meLiked?.[0]?.myFavorite);
									return (
										<article className="directory-instructor-card" key={member._id}>
											<div className="instructor-photo">
										<Link href={href} passHref>
													<InstructorImage instructor={member} />
												</Link>
												<button
													className="instructor-like"
													aria-label={t(liked ? 'Unlike instructor' : 'Like instructor')}
													aria-pressed={liked}
													disabled={pending.includes(member._id)}
													onClick={() => void toggleLike(member)}
												>
													{liked ? <Favorite /> : <FavoriteBorder />}
												</button>
												<span className="instructor-badge">
													{[
														member.instructorLevel && t(`Instructor level ${member.instructorLevel}`),
														member.instructorAudience && t(`Audience ${member.instructorAudience}`),
													]
														.filter(Boolean)
														.join(' · ') || t('Instructor')}
												</span>
											</div>
											<div className="instructor-card-body">
												<h3>
													<Link href={href}>{member.memberFullName || member.memberNick}</Link>
												</h3>
												{member.instructorExperienceYears != null && (
													<p>
														<Schedule />
														{t('Instructor experience', { count: member.instructorExperienceYears })}
													</p>
												)}
												{Boolean(member.instructorLanguages?.length) && (
													<p>
														<Translate />
														{member.instructorLanguages?.join(' · ')}
													</p>
												)}
												{resortName && (
													<p className="instructor-resort">
														<LocationOn />
														{resortName}
													</p>
												)}
												<div className="instructor-stats">
													<span>
														<Visibility />
														{member.memberViews} {t('views')}
													</span>
													<span>
														<FavoriteBorder />
														{member.memberLikes} {t('likes')}
													</span>
												</div>
											</div>
											<div className="instructor-card-footer">
												<div>
													<small>
														{t('Weeks', { count: weeks })}
													</small>
													<strong>{price == null ? t('Price not listed') : homePrice(price, i18n.language)}</strong>
												</div>
												<Link href={href}>{t('View Profile')}</Link>
											</div>
										</article>
									);
								})}
							</div>
							{totalPages > 1 && (
								<Pagination count={totalPages} page={currentPage} onChange={(_event, next) => setPage(next)} />
							)}
						</>
					)}
				</section>
			</div>
		</div>
	);
}
