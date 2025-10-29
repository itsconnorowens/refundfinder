export interface TrustContent {
  transparentPricing: {
    title: string;
    description: string;
    highlights: string[];
  };
  moneyBackGuarantee: {
    title: string;
    description: string;
    conditions: string[];
  };
  secureCompliant: {
    title: string;
    description: string;
    features: string[];
  };
  expertTeam: {
    title: string;
    description: string;
    credentials: string[];
  };
}

export interface ComparisonFeature {
  feature: string;
  flghtly: string;
  competitors: string;
}

export const trustContent: TrustContent = {
  transparentPricing: {
    title: 'Transparent Pricing',
    description: 'No hidden fees. No commission games. Just $49 flat fee.',
    highlights: [
      'No percentage-based fees',
      'No surprise charges',
      'Clear upfront pricing',
      'Better than 25-35% commission models',
    ],
  },
  moneyBackGuarantee: {
    title: '100% Money-Back Guarantee',
    description: "If we don't file within 48 hours, automatic refund",
    conditions: [
      "If we don't file within 48 hours",
      'If claim rejected due to our error',
      'If you request refund within 24 hours',
      "If we determine flight isn't eligible after payment",
    ],
  },
  secureCompliant: {
    title: 'Secure & Compliant',
    description: 'Your data is encrypted and never shared',
    features: [
      'GDPR compliant data handling',
      '256-bit SSL encryption',
      'Stripe secure payment processing',
      'Full data deletion rights',
    ],
  },
  expertTeam: {
    title: 'Expert Team',
    description: 'Specialists in EU261 and UK CAA regulations',
    credentials: [
      'Processed 320+ claims with 94% success rate',
      'Average 3.2 week processing time',
      'Deep knowledge of airline-specific requirements',
      'Regular updates on regulation changes',
    ],
  },
};

export const comparisonData = {
  features: [
    {
      feature: 'Fee',
      flghtly: '$49 flat',
      competitors: '25-35% commission',
    },
    {
      feature: 'Filing Time',
      flghtly: '48 hours',
      competitors: '1-2 weeks',
    },
    {
      feature: 'Refund Guarantee',
      flghtly: '100% automatic',
      competitors: 'Limited/None',
    },
    {
      feature: 'Transparency',
      flghtly: 'Full upfront',
      competitors: 'Hidden terms',
    },
  ],
};
