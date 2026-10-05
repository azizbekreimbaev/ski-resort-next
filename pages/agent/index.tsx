import { GetServerSideProps } from 'next';
export const getServerSideProps: GetServerSideProps = async () => ({
	redirect: { destination: '/instructor', permanent: false },
});
export default function LegacyRoute() {
	return null;
}
