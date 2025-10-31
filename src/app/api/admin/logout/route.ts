import { clearAdminSession } from '@/lib/admin-auth';
import { withErrorTracking } from '@/lib/error-tracking';

export const POST = withErrorTracking(async () => {
  return clearAdminSession();
}, {
  route: '/api/admin/logout',
  tags: { service: 'admin', operation: 'logout' }
});


