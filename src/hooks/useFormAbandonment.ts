import { useEffect, useRef, useState } from 'react';
import posthog from 'posthog-js';
import { getAttributionProperties } from '@/lib/marketing-attribution';

/**
 * Hook to track form abandonment
 *
 * Tracks when users start interacting with a form but leave without completing it.
 * Useful for identifying friction points in the user journey.
 *
 * @param formName - Identifier for the form (e.g., 'eligibility_check', 'claim_submission')
 * @param formData - Current form data object
 * @param additionalProperties - Optional additional properties to include in the event
 *
 * @example
 * useFormAbandonment('eligibility_check', formData, { disruption_type: formData.disruptionType });
 */
export function useFormAbandonment<T extends Record<string, any>>(
  formName: string,
  formData: T,
  additionalProperties?: Record<string, any>
) {
  const interactionOccurred = useRef(false);
  const [startTime] = useState(() => Date.now());
  const hasTrackedAbandonment = useRef(false);
  const [attributionProperties] = useState(() => getAttributionProperties());

  useEffect(() => {
    const handleInteraction = () => {
      if (!interactionOccurred.current) {
        interactionOccurred.current = true;

        // Track that user started interacting with form
        if (typeof window !== 'undefined') {
          posthog.capture(`${formName}_interaction_started`, {
            form_name: formName,
            ...additionalProperties,
            ...attributionProperties,
          });
        }
      }
    };

    // Track any interaction with form inputs
    window.addEventListener('input', handleInteraction, { once: true });
    window.addEventListener('change', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('input', handleInteraction);
      window.removeEventListener('change', handleInteraction);
    };
  }, [formName, additionalProperties, attributionProperties]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      // Only track abandonment if:
      // 1. User interacted with the form
      // 2. Form has some data
      // 3. Haven't already tracked abandonment
      if (
        interactionOccurred.current &&
        Object.keys(formData).length > 0 &&
        !hasTrackedAbandonment.current
      ) {
        const timeSpent = Math.round((Date.now() - startTime) / 1000);

        // Count fields that have been filled
        const completedFields = Object.entries(formData).filter(([_, value]) => {
          if (value === null || value === undefined || value === '') return false;
          if (typeof value === 'boolean') return true;
          if (typeof value === 'object' && !Array.isArray(value)) {
            // For nested objects (like careProvided), check if any property is true
            return Object.values(value).some(v => v === true);
          }
          return true;
        }).length;

        const totalFields = Object.keys(formData).length;
        const completionPercentage = totalFields > 0
          ? Math.round((completedFields / totalFields) * 100)
          : 0;

        // Track abandonment event
        posthog.capture(`${formName}_abandoned`, {
          form_name: formName,
          time_spent_seconds: timeSpent,
          fields_completed: completedFields,
          total_fields: totalFields,
          completion_percentage: completionPercentage,
          ...additionalProperties,
          ...attributionProperties,
        });

        hasTrackedAbandonment.current = true;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formName, formData, additionalProperties, attributionProperties, startTime]);

  // Provide a method to mark form as completed (prevents abandonment tracking)
  const markCompleted = () => {
    hasTrackedAbandonment.current = true;
  };

  return { markCompleted };
}
