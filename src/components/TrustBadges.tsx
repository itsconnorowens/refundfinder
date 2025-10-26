'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LockIcon, CheckIcon } from './icons';

interface TrustBadgeProps {
  icon: React.ReactNode;
  text: string;
  className?: string;
  delay?: number;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ icon, text, className = '', delay = 0 }) => (
  <motion.div 
    className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ 
      duration: 0.5, 
      delay: delay,
      ease: "easeOut"
    }}
    viewport={{ once: true, margin: "-50px" }}
    whileHover={{ 
      scale: 1.05,
      transition: { duration: 0.2 }
    }}
  >
    {icon}
    <span>{text}</span>
  </motion.div>
);

export const TrustBadges: React.FC = () => {
  return (
    <motion.div
      className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 py-6"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <TrustBadge 
        icon={<LockIcon size={16} className="text-green-600" />}
        text="256-bit SSL Encryption"
        delay={0}
      />
      <TrustBadge 
        icon={<CheckIcon size={16} className="text-blue-600" />}
        text="GDPR Compliant"
        delay={0.1}
      />
      <TrustBadge 
        icon={<LockIcon size={16} className="text-purple-600" />}
        text="Secure Payment via Stripe"
        delay={0.2}
      />
    </motion.div>
  );
};
