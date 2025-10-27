'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressIndicatorProps {
  completedFields: number;
  totalFields: number;
  showPercentage?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  completedFields,
  totalFields,
  showPercentage = true,
}) => {
  const percentage = Math.round((completedFields / totalFields) * 100);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 font-medium">
          Progress
        </span>
        {showPercentage && (
          <span className="text-sm text-gray-600 font-semibold">
            {percentage}%
          </span>
        )}
      </div>
      
      {/* Progress bar background */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        {/* Animated progress fill */}
        <motion.div
          className={`h-full rounded-full ${
            percentage >= 75 ? 'bg-green-500' :
            percentage >= 50 ? 'bg-blue-500' :
            'bg-blue-400'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: 0.5, 
            ease: "easeOut" 
          }}
        />
      </div>

      {/* Completion message */}
      {percentage === 100 && (
        <motion.p
          className="mt-2 text-sm text-green-600 font-medium"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          ✓ All fields complete! Ready to check your eligibility.
        </motion.p>
      )}
    </motion.div>
  );
};
