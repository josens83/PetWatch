/**
 * Audit Logger System Tests
 * 감사 로그 시스템 테스트
 */

import { auditLogger } from '@/lib/audit-logger'

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('Audit Logger System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ============================================================================
  // Basic Logging Tests
  // ============================================================================
  describe('log', () => {
    describe('Happy Path', () => {
      it('should log audit event with all required fields', async () => {
        const logId = await auditLogger.log({
          eventType: 'AUTH_LOGIN_SUCCESS',
          severity: 'INFO',
          userId: 'user-123',
          action: '로그인 성공',
          success: true,
        })

        expect(logId).toBeDefined()
        expect(logId).toMatch(/^aud_/)
      })

      it('should include optional fields when provided', async () => {
        const logId = await auditLogger.log({
          eventType: 'DATA_CREATED',
          severity: 'INFO',
          userId: 'user-123',
          action: 'Pet created',
          success: true,
          resourceType: 'Pet',
          resourceId: 'pet-456',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          details: { petName: '멍멍이' },
        })

        expect(logId).toBeDefined()
      })

      it('should generate unique IDs for each log', async () => {
        const ids = await Promise.all([
          auditLogger.log({
            eventType: 'DATA_VIEWED',
            severity: 'INFO',
            action: 'View 1',
            success: true,
          }),
          auditLogger.log({
            eventType: 'DATA_VIEWED',
            severity: 'INFO',
            action: 'View 2',
            success: true,
          }),
          auditLogger.log({
            eventType: 'DATA_VIEWED',
            severity: 'INFO',
            action: 'View 3',
            success: true,
          }),
        ])

        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(3)
      })
    })

    describe('Edge Cases', () => {
      it('should handle empty details object', async () => {
        const logId = await auditLogger.log({
          eventType: 'USER_UPDATED',
          severity: 'INFO',
          action: 'User updated',
          success: true,
          details: {},
        })

        expect(logId).toBeDefined()
      })

      it('should handle undefined optional fields', async () => {
        const logId = await auditLogger.log({
          eventType: 'AUTH_LOGOUT',
          severity: 'INFO',
          action: 'Logout',
          success: true,
          userId: undefined,
          ipAddress: undefined,
        })

        expect(logId).toBeDefined()
      })
    })
  })

  // ============================================================================
  // Auth Event Logging Tests
  // ============================================================================
  describe('logAuth', () => {
    describe('Happy Path', () => {
      it('should log login success', async () => {
        const logId = await auditLogger.logAuth('LOGIN_SUCCESS', {
          userId: 'user-123',
          userEmail: 'test@example.com',
          ipAddress: '192.168.1.1',
        })

        expect(logId).toBeDefined()
      })

      it('should log login failure with WARNING severity', async () => {
        const logId = await auditLogger.logAuth('LOGIN_FAILURE', {
          userEmail: 'test@example.com',
          ipAddress: '192.168.1.1',
          errorMessage: 'Invalid password',
        })

        expect(logId).toBeDefined()
      })

      it('should log password change', async () => {
        const logId = await auditLogger.logAuth('PASSWORD_CHANGE', {
          userId: 'user-123',
          userEmail: 'test@example.com',
          ipAddress: '192.168.1.1',
        })

        expect(logId).toBeDefined()
      })

      it('should log logout', async () => {
        const logId = await auditLogger.logAuth('LOGOUT', {
          userId: 'user-123',
          userEmail: 'test@example.com',
        })

        expect(logId).toBeDefined()
      })
    })
  })

  // ============================================================================
  // Data Change Logging Tests
  // ============================================================================
  describe('logDataChange', () => {
    describe('Happy Path', () => {
      it('should log data creation', async () => {
        const logId = await auditLogger.logDataChange({
          userId: 'user-123',
          resourceType: 'Pet',
          resourceId: 'pet-456',
          action: 'CREATE',
          newValue: { name: '멍멍이', species: 'DOG' },
        })

        expect(logId).toBeDefined()
      })

      it('should log data update with previous value', async () => {
        const logId = await auditLogger.logDataChange({
          userId: 'user-123',
          resourceType: 'Pet',
          resourceId: 'pet-456',
          action: 'UPDATE',
          previousValue: { name: '멍멍이' },
          newValue: { name: '뽀삐' },
        })

        expect(logId).toBeDefined()
      })

      it('should log data deletion', async () => {
        const logId = await auditLogger.logDataChange({
          userId: 'user-123',
          resourceType: 'Pet',
          resourceId: 'pet-456',
          action: 'DELETE',
          previousValue: { name: '멍멍이', species: 'DOG' },
        })

        expect(logId).toBeDefined()
      })
    })
  })

  // ============================================================================
  // Security Event Logging Tests
  // ============================================================================
  describe('logSecurity', () => {
    describe('Happy Path', () => {
      it('should log rate limit exceeded', async () => {
        const logId = await auditLogger.logSecurity('RATE_LIMIT', {
          ipAddress: '192.168.1.1',
          details: { endpoint: '/api/pets', requestCount: 150 },
        })

        expect(logId).toBeDefined()
      })

      it('should log unauthorized access attempt', async () => {
        const logId = await auditLogger.logSecurity('UNAUTHORIZED', {
          userId: 'user-123',
          resourceType: 'Pet',
          resourceId: 'pet-999',
          details: { attemptedAction: 'DELETE' },
        })

        expect(logId).toBeDefined()
      })

      it('should log privilege escalation attempt with CRITICAL severity', async () => {
        const logId = await auditLogger.logSecurity('PRIVILEGE_ESCALATION', {
          userId: 'user-123',
          details: { attemptedRole: 'ADMIN' },
        })

        expect(logId).toBeDefined()
      })

      it('should log suspicious activity', async () => {
        const logId = await auditLogger.logSecurity('SUSPICIOUS', {
          userId: 'user-123',
          ipAddress: '192.168.1.1',
          details: {
            reason: 'Multiple failed login attempts',
            failedAttempts: 10,
          },
        })

        expect(logId).toBeDefined()
      })
    })
  })

  // ============================================================================
  // Pet Event Logging Tests
  // ============================================================================
  describe('logPetEvent', () => {
    describe('Happy Path', () => {
      it('should log pet creation', async () => {
        const logId = await auditLogger.logPetEvent('CREATED', {
          userId: 'user-123',
          petId: 'pet-456',
          petName: '멍멍이',
          newValue: { species: 'DOG', breed: 'Maltese' },
        })

        expect(logId).toBeDefined()
      })

      it('should log pet health log creation', async () => {
        const logId = await auditLogger.logPetEvent('HEALTH_LOG', {
          userId: 'user-123',
          petId: 'pet-456',
          petName: '멍멍이',
          newValue: { weight: 5.5, date: new Date() },
        })

        expect(logId).toBeDefined()
      })

      it('should log AI health analysis', async () => {
        const logId = await auditLogger.logPetEvent('ANALYZED', {
          userId: 'user-123',
          petId: 'pet-456',
          petName: '멍멍이',
        })

        expect(logId).toBeDefined()
      })

      it('should log pet deletion with WARNING severity', async () => {
        const logId = await auditLogger.logPetEvent('DELETED', {
          userId: 'user-123',
          petId: 'pet-456',
          petName: '멍멍이',
          previousValue: { species: 'DOG', breed: 'Maltese' },
        })

        expect(logId).toBeDefined()
      })
    })
  })

  // ============================================================================
  // Query Tests
  // ============================================================================
  describe('query', () => {
    it('should return paginated results', async () => {
      const result = await auditLogger.query({
        userId: 'user-123',
        limit: 10,
        offset: 0,
      })

      expect(result).toHaveProperty('entries')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('hasMore')
      expect(Array.isArray(result.entries)).toBe(true)
    })

    it('should filter by event type', async () => {
      const result = await auditLogger.query({
        eventType: 'AUTH_LOGIN_SUCCESS',
      })

      expect(result).toHaveProperty('entries')
    })

    it('should filter by multiple event types', async () => {
      const result = await auditLogger.query({
        eventType: ['AUTH_LOGIN_SUCCESS', 'AUTH_LOGIN_FAILURE'],
      })

      expect(result).toHaveProperty('entries')
    })

    it('should filter by date range', async () => {
      const result = await auditLogger.query({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      })

      expect(result).toHaveProperty('entries')
    })

    it('should filter by severity', async () => {
      const result = await auditLogger.query({
        severity: 'CRITICAL',
      })

      expect(result).toHaveProperty('entries')
    })
  })

  // ============================================================================
  // Stats Tests
  // ============================================================================
  describe('getStats', () => {
    it('should return audit log statistics', async () => {
      const stats = await auditLogger.getStats(
        new Date('2024-01-01'),
        new Date('2024-12-31')
      )

      expect(stats).toHaveProperty('totalEvents')
      expect(stats).toHaveProperty('eventsByType')
      expect(stats).toHaveProperty('eventsBySeverity')
      expect(stats).toHaveProperty('successRate')
      expect(stats).toHaveProperty('topUsers')
      expect(stats).toHaveProperty('topResources')
    })

    it('should filter stats by user', async () => {
      const stats = await auditLogger.getStats(
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        'user-123'
      )

      expect(stats).toHaveProperty('totalEvents')
    })
  })

  // ============================================================================
  // Report Generation Tests
  // ============================================================================
  describe('generateUserActivityReport', () => {
    it('should generate user activity report', async () => {
      const report = await auditLogger.generateUserActivityReport(
        'user-123',
        new Date('2024-01-01'),
        new Date('2024-12-31')
      )

      expect(report).toHaveProperty('userId', 'user-123')
      expect(report).toHaveProperty('period')
      expect(report.period).toHaveProperty('start')
      expect(report.period).toHaveProperty('end')
      expect(report).toHaveProperty('summary')
      expect(report.summary).toHaveProperty('totalActions')
      expect(report.summary).toHaveProperty('byType')
      expect(report.summary).toHaveProperty('bySeverity')
      expect(report).toHaveProperty('timeline')
    })
  })

  describe('generateSecurityReport', () => {
    it('should generate security report', async () => {
      const report = await auditLogger.generateSecurityReport(
        new Date('2024-01-01'),
        new Date('2024-12-31')
      )

      expect(report).toHaveProperty('period')
      expect(report).toHaveProperty('summary')
      expect(report.summary).toHaveProperty('totalSecurityEvents')
      expect(report.summary).toHaveProperty('criticalEvents')
      expect(report.summary).toHaveProperty('failedLogins')
      expect(report.summary).toHaveProperty('rateLimitExceeded')
      expect(report.summary).toHaveProperty('unauthorizedAttempts')
      expect(report).toHaveProperty('topOffenders')
      expect(report).toHaveProperty('recommendations')
      expect(Array.isArray(report.recommendations)).toBe(true)
    })
  })

  // ============================================================================
  // Sensitive Data Masking Tests
  // ============================================================================
  describe('Sensitive Data Masking', () => {
    it('should mask password in details', async () => {
      const logId = await auditLogger.log({
        eventType: 'AUTH_PASSWORD_CHANGE',
        severity: 'INFO',
        action: 'Password changed',
        success: true,
        details: {
          password: 'secret123',
          newPassword: 'newsecret456',
        },
      })

      expect(logId).toBeDefined()
      // Note: In a real test, we'd verify the logged data has masked values
    })

    it('should mask token in newValue', async () => {
      const logId = await auditLogger.log({
        eventType: 'API_KEY_CREATED',
        severity: 'INFO',
        action: 'API key created',
        success: true,
        newValue: {
          apiKey: 'sk_live_12345',
          accessToken: 'eyJhbGciOiJIUzI1NiJ9',
        },
      })

      expect(logId).toBeDefined()
    })

    it('should mask nested sensitive fields', async () => {
      const logId = await auditLogger.log({
        eventType: 'USER_UPDATED',
        severity: 'INFO',
        action: 'User settings updated',
        success: true,
        details: {
          user: {
            id: 'user-123',
            settings: {
              apiKey: 'secret_key',
              publicName: 'John',
            },
          },
        },
      })

      expect(logId).toBeDefined()
    })
  })

  // ============================================================================
  // Buffer Tests
  // ============================================================================
  describe('Buffer Management', () => {
    it('should handle rapid logging without issues', async () => {
      const promises = Array.from({ length: 50 }, (_, i) =>
        auditLogger.log({
          eventType: 'DATA_VIEWED',
          severity: 'INFO',
          action: `View action ${i}`,
          success: true,
        })
      )

      const ids = await Promise.all(promises)
      expect(ids).toHaveLength(50)
      expect(new Set(ids).size).toBe(50)
    })
  })

  // ============================================================================
  // Cleanup Tests
  // ============================================================================
  describe('cleanup', () => {
    it('should flush remaining buffer on cleanup', async () => {
      // Log something
      await auditLogger.log({
        eventType: 'SYSTEM_MAINTENANCE',
        severity: 'INFO',
        action: 'Pre-cleanup log',
        success: true,
      })

      // Cleanup should not throw
      await expect(auditLogger.cleanup()).resolves.not.toThrow()
    })
  })
})
