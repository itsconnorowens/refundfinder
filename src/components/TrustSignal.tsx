'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type TrustType = 'security' | 'success-rate' | 'processing-time' | 'money-back';

interface TrustSignalProps {
  type: TrustType;
  className?: string;
  showIcon?: boolean;
}

export default function TrustSignal({ type, className, showIcon = true }: TrustSignalProps) {
  const meta = {
    'security': {
      icon: <Shield size={16} className="text-blue-600" />,
      text: '256-bit SSL encryption',
      color: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    'success-rate': {
      icon: <TrendingUp size={16} className="text-green-600" />,
      text: '94% success rate',
      color: 'text-green-700 bg-green-50 border-green-200',
    },
    'processing-time': {
      icon: <Clock size={16} className="text-purple-600" />,
      text: '48h filing guarantee',
      color: 'text-purple-700 bg-purple-50 border-purple-200',
    },
    'money-back': {
      icon: <CheckCircle size={16} className="text-orange-600" />,
      text: '100% money-back guarantee',
      color: 'text-orange-700 bg-orange-50 border-orange-200',
    },
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border',
        meta.color,
        className,
      )}
    >
      {showIcon && meta.icon}
      <span>{meta.text}</span>
    </motion.div>
  );
}


