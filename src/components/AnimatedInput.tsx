'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  error?: string;
  success?: boolean;
  helpText?: string;
  helpIcon?: string;
  className?: string;
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  error,
  success,
  helpText,
  helpIcon,
  className = '',
  ...props
}) => {
  return (
    <div>
      <motion.div
        className="relative"
        initial={false}
        animate={{
          scale: error ? [1, 1.01, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <input
          className={`
            w-full px-4 py-4 md:py-3 border rounded-lg text-base
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-all duration-200
            ${
              error 
                ? 'border-red-500 bg-red-50' 
                : success 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 bg-white'
            }
            ${className}
          `}
          {...props}
        />
        
        {/* Success checkmark */}
        {success && !error && (
          <motion.div
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}

        {/* Error icon */}
        {error && (
          <motion.div
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.div>
        )}
      </motion.div>

      {/* Error message */}
      {error && (
        <motion.p
          className="mt-1 text-sm text-red-600"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}

      {/* Help text */}
      {helpText && !error && (
        <motion.p
          className="mt-1 text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {helpIcon && <span className="mr-1">{helpIcon}</span>}
          {helpText}
        </motion.p>
      )}
    </div>
  );
};