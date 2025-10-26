import React from 'react';
import { LockIcon, CheckIcon } from './icons';

interface TrustBadgeProps {
  icon: React.ReactNode;
  text: string;
  className?: string;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ icon, text, className = '' }) => (
  <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
    {icon}
    <span>{text}</span>
  </div>
);

export const TrustBadges: React.FC = () => {
  return (
    <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
      <TrustBadge 
        icon={<LockIcon size={16} className="text-green-600" />}
        text="256-bit SSL Encryption"
      />
      <TrustBadge 
        icon={<CheckIcon size={16} className="text-blue-600" />}
        text="GDPR Compliant"
      />
      <TrustBadge 
        icon={<LockIcon size={16} className="text-purple-600" />}
        text="Secure Payment via Stripe"
      />
    </div>
  );
};
