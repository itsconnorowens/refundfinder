'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StickyPricingBadgeProps {
  amount: number; // cents
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  className?: string;
}

export default function StickyPricingBadge({
  amount,
  position = 'bottom-right',
  className,
}: StickyPricingBadgeProps) {
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const pos =
    position === 'top-right'
      ? 'top-4 right-4'
      : position === 'top-left'
      ? 'top-4 left-4'
      : position === 'bottom-left'
      ? 'bottom-4 left-4'
      : 'bottom-4 right-4';

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('fixed z-40', pos, className)}
    >
      <AnimatePresence>
        {!minimized ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="bg-white/95 backdrop-blur rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <DollarSign size={16} className="text-green-600" /> Success Fee
              </div>
              <button
                onClick={() => setMinimized(true)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Minimize pricing badge"
              >
                −
              </button>
            </div>
            <div className="text-2xl font-bold text-green-600">${(amount / 100).toFixed(0)}</div>
            <p className="text-xs text-gray-600 mt-1">Only if we win your case</p>
            <div className="mt-2 text-xs text-green-700">✓ No win, no fee guarantee</div>
          </motion.div>
        ) : (
          <motion.button
            key="min"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setMinimized(false)}
            className="bg-green-600 text-white rounded-full p-3 shadow-lg"
            aria-label="Expand pricing badge"
          >
            <DollarSign size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


