/**
 * Email Parsing Cost Analysis Script
 *
 * Analyzes email parsing costs based on token usage logs.
 * This script helps monitor API costs and optimize parsing efficiency.
 *
 * Usage:
 *   npx tsx scripts/analyze-email-parsing-costs.ts
 *
 * Requirements:
 *   - BetterStack logs must be accessible
 *   - BETTERSTACK_SOURCE_TOKEN must be set in environment
 *
 * The script queries logs for 'email_parse_tokens' events and generates:
 *   - Daily cost breakdown
 *   - Average cost per parse
 *   - Token usage statistics
 *   - Email length vs cost correlation
 *   - Monthly cost projection
 */

interface TokenUsageLog {
  timestamp: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  emailLength: number;
  model: string;
}

interface CostAnalysis {
  totalParses: number;
  totalCost: number;
  averageCostPerParse: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  averageInputTokens: number;
  averageOutputTokens: number;
  averageEmailLength: number;
  dailyCosts: Record<string, number>;
  monthlyCostProjection: number;
}

/**
 * Parse BetterStack log entry
 */
function _parseLogEntry(logLine: string): TokenUsageLog | null {
  try {
    const log = JSON.parse(logLine);

    // Check if this is a token usage log
    if (log.message !== 'Email parsing token usage') {
      return null;
    }

    return {
      timestamp: log.timestamp || log.dt,
      input_tokens: log.input_tokens,
      output_tokens: log.output_tokens,
      total_tokens: log.total_tokens,
      estimated_cost_usd: log.estimated_cost_usd,
      emailLength: log.emailLength,
      model: log.model,
    };
  } catch {
    return null;
  }
}

/**
 * Analyze token usage logs
 */
function analyzeCosts(logs: TokenUsageLog[]): CostAnalysis {
  if (logs.length === 0) {
    return {
      totalParses: 0,
      totalCost: 0,
      averageCostPerParse: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      averageInputTokens: 0,
      averageOutputTokens: 0,
      averageEmailLength: 0,
      dailyCosts: {},
      monthlyCostProjection: 0,
    };
  }

  const totalParses = logs.length;
  const totalCost = logs.reduce((sum, log) => sum + log.estimated_cost_usd, 0);
  const totalInputTokens = logs.reduce((sum, log) => sum + log.input_tokens, 0);
  const totalOutputTokens = logs.reduce(
    (sum, log) => sum + log.output_tokens,
    0
  );
  const totalTokens = logs.reduce((sum, log) => sum + log.total_tokens, 0);
  const totalEmailLength = logs.reduce((sum, log) => sum + log.emailLength, 0);

  // Calculate daily costs
  const dailyCosts: Record<string, number> = {};
  logs.forEach((log) => {
    const date = new Date(log.timestamp).toISOString().split('T')[0];
    dailyCosts[date] = (dailyCosts[date] || 0) + log.estimated_cost_usd;
  });

  // Calculate monthly projection based on recent daily average
  const daysWithData = Object.keys(dailyCosts).length;
  const averageDailyCost =
    daysWithData > 0 ? totalCost / daysWithData : totalCost;
  const monthlyCostProjection = averageDailyCost * 30;

  return {
    totalParses,
    totalCost,
    averageCostPerParse: totalCost / totalParses,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    averageInputTokens: totalInputTokens / totalParses,
    averageOutputTokens: totalOutputTokens / totalParses,
    averageEmailLength: totalEmailLength / totalParses,
    dailyCosts,
    monthlyCostProjection,
  };
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(amount);
}

/**
 * Format number with commas
 */
function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(num));
}

/**
 * Print cost analysis report
 */
function printReport(analysis: CostAnalysis): void {
  console.log('\n' + '='.repeat(80));
  console.log('EMAIL PARSING COST ANALYSIS REPORT');
  console.log('='.repeat(80) + '\n');

  console.log('OVERVIEW');
  console.log('-'.repeat(80));
  console.log(`Total Parses:              ${analysis.totalParses}`);
  console.log(`Total Cost:                ${formatCurrency(analysis.totalCost)}`);
  console.log(
    `Average Cost per Parse:    ${formatCurrency(analysis.averageCostPerParse)}`
  );
  console.log(
    `Monthly Cost Projection:   ${formatCurrency(analysis.monthlyCostProjection)}`
  );
  console.log('');

  console.log('TOKEN USAGE');
  console.log('-'.repeat(80));
  console.log(`Total Input Tokens:        ${formatNumber(analysis.totalInputTokens)}`);
  console.log(`Total Output Tokens:       ${formatNumber(analysis.totalOutputTokens)}`);
  console.log(`Total Tokens:              ${formatNumber(analysis.totalTokens)}`);
  console.log(`Average Input Tokens:      ${formatNumber(analysis.averageInputTokens)}`);
  console.log(`Average Output Tokens:     ${formatNumber(analysis.averageOutputTokens)}`);
  console.log('');

  console.log('EMAIL STATISTICS');
  console.log('-'.repeat(80));
  console.log(
    `Average Email Length:      ${formatNumber(analysis.averageEmailLength)} characters`
  );
  console.log('');

  console.log('DAILY BREAKDOWN');
  console.log('-'.repeat(80));
  const sortedDates = Object.keys(analysis.dailyCosts).sort();
  if (sortedDates.length > 0) {
    sortedDates.forEach((date) => {
      const cost = analysis.dailyCosts[date];
      console.log(`${date}:  ${formatCurrency(cost)}`);
    });
  } else {
    console.log('No daily data available');
  }
  console.log('');

  console.log('COST BREAKDOWN');
  console.log('-'.repeat(80));
  const inputCostPerToken = 3.0 / 1_000_000;
  const outputCostPerToken = 15.0 / 1_000_000;
  const totalInputCost = analysis.totalInputTokens * inputCostPerToken;
  const totalOutputCost = analysis.totalOutputTokens * outputCostPerToken;

  console.log(
    `Input Cost:                ${formatCurrency(totalInputCost)} (${((totalInputCost / analysis.totalCost) * 100).toFixed(1)}%)`
  );
  console.log(
    `Output Cost:               ${formatCurrency(totalOutputCost)} (${((totalOutputCost / analysis.totalCost) * 100).toFixed(1)}%)`
  );
  console.log('');

  console.log('OPTIMIZATION RECOMMENDATIONS');
  console.log('-'.repeat(80));

  // Provide recommendations based on usage
  if (analysis.averageInputTokens > 1000) {
    console.log(
      '⚠️  Average input tokens are high (>1000). Consider optimizing prompt length.'
    );
  }

  if (analysis.averageOutputTokens > 500) {
    console.log(
      '⚠️  Average output tokens are high (>500). Consider reducing max_tokens setting.'
    );
  }

  if (analysis.monthlyCostProjection > 100) {
    console.log(
      `⚠️  Monthly cost projection (${formatCurrency(analysis.monthlyCostProjection)}) is high. Consider implementing caching.`
    );
  }

  if (analysis.averageCostPerParse > 0.01) {
    console.log(
      `⚠️  Average cost per parse (${formatCurrency(analysis.averageCostPerParse)}) is high. Review prompt efficiency.`
    );
  }

  // Cache efficiency (if data is available)
  const potentialSavingsWithCache =
    analysis.totalCost * 0.5; // Assume 50% cache hit rate
  console.log('');
  console.log(
    `💡 Potential savings with 50% cache hit rate: ${formatCurrency(potentialSavingsWithCache)}/month`
  );

  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Main function - Mock implementation for demonstration
 *
 * In a real implementation, this would:
 * 1. Connect to BetterStack API
 * 2. Query logs for the specified time period
 * 3. Parse and analyze the logs
 * 4. Generate the report
 */
async function main() {
  console.log('Email Parsing Cost Analysis Tool\n');

  // Check for BetterStack token
  if (!process.env.BETTERSTACK_SOURCE_TOKEN) {
    console.error(
      '❌ Error: BETTERSTACK_SOURCE_TOKEN not found in environment variables'
    );
    console.error(
      'Please set BETTERSTACK_SOURCE_TOKEN to analyze production logs.'
    );
    console.error('');
    console.error('For now, showing a sample analysis with mock data...\n');
  }

  // Generate mock data for demonstration
  // In production, replace this with actual log fetching from BetterStack
  const mockLogs: TokenUsageLog[] = [];
  const today = new Date();

  // Generate 30 days of mock data
  for (let day = 0; day < 30; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() - day);

    // Random number of parses per day (5-20)
    const parsesPerDay = Math.floor(Math.random() * 15) + 5;

    for (let i = 0; i < parsesPerDay; i++) {
      const inputTokens = Math.floor(Math.random() * 400) + 200; // 200-600
      const outputTokens = Math.floor(Math.random() * 250) + 100; // 100-350
      const emailLength = Math.floor(Math.random() * 3000) + 500; // 500-3500

      mockLogs.push({
        timestamp: date.toISOString(),
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
        estimated_cost_usd:
          (inputTokens / 1_000_000) * 3.0 + (outputTokens / 1_000_000) * 15.0,
        emailLength,
        model: 'claude-3-5-sonnet-20241022',
      });
    }
  }

  const analysis = analyzeCosts(mockLogs);
  printReport(analysis);

  console.log('NOTE: This is mock data for demonstration purposes.');
  console.log(
    'To analyze real data, ensure BETTERSTACK_SOURCE_TOKEN is configured.'
  );
  console.log('');
  console.log('Real implementation would query BetterStack logs API:');
  console.log('  - Filter by: message = "Email parsing token usage"');
  console.log('  - Date range: Last 30 days');
  console.log('  - Extract token usage and cost data');
  console.log('');
}

// Run the analysis
main().catch((error) => {
  console.error('Error running cost analysis:', error);
  process.exit(1);
});
