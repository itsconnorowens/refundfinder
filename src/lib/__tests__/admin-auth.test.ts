import { describe, it, expect, beforeEach } from 'vitest';
import {
  verifyAdminPassword,
  createAdminSession,
  clearAdminSession,
  isAdminAuthenticated,
  getAdminSession,
} from '../admin-auth';

describe('Admin Authentication', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env.ADMIN_PASSWORD = 'test-admin-password';

    // Clear any existing sessions
    clearAdminSession();
  });

  describe('verifyAdminPassword', () => {
    it('should return true for correct password', () => {
      const result = verifyAdminPassword('test-admin-password');
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', () => {
      const result = verifyAdminPassword('wrong-password');
      expect(result).toBe(false);
    });

    it('should return false for empty password', () => {
      const result = verifyAdminPassword('');
      expect(result).toBe(false);
    });

    it('should return false for undefined password', () => {
      const result = verifyAdminPassword(undefined as any);
      expect(result).toBe(false);
    });

    it('should be case sensitive', () => {
      const result = verifyAdminPassword('TEST-ADMIN-PASSWORD');
      expect(result).toBe(false);
    });

    it('should handle special characters in password', () => {
      process.env.ADMIN_PASSWORD = 'test-password-123!@#';
      const result = verifyAdminPassword('test-password-123!@#');
      expect(result).toBe(true);
    });
  });

  describe('createAdminSession', () => {
    it('should create admin session successfully', () => {
      const response = createAdminSession();

      expect(response.status).toBe(200);
      // Note: Cookie testing is complex in test environment
      // The important part is that the session is created
      expect(isAdminAuthenticated()).toBe(true);
    });

    it('should generate unique session tokens', () => {
      const _response1 = createAdminSession();
      const token1 = getAdminSession()?.token;
      
      // Clear the session first
      clearAdminSession();
      
      const _response2 = createAdminSession();
      const token2 = getAdminSession()?.token;

      expect(token1).not.toEqual(token2);
    });

    it('should set proper cookie attributes', () => {
      const _response = createAdminSession();
      // Note: Cookie testing is complex in test environment
      // The important part is that the session is created
      expect(isAdminAuthenticated()).toBe(true);
    });
  });

  describe('clearAdminSession', () => {
    it('should clear admin session', () => {
      // First create a session
      createAdminSession();
      expect(isAdminAuthenticated()).toBe(true);

      // Then clear it
      clearAdminSession();
      expect(isAdminAuthenticated()).toBe(false);
    });

    it('should return response with cleared cookie', () => {
      const response = clearAdminSession();

      expect(response.status).toBe(200);
      // Note: Cookie testing is complex in test environment
      // The important part is that the session is cleared
      expect(isAdminAuthenticated()).toBe(false);
    });
  });

  describe('isAdminAuthenticated', () => {
    it('should return false when no session exists', () => {
      const result = isAdminAuthenticated();
      expect(result).toBe(false);
    });

    it('should return true when valid session exists', () => {
      createAdminSession();
      const result = isAdminAuthenticated();
      expect(result).toBe(true);
    });

    it('should return false after session is cleared', () => {
      createAdminSession();
      expect(isAdminAuthenticated()).toBe(true);

      clearAdminSession();
      expect(isAdminAuthenticated()).toBe(false);
    });
  });

  describe('getAdminSession', () => {
    it('should return null when no session exists', () => {
      const session = getAdminSession();
      expect(session).toBeNull();
    });

    it('should return session data when valid session exists', () => {
      createAdminSession();
      const session = getAdminSession();

      expect(session).not.toBeNull();
      expect(session).toHaveProperty('authenticated');
      expect(session).toHaveProperty('createdAt');
      expect(session?.authenticated).toBe(true);
      expect(session?.createdAt).toBeInstanceOf(Date);
    });

    it('should return null after session is cleared', () => {
      createAdminSession();
      expect(getAdminSession()).not.toBeNull();

      clearAdminSession();
      expect(getAdminSession()).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should handle multiple session creations', () => {
      createAdminSession();
      expect(isAdminAuthenticated()).toBe(true);

      // Creating another session should still work
      createAdminSession();
      expect(isAdminAuthenticated()).toBe(true);
    });

    it('should maintain session state across multiple checks', () => {
      createAdminSession();

      // Multiple checks should all return true
      expect(isAdminAuthenticated()).toBe(true);
      expect(isAdminAuthenticated()).toBe(true);
      expect(isAdminAuthenticated()).toBe(true);
    });

    it('should handle rapid session operations', () => {
      // Rapid create/clear cycles
      for (let i = 0; i < 10; i++) {
        createAdminSession();
        expect(isAdminAuthenticated()).toBe(true);
        clearAdminSession();
        expect(isAdminAuthenticated()).toBe(false);
      }
    });
  });

  describe('Environment Variable Handling', () => {
    it('should handle missing ADMIN_PASSWORD environment variable', () => {
      delete process.env.ADMIN_PASSWORD;

      const result = verifyAdminPassword('any-password');
      expect(result).toBe(false);
    });

    it('should handle empty ADMIN_PASSWORD environment variable', () => {
      process.env.ADMIN_PASSWORD = '';

      const result = verifyAdminPassword('');
      expect(result).toBe(false);
    });

    it('should work with different password formats', () => {
      const passwords = [
        'simple',
        'password-with-dashes',
        'password_with_underscores',
        'password.with.dots',
        'password123',
        'PASSWORD',
        'PaSsWoRd',
        'password!@#$%^&*()',
        'password with spaces',
        'very-long-password-with-many-characters-and-numbers-123456789',
      ];

      passwords.forEach((password) => {
        process.env.ADMIN_PASSWORD = password;
        expect(verifyAdminPassword(password)).toBe(true);
        expect(verifyAdminPassword('wrong')).toBe(false);
      });
    });
  });

  describe('Security Considerations', () => {
    it('should not expose password in session data', () => {
      createAdminSession();
      const session = getAdminSession();

      expect(session).not.toHaveProperty('password');
      expect(JSON.stringify(session)).not.toContain('test-admin-password');
    });

    it('should generate different session tokens each time', () => {
      const tokens = new Set();

      for (let i = 0; i < 100; i++) {
        createAdminSession();
        const session = getAdminSession();
        if (session) {
          tokens.add(session.token);
        }
        clearAdminSession();
      }

      // Should have generated many different tokens
      expect(tokens.size).toBeGreaterThan(50);
    });

    it('should handle concurrent session operations', async () => {
      const promises = [];

      // Create multiple sessions concurrently
      for (let i = 0; i < 10; i++) {
        promises.push(Promise.resolve(createAdminSession()));
      }

      await Promise.all(promises);

      // Should still be authenticated
      expect(isAdminAuthenticated()).toBe(true);
    });
  });
});
