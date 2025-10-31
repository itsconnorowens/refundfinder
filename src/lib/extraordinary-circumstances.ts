// Enhanced extraordinary circumstances detection using Claude AI
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ExtraordinaryCircumstanceResult {
  isExtraordinary: boolean;
  confidence: number;
  reason: string;
  category:
    | 'weather'
    | 'security'
    | 'air_traffic'
    | 'strike'
    | 'medical'
    | 'technical'
    | 'operational'
    | 'unknown';
  explanation: string;
}

export interface DelayReasonAnalysis {
  originalReason: string;
  isExtraordinary: boolean;
  confidence: number;
  category: string;
  explanation: string;
  suggestedAction: 'proceed' | 'caution' | 'reject';
}

/**
 * Enhanced extraordinary circumstances detection using Claude AI
 * This replaces the simple keyword matching with sophisticated NLP analysis
 */
export async function analyzeExtraordinaryCircumstances(
  delayReason: string,
  additionalContext?: {
    flightNumber?: string;
    airline?: string;
    departureAirport?: string;
    arrivalAirport?: string;
    delayDuration?: string;
    weatherData?: any;
  }
): Promise<ExtraordinaryCircumstanceResult> {
  if (!delayReason || delayReason.trim().length === 0) {
    return {
      isExtraordinary: false,
      confidence: 0.9,
      reason: 'No delay reason provided',
      category: 'unknown',
      explanation:
        'Cannot determine extraordinary circumstances without delay reason',
    };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    // Fallback to keyword-based detection if Claude not available
    return fallbackKeywordDetection(delayReason);
  }

  try {
    const prompt = createExtraordinaryCircumstancesPrompt(
      delayReason,
      additionalContext
    );

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Claude');
    }

    const result = JSON.parse(content.text);

    // Validate the response structure
    if (!isValidExtraordinaryCircumstanceResult(result)) {
      throw new Error('Invalid response structure from Claude');
    }

    return result;
  } catch (error) {
    logger.error('Error analyzing extraordinary circumstances:', error);

    // Fallback to keyword-based detection on error
    return fallbackKeywordDetection(delayReason);
  }
}

/**
 * Create a sophisticated prompt for Claude to analyze extraordinary circumstances
 */
function createExtraordinaryCircumstancesPrompt(
  delayReason: string,
  additionalContext?: any
): string {
  return `
You are an expert aviation lawyer specializing in EU Regulation 261/2004 and UK CAA regulations. Your task is to determine if a flight delay or cancellation reason constitutes "extraordinary circumstances" that would exempt airlines from compensation obligations.

EXTRAORDINARY CIRCUMSTANCES DEFINITION:
Under EU261/UK CAA, extraordinary circumstances are events that:
1. Are beyond the airline's control
2. Could not have been avoided even if all reasonable measures had been taken
3. Are not inherent in the normal exercise of the airline's activity

COMMON EXTRAORDINARY CIRCUMSTANCES:
- Weather conditions (storms, fog, snow, ice, hurricanes, tornadoes)
- Security threats, terrorist activities, or suspicious packages
- Air traffic control restrictions or strikes
- Industrial action by airport staff or air traffic controllers
- Bird strikes or wildlife interference
- Medical emergencies requiring emergency landings
- Political unrest or war
- Natural disasters (earthquakes, volcanic ash)

NOT EXTRAORDINARY CIRCUMSTANCES:
- Technical problems with the aircraft (maintenance issues)
- Crew scheduling problems
- Overbooking
- Baggage handling issues
- Fuel problems
- Operational decisions by the airline
- Staff shortages (unless due to industrial action)
- Computer system failures
- Gate availability issues

DELAY REASON TO ANALYZE:
"${delayReason}"

${
  additionalContext
    ? `
ADDITIONAL CONTEXT:
- Flight: ${additionalContext.flightNumber || 'Unknown'}
- Airline: ${additionalContext.airline || 'Unknown'}
- Route: ${additionalContext.departureAirport || 'Unknown'} → ${additionalContext.arrivalAirport || 'Unknown'}
- Delay Duration: ${additionalContext.delayDuration || 'Unknown'}
`
    : ''
}

Analyze the delay reason and return ONLY a JSON object with this exact structure:

{
  "isExtraordinary": boolean,
  "confidence": number (0.0 to 1.0),
  "reason": "string (brief explanation)",
  "category": "weather" | "security" | "air_traffic" | "strike" | "medical" | "technical" | "operational" | "unknown",
  "explanation": "string (detailed explanation of why this is/isn't extraordinary)"
}

IMPORTANT RULES:
1. Be conservative - only classify as extraordinary if clearly beyond airline control
2. Consider context clues (e.g., "weather" vs "weather-related operational issues")
3. If ambiguous, err on the side of NOT extraordinary
4. Provide high confidence (0.8+) for clear cases, lower confidence (0.5-0.7) for ambiguous cases
5. Return ONLY the JSON object, no other text

Examples:
- "Weather delay" → isExtraordinary: true, category: "weather"
- "Technical issue with aircraft" → isExtraordinary: false, category: "technical"
- "Air traffic control restrictions" → isExtraordinary: true, category: "air_traffic"
- "Crew scheduling problem" → isExtraordinary: false, category: "operational"
`;
}

/**
 * Fallback keyword-based detection when Claude is unavailable
 */
function fallbackKeywordDetection(
  delayReason: string
): ExtraordinaryCircumstanceResult {
  const lowerReason = delayReason.toLowerCase();

  // Extraordinary circumstances keywords
  const extraordinaryKeywords = {
    weather: [
      'weather',
      'storm',
      'snow',
      'fog',
      'ice',
      'hurricane',
      'tornado',
      'rain',
      'wind',
      'visibility',
    ],
    security: [
      'security',
      'terrorist',
      'threat',
      'bomb',
      'suspicious',
      'screening',
    ],
    air_traffic: [
      'air traffic control',
      'atc',
      'airspace',
      'traffic management',
    ],
    strike: ['strike', 'industrial action', 'union', 'walkout'],
    medical: ['medical emergency', 'emergency landing', 'passenger illness'],
    technical: ['technical', 'mechanical', 'maintenance', 'repair'],
    operational: [
      'operational',
      'scheduling',
      'crew',
      'staffing',
      'overbooking',
    ],
  };

  // Check for extraordinary circumstances
  for (const [category, keywords] of Object.entries(extraordinaryKeywords)) {
    if (keywords.some((keyword) => lowerReason.includes(keyword))) {
      const isExtraordinary = [
        'weather',
        'security',
        'air_traffic',
        'strike',
        'medical',
      ].includes(category);

      return {
        isExtraordinary,
        confidence: isExtraordinary ? 0.8 : 0.7,
        reason: `Detected ${category} related delay`,
        category: category as any,
        explanation: isExtraordinary
          ? `Delay appears to be due to ${category}, which is typically considered extraordinary circumstances`
          : `Delay appears to be due to ${category}, which is typically NOT extraordinary circumstances`,
      };
    }
  }

  // Default to not extraordinary if no keywords match
  return {
    isExtraordinary: false,
    confidence: 0.6,
    reason: 'No extraordinary circumstances detected',
    category: 'unknown',
    explanation:
      'Could not identify extraordinary circumstances from the provided reason',
  };
}

/**
 * Validate Claude response structure
 */
function isValidExtraordinaryCircumstanceResult(result: any): boolean {
  return (
    typeof result === 'object' &&
    typeof result.isExtraordinary === 'boolean' &&
    typeof result.confidence === 'number' &&
    result.confidence >= 0 &&
    result.confidence <= 1 &&
    typeof result.reason === 'string' &&
    typeof result.category === 'string' &&
    typeof result.explanation === 'string' &&
    [
      'weather',
      'security',
      'air_traffic',
      'strike',
      'medical',
      'technical',
      'operational',
      'unknown',
    ].includes(result.category)
  );
}

/**
 * Enhanced delay reason analysis with suggested actions
 */
export async function analyzeDelayReason(
  delayReason: string,
  additionalContext?: any
): Promise<DelayReasonAnalysis> {
  const analysis = await analyzeExtraordinaryCircumstances(
    delayReason,
    additionalContext
  );

  let suggestedAction: 'proceed' | 'caution' | 'reject';

  if (analysis.isExtraordinary) {
    suggestedAction = analysis.confidence > 0.8 ? 'reject' : 'caution';
  } else {
    suggestedAction = analysis.confidence > 0.8 ? 'proceed' : 'caution';
  }

  return {
    originalReason: delayReason,
    isExtraordinary: analysis.isExtraordinary,
    confidence: analysis.confidence,
    category: analysis.category,
    explanation: analysis.explanation,
    suggestedAction,
  };
}

/**
 * Batch analysis for multiple delay reasons
 */
export async function analyzeMultipleDelayReasons(
  delayReasons: string[],
  additionalContext?: any
): Promise<DelayReasonAnalysis[]> {
  const results = await Promise.all(
    delayReasons.map((reason) => analyzeDelayReason(reason, additionalContext))
  );

  return results;
}

/**
 * Get confidence-based recommendation
 */
export function getConfidenceRecommendation(
  confidence: number,
  isExtraordinary: boolean
): string {
  if (isExtraordinary) {
    if (confidence > 0.8) {
      return 'High confidence: This appears to be extraordinary circumstances. Compensation likely not available.';
    } else if (confidence > 0.6) {
      return 'Moderate confidence: This may be extraordinary circumstances. Proceed with caution.';
    } else {
      return 'Low confidence: Unclear if extraordinary circumstances. Consider proceeding with claim.';
    }
  } else {
    if (confidence > 0.8) {
      return 'High confidence: This does not appear to be extraordinary circumstances. Compensation likely available.';
    } else if (confidence > 0.6) {
      return 'Moderate confidence: This may not be extraordinary circumstances. Proceed with claim.';
    } else {
      return 'Low confidence: Unclear circumstances. Proceed with claim but expect potential challenges.';
    }
  }
}
