/**
 * API Endpoint for Real-Time Services Monitoring and Metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeRealTimeServices } from '../../../lib/real-time-services-config';

// Initialize services
const { monitor, config } = initializeRealTimeServices();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint parameter is required' },
        { status: 400 }
      );
    }

    switch (endpoint) {
      case 'metrics':
        return getMetrics();
      case 'health':
        return getHealth();
      case 'config':
        return getConfig();
      case 'status':
        return getStatus();
      default:
        return NextResponse.json(
          { error: 'Invalid endpoint. Use: metrics, health, config, status' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Monitoring API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch monitoring data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function getMetrics() {
  const metrics = monitor.getMetrics();

  return NextResponse.json({
    success: true,
    data: {
      metrics,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
}

async function getHealth() {
  // Check health of all services
  const healthChecks = {
    flightStatus: await checkFlightStatusHealth(),
    weather: await checkWeatherHealth(),
    operational: await checkOperationalHealth(),
  };

  const overallHealth = Object.values(healthChecks).every(
    (status) => status === 'healthy'
  )
    ? 'healthy'
    : 'degraded';

  return NextResponse.json({
    success: true,
    data: {
      overall: overallHealth,
      services: healthChecks,
      timestamp: new Date().toISOString(),
    },
  });
}

async function getConfig() {
  // Return sanitized configuration (without API keys)
  const sanitizedConfig = {
    flightStatus: {
      providers: {
        flightRadar24: {
          enabled:
            config.flightStatus.providers.flightRadar24?.enabled || false,
        },
        aviationStack: {
          enabled:
            config.flightStatus.providers.aviationStack?.enabled || false,
        },
        flightAPI: {
          enabled: config.flightStatus.providers.flightAPI?.enabled || false,
        },
      },
      cache: config.flightStatus.cache,
      rateLimit: config.flightStatus.rateLimit,
    },
    weather: {
      providers: {
        openWeatherMap: {
          enabled: config.weather.providers.openWeatherMap?.enabled || false,
        },
        aviationWeatherCenter: {
          enabled:
            config.weather.providers.aviationWeatherCenter?.enabled || false,
        },
        weatherAPI: {
          enabled: config.weather.providers.weatherAPI?.enabled || false,
        },
      },
      cache: config.weather.cache,
      rateLimit: config.weather.rateLimit,
    },
    operational: {
      providers: {
        faa: {
          enabled: config.operational.providers.faa?.enabled || false,
        },
        eurocontrol: {
          enabled: config.operational.providers.eurocontrol?.enabled || false,
        },
        basic: {
          enabled: config.operational.providers.basic?.enabled || false,
        },
      },
      cache: config.operational.cache,
    },
    monitoring: config.monitoring,
  };

  return NextResponse.json({
    success: true,
    data: sanitizedConfig,
  });
}

async function getStatus() {
  const metrics = monitor.getMetrics();

  // Calculate service status based on metrics
  const serviceStatus = {
    flightStatus: calculateServiceStatus(metrics, 'flight-status'),
    weather: calculateServiceStatus(metrics, 'weather'),
    operational: calculateServiceStatus(metrics, 'operational'),
  };

  return NextResponse.json({
    success: true,
    data: {
      services: serviceStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
}

async function checkFlightStatusHealth(): Promise<
  'healthy' | 'degraded' | 'unhealthy'
> {
  try {
    // Check if at least one flight status provider is configured
    const hasProvider = !!(
      config.flightStatus.providers.flightRadar24?.enabled ||
      config.flightStatus.providers.aviationStack?.enabled ||
      config.flightStatus.providers.flightAPI?.enabled
    );

    return hasProvider ? 'healthy' : 'unhealthy';
  } catch {
    return 'unhealthy';
  }
}

async function checkWeatherHealth(): Promise<
  'healthy' | 'degraded' | 'unhealthy'
> {
  try {
    // Check if at least one weather provider is configured
    const hasProvider = !!(
      config.weather.providers.openWeatherMap?.enabled ||
      config.weather.providers.aviationWeatherCenter?.enabled ||
      config.weather.providers.weatherAPI?.enabled
    );

    return hasProvider ? 'healthy' : 'unhealthy';
  } catch {
    return 'unhealthy';
  }
}

async function checkOperationalHealth(): Promise<
  'healthy' | 'degraded' | 'unhealthy'
> {
  try {
    // Operational services are always available (basic provider)
    return 'healthy';
  } catch {
    return 'unhealthy';
  }
}

function calculateServiceStatus(
  metrics: any,
  serviceName: string
): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  successRate: number;
  averageResponseTime: number;
  totalCalls: number;
} {
  const serviceMetrics = Object.entries(metrics)
    .filter(([key]) => key.startsWith(serviceName))
    .map(([, value]) => value as any);

  if (serviceMetrics.length === 0) {
    return {
      status: 'unhealthy',
      successRate: 0,
      averageResponseTime: 0,
      totalCalls: 0,
    };
  }

  const totalCalls = serviceMetrics.reduce(
    (sum, metric) => sum + metric.totalCalls,
    0
  );
  const successfulCalls = serviceMetrics.reduce(
    (sum, metric) => sum + metric.successfulCalls,
    0
  );
  const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
  const averageResponseTime =
    serviceMetrics.reduce(
      (sum, metric) => sum + metric.averageResponseTime,
      0
    ) / serviceMetrics.length;

  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (successRate >= 95) {
    status = 'healthy';
  } else if (successRate >= 80) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return {
    status,
    successRate: Math.round(successRate * 100) / 100,
    averageResponseTime: Math.round(averageResponseTime * 100) / 100,
    totalCalls,
  };
}
