/**
 * Airport Status Service - Core interfaces and types for real-time airport operational data
 */

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AirportStatusService {
  getAirportStatus(airportCode: string): Promise<AirportStatus>;
  getWeatherConditions(airportCode: string): Promise<WeatherConditions>;
  getOperationalStatus(airportCode: string): Promise<OperationalStatus>;
  getHistoricalWeather(
    airportCode: string,
    dateRange: DateRange
  ): Promise<WeatherHistory[]>;
}

export interface AirportStatus {
  airportCode: string;
  timestamp: Date;
  weather: WeatherConditions;
  operational: OperationalStatus;
  delays: DelayInformation;
  lastUpdated: Date;
}

export interface WeatherConditions {
  temperature: number; // Celsius
  humidity: number; // Percentage
  visibility: number; // Kilometers
  windSpeed: number; // km/h
  windDirection: number; // Degrees
  pressure: number; // hPa
  conditions: WeatherCondition[];
  isSevere: boolean;
  affectsAviation: boolean;
}

export interface WeatherCondition {
  type: WeatherType;
  intensity: WeatherIntensity;
  description: string;
  affectsRunways: boolean;
  affectsVisibility: boolean;
}

export type WeatherType =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'fog'
  | 'storm'
  | 'hail'
  | 'ice';

export type WeatherIntensity = 'light' | 'moderate' | 'heavy' | 'severe';

export interface OperationalStatus {
  status: OperationalStatusType;
  runwayStatus: RunwayStatus[];
  airTrafficDelays: boolean;
  groundStop: boolean;
  closureReason?: string;
  estimatedReopening?: Date;
}

export type OperationalStatusType =
  | 'normal'
  | 'delayed'
  | 'ground_stop'
  | 'closed';

export interface RunwayStatus {
  runway: string;
  status: RunwayStatusType;
  visibility: number; // meters
  surfaceCondition: SurfaceCondition;
  windRestrictions: boolean;
}

export type RunwayStatusType = 'open' | 'closed' | 'limited';

export type SurfaceCondition = 'dry' | 'wet' | 'snow' | 'ice' | 'contaminated';

export interface DelayInformation {
  averageDelay: number; // minutes
  delayReason: string;
  affectedFlights: number;
  expectedResolution?: Date;
}

export interface WeatherHistory {
  timestamp: Date;
  conditions: WeatherConditions;
}

export interface WeatherProvider {
  name: string;
  priority: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  costPerRequest: number;
  dataAccuracy: 'high' | 'medium' | 'low';

  getCurrentWeather(airportCode: string): Promise<WeatherConditions>;
  getForecast(airportCode: string, hours: number): Promise<WeatherForecast[]>;
  getHistoricalWeather(
    airportCode: string,
    date: Date
  ): Promise<WeatherConditions>;
  isHealthy(): Promise<boolean>;
}

export interface WeatherForecast {
  timestamp: Date;
  conditions: WeatherConditions;
  confidence: number; // 0-1
}

export interface OperationalProvider {
  name: string;
  priority: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };

  getOperationalStatus(airportCode: string): Promise<OperationalStatus>;
  getRunwayStatus(airportCode: string): Promise<RunwayStatus[]>;
  getAirTrafficDelays(airportCode: string): Promise<boolean>;
  isHealthy(): Promise<boolean>;
}

export interface CachedAirportStatus {
  data: AirportStatus;
  timestamp: number;
  ttl: number;
  provider: string;
}

export interface CachedWeatherData {
  data: WeatherConditions;
  timestamp: number;
  ttl: number;
  provider: string;
}

export class RateLimiter {
  private limits: Map<string, { count: number; resetTime: number }>;

  constructor() {
    this.limits = new Map();
  }

  async canMakeRequest(
    provider: WeatherProvider | OperationalProvider
  ): Promise<boolean> {
    const now = Date.now();
    const limit = this.limits.get(provider.name);

    if (!limit || now > limit.resetTime) {
      this.limits.set(provider.name, {
        count: 1,
        resetTime: now + 60000, // Reset every minute
      });
      return true;
    }

    if (limit.count >= provider.rateLimit.requestsPerMinute) {
      return false;
    }

    limit.count++;
    return true;
  }
}

export class AirportStatusManager {
  private weatherProviders: WeatherProvider[];
  private operationalProviders: OperationalProvider[];
  private cache: Map<string, CachedAirportStatus>;
  private weatherCache: Map<string, CachedWeatherData>;
  private rateLimiter: RateLimiter;

  constructor(
    weatherProviders: WeatherProvider[],
    operationalProviders: OperationalProvider[]
  ) {
    this.weatherProviders = weatherProviders.sort(
      (a, b) => a.priority - b.priority
    );
    this.operationalProviders = operationalProviders.sort(
      (a, b) => a.priority - b.priority
    );
    this.cache = new Map();
    this.weatherCache = new Map();
    this.rateLimiter = new RateLimiter();
  }

  async getAirportStatus(airportCode: string): Promise<AirportStatus> {
    const cacheKey = airportCode.toUpperCase();
    const cached = this.cache.get(cacheKey);

    if (cached && !this.isCacheExpired(cached)) {
      return cached.data;
    }

    try {
      const [weather, operational] = await Promise.all([
        this.getWeatherConditions(airportCode),
        this.getOperationalStatus(airportCode),
      ]);

      const status: AirportStatus = {
        airportCode: airportCode.toUpperCase(),
        timestamp: new Date(),
        weather,
        operational,
        delays: await this.calculateDelayInformation(
          airportCode,
          weather,
          operational
        ),
        lastUpdated: new Date(),
      };

      this.cache.set(cacheKey, {
        data: status,
        timestamp: Date.now(),
        ttl: 10 * 60 * 1000, // 10 minutes
        provider: 'combined',
      });

      return status;
    } catch (error: unknown) {
      console.error(`Failed to get airport status for ${airportCode}:`, error);
      throw error;
    }
  }

  private async getWeatherConditions(
    airportCode: string
  ): Promise<WeatherConditions> {
    const cacheKey = `weather:${airportCode}`;
    const cached = this.weatherCache.get(cacheKey);

    if (cached && !this.isCacheExpired(cached)) {
      return cached.data;
    }

    for (const provider of this.weatherProviders) {
      try {
        if (await this.rateLimiter.canMakeRequest(provider)) {
          const weather = await provider.getCurrentWeather(airportCode);
          this.weatherCache.set(cacheKey, {
            data: weather,
            timestamp: Date.now(),
            ttl: 10 * 60 * 1000, // 10 minutes
            provider: provider.name,
          });
          return weather;
        }
      } catch (error: unknown) {
        console.warn(`Weather provider ${provider.name} failed:`, error);
        continue;
      }
    }

    throw new Error('All weather providers failed');
  }

  private async getOperationalStatus(
    airportCode: string
  ): Promise<OperationalStatus> {
    for (const provider of this.operationalProviders) {
      try {
        if (await this.rateLimiter.canMakeRequest(provider)) {
          return await provider.getOperationalStatus(airportCode);
        }
      } catch (error: unknown) {
        console.warn(`Operational provider ${provider.name} failed:`, error);
        continue;
      }
    }

    // Fallback to basic operational status
    return this.getBasicOperationalStatus(airportCode);
  }

  private getBasicOperationalStatus(_airportCode: string): OperationalStatus {
    return {
      status: 'normal',
      runwayStatus: [],
      airTrafficDelays: false,
      groundStop: false,
    };
  }

  private async calculateDelayInformation(
    airportCode: string,
    weather: WeatherConditions,
    operational: OperationalStatus
  ): Promise<DelayInformation> {
    let averageDelay = 0;
    let delayReason = 'Normal operations';
    let affectedFlights = 0;

    if (operational.status === 'closed') {
      averageDelay = 120; // 2 hours for closure
      delayReason = operational.closureReason || 'Airport closed';
      affectedFlights = 50; // Estimate
    } else if (operational.groundStop) {
      averageDelay = 60; // 1 hour for ground stop
      delayReason = 'Ground stop in effect';
      affectedFlights = 30; // Estimate
    } else if (operational.airTrafficDelays) {
      averageDelay = 30; // 30 minutes for ATC delays
      delayReason = 'Air traffic control delays';
      affectedFlights = 20; // Estimate
    } else if (weather.affectsAviation) {
      averageDelay = this.calculateWeatherDelay(weather);
      delayReason = 'Weather-related delays';
      affectedFlights = 15; // Estimate
    }

    return {
      averageDelay,
      delayReason,
      affectedFlights,
      expectedResolution: this.calculateExpectedResolution(averageDelay),
    };
  }

  private calculateWeatherDelay(weather: WeatherConditions): number {
    if (weather.visibility < 0.5) return 90; // Severe visibility
    if (weather.visibility < 1.0) return 60; // Poor visibility
    if (weather.windSpeed > 50) return 45; // High winds
    if (weather.windSpeed > 30) return 20; // Moderate winds
    if (weather.conditions.some((c) => c.intensity === 'severe')) return 75; // Severe weather
    if (weather.conditions.some((c) => c.intensity === 'heavy')) return 30; // Heavy precipitation
    return 10; // Light weather impact
  }

  private calculateExpectedResolution(delay: number): Date | undefined {
    if (delay === 0) return undefined;
    const resolution = new Date();
    resolution.setMinutes(resolution.getMinutes() + delay);
    return resolution;
  }

  private isCacheExpired(
    cached: CachedAirportStatus | CachedWeatherData
  ): boolean {
    return Date.now() - cached.timestamp > cached.ttl;
  }
}

export class WeatherClassificationEngine {
  classifyWeatherImpact(weather: WeatherConditions): WeatherImpact {
    const impact: WeatherImpact = {
      severity: 'none',
      affectsAviation: false,
      isExtraordinary: false,
      delayProbability: 0,
      recommendations: [],
    };

    // Check visibility
    if (weather.visibility < 0.5) {
      impact.severity = 'severe';
      impact.affectsAviation = true;
      impact.isExtraordinary = true;
      impact.delayProbability = 0.9;
      impact.recommendations.push('Ground stop likely due to low visibility');
    } else if (weather.visibility < 1.0) {
      impact.severity = 'moderate';
      impact.affectsAviation = true;
      impact.delayProbability = 0.7;
      impact.recommendations.push('Delays expected due to reduced visibility');
    }

    // Check wind conditions
    if (weather.windSpeed > 50) {
      impact.severity = 'severe';
      impact.affectsAviation = true;
      impact.isExtraordinary = true;
      impact.delayProbability = 0.8;
      impact.recommendations.push('High winds may cause delays');
    } else if (weather.windSpeed > 30) {
      impact.severity = 'moderate';
      impact.affectsAviation = true;
      impact.delayProbability = 0.5;
    }

    // Check precipitation
    const hasPrecipitation = weather.conditions.some((c) =>
      ['rain', 'snow', 'hail'].includes(c.type)
    );

    if (hasPrecipitation) {
      const heavyPrecipitation = weather.conditions.some(
        (c) => c.intensity === 'heavy' || c.intensity === 'severe'
      );

      if (heavyPrecipitation) {
        impact.severity = 'severe';
        impact.affectsAviation = true;
        impact.isExtraordinary = true;
        impact.delayProbability = 0.8;
        impact.recommendations.push('Heavy precipitation causing delays');
      } else {
        impact.severity = 'moderate';
        impact.affectsAviation = true;
        impact.delayProbability = 0.4;
        impact.recommendations.push('Precipitation may cause minor delays');
      }
    }

    // Check severe weather
    if (weather.isSevere) {
      impact.severity = 'severe';
      impact.affectsAviation = true;
      impact.isExtraordinary = true;
      impact.delayProbability = 0.95;
      impact.recommendations.push(
        'Severe weather conditions - significant delays expected'
      );
    }

    return impact;
  }
}

export interface WeatherImpact {
  severity: 'none' | 'light' | 'moderate' | 'severe';
  affectsAviation: boolean;
  isExtraordinary: boolean;
  delayProbability: number; // 0-1
  recommendations: string[];
}

export class DelayAttributionEngine {
  private weatherClassifier: WeatherClassificationEngine;

  constructor(weatherClassifier: WeatherClassificationEngine) {
    this.weatherClassifier = weatherClassifier;
  }

  async attributeDelay(
    flightData: any, // ParsedFlightData type will be imported
    airportStatus: AirportStatus
  ): Promise<DelayAttribution> {
    const departureImpact = this.weatherClassifier.classifyWeatherImpact(
      airportStatus.weather
    );

    const attribution: DelayAttribution = {
      isWeatherRelated: departureImpact.affectsAviation,
      isExtraordinary: departureImpact.isExtraordinary,
      weatherSeverity: departureImpact.severity,
      delayProbability: departureImpact.delayProbability,
      attribution: 'unknown',
      confidence: 0.5,
    };

    // High confidence if severe weather
    if (departureImpact.severity === 'severe') {
      attribution.attribution = 'weather';
      attribution.confidence = 0.9;
    }
    // Medium confidence if moderate weather
    else if (departureImpact.severity === 'moderate') {
      attribution.attribution = 'weather';
      attribution.confidence = 0.7;
    }
    // Low confidence if light weather
    else if (departureImpact.severity === 'light') {
      attribution.attribution = 'weather';
      attribution.confidence = 0.4;
    }
    // Check operational status
    else if (airportStatus.operational.status !== 'normal') {
      attribution.attribution = 'operational';
      attribution.confidence = 0.8;
    }

    return attribution;
  }
}

export interface DelayAttribution {
  isWeatherRelated: boolean;
  isExtraordinary: boolean;
  weatherSeverity: 'none' | 'light' | 'moderate' | 'severe';
  delayProbability: number;
  attribution: 'weather' | 'operational' | 'airline' | 'unknown';
  confidence: number; // 0-1
}
