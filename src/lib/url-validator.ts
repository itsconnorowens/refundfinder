/**
 * URL Validation Service
 * Automated validation and monitoring of airline claim submission URLs
 */

export interface URLValidationResult {
  url: string;
  isValid: boolean;
  statusCode?: number;
  isAccessible: boolean;
  redirectUrl?: string;
  lastChecked: Date;
  error?: string;
  responseTime?: number;
}

export interface URLStatus {
  url: string;
  airlineCode: string;
  isHealthy: boolean;
  lastSuccess?: Date;
  lastFailure?: Date;
  consecutiveFailures: number;
  totalChecks: number;
  successRate: number;
}

export class URLValidator {
  private urlStatuses: Map<string, URLStatus> = new Map();
  private validationCache: Map<string, URLValidationResult> = new Map();
  private readonly cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Validate a single URL
   */
  async validateUrl(url: string): Promise<URLValidationResult> {
    // Check cache first
    const cached = this.validationCache.get(url);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    const startTime = Date.now();
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000), // 10 second timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Flghtly/1.0)',
        },
      });

      const responseTime = Date.now() - startTime;
      const result: URLValidationResult = {
        url,
        isValid: response.ok,
        statusCode: response.status,
        isAccessible: response.ok && response.status < 400,
        lastChecked: new Date(),
        responseTime,
      };

      // Handle redirects
      if (response.redirected) {
        result.redirectUrl = response.url;
      }

      this.validationCache.set(url, result);
      return result;
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const result: URLValidationResult = {
        url,
        isValid: false,
        isAccessible: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
      };

      this.validationCache.set(url, result);
      return result;
    }
  }

  /**
   * Track URL status for an airline
   */
  trackUrlStatus(airlineCode: string, url: string, isValid: boolean): void {
    const key = `${airlineCode}:${url}`;
    const status = this.urlStatuses.get(key) || {
      url,
      airlineCode,
      isHealthy: true,
      consecutiveFailures: 0,
      totalChecks: 0,
      successRate: 100,
    };

    status.totalChecks++;
    const newSuccessRate =
      status.totalChecks > 0
        ? ((status.totalChecks -
            (status.consecutiveFailures + (!isValid ? 1 : 0))) /
            status.totalChecks) *
          100
        : 100;

    if (isValid) {
      status.lastSuccess = new Date();
      status.consecutiveFailures = 0;
      status.isHealthy = true;
      status.successRate = newSuccessRate;
    } else {
      status.lastFailure = new Date();
      status.consecutiveFailures++;
      status.isHealthy = status.consecutiveFailures < 3;
      status.successRate = newSuccessRate;
    }

    this.urlStatuses.set(key, status);
  }

  /**
   * Get URL status for an airline
   */
  getUrlStatus(airlineCode: string, url: string): URLStatus | undefined {
    const key = `${airlineCode}:${url}`;
    return this.urlStatuses.get(key);
  }

  /**
   * Get all URL statuses for monitoring
   */
  getAllUrlStatuses(): URLStatus[] {
    return Array.from(this.urlStatuses.values());
  }

  /**
   * Get unhealthy URLs that need attention
   */
  getUnhealthyUrls(): URLStatus[] {
    return this.getAllUrlStatuses().filter(
      (status) => !status.isHealthy || status.successRate < 80
    );
  }

  /**
   * Validate multiple URLs in batch
   */
  async validateUrls(
    urls: Array<{ airlineCode: string; url: string }>
  ): Promise<Array<{ airlineCode: string; result: URLValidationResult }>> {
    const results = await Promise.all(
      urls.map(async ({ airlineCode, url }) => {
        const result = await this.validateUrl(url);
        this.trackUrlStatus(airlineCode, url, result.isAccessible);
        return { airlineCode, result };
      })
    );

    return results;
  }

  /**
   * Check if cached result is still valid
   */
  private isCacheValid(cached: URLValidationResult): boolean {
    const age = Date.now() - cached.lastChecked.getTime();
    return age < this.cacheTTL;
  }

  /**
   * Get validation statistics
   */
  getStatistics(): {
    totalUrls: number;
    healthyUrls: number;
    unhealthyUrls: number;
    averageSuccessRate: number;
  } {
    const allStatuses = this.getAllUrlStatuses();
    const healthyUrls = allStatuses.filter((s) => s.isHealthy).length;
    const unhealthyUrls = allStatuses.filter((s) => !s.isHealthy).length;
    const averageSuccessRate =
      allStatuses.length > 0
        ? allStatuses.reduce((sum, s) => sum + s.successRate, 0) /
          allStatuses.length
        : 0;

    return {
      totalUrls: allStatuses.length,
      healthyUrls,
      unhealthyUrls,
      averageSuccessRate,
    };
  }
}

/**
 * Claim Success Rate Tracker
 */
export interface ClaimResult {
  airlineCode: string;
  claimSubmitted: boolean;
  submissionMethod: 'email' | 'web_form' | 'postal';
  timestamp: Date;
  statusCode?: number;
  error?: string;
  trackingId: string;
}

export interface AirlineSuccessMetrics {
  airlineCode: string;
  airlineName: string;
  totalClaims: number;
  successfulSubmissions: number;
  failedSubmissions: number;
  successRate: number;
  averageResponseTime?: number;
  lastSubmission?: Date;
  submissionMethodBreakdown: {
    email: { total: number; success: number };
    web_form: { total: number; success: number };
    postal: { total: number; success: number };
  };
}

export class ClaimTracker {
  private claimResults: ClaimResult[] = [];
  private readonly maxHistory = 10000; // Keep last 10k claims

  /**
   * Record a claim submission result
   */
  recordClaim(result: ClaimResult): void {
    this.claimResults.push(result);

    // Limit history size
    if (this.claimResults.length > this.maxHistory) {
      this.claimResults = this.claimResults.slice(-this.maxHistory);
    }
  }

  /**
   * Get success metrics for an airline
   */
  getAirlineMetrics(
    airlineCode: string,
    airlineName: string
  ): AirlineSuccessMetrics {
    const airlineClaims = this.claimResults.filter(
      (claim) => claim.airlineCode === airlineCode
    );

    const successful = airlineClaims.filter(
      (claim) => claim.claimSubmitted
    ).length;
    const failed = airlineClaims.filter(
      (claim) => !claim.claimSubmitted
    ).length;
    const successRate =
      airlineClaims.length > 0 ? (successful / airlineClaims.length) * 100 : 0;

    const submissionMethodBreakdown = {
      email: {
        total: airlineClaims.filter((c) => c.submissionMethod === 'email')
          .length,
        success: airlineClaims.filter(
          (c) => c.submissionMethod === 'email' && c.claimSubmitted
        ).length,
      },
      web_form: {
        total: airlineClaims.filter((c) => c.submissionMethod === 'web_form')
          .length,
        success: airlineClaims.filter(
          (c) => c.submissionMethod === 'web_form' && c.claimSubmitted
        ).length,
      },
      postal: {
        total: airlineClaims.filter((c) => c.submissionMethod === 'postal')
          .length,
        success: airlineClaims.filter(
          (c) => c.submissionMethod === 'postal' && c.claimSubmitted
        ).length,
      },
    };

    const lastSubmission =
      airlineClaims.length > 0
        ? airlineClaims[airlineClaims.length - 1].timestamp
        : undefined;

    return {
      airlineCode,
      airlineName,
      totalClaims: airlineClaims.length,
      successfulSubmissions: successful,
      failedSubmissions: failed,
      successRate,
      lastSubmission,
      submissionMethodBreakdown,
    };
  }

  /**
   * Get all airline metrics
   */
  getAllMetrics(
    airlineCodes: Array<{ code: string; name: string }>
  ): AirlineSuccessMetrics[] {
    return airlineCodes.map(({ code, name }) =>
      this.getAirlineMetrics(code, name)
    );
  }

  /**
   * Get top performing airlines by success rate
   */
  getTopPerformingAirlines(limit: number = 10): AirlineSuccessMetrics[] {
    const airlineCodes = new Set(this.claimResults.map((c) => c.airlineCode));
    const allMetrics = Array.from(airlineCodes).map((code) => {
      const airlineName = code; // You'd fetch the actual name
      return this.getAirlineMetrics(code, airlineName);
    });

    return allMetrics
      .filter((m) => m.totalClaims > 0)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, limit);
  }

  /**
   * Get airlines with low success rates (needing attention)
   */
  getAirlinesNeedingAttention(threshold: number = 70): AirlineSuccessMetrics[] {
    const airlineCodes = new Set(this.claimResults.map((c) => c.airlineCode));
    const allMetrics = Array.from(airlineCodes).map((code) => {
      const airlineName = code;
      return this.getAirlineMetrics(code, airlineName);
    });

    return allMetrics
      .filter((m) => m.totalClaims >= 5 && m.successRate < threshold)
      .sort((a, b) => a.successRate - b.successRate);
  }

  /**
   * Get overall statistics
   */
  getOverallStatistics(): {
    totalClaims: number;
    overallSuccessRate: number;
    submissionMethodBreakdown: {
      email: { total: number; successRate: number };
      web_form: { total: number; successRate: number };
      postal: { total: number; successRate: number };
    };
    topPerformingAirlines: AirlineSuccessMetrics[];
    airlinesNeedingAttention: AirlineSuccessMetrics[];
  } {
    const totalClaims = this.claimResults.length;
    const successfulClaims = this.claimResults.filter(
      (c) => c.claimSubmitted
    ).length;
    const overallSuccessRate =
      totalClaims > 0 ? (successfulClaims / totalClaims) * 100 : 0;

    const emailClaims = this.claimResults.filter(
      (c) => c.submissionMethod === 'email'
    );
    const webFormClaims = this.claimResults.filter(
      (c) => c.submissionMethod === 'web_form'
    );
    const postalClaims = this.claimResults.filter(
      (c) => c.submissionMethod === 'postal'
    );

    const submissionMethodBreakdown = {
      email: {
        total: emailClaims.length,
        successRate:
          emailClaims.length > 0
            ? (emailClaims.filter((c) => c.claimSubmitted).length /
                emailClaims.length) *
              100
            : 0,
      },
      web_form: {
        total: webFormClaims.length,
        successRate:
          webFormClaims.length > 0
            ? (webFormClaims.filter((c) => c.claimSubmitted).length /
                webFormClaims.length) *
              100
            : 0,
      },
      postal: {
        total: postalClaims.length,
        successRate:
          postalClaims.length > 0
            ? (postalClaims.filter((c) => c.claimSubmitted).length /
                postalClaims.length) *
              100
            : 0,
      },
    };

    return {
      totalClaims,
      overallSuccessRate,
      submissionMethodBreakdown,
      topPerformingAirlines: this.getTopPerformingAirlines(10),
      airlinesNeedingAttention: this.getAirlinesNeedingAttention(70),
    };
  }

  /**
   * Export claim data for analysis
   */
  exportClaimData(): ClaimResult[] {
    return this.claimResults;
  }

  /**
   * Clear old claim data (data retention)
   */
  clearOldData(daysToKeep: number = 90): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.claimResults = this.claimResults.filter(
      (claim) => claim.timestamp >= cutoffDate
    );
  }
}

// Singleton instances for global access
export const urlValidator = new URLValidator();
export const claimTracker = new ClaimTracker();
