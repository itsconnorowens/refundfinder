'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface ServiceStatus {
  status: 'configured' | 'missing' | 'error' | 'unknown';
  issues: string[];
}

interface HealthData {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    sentry: ServiceStatus;
    posthog: ServiceStatus;
    betterstack: ServiceStatus;
  };
  integration: {
    requestIdMiddleware: string;
    errorCorrelation: string;
    crossServiceTracking: string;
    issues: string[];
  };
  recommendations: string[];
}

/**
 * Observability Status Component
 *
 * Displays the health status of all observability services
 * Can be added to admin dashboards or monitoring pages
 */
export function ObservabilityStatus() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/observability/health');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.health) {
        setHealth(data.health);
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'configured':
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'missing':
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'configured':
      case 'healthy':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'missing':
      case 'degraded':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'error':
      case 'unhealthy':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  if (loading && !health) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading observability status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-red-900 dark:text-red-300">Failed to load observability status</h3>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            <button
              onClick={fetchHealth}
              className="mt-3 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Overall Status Card */}
      <div className={`p-6 rounded-lg border ${getStatusColor(health.overall)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(health.overall)}
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                Observability Stack
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Overall status: <span className="font-medium capitalize">{health.overall}</span>
              </p>
            </div>
          </div>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            title="Refresh status"
          >
            <RefreshCw className={`h-4 w-4 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {lastUpdated && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sentry */}
        <div className={`p-4 rounded-lg border ${getStatusColor(health.services.sentry.status)}`}>
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon(health.services.sentry.status)}
            <h4 className="font-medium text-gray-900 dark:text-white">Sentry</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Error Tracking</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{health.services.sentry.status}</p>
          {health.services.sentry.issues.length > 0 && (
            <ul className="mt-2 space-y-1">
              {health.services.sentry.issues.map((issue, idx) => (
                <li key={idx} className="text-xs text-red-600 dark:text-red-400">
                  • {issue}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* PostHog */}
        <div className={`p-4 rounded-lg border ${getStatusColor(health.services.posthog.status)}`}>
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon(health.services.posthog.status)}
            <h4 className="font-medium text-gray-900 dark:text-white">PostHog</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Analytics</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{health.services.posthog.status}</p>
          {health.services.posthog.issues.length > 0 && (
            <ul className="mt-2 space-y-1">
              {health.services.posthog.issues.map((issue, idx) => (
                <li key={idx} className="text-xs text-red-600 dark:text-red-400">
                  • {issue}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* BetterStack */}
        <div className={`p-4 rounded-lg border ${getStatusColor(health.services.betterstack.status)}`}>
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon(health.services.betterstack.status)}
            <h4 className="font-medium text-gray-900 dark:text-white">BetterStack</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Logging</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{health.services.betterstack.status}</p>
          {health.services.betterstack.issues.length > 0 && (
            <ul className="mt-2 space-y-1">
              {health.services.betterstack.issues.map((issue, idx) => (
                <li key={idx} className="text-xs text-red-600 dark:text-red-400">
                  • {issue}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Integration Status */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Integration Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Request ID Middleware</p>
            <p className="font-medium text-gray-900 dark:text-white capitalize">{health.integration.requestIdMiddleware}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Error Correlation</p>
            <p className="font-medium text-gray-900 dark:text-white capitalize">{health.integration.errorCorrelation}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Cross-Service Tracking</p>
            <p className="font-medium text-gray-900 dark:text-white capitalize">{health.integration.crossServiceTracking}</p>
          </div>
        </div>
        {health.integration.issues.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300 mb-1">Issues:</p>
            <ul className="space-y-1">
              {health.integration.issues.map((issue, idx) => (
                <li key={idx} className="text-sm text-yellow-700 dark:text-yellow-400">
                  • {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {health.recommendations.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Recommendations</h4>
          <ul className="space-y-1">
            {health.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-blue-700 dark:text-blue-400">
                • {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
