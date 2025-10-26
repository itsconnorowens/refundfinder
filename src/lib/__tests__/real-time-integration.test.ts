/**
 * Test Suite for Flight Status Integration and Airport Operational Data
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FlightStatusManager,
  FlightStatusProvider,
  FlightStatus,
  FlightStatusError,
} from '../flight-status-service';
import {
  AirportStatusManager,
  WeatherProvider,
  OperationalProvider,
  WeatherConditions,
  OperationalStatus,
  WeatherClassificationEngine,
  DelayAttributionEngine,
} from '../airport-status-service';
import {
  FlightRadar24Provider,
  AviationStackProvider,
  FlightAPIProvider,
} from '../providers/flight-status-providers';
import {
  OpenWeatherMapProvider,
  AviationWeatherCenterProvider,
  WeatherAPIProvider,
} from '../providers/weather-providers';
import {
  FAAOperationalProvider,
  EurocontrolOperationalProvider,
  BasicOperationalProvider,
} from '../providers/operational-providers';
import {
  EnhancedClaimProcessingService,
  ParsedFlightData,
  EligibilityResult,
} from '../enhanced-claim-processing';

describe('Flight Status Integration', () => {
  let mockProvider: any;
  let flightStatusManager: FlightStatusManager;

  beforeEach(() => {
    mockProvider = {
      name: 'TestProvider',
      priority: 1,
      rateLimit: { requestsPerMinute: 100, requestsPerDay: 10000 },
      costPerRequest: 0.001,
      getFlightStatus: vi.fn(),
      validateFlightExists: vi.fn(),
      isHealthy: vi.fn(),
    };

    flightStatusManager = new FlightStatusManager([mockProvider]);
  });

  describe('FlightStatusManager', () => {
    it('should return flight status from primary provider', async () => {
      const mockStatus: FlightStatus = {
        flightNumber: 'BA123',
        airlineCode: 'BA',
        departureAirport: 'LHR',
        arrivalAirport: 'JFK',
        scheduledDeparture: new Date('2024-01-01T10:00:00Z'),
        actualDeparture: new Date('2024-01-01T10:30:00Z'),
        scheduledArrival: new Date('2024-01-01T18:00:00Z'),
        actualArrival: new Date('2024-01-01T18:30:00Z'),
        delayMinutes: 30,
        status: 'delayed',
        lastUpdated: new Date(),
      };

      mockProvider.getFlightStatus.mockResolvedValue(mockStatus);

      const result = await flightStatusManager.getFlightStatus(
        'BA123',
        new Date('2024-01-01')
      );

      expect(result).toEqual(mockStatus);
      expect(mockProvider.getFlightStatus).toHaveBeenCalledWith(
        'BA123',
        new Date('2024-01-01')
      );
    });

    it('should fallback to secondary provider when primary fails', async () => {
      const secondaryProvider = {
        ...mockProvider,
        name: 'SecondaryProvider',
        priority: 2,
      };
      const service = new FlightStatusManager([
        mockProvider,
        secondaryProvider,
      ]);

      const mockStatus: FlightStatus = {
        flightNumber: 'BA123',
        airlineCode: 'BA',
        departureAirport: 'LHR',
        arrivalAirport: 'JFK',
        scheduledDeparture: new Date('2024-01-01T10:00:00Z'),
        actualDeparture: new Date('2024-01-01T10:30:00Z'),
        scheduledArrival: new Date('2024-01-01T18:00:00Z'),
        actualArrival: new Date('2024-01-01T18:30:00Z'),
        delayMinutes: 30,
        status: 'delayed',
        lastUpdated: new Date(),
      };

      mockProvider.getFlightStatus.mockRejectedValue(
        new Error('Primary failed')
      );
      secondaryProvider.getFlightStatus.mockResolvedValue(mockStatus);

      const result = await service.getFlightStatus(
        'BA123',
        new Date('2024-01-01')
      );

      expect(result).toEqual(mockStatus);
      expect(secondaryProvider.getFlightStatus).toHaveBeenCalled();
    });

    it('should validate flight exists correctly', async () => {
      const mockStatus: FlightStatus = {
        flightNumber: 'BA123',
        airlineCode: 'BA',
        departureAirport: 'LHR',
        arrivalAirport: 'JFK',
        scheduledDeparture: new Date('2024-01-01T10:00:00Z'),
        actualDeparture: new Date('2024-01-01T10:30:00Z'),
        scheduledArrival: new Date('2024-01-01T18:00:00Z'),
        actualArrival: new Date('2024-01-01T18:30:00Z'),
        delayMinutes: 30,
        status: 'delayed',
        lastUpdated: new Date(),
      };

      mockProvider.getFlightStatus.mockResolvedValue(mockStatus);

      const exists = await flightStatusManager.validateFlightExists(
        'BA123',
        new Date('2024-01-01')
      );

      expect(exists).toBe(true);
    });

    it('should return false when flight does not exist', async () => {
      mockProvider.getFlightStatus.mockRejectedValue(
        new Error('Flight not found')
      );

      const exists = await flightStatusManager.validateFlightExists(
        'INVALID',
        new Date('2024-01-01')
      );

      expect(exists).toBe(false);
    });
  });

  describe('Flight Status Providers', () => {
    it('should transform FlightRadar24 data correctly', () => {
      const provider = new FlightRadar24Provider('test-key');
      const mockData = {
        identification: { number: 'BA123' },
        airline: { iata: 'BA' },
        airport: {
          origin: { iata: 'LHR', gate: 'A1', terminal: 'T5' },
          destination: { iata: 'JFK' },
        },
        time: {
          scheduled: { departure: 1704110400, arrival: 1704132000 },
          real: { departure: 1704112200, arrival: 1704133800 },
        },
        status: { text: 'Delayed' },
        aircraft: { model: { text: 'Boeing 777' } },
      };

      const result = provider.transformToFlightStatus(mockData);

      expect(result.flightNumber).toBe('BA123');
      expect(result.airlineCode).toBe('BA');
      expect(result.departureAirport).toBe('LHR');
      expect(result.arrivalAirport).toBe('JFK');
      expect(result.delayMinutes).toBe(30);
      expect(result.status).toBe('delayed');
      expect(result.gate).toBe('A1');
      expect(result.terminal).toBe('T5');
    });

    it('should transform AviationStack data correctly', () => {
      const provider = new AviationStackProvider('test-key');
      const mockData = {
        flight: { iata: 'BA123' },
        airline: { iata: 'BA' },
        departure: {
          iata: 'LHR',
          scheduled: '2024-01-01T10:00:00Z',
          actual: '2024-01-01T10:30:00Z',
          gate: 'A1',
          terminal: 'T5',
          delay: 30,
          delay_reason: 'Weather',
        },
        arrival: {
          iata: 'JFK',
          scheduled: '2024-01-01T18:00:00Z',
          actual: '2024-01-01T18:30:00Z',
        },
        flight_status: 'delayed',
        aircraft: { iata: 'B777' },
      };

      const result = provider.transformToFlightStatus(mockData);

      expect(result.flightNumber).toBe('BA123');
      expect(result.airlineCode).toBe('BA');
      expect(result.delayMinutes).toBe(30);
      expect(result.status).toBe('delayed');
      expect(result.delayReason?.category).toBe('weather');
      expect(result.delayReason?.isExtraordinary).toBe(true);
    });
  });
});

describe('Airport Operational Data Integration', () => {
  let mockWeatherProvider: any;
  let mockOperationalProvider: any;
  let airportStatusManager: AirportStatusManager;

  beforeEach(() => {
    mockWeatherProvider = {
      name: 'TestWeatherProvider',
      priority: 1,
      rateLimit: { requestsPerMinute: 60, requestsPerDay: 1000000 },
      costPerRequest: 0.0015,
      dataAccuracy: 'high',
      getCurrentWeather: vi.fn(),
      getForecast: vi.fn(),
      getHistoricalWeather: vi.fn(),
      isHealthy: vi.fn(),
    };

    mockOperationalProvider = {
      name: 'TestOperationalProvider',
      priority: 1,
      rateLimit: { requestsPerMinute: 60, requestsPerDay: 10000 },
      getOperationalStatus: vi.fn(),
      getRunwayStatus: vi.fn(),
      getAirTrafficDelays: vi.fn(),
      isHealthy: vi.fn(),
    };

    airportStatusManager = new AirportStatusManager(
      [mockWeatherProvider],
      [mockOperationalProvider]
    );
  });

  describe('AirportStatusManager', () => {
    it('should return combined airport status', async () => {
      const mockWeather: WeatherConditions = {
        temperature: 15,
        humidity: 80,
        visibility: 2,
        windSpeed: 25,
        windDirection: 270,
        pressure: 1013,
        conditions: [
          {
            type: 'rain',
            intensity: 'moderate',
            description: 'Light rain',
            affectsRunways: true,
            affectsVisibility: true,
          },
        ],
        isSevere: false,
        affectsAviation: true,
      };

      const mockOperational: OperationalStatus = {
        status: 'normal',
        runwayStatus: [
          {
            runway: '09L/27R',
            status: 'open',
            visibility: 2000,
            surfaceCondition: 'wet',
            windRestrictions: false,
          },
        ],
        airTrafficDelays: false,
        groundStop: false,
      };

      mockWeatherProvider.getCurrentWeather.mockResolvedValue(mockWeather);
      mockOperationalProvider.getOperationalStatus.mockResolvedValue(
        mockOperational
      );

      const result = await airportStatusManager.getAirportStatus('LHR');

      expect(result.airportCode).toBe('LHR');
      expect(result.weather).toEqual(mockWeather);
      expect(result.operational).toEqual(mockOperational);
      expect(result.delays.averageDelay).toBeGreaterThan(0);
      expect(result.delays.delayReason).toContain('Weather');
    });

    it('should fallback to basic operational status when providers fail', async () => {
      const mockWeather: WeatherConditions = {
        temperature: 20,
        humidity: 50,
        visibility: 10,
        windSpeed: 10,
        windDirection: 180,
        pressure: 1013,
        conditions: [
          {
            type: 'clear',
            intensity: 'light',
            description: 'Clear skies',
            affectsRunways: false,
            affectsVisibility: false,
          },
        ],
        isSevere: false,
        affectsAviation: false,
      };

      mockWeatherProvider.getCurrentWeather.mockResolvedValue(mockWeather);
      mockOperationalProvider.getOperationalStatus.mockRejectedValue(
        new Error('Provider failed')
      );

      const result = await airportStatusManager.getAirportStatus('LHR');

      expect(result.weather).toEqual(mockWeather);
      expect(result.operational.status).toBe('normal');
      expect(result.operational.airTrafficDelays).toBe(false);
      expect(result.operational.groundStop).toBe(false);
    });
  });

  describe('Weather Classification Engine', () => {
    let classifier: WeatherClassificationEngine;

    beforeEach(() => {
      classifier = new WeatherClassificationEngine();
    });

    it('should classify severe weather correctly', () => {
      const severeWeather: WeatherConditions = {
        temperature: 15,
        humidity: 80,
        visibility: 0.2, // Very low visibility
        windSpeed: 60, // High wind
        windDirection: 270,
        pressure: 1013,
        conditions: [
          {
            type: 'storm',
            intensity: 'severe',
            description: 'Severe thunderstorm',
            affectsRunways: true,
            affectsVisibility: true,
          },
        ],
        isSevere: true,
        affectsAviation: true,
      };

      const impact = classifier.classifyWeatherImpact(severeWeather);

      expect(impact.severity).toBe('severe');
      expect(impact.affectsAviation).toBe(true);
      expect(impact.isExtraordinary).toBe(true);
      expect(impact.delayProbability).toBeGreaterThan(0.8);
    });

    it('should classify normal weather correctly', () => {
      const normalWeather: WeatherConditions = {
        temperature: 20,
        humidity: 50,
        visibility: 10,
        windSpeed: 10,
        windDirection: 180,
        pressure: 1013,
        conditions: [
          {
            type: 'clear',
            intensity: 'light',
            description: 'Clear skies',
            affectsRunways: false,
            affectsVisibility: false,
          },
        ],
        isSevere: false,
        affectsAviation: false,
      };

      const impact = classifier.classifyWeatherImpact(normalWeather);

      expect(impact.severity).toBe('none');
      expect(impact.affectsAviation).toBe(false);
      expect(impact.isExtraordinary).toBe(false);
      expect(impact.delayProbability).toBeLessThan(0.2);
    });

    it('should classify moderate weather correctly', () => {
      const moderateWeather: WeatherConditions = {
        temperature: 18,
        humidity: 70,
        visibility: 1.5,
        windSpeed: 35,
        windDirection: 270,
        pressure: 1013,
        conditions: [
          {
            type: 'rain',
            intensity: 'moderate',
            description: 'Moderate rain',
            affectsRunways: true,
            affectsVisibility: true,
          },
        ],
        isSevere: false,
        affectsAviation: true,
      };

      const impact = classifier.classifyWeatherImpact(moderateWeather);

      expect(impact.severity).toBe('moderate');
      expect(impact.affectsAviation).toBe(true);
      expect(impact.isExtraordinary).toBe(false);
      expect(impact.delayProbability).toBeGreaterThanOrEqual(0.4);
    });
  });

  describe('Delay Attribution Engine', () => {
    let attributionEngine: DelayAttributionEngine;
    let weatherClassifier: WeatherClassificationEngine;

    beforeEach(() => {
      weatherClassifier = new WeatherClassificationEngine();
      attributionEngine = new DelayAttributionEngine(weatherClassifier);
    });

    it('should attribute delay to weather with high confidence', async () => {
      const mockAirportStatus = {
        airportCode: 'LHR',
        timestamp: new Date(),
        weather: {
          temperature: 15,
          humidity: 80,
          visibility: 0.5,
          windSpeed: 45,
          windDirection: 270,
          pressure: 1013,
          conditions: [
            {
              type: 'storm',
              intensity: 'severe',
              description: 'Severe thunderstorm',
              affectsRunways: true,
              affectsVisibility: true,
            },
          ],
          isSevere: true,
          affectsAviation: true,
        },
        operational: {
          status: 'normal' as const,
          runwayStatus: [],
          airTrafficDelays: false,
          groundStop: false,
        },
        delays: {
          averageDelay: 90,
          delayReason: 'Weather-related delays',
          affectedFlights: 25,
        },
        lastUpdated: new Date(),
      };

      const mockFlightData = {
        flightNumber: 'BA123',
        airlineCode: 'BA',
        departureAirport: 'LHR',
        arrivalAirport: 'JFK',
        flightDate: new Date(),
        delayMinutes: 90,
        status: 'delayed' as const,
        isVerified: false,
      };

      const attribution = await attributionEngine.attributeDelay(
        mockFlightData,
        mockAirportStatus
      );

      expect(attribution.isWeatherRelated).toBe(true);
      expect(attribution.isExtraordinary).toBe(true);
      expect(attribution.weatherSeverity).toBe('severe');
      expect(attribution.attribution).toBe('weather');
      expect(attribution.confidence).toBeGreaterThan(0.8);
    });

    it('should attribute delay to operational factors', async () => {
      const mockAirportStatus = {
        airportCode: 'LHR',
        timestamp: new Date(),
        weather: {
          temperature: 20,
          humidity: 50,
          visibility: 10,
          windSpeed: 10,
          windDirection: 180,
          pressure: 1013,
          conditions: [
            {
              type: 'clear',
              intensity: 'light',
              description: 'Clear skies',
              affectsRunways: false,
              affectsVisibility: false,
            },
          ],
          isSevere: false,
          affectsAviation: false,
        },
        operational: {
          status: 'delayed' as const,
          runwayStatus: [],
          airTrafficDelays: true,
          groundStop: false,
        },
        delays: {
          averageDelay: 30,
          delayReason: 'Air traffic control delays',
          affectedFlights: 15,
        },
        lastUpdated: new Date(),
      };

      const mockFlightData = {
        flightNumber: 'BA123',
        airlineCode: 'BA',
        departureAirport: 'LHR',
        arrivalAirport: 'JFK',
        flightDate: new Date(),
        delayMinutes: 30,
        status: 'delayed' as const,
        isVerified: false,
      };

      const attribution = await attributionEngine.attributeDelay(
        mockFlightData,
        mockAirportStatus
      );

      expect(attribution.isWeatherRelated).toBe(false);
      expect(attribution.isExtraordinary).toBe(false);
      expect(attribution.attribution).toBe('operational');
      expect(attribution.confidence).toBeGreaterThan(0.7);
    });
  });
});

describe('Enhanced Claim Processing Integration', () => {
  let mockFlightStatusManager: any;
  let mockAirportStatusManager: any;
  let mockDelayAttributionEngine: any;
  let claimProcessingService: EnhancedClaimProcessingService;

  beforeEach(() => {
    mockFlightStatusManager = {
      getFlightStatus: vi.fn(),
      validateFlightExists: vi.fn(),
    };

    mockAirportStatusManager = {
      getAirportStatus: vi.fn(),
    };

    mockDelayAttributionEngine = {
      attributeDelay: vi.fn(),
    };

    claimProcessingService = new EnhancedClaimProcessingService(
      mockFlightStatusManager,
      mockAirportStatusManager,
      mockDelayAttributionEngine
    );
  });

  it('should process claim with real-time verification', async () => {
    const mockEmailContent = `
      Flight BA123 from LHR to JFK on 01/01/2024
      Delayed by 2 hours due to weather
    `;

    const mockFlightStatus = {
      flightNumber: 'BA123',
      airlineCode: 'BA',
      departureAirport: 'LHR',
      arrivalAirport: 'JFK',
      scheduledDeparture: new Date('2024-01-01T10:00:00Z'),
      actualDeparture: new Date('2024-01-01T12:00:00Z'),
      scheduledArrival: new Date('2024-01-01T18:00:00Z'),
      actualArrival: new Date('2024-01-01T20:00:00Z'),
      delayMinutes: 120,
      status: 'delayed' as const,
      lastUpdated: new Date(),
    };

    const mockAirportStatus = {
      airportCode: 'LHR',
      timestamp: new Date(),
      weather: {
        temperature: 15,
        humidity: 80,
        visibility: 1,
        windSpeed: 30,
        windDirection: 270,
        pressure: 1013,
        conditions: [
          {
            type: 'rain' as const,
            intensity: 'moderate' as const,
            description: 'Moderate rain',
            affectsRunways: true,
            affectsVisibility: true,
          },
        ],
        isSevere: false,
        affectsAviation: true,
      },
      operational: {
        status: 'normal' as const,
        runwayStatus: [],
        airTrafficDelays: false,
        groundStop: false,
      },
      delays: {
        averageDelay: 60,
        delayReason: 'Weather-related delays',
        affectedFlights: 20,
      },
      lastUpdated: new Date(),
    };

    const mockDelayAttribution = {
      isWeatherRelated: true,
      isExtraordinary: false,
      weatherSeverity: 'moderate' as const,
      delayProbability: 0.6,
      attribution: 'weather' as const,
      confidence: 0.7,
    };

    mockFlightStatusManager.getFlightStatus.mockResolvedValue(mockFlightStatus);
    mockAirportStatusManager.getAirportStatus.mockResolvedValue(
      mockAirportStatus
    );
    mockDelayAttributionEngine.attributeDelay.mockResolvedValue(
      mockDelayAttribution
    );

    const result = await claimProcessingService.processClaim(mockEmailContent);

    expect(result.parsedData.isVerified).toBe(true);
    expect(result.parsedData.verifiedDelay).toBe(120);
    expect(result.parsedData.weatherContext?.isWeatherRelated).toBe(true);
    expect(result.eligibility.isEligible).toBe(false); // Weather-related delays reduce eligibility
    expect(result.eligibility.compensationAmount).toBeLessThan(600); // Reduced due to weather
    expect(result.recommendations).toContain(
      'Weather-related delays detected - compensation may be reduced'
    );
  });

  it('should handle verification failure gracefully', async () => {
    const mockEmailContent = `
      Flight BA123 from LHR to JFK on 01/01/2024
      Delayed by 2 hours due to weather
    `;

    mockFlightStatusManager.getFlightStatus.mockRejectedValue(
      new Error('API failure')
    );

    const result = await claimProcessingService.processClaim(mockEmailContent);

    expect(result.parsedData.isVerified).toBe(false);
    expect(result.parsedData.flightNumber).toBe('BA123');
    expect(result.parsedData.delayMinutes).toBe(120);
    expect(result.recommendations).toContain(
      'Flight status could not be verified - proceed with caution'
    );
  });
});
