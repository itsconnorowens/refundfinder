import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('Utils', () => {
  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class');
      expect(result).toContain('base-class');
      expect(result).toContain('additional-class');
    });

    it('should handle conditional class names', () => {
      const condition = false;
      const result = cn('base', condition && 'conditional', 'always');
      expect(result).toContain('base');
      expect(result).toContain('always');
      expect(result).not.toContain('conditional');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'end');
      expect(result).toContain('base');
      expect(result).toContain('end');
    });

    it('should override conflicting Tailwind classes correctly', () => {
      const result = cn('p-4', 'p-8');
      // tailwind-merge should keep only the last padding class
      expect(result).toContain('p-8');
      expect(result).not.toContain('p-4');
    });
  });
});

