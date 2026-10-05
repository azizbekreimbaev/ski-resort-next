import { GetServerSideProps } from 'next';
export const getServerSideProps: GetServerSideProps = async () => ({
	redirect: { destination: '/_admin/resort', permanent: false },
});
export default function LegacyAdminRoute() {
	return null;
}
