/**
 * Airline Monitoring Service
 * Automated monitoring and alerting for airline claim submission health
 */

import {
  AIRLINE_CONFIGS,
  AirlineConfig,
  getAllAirlineConfigs,
} from './airline-config';
import {
  URLValidator,
  URLStatus,
  ClaimTracker,
  ClaimResult,
  AirlineSuccessMetrics,
} from './url-validator';

export interface MonitoringAlert {
  severity: 'info' | 'warning' | 'error' | 'critical';
  airlineCode: string;
  airlineName: string;
  issue: string;
  message: string;
  timestamp: Date;
  actionRequired: string;
}

export interface MonitoringReport {
  timestamp: Date;
  totalAirlines: number;
  healthyAirlines: number;
  unhealthyAirlines: number;
  urlValidationHealth: number;
  claimSuccessRate: number;
  alerts: MonitoringAlert[];
  topPerformers: AirlineSuccessMetrics[];
  airlinesNeedingAttention: AirlineSuccessMetrics[];
}

export class AirlineMonitoringService {
  private urlValidator: URLValidator;
  private claimTracker: ClaimTracker;
  private alerts: MonitoringAlert[] = [];
  private readonly maxAlerts = 1000;

  constructor(urlValidator: URLValidator, claimTracker: ClaimTracker) {
    this.urlValidator = urlValidator;
    this.claimTracker = claimTracker;
  }

  /**
   * Run comprehensive health check
   */
  async performHealthCheck(): Promise<MonitoringReport> {
    const airlines = getAllAirlineConfigs();
    const timestamp = new Date();
    const alerts: MonitoringAlert[] = [];

    // Check URL accessibility
    for (const airline of airlines) {
      const urlCheck = await this.checkAirlineURL(airline);
      if (urlCheck.alert) {
        alerts.push(urlCheck.alert);
      }
    }

    // Check claim success rates
    const successMetrics = this.claimTracker.getOverallStatistics();
    const lowSuccessAirlines =
      this.claimTracker.getAirlinesNeedingAttention(70);

    for (const airline of lowSuccessAirlines) {
      alerts.push({
        severity: 'warning',
        airlineCode: airline.airlineCode,
        airlineName: airline.airlineName,
        issue: 'Low claim success rate',
        message: `Success rate is ${airline.successRate.toFixed(1)}%`,
        timestamp: new Date(),
        actionRequired: 'Review submission process for this airline',
      });
    }

    // Store alerts
    this.addAlerts(alerts);

    // Calculate health metrics
    const urlStatuses = this.urlValidator.getAllUrlStatuses();
    const healthyUrls = urlStatuses.filter((s) => s.isHealthy).length;
    const urlValidationHealth =
      urlStatuses.length > 0 ? (healthyUrls / urlStatuses.length) * 100 : 100;

    const healthyAirlines = airlines.filter((a) => a.isActive).length;
    const totalActive = airlines.filter((a) => a.isActive).length;

    return {
      timestamp,
      totalAirlines: airlines.length,
      healthyAirlines,
      unhealthyAirlines: totalActive - healthyAirlines,
      urlValidationHealth,
      claimSuccessRate: successMetrics.overallSuccessRate,
      alerts: alerts.slice(0, 20), // Limit report to 20 most critical
      topPerformers: this.claimTracker.getTopPerformingAirlines(10),
      airlinesNeedingAttention:
        this.claimTracker.getAirlinesNeedingAttention(70),
    };
  }

  /**
   * Check individual airline URL
   */
  private async checkAirlineURL(airline: AirlineConfig): Promise<{
    isHealthy: boolean;
    alert?: MonitoringAlert;
  }> {
    const url = airline.claimFormUrl || airline.claimEmail;

    if (!url) {
      return {
        isHealthy: false,
        alert: {
          severity: 'error',
          airlineCode: airline.airlineCode,
          airlineName: airline.airlineName,
          issue: 'No claim submission URL configured',
          message: 'Missing contact information for claim submissions',
          timestamp: new Date(),
          actionRequired: 'Add contact URL or email address',
        },
      };
    }

    // Skip validation for email addresses (validate format instead)
    if (url.includes('@')) {
      const emailValid = this.validateEmailFormat(url);
      return {
        isHealthy: emailValid,
        alert: emailValid
          ? undefined
          : {
              severity: 'warning',
              airlineCode: airline.airlineCode,
              airlineName: airline.airlineName,
              issue: 'Invalid email format',
              message: `Email address "${url}" is not valid`,
              timestamp: new Date(),
              actionRequired: 'Update email address format',
            },
      };
    }

    // Validate HTTP URL
    try {
      const result = await this.urlValidator.validateUrl(url);
      this.urlValidator.trackUrlStatus(
        airline.airlineCode,
        url,
        result.isAccessible
      );

      if (!result.isAccessible) {
        return {
          isHealthy: false,
          alert: {
            severity: 'error',
            airlineCode: airline.airlineCode,
            airlineName: airline.airlineName,
            issue: 'Claim URL inaccessible',
            message: `URL ${url} returned status ${result.statusCode || 'unknown'}`,
            timestamp: new Date(),
            actionRequired: 'Check URL and update if necessary',
          },
        };
      }

      return { isHealthy: true };
    } catch (error) {
      return {
        isHealthy: false,
        alert: {
          severity: 'critical',
          airlineCode: airline.airlineCode,
          airlineName: airline.airlineName,
          issue: 'URL validation failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          actionRequired: 'Immediate review required',
        },
      };
    }
  }

  /**
   * Validate email format
   */
  private validateEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Track claim submission result
   */
  trackClaim(
    airlineCode: string,
    success: boolean,
    submissionMethod: 'email' | 'web_form' | 'postal',
    statusCode?: number,
    error?: string
  ): void {
    const result: ClaimResult = {
      airlineCode,
      claimSubmitted: success,
      submissionMethod,
      timestamp: new Date(),
      statusCode,
      error,
      trackingId: `${airlineCode}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    this.claimTracker.recordClaim(result);

    // Generate alert for repeated failures
    if (!success) {
      const airline = AIRLINE_CONFIGS[airlineCode];
      if (airline) {
        const recentFailures = this.claimTracker
          .exportClaimData()
          .filter(
            (c) => c.airlineCode === airlineCode && !c.claimSubmitted
          ).length;

        if (recentFailures >= 5) {
          this.addAlert({
            severity: 'warning',
            airlineCode,
            airlineName: airline.airlineName,
            issue: 'Multiple claim failures',
            message: `${recentFailures} recent failures for this airline`,
            timestamp: new Date(),
            actionRequired: 'Review submission process for this airline',
          });
        }
      }
    }
  }

  /**
   * Get monitoring alerts
   */
  getAlerts(): MonitoringAlert[] {
    return this.alerts;
  }

  /**
   * Get critical alerts only
   */
  getCriticalAlerts(): MonitoringAlert[] {
    return this.alerts.filter(
      (a) => a.severity === 'critical' || a.severity === 'error'
    );
  }

  /**
   * Add alerts
   */
  private addAlerts(newAlerts: MonitoringAlert[]): void {
    this.alerts.push(...newAlerts);

    // Keep only recent alerts
    this.alerts = this.alerts.slice(-this.maxAlerts);
  }

  /**
   * Add single alert
   */
  private addAlert(alert: MonitoringAlert): void {
    this.alerts.push(alert);
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }
  }

  /**
   * Get airline health metrics
   */
  async getAirlineHealth(airlineCode: string): Promise<{
    airline: AirlineConfig | undefined;
    urlStatus: URLStatus | undefined;
    claimMetrics: AirlineSuccessMetrics | undefined;
    isHealthy: boolean;
  }> {
    const airline = AIRLINE_CONFIGS[airlineCode];
    if (!airline) {
      return {
        airline: undefined,
        urlStatus: undefined,
        claimMetrics: undefined,
        isHealthy: false,
      };
    }

    const url = airline.claimFormUrl || airline.claimEmail;
    const urlStatus = url
      ? this.urlValidator.getUrlStatus(airlineCode, url)
      : undefined;
    const claimMetrics = this.claimTracker.getAirlineMetrics(
      airlineCode,
      airline.airlineName
    );

    const isHealthy =
      airline.isActive &&
      claimMetrics.successRate >= 70 &&
      (!urlStatus || (urlStatus.isHealthy && urlStatus.successRate >= 80));

    return {
      airline,
      urlStatus,
      claimMetrics,
      isHealthy,
    };
  }

  /**
   * Get summary statistics
   */
  getStatistics() {
    const airlines = getAllAirlineConfigs();
    const activeAirlines = airlines.filter((a) => a.isActive).length;

    return {
      totalAirlines: airlines.length,
      activeAirlines,
      inactiveAirlines: airlines.length - activeAirlines,
      urlStatistics: this.urlValidator.getStatistics(),
      claimStatistics: this.claimTracker.getOverallStatistics(),
    };
  }
}

// Singleton instance
export const airlineMonitoringService = new AirlineMonitoringService(
  new URLValidator(),
  new ClaimTracker()
);
