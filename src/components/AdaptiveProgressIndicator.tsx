'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  description: string;
  estimatedTime?: string;
}

interface AdaptiveProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (stepId: number) => void;
  className?: string;
}

export const AdaptiveProgressIndicator: React.FC<AdaptiveProgressIndicatorProps> = ({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  className
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getStepStatus = (stepId: number) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'current';
    if (stepId < currentStep) return 'completed';
    return 'upcoming';
  };

  const getEstimatedTimeRemaining = () => {
    const remainingSteps = steps.length - currentStep;
    const avgTimePerStep = 2; // minutes
    return remainingSteps * avgTimePerStep;
  };

  const StepIcon = ({ stepId, status }: { stepId: number; status: string }) => {
    const iconProps = { size: 20 };
    
    switch (status) {
      case 'completed':
        return <CheckCircle {...iconProps} className="text-green-500" />;
      case 'current':
        return <Circle {...iconProps} className="text-blue-500 fill-current" />;
      default:
        return <Circle {...iconProps} className="text-gray-400" />;
    }
  };

  // Desktop Vertical Sidebar
  const DesktopProgress = () => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed left-4 top-1/2 transform -translate-y-1/2 z-10 hidden md:block"
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4 min-w-[280px]">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Progress</h3>
          <div className="flex items-center text-xs text-gray-500">
            <Clock size={14} className="mr-1" />
            <span>{getEstimatedTimeRemaining()} min remaining</span>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const isClickable = completedSteps.includes(step.id) && onStepClick;
            
            return (
              <motion.div
                key={step.id}
                className={cn(
                  "flex items-start space-x-3 p-2 rounded-lg transition-all duration-200",
                  status === 'current' && "bg-blue-50 border border-blue-200",
                  status === 'completed' && "bg-green-50",
                  isClickable && "cursor-pointer hover:bg-gray-50"
                )}
                onClick={() => isClickable && onStepClick?.(step.id)}
                whileHover={isClickable ? { scale: 1.02 } : {}}
                whileTap={isClickable ? { scale: 0.98 } : {}}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <StepIcon stepId={step.id} status={status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-sm font-medium",
                      status === 'current' && "text-blue-900",
                      status === 'completed' && "text-green-900",
                      status === 'upcoming' && "text-gray-500"
                    )}>
                      {step.title}
                    </p>
                    {step.estimatedTime && (
                      <span className="text-xs text-gray-400">{step.estimatedTime}</span>
                    )}
                  </div>
                  <p className={cn(
                    "text-xs mt-0.5",
                    status === 'current' && "text-blue-700",
                    status === 'completed' && "text-green-700",
                    status === 'upcoming' && "text-gray-400"
                  )}>
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Step {currentStep} of {steps.length}</span>
            <span>{Math.round((currentStep / steps.length) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Mobile Horizontal Compact
  const MobileProgress = () => (
    <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="px-4 py-3">
        {/* Current Step Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <StepIcon stepId={currentStep} status="current" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {steps[currentStep - 1]?.title}
              </h3>
              <p className="text-xs text-gray-500">
                Step {currentStep} of {steps.length}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowMobileDetails(!showMobileDetails)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight 
              size={16} 
              className={cn(
                "transition-transform duration-200",
                showMobileDetails && "rotate-90"
              )}
            />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Time Remaining */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{Math.round((currentStep / steps.length) * 100)}% complete</span>
          <div className="flex items-center">
            <Clock size={12} className="mr-1" />
            <span>{getEstimatedTimeRemaining()} min left</span>
          </div>
        </div>

        {/* Expandable Details */}
        <AnimatePresence>
          {showMobileDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 pt-3 border-t border-gray-200"
            >
              <div className="space-y-2">
                {steps.map((step) => {
                  const status = getStepStatus(step.id);
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "flex items-center space-x-2 text-xs",
                        status === 'current' && "text-blue-600 font-medium",
                        status === 'completed' && "text-green-600",
                        status === 'upcoming' && "text-gray-400"
                      )}
                    >
                      <StepIcon stepId={step.id} status={status} />
                      <span>{step.title}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className={cn("", className)}>
      <DesktopProgress />
      <MobileProgress />
    </div>
  );
};

export default AdaptiveProgressIndicator;
