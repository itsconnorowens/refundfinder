/**
 * Admin Layout
 * Forces dynamic rendering for all admin pages
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
