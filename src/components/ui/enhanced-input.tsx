'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2, Edit3, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InputState = 'idle' | 'focus' | 'validating' | 'success' | 'error' | 'prefilled';

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  state?: InputState;
  errorMessage?: string;
  successMessage?: string;
  helpText?: string;
  isPrefilled?: boolean;
  onEditPrefilled?: () => void;
  showPasswordToggle?: boolean;
  validationDelay?: number;
  className?: string;
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({
    state = 'idle',
    errorMessage,
    successMessage,
    helpText,
    isPrefilled = false,
    onEditPrefilled,
    showPasswordToggle = false,
    validationDelay = 500,
    className,
    ...props
  }, ref) => {
    const [internalState, setInternalState] = useState<InputState>(state);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Update internal state when prop changes
    useEffect(() => {
      setInternalState(state);
    }, [state]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (internalState === 'idle' || internalState === 'prefilled') {
        setInternalState('focus');
      }
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (internalState === 'focus') {
        setInternalState('idle');
      }
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Clear validation timeout
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }

      // Set validating state with delay
      if (internalState !== 'error' && internalState !== 'success') {
        setInternalState('validating');
        
        validationTimeoutRef.current = setTimeout(() => {
          // This would typically trigger validation
          // For now, we'll just go back to focus state
          if (isFocused) {
            setInternalState('focus');
          } else {
            setInternalState('idle');
          }
        }, validationDelay);
      }

      props.onChange?.(e);
    };

    const getInputType = () => {
      if (showPasswordToggle && props.type === 'password') {
        return isPasswordVisible ? 'text' : 'password';
      }
      return props.type;
    };

    const getBorderColor = () => {
      switch (internalState) {
        case 'focus':
          return 'border-blue-500 ring-2 ring-blue-200';
        case 'validating':
          return 'border-yellow-400 ring-2 ring-yellow-200';
        case 'success':
          return 'border-green-500 ring-2 ring-green-200';
        case 'error':
          return 'border-red-500 ring-2 ring-red-200';
        case 'prefilled':
          return 'border-green-300 bg-green-50';
        default:
          return 'border-gray-300';
      }
    };

    const getIcon = () => {
      switch (internalState) {
        case 'validating':
          return <Loader2 size={16} className="animate-spin text-yellow-500" />;
        case 'success':
          return <CheckCircle size={16} className="text-green-500" />;
        case 'error':
          return <AlertCircle size={16} className="text-red-500" />;
        case 'prefilled':
          return <Edit3 size={16} className="text-green-600" />;
        default:
          return null;
      }
    };

    const getMessage = () => {
      if (internalState === 'error' && errorMessage) {
        return { text: errorMessage, type: 'error' };
      }
      if (internalState === 'success' && successMessage) {
        return { text: successMessage, type: 'success' };
      }
      if (helpText) {
        return { text: helpText, type: 'help' };
      }
      return null;
    };

    const message = getMessage();

    return (
      <div className="space-y-1">
        <div className="relative">
          <input
            ref={ref}
            type={getInputType()}
            className={cn(
              "flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-all duration-200",
              "bg-background ring-offset-background",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              getBorderColor(),
              isPrefilled && "pr-20", // Extra padding for prefilled badge
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />

          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {/* State icon */}
            <AnimatePresence>
              {getIcon() && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  {getIcon()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password toggle */}
            {showPasswordToggle && props.type === 'password' && (
              <button
                type="button"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}

            {/* Prefilled edit button */}
            {isPrefilled && onEditPrefilled && (
              <button
                type="button"
                onClick={onEditPrefilled}
                className="text-green-600 hover:text-green-700 transition-colors"
                title="Edit this field"
              >
                <Edit3 size={14} />
              </button>
            )}
          </div>

          {/* Prefilled badge */}
          {isPrefilled && (
            <div className="absolute -top-2 -right-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200"
              >
                Pre-filled
              </motion.div>
            </div>
          )}
        </div>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex items-center space-x-1 text-xs",
                message.type === 'error' && "text-red-600",
                message.type === 'success' && "text-green-600",
                message.type === 'help' && "text-gray-500"
              )}
            >
              {message.type === 'error' && <AlertCircle size={12} />}
              {message.type === 'success' && <CheckCircle size={12} />}
              <span>{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';

export { EnhancedInput };
