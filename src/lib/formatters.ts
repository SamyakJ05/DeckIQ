/**
 * Formatting utilities for DeckIQ
 */

/**
 * Convert camelCase dimension keys to human-readable labels
 */
export function formatDimension(key: string): string {
  const map: Record<string, string> = {
    problemClarity: 'Problem Clarity',
    solutionFit: 'Solution Fit',
    marketSize: 'Market Size',
    tractionEvidence: 'Traction Evidence',
    businessModel: 'Business Model',
    competitiveMoat: 'Competitive Moat',
    teamStrength: 'Team Strength',
    askClarity: 'Ask Clarity',
    narrativeFlow: 'Narrative Flow',
    investorReadiness: 'Investor Readiness',
  };
  
  // Return mapped value or fallback to splitting camelCase
  return map[key] ?? key.replace(/([A-Z])/g, ' $1').trim();
}

// Made with Bob
