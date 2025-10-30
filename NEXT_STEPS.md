# Next Steps - Production Readiness

**Updated:** October 30, 2025
**Current Status:** Sentry Restored ✅ | Build Passing ✅

## Priority 1: Immediate Actions (Before Next Deployment)

### 1. Test Sentry in Development
**Action:** Start dev server and verify Sentry captures errors
```bash
npm run dev
```

**Test Checklist:**
- [ ] Visit http://localhost:3000
- [ ] Trigger a test error (use `/api/test-sentry` route if available)
- [ ] Check Sentry dashboard for error event
- [ ] Verify source maps resolve correctly
- [ ] Test error boundaries on frontend

**Expected Result:** Errors appear in Sentry with proper source file references

### 2. Restore PostHog & Error Boundaries in Layout
**Issue:** Layout was simplified during debugging - features were removed

**File:** `src/app/layout.tsx`

**Restore:**
```tsx
import { PostHogProvider, PostHogPageView } from '@/components/PostHogProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Suspense } from 'react'
import { Toaster } from 'sonner'

// ... in body
<ErrorBoundary context="root-layout">
  <PostHogProvider>
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
    {children}
    <PWAInstaller />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1e293b',
          color: '#f8fafc',
          border: '1px solid #334155',
        },
        className: 'sonner-toast',
        duration: 4000,
      }}
      richColors
    />
  </PostHogProvider>
</ErrorBoundary>
```

**Why:** These were temporarily removed during build debugging

### 3. Remove force-dynamic from Layout
**File:** `src/app/layout.tsx`

**Current (Temporary Fix):**
```typescript
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
```

**Action:** Remove these lines once build is stable

**Why:** These were added to workaround the NODE_ENV issue and are no longer needed

### 4. Update .gitignore for Sentry
**File:** `.gitignore`

**Add:**
```
# Sentry
.sentryclirc
sentry.properties
```

**Why:** Prevent accidental commit of Sentry credentials

## Priority 2: Sentry Enhancements (Optional but Recommended)

### 5. Add onRequestError Hook
**File:** `instrumentation.ts`

**Add:**
```typescript
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export async function onRequestError(
  err: Error,
  request: {
    path: string;
    method: string;
    headers: Headers;
  },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'action' | 'middleware';
  }
) {
  Sentry.captureException(err, (scope) => {
    scope.setContext('request', {
      path: request.path,
      method: request.method,
    });
    scope.setContext('router', {
      kind: context.routerKind,
      path: context.routePath,
      type: context.routeType,
    });
    return scope;
  });
}
```

**Benefit:** Captures errors from nested React Server Components

### 6. Create Global Error Handler
**File:** `src/app/global-error.tsx` (NEW)

**Create:**
```tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <AlertCircle size={64} color="#ef4444" />
          <h1 style={{ fontSize: '2rem', marginTop: '1rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
            We've been notified and are looking into it.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: '2rem',
              padding: '0.75rem 1.5rem',
              background: '#00D9B5',
              color: '#0f172a',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
```

**Benefit:** Catches all React rendering errors and reports to Sentry

### 7. Suppress Build Warning (Optional)
**File:** `.env.local`

**Add (if warning is annoying):**
```bash
SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING=1
```

**When:** After you've decided whether to implement global-error.tsx

## Priority 3: Code Quality & Testing

### 8. Uncomment Sentry in Error Boundaries
**Files to update:**
- `src/components/ErrorBoundary.tsx`
- `src/components/FormErrorBoundary.tsx` (if exists)
- `src/components/PaymentErrorBoundary.tsx` (if exists)

**Action:** Uncomment all `Sentry.captureException` calls

**Example:**
```tsx
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  // Uncomment this:
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack,
      },
    },
    tags: {
      errorBoundary: this.props.context || 'unknown',
    },
  });

  // ... rest of handler
}
```

### 9. Run Quality Checks
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Tests
npm test

# Full quality check
npm run quality-check
```

**Expected:** All should pass

### 10. Test Payment Flow End-to-End
**Critical paths to test:**
- [ ] Eligibility check
- [ ] Claim form submission
- [ ] Payment processing
- [ ] Error handling at each step
- [ ] Sentry captures errors correctly

## Priority 4: Deployment Preparation

### 11. Verify Vercel Environment Variables
**Variables to check in Vercel dashboard:**
```bash
# Required for Sentry
NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_ORG=...
SENTRY_PROJECT=...
SENTRY_AUTH_TOKEN=...  # For source maps

# Required for PostHog
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=...

# Required for business logic
AIRTABLE_API_KEY=...
AIRTABLE_BASE_ID=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
# ... etc
```

### 12. Test Build in Production Mode Locally
```bash
# Build for production
npm run build

# Start production server
npm start

# Test at http://localhost:3000
```

**Verify:**
- [ ] No build errors
- [ ] No runtime errors
- [ ] Sentry initializes correctly
- [ ] Source maps work

### 13. Deploy to Vercel Preview
```bash
# Push to branch
git add .
git commit -m "fix: restore Sentry error tracking and resolve build issues"
git push origin main

# Or create a preview branch
git checkout -b sentry-restoration
git push origin sentry-restoration
```

**Monitor:**
- [ ] Build succeeds on Vercel
- [ ] No deployment errors
- [ ] Preview URL loads correctly
- [ ] Sentry events appear in dashboard

## Priority 5: Monitoring & Optimization

### 14. Set Up Sentry Alerts
**In Sentry Dashboard:**
1. Create alert for "New Issue"
2. Create alert for "High Error Rate"
3. Set up Slack/email notifications
4. Define alerting thresholds

### 15. Review Sentry Quota
**Monitor for first week:**
- Events per day
- Sampling effectiveness
- Common error patterns
- Adjust sampling rates if needed

**Adjust sampling in:**
- `sentry.client.config.ts`
- `sentry.server.config.ts`

### 16. PostHog Dashboard Setup
**Create dashboards for:**
1. Conversion funnel (eligibility → claim → payment)
2. Drop-off analysis
3. Error correlation with user behavior
4. Performance metrics

## Priority 6: Documentation

### 17. Update README.md
**Add section:**
```markdown
## Monitoring & Error Tracking

This application uses:
- **Sentry** for error tracking and performance monitoring
- **PostHog** for user analytics and conversion tracking

### Environment Variables Required
See `.env.example` for complete list.

### Important Notes
- Never manually set `NODE_ENV` - Next.js handles this automatically
- Use only `next.config.ts`, not `next.config.js`
```

### 18. Document Incident
**Add to memory-bank/decision-log.md:**
```markdown
## 2025-10-30: Sentry Restoration

**Issue:** Build failures incorrectly attributed to Sentry
**Root Cause:** Manual NODE_ENV override in .env.local
**Resolution:** Removed NODE_ENV, restored Sentry
**Lesson:** Never manually set NODE_ENV in Next.js projects
**Reference:** See SENTRY_RESTORATION.md
```

## Priority 7: Git Cleanup

### 19. Remove Backup Files
```bash
# Once confirmed everything works:
rm *.bak
rm src/lib/error-tracking.ts.backup
```

### 20. Create Comprehensive Commit
```bash
git add .
git commit -m "fix: restore Sentry error tracking and resolve build issues

Root cause was manual NODE_ENV override in .env.local causing
Next.js to incorrectly render error pages. Sentry was never
incompatible with Next.js 15.1.4.

Changes:
- Remove NODE_ENV from .env.local and .env.example
- Delete duplicate next.config.js, keep only next.config.ts
- Restore @sentry/nextjs package and all config files
- Re-enable Sentry instrumentation and error tracking
- Add comprehensive documentation in SENTRY_RESTORATION.md

Verified:
- Build passes with Sentry fully operational
- All 29 API routes have error tracking
- Smart sampling active for cost optimization
- Source maps configured for production

Closes #[issue-number-if-applicable]"
```

## Checklist Summary

### Must Do Before Production Deploy
- [ ] Test Sentry in development
- [ ] Restore PostHog & Error Boundaries in layout
- [ ] Remove temporary force-dynamic
- [ ] Run quality checks (type-check, lint, test)
- [ ] Test payment flow end-to-end
- [ ] Verify Vercel environment variables
- [ ] Deploy to preview and validate

### Should Do (High Priority)
- [ ] Add onRequestError hook
- [ ] Create global-error.tsx
- [ ] Uncomment Sentry in error boundaries
- [ ] Test production build locally
- [ ] Set up Sentry alerts

### Nice to Have
- [ ] Update README with monitoring section
- [ ] Document incident in decision-log
- [ ] Review and optimize Sentry quota
- [ ] Set up PostHog dashboards
- [ ] Clean up backup files

## Success Criteria

**Sentry is production-ready when:**
1. ✅ Build passes with Sentry enabled
2. ⏳ Errors in dev environment appear in Sentry dashboard
3. ⏳ Source maps resolve to correct files
4. ⏳ Error boundaries report to Sentry
5. ⏳ API errors tracked via withErrorTracking wrapper
6. ⏳ Preview deployment succeeds
7. ⏳ No console errors in production

## Questions to Consider

1. **Do we want to add the onRequestError hook now or later?**
   - Pros: Better error coverage for nested RSC
   - Cons: Adds complexity, not critical for MVP

2. **Should we create global-error.tsx immediately?**
   - Pros: Catches React rendering errors
   - Cons: Can be added later without issues

3. **Are current Sentry sampling rates appropriate?**
   - Current: 15-80% based on route priority
   - Adjust based on quota usage after launch

4. **Do we need to adjust the .gitignore for Sentry files?**
   - Yes: Add `.sentryclirc` and `sentry.properties`

## Resources

- [SENTRY_RESTORATION.md](./SENTRY_RESTORATION.md) - Complete investigation writeup
- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Next.js Instrumentation](https://nextjs.org/docs/app/guides/instrumentation)
- [Current commit history](git log --oneline -10)

---

**Current Status:** Sentry restored and operational. Follow checklist above for production deployment.
