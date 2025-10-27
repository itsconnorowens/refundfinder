'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CharacterCountProps {
  current: number;
  minimum?: number;
  maximum?: number;
}

export const CharacterCount: React.FC<CharacterCountProps> = ({
  current,
  minimum = 50,
  maximum = 5000,
}) => {
  const isValidLength = current >= minimum && current <= maximum;
  const isNearMinimum = current < minimum && current > minimum - 20;
  
  const getColor = () => {
    if (isValidLength) return 'text-green-600';
    if (current < minimum) return 'text-red-600';
    return 'text-gray-500';
  };

  const getProgress = () => {
    if (current < minimum) {
      return (current / minimum) * 100;
    }
    return ((current - minimum) / (maximum - minimum)) * 100;
  };

  return (
    <motion.div
      className="mt-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Progress indicator */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
        <motion.div
          className={`h-full rounded-full ${
            isValidLength ? 'bg-green-500' : 'bg-blue-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(getProgress(), 100)}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Character count text */}
      <div className="flex justify-between items-center">
        <motion.span
          className={`text-xs font-medium ${getColor()}`}
          animate={{ 
            color: getColor() === 'text-green-600' ? '#16a34a' :
                   getColor() === 'text-red-600' ? '#dc2626' : '#6b7280'
          }}
          transition={{ duration: 0.2 }}
        >
          {current < minimum && (
            <>
              {minimum - current} more characters needed
            </>
          )}
          {isValidLength && (
            <>
              ✓ Character count valid ({current} characters)
            </>
          )}
          {current > maximum && (
            <>
              Too long ({current - maximum} over limit)
            </>
          )}
        </motion.span>
        <span className="text-xs text-gray-500">
          {current} / {maximum}
        </span>
      </div>
    </motion.div>
  );
};
