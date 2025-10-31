import type { Metadata } from 'next'
import './globals.css'
import { PWAInstaller } from '@/components/PWAInstaller'
import { ClientPostHogProvider } from '@/components/ClientPostHog'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ClientToaster } from '@/components/ClientToaster'
import { SentryFeedbackWidget } from '@/components/SentryFeedback'
import { CurrencyProvider } from '@/contexts/CurrencyContext'

export const metadata: Metadata = {
  title: 'Flghtly - Flight Delay Compensation',
  description: 'Get compensation for flight delays and cancellations under EU Regulation 261/2004. We handle the entire process for you.',
  manifest: '/manifest.json',
  themeColor: '#00D9B5',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Flghtly',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Flghtly" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init fi Cr Or ci Tr Ir capture Mi calculateEventProperties Ar register register_once register_for_session unregister unregister_for_session Nr getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty jr Mr createPersonProfile Lr kr Ur opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing Fr debug M Dr getPageViewId captureTraceFeedback captureTraceMetric Sr".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('phc_GbPdanX1oIiHJnykE5uuGXDpKV5z8GFuRinHl1yBZ6i', {
        api_host: '/ingest',
        ui_host: 'https://us.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false,
        capture_pageleave: true,
    });
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ErrorBoundary context="root-layout">
          <ClientPostHogProvider>
            <CurrencyProvider>
              {children}
              <PWAInstaller />
              <SentryFeedbackWidget />
              <ClientToaster />
            </CurrencyProvider>
          </ClientPostHogProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
