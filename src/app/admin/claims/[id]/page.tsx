/**
 * Server Component Wrapper for Claim Details
 * Handles async params for Next.js 15+
 */

import ClaimDetailClientPage from './page-client';

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClaimDetailClientPage id={id} />;
}
