export interface Statistics {
  totalRecovered: string;
  totalTravelers: string;
  successRate: string;
  averageProcessingTime: string;
  averageCompensation: string;
}

export const statistics: Statistics = {
  totalRecovered: '€147,000',
  totalTravelers: '320',
  successRate: '94%',
  averageProcessingTime: '3.2 weeks',
  averageCompensation: '€450',
};

export const trustBadges = [
  {
    id: 'stripe-secured',
    label: 'Stripe Secured',
    icon: '🔒',
    description: 'Secure payment processing',
  },
  {
    id: 'gdpr-compliant',
    label: 'GDPR Compliant',
    icon: '🛡️',
    description: 'Full data protection compliance',
  },
  {
    id: 'ssl-encrypted',
    label: 'SSL Encrypted',
    icon: '🔐',
    description: '256-bit encryption',
  },
  {
    id: 'money-back-guarantee',
    label: 'Money-Back Guarantee',
    icon: '✅',
    description: "100% refund if we can't deliver",
  },
];

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
