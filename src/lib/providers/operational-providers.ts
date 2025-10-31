/**
 * Operational Providers - Implementation of airport operational status APIs
 */

import {
  OperationalProvider,
  OperationalStatus,
  RunwayStatus,
  OperationalStatusType as _OperationalStatusType,
  RunwayStatusType as _RunwayStatusType,
  SurfaceCondition as _SurfaceCondition,
} from '../airport-status-service';

export class FAAOperationalProvider implements OperationalProvider {
  name = 'FAA Operational';
  priority = 1;
  rateLimit = {
    requestsPerMinute: 60,
    requestsPerDay: 10000,
  };
  private baseUrl = 'https://www.fly.faa.gov/flyfaa/usmap.jsp';

  async getOperationalStatus(airportCode: string): Promise<OperationalStatus> {
    // FAA provides operational status for US airports
    // This is a simplified implementation - would need actual API integration
    const response = await fetch(`${this.baseUrl}?airport=${airportCode}`);

    if (!response.ok) {
      throw new Error(`FAA API error: ${response.status}`);
    }

    // Parse FAA response - simplified for now
    const data = await response.text();
    return this.parseFAAStatus(data, airportCode);
  }

  async getRunwayStatus(airportCode: string): Promise<RunwayStatus[]> {
    try {
      const operational = await this.getOperationalStatus(airportCode);
      return operational.runwayStatus;
    } catch {
      return [];
    }
  }

  async getAirTrafficDelays(airportCode: string): Promise<boolean> {
    try {
      const operational = await this.getOperationalStatus(airportCode);
      return operational.airTrafficDelays;
    } catch {
      return false;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}?airport=KJFK`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private parseFAAStatus(data: string, _airportCode: string): OperationalStatus {
    // Simplified parsing - would need full implementation
    const status: OperationalStatus = {
      status: 'normal',
      runwayStatus: [],
      airTrafficDelays: false,
      groundStop: false,
    };

    // Look for delay indicators in the response
    if (data.includes('DELAY') || data.includes('GROUND STOP')) {
      status.status = 'delayed';
      status.airTrafficDelays = true;
    }

    if (data.includes('GROUND STOP')) {
      status.groundStop = true;
    }

    if (data.includes('CLOSED')) {
      status.status = 'closed';
      status.closureReason = 'Airport closed';
    }

    return status;
  }
}

export class EurocontrolOperationalProvider implements OperationalProvider {
  name = 'Eurocontrol Operational';
  priority = 2;
  rateLimit = {
    requestsPerMinute: 30,
    requestsPerDay: 5000,
  };
  private baseUrl = 'https://www.eurocontrol.int/api/operational-status';

  async getOperationalStatus(airportCode: string): Promise<OperationalStatus> {
    // Eurocontrol provides operational status for European airports
    const response = await fetch(`${this.baseUrl}/${airportCode}`);

    if (!response.ok) {
      throw new Error(`Eurocontrol API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseEurocontrolStatus(data);
  }

  async getRunwayStatus(airportCode: string): Promise<RunwayStatus[]> {
    try {
      const operational = await this.getOperationalStatus(airportCode);
      return operational.runwayStatus;
    } catch {
      return [];
    }
  }

  async getAirTrafficDelays(airportCode: string): Promise<boolean> {
    try {
      const operational = await this.getOperationalStatus(airportCode);
      return operational.airTrafficDelays;
    } catch {
      return false;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/EHAM`); // Amsterdam
      return response.ok;
    } catch {
      return false;
    }
  }

  private parseEurocontrolStatus(data: any): OperationalStatus {
    // Simplified parsing - would need full implementation based on actual API
    const status: OperationalStatus = {
      status: 'normal',
      runwayStatus: [],
      airTrafficDelays: false,
      groundStop: false,
    };

    if (data.delays && data.delays > 0) {
      status.status = 'delayed';
      status.airTrafficDelays = true;
    }

    if (data.groundStop) {
      status.groundStop = true;
    }

    if (data.status === 'CLOSED') {
      status.status = 'closed';
      status.closureReason = data.reason || 'Airport closed';
    }

    return status;
  }
}

export class BasicOperationalProvider implements OperationalProvider {
  name = 'Basic Operational';
  priority = 3;
  rateLimit = {
    requestsPerMinute: 1000,
    requestsPerDay: 100000,
  };

  async getOperationalStatus(airportCode: string): Promise<OperationalStatus> {
    // Basic fallback provider that returns normal status
    return {
      status: 'normal',
      runwayStatus: this.getBasicRunwayStatus(airportCode),
      airTrafficDelays: false,
      groundStop: false,
    };
  }

  async getRunwayStatus(airportCode: string): Promise<RunwayStatus[]> {
    return this.getBasicRunwayStatus(airportCode);
  }

  async getAirTrafficDelays(_airportCode: string): Promise<boolean> {
    return false;
  }

  async isHealthy(): Promise<boolean> {
    return true; // Always healthy as it's a fallback
  }

  private getBasicRunwayStatus(airportCode: string): RunwayStatus[] {
    // Return basic runway status for major airports
    const majorAirportRunways: Record<string, RunwayStatus[]> = {
      LHR: [
        {
          runway: '09L/27R',
          status: 'open',
          visibility: 10000,
          surfaceCondition: 'dry',
          windRestrictions: false,
        },
        {
          runway: '09R/27L',
          status: 'open',
          visibility: 10000,
          surfaceCondition: 'dry',
          windRestrictions: false,
        },
      ],
      JFK: [
        {
          runway: '04L/22R',
          status: 'open',
          visibility: 10000,
          surfaceCondition: 'dry',
          windRestrictions: false,
        },
        {
          runway: '04R/22L',
          status: 'open',
          visibility: 10000,
          surfaceCondition: 'dry',
          windRestrictions: false,
        },
        {
          runway: '13L/31R',
          status: 'open',
          visibility: 10000,
          surfaceCondition: 'dry',
          windRestrictions: false,
        },
      ],
      CDG: [
        {
          runway: '08L/26R',
          status: 'open',
          visibility: 10000,
          surfaceCondition: 'dry',
          windRestrictions: false,
        },
        {
          runway: '08R/26L',
          status: 'open',
          visibility: 10000,
          surfaceCondition: 'dry',
          windRestrictions: false,
        },
        {
          runway: '09L/27R',
          status: 'open',
          visibility: 10000,
          surfaceCondition: 'dry',
          windRestrictions: false,
        },
      ],
      FRA: [
        {
          runway: '07L/25R',
          status: 'open',
          visibility: 10000,
          surfaceCondition: 'dry',
          windRestrictions: false,
        },
        {
          runway: '07R/25L',
          status: 'open',
          visibility: 10000,
          surfaceCondition: 'dry',
          windRestrictions: false,
        },
        {
          runway: '18',
          status: 'open',
          visibility: 10000,
          surfaceCondition: 'dry',
          windRestrictions: false,
        },
      ],
    };

    return (
      majorAirportRunways[airportCode.toUpperCase()] || [
        {
          runway: '01/19',
          status: 'open',
          visibility: 10000,
          surfaceCondition: 'dry',
          windRestrictions: false,
        },
      ]
    );
  }
}

export class MockOperationalProvider implements OperationalProvider {
  name = 'Mock Operational';
  priority = 999; // Lowest priority
  rateLimit = {
    requestsPerMinute: 1000,
    requestsPerDay: 100000,
  };

  async getOperationalStatus(_airportCode: string): Promise<OperationalStatus> {
    // Mock provider for testing
    return {
      status: 'normal',
      runwayStatus: [
        {
          runway: '01/19',
          status: 'open',
          visibility: 10000,
          surfaceCondition: 'dry',
          windRestrictions: false,
        },
      ],
      airTrafficDelays: false,
      groundStop: false,
    };
  }

  async getRunwayStatus(_airportCode: string): Promise<RunwayStatus[]> {
    return [
      {
        runway: '01/19',
        status: 'open',
        visibility: 10000,
        surfaceCondition: 'dry',
        windRestrictions: false,
      },
    ];
  }

  async getAirTrafficDelays(_airportCode: string): Promise<boolean> {
    return false;
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}
