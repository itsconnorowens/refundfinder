import { logger } from '@/lib/logger';

/**
 * Real-Time Services Configuration
 */

export interface RealTimeServicesConfig {
  flightStatus: {
    providers: {
      flightRadar24?: {
        apiKey: string;
        enabled: boolean;
      };
      aviationStack?: {
        apiKey: string;
        enabled: boolean;
      };
      flightAPI?: {
        apiKey: string;
        enabled: boolean;
      };
    };
    cache: {
      enabled: boolean;
      ttl: number; // milliseconds
      maxSize: number;
    };
    rateLimit: {
      enabled: boolean;
      requestsPerMinute: number;
    };
  };

  weather: {
    providers: {
      openWeatherMap?: {
        apiKey: string;
        enabled: boolean;
      };
      aviationWeatherCenter?: {
        enabled: boolean;
      };
      weatherAPI?: {
        apiKey: string;
        enabled: boolean;
      };
    };
    cache: {
      enabled: boolean;
      ttl: number; // milliseconds
      maxSize: number;
    };
    rateLimit: {
      enabled: boolean;
      requestsPerMinute: number;
    };
  };

  operational: {
    providers: {
      faa?: {
        enabled: boolean;
      };
      eurocontrol?: {
        enabled: boolean;
      };
      basic?: {
        enabled: boolean;
      };
    };
    cache: {
      enabled: boolean;
      ttl: number; // milliseconds
      maxSize: number;
    };
  };

  monitoring: {
    enabled: boolean;
    metrics: {
      enabled: boolean;
      endpoint?: string;
    };
    alerts: {
      enabled: boolean;
      webhook?: string;
    };
  };
}

export const defaultConfig: RealTimeServicesConfig = {
  flightStatus: {
    providers: {
      flightRadar24: {
        apiKey: process.env.FLIGHTRADAR24_API_KEY || '',
        enabled: !!process.env.FLIGHTRADAR24_API_KEY,
      },
      aviationStack: {
        apiKey: process.env.AVIATIONSTACK_API_KEY || '',
        enabled: !!process.env.AVIATIONSTACK_API_KEY,
      },
      flightAPI: {
        apiKey: process.env.FLIGHTAPI_API_KEY || '',
        enabled: !!process.env.FLIGHTAPI_API_KEY,
      },
    },
    cache: {
      enabled: true,
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
    },
    rateLimit: {
      enabled: true,
      requestsPerMinute: 100,
    },
  },

  weather: {
    providers: {
      openWeatherMap: {
        apiKey: process.env.OPENWEATHER_API_KEY || '',
        enabled: !!process.env.OPENWEATHER_API_KEY,
      },
      aviationWeatherCenter: {
        enabled: true, // Free government service
      },
      weatherAPI: {
        apiKey: process.env.WEATHERAPI_API_KEY || '',
        enabled: !!process.env.WEATHERAPI_API_KEY,
      },
    },
    cache: {
      enabled: true,
      ttl: 10 * 60 * 1000, // 10 minutes
      maxSize: 500,
    },
    rateLimit: {
      enabled: true,
      requestsPerMinute: 60,
    },
  },

  operational: {
    providers: {
      faa: {
        enabled: true, // Free government service
      },
      eurocontrol: {
        enabled: true, // Free government service
      },
      basic: {
        enabled: true, // Always enabled as fallback
      },
    },
    cache: {
      enabled: true,
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 200,
    },
  },

  monitoring: {
    enabled: true,
    metrics: {
      enabled: true,
      endpoint: process.env.METRICS_ENDPOINT,
    },
    alerts: {
      enabled: true,
      webhook: process.env.ALERTS_WEBHOOK,
    },
  },
};

export class RealTimeServicesFactory {
  private config: RealTimeServicesConfig;

  constructor(config: RealTimeServicesConfig = defaultConfig) {
    this.config = config;
  }

  createFlightStatusManager() {
    const {
      FlightRadar24Provider,
      AviationStackProvider,
      FlightAPIProvider,
    } = require('./providers/flight-status-providers');
    const { FlightStatusManager } = require('./flight-status-service');

    const providers = [];

    if (this.config.flightStatus.providers.flightRadar24?.enabled) {
      providers.push(
        new FlightRadar24Provider(
          this.config.flightStatus.providers.flightRadar24.apiKey
        )
      );
    }

    if (this.config.flightStatus.providers.aviationStack?.enabled) {
      providers.push(
        new AviationStackProvider(
          this.config.flightStatus.providers.aviationStack.apiKey
        )
      );
    }

    if (this.config.flightStatus.providers.flightAPI?.enabled) {
      providers.push(
        new FlightAPIProvider(
          this.config.flightStatus.providers.flightAPI.apiKey
        )
      );
    }

    if (providers.length === 0) {
      throw new Error('No flight status providers enabled');
    }

    return new FlightStatusManager(providers);
  }

  createAirportStatusManager() {
    const {
      OpenWeatherMapProvider,
      AviationWeatherCenterProvider,
      WeatherAPIProvider,
    } = require('./providers/weather-providers');
    const {
      FAAOperationalProvider,
      EurocontrolOperationalProvider,
      BasicOperationalProvider,
    } = require('./providers/operational-providers');
    const { AirportStatusManager } = require('./airport-status-service');

    const weatherProviders = [];

    if (this.config.weather.providers.openWeatherMap?.enabled) {
      weatherProviders.push(
        new OpenWeatherMapProvider(
          this.config.weather.providers.openWeatherMap.apiKey
        )
      );
    }

    if (this.config.weather.providers.aviationWeatherCenter?.enabled) {
      weatherProviders.push(new AviationWeatherCenterProvider());
    }

    if (this.config.weather.providers.weatherAPI?.enabled) {
      weatherProviders.push(
        new WeatherAPIProvider(this.config.weather.providers.weatherAPI.apiKey)
      );
    }

    const operationalProviders = [];

    if (this.config.operational.providers.faa?.enabled) {
      operationalProviders.push(new FAAOperationalProvider());
    }

    if (this.config.operational.providers.eurocontrol?.enabled) {
      operationalProviders.push(new EurocontrolOperationalProvider());
    }

    if (this.config.operational.providers.basic?.enabled) {
      operationalProviders.push(new BasicOperationalProvider());
    }

    return new AirportStatusManager(weatherProviders, operationalProviders);
  }

  createDelayAttributionEngine() {
    const {
      WeatherClassificationEngine,
      DelayAttributionEngine,
    } = require('./airport-status-service');

    const weatherClassifier = new WeatherClassificationEngine();
    return new DelayAttributionEngine(weatherClassifier);
  }

  createEnhancedClaimProcessingService() {
    const {
      EnhancedClaimProcessingService,
    } = require('./enhanced-claim-processing');

    const flightStatusManager = this.createFlightStatusManager();
    const airportStatusManager = this.createAirportStatusManager();
    const delayAttributionEngine = this.createDelayAttributionEngine();

    return new EnhancedClaimProcessingService(
      flightStatusManager,
      airportStatusManager,
      delayAttributionEngine
    );
  }
}

export class RealTimeServicesMonitor {
  private config: RealTimeServicesConfig;
  private metrics: Map<string, any> = new Map();

  constructor(config: RealTimeServicesConfig = defaultConfig) {
    this.config = config;
  }

  recordApiCall(
    service: string,
    provider: string,
    success: boolean,
    responseTime: number
  ) {
    if (!this.config.monitoring.metrics.enabled) return;

    const key = `${service}:${provider}`;
    const existing = this.metrics.get(key) || {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
    };

    existing.totalCalls++;
    existing.totalResponseTime += responseTime;
    existing.averageResponseTime =
      existing.totalResponseTime / existing.totalCalls;

    if (success) {
      existing.successfulCalls++;
    } else {
      existing.failedCalls++;
    }

    this.metrics.set(key, existing);

    // Log metrics
    console.log(
      `API Call: ${service}:${provider}, Success: ${success}, ResponseTime: ${responseTime}ms`
    );
  }

  recordCacheHit(cacheKey: string) {
    if (!this.config.monitoring.metrics.enabled) return;

    logger.info('Cache Hit: ', { cacheKey: cacheKey });
  }

  recordCacheMiss(cacheKey: string) {
    if (!this.config.monitoring.metrics.enabled) return;

    logger.info('Cache Miss: ', { cacheKey: cacheKey });
  }

  recordError(service: string, provider: string, error: Error) {
    if (!this.config.monitoring.metrics.enabled) return;

    console.error(`Service Error: ${service}:${provider}`, error);

    // Send alert if configured
    if (
      this.config.monitoring.alerts.enabled &&
      this.config.monitoring.alerts.webhook
    ) {
      this.sendAlert(service, provider, error);
    }
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  private async sendAlert(service: string, provider: string, error: Error) {
    try {
      const alert = {
        service,
        provider,
        error: error.message,
        timestamp: new Date().toISOString(),
        severity: 'error',
      };

      await fetch(this.config.monitoring.alerts.webhook!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      });
    } catch (alertError) {
      logger.error('Failed to send alert:', alertError);
    }
  }
}

// Environment variable validation
export function validateEnvironmentVariables(): string[] {
  const errors: string[] = [];

  // Check for at least one flight status provider
  const hasFlightProvider = !!(
    process.env.FLIGHTRADAR24_API_KEY ||
    process.env.AVIATIONSTACK_API_KEY ||
    process.env.FLIGHTAPI_API_KEY
  );

  if (!hasFlightProvider) {
    errors.push(
      'At least one flight status provider API key must be configured'
    );
  }

  // Check for at least one weather provider
  const hasWeatherProvider = !!(
    process.env.OPENWEATHER_API_KEY || process.env.WEATHERAPI_API_KEY
  );

  if (!hasWeatherProvider) {
    errors.push('At least one weather provider API key must be configured');
  }

  return errors;
}

// Initialize services with configuration
export function initializeRealTimeServices(config?: RealTimeServicesConfig) {
  const errors = validateEnvironmentVariables();
  if (errors.length > 0) {
    logger.warn('Configuration warnings:', { errors: errors });
  }

  const factory = new RealTimeServicesFactory(config);
  const monitor = new RealTimeServicesMonitor(config);

  return {
    factory,
    monitor,
    config: config || defaultConfig,
  };
}
