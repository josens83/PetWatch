/**
 * Audit Logging System
 * 감사 로그 시스템 - 모든 중요 작업을 추적하고 기록
 *
 * @description
 * 이 모듈은 사용자 행동, 보안 이벤트, 데이터 변경을 추적합니다.
 * 컴플라이언스(GDPR, HIPAA 등) 및 보안 감사에 필요한 로그를 생성합니다.
 *
 * @module audit-logger
 * @version 1.0.0
 */

import { prisma } from './db'
import { logger } from './logger'

// ============================================================================
// Types
// ============================================================================

/**
 * 감사 이벤트 타입
 */
export type AuditEventType =
  // 인증 이벤트
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILURE'
  | 'AUTH_LOGOUT'
  | 'AUTH_PASSWORD_CHANGE'
  | 'AUTH_PASSWORD_RESET'
  | 'AUTH_MFA_ENABLED'
  | 'AUTH_MFA_DISABLED'
  | 'AUTH_SESSION_EXPIRED'
  // 사용자 관리
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_ROLE_CHANGED'
  | 'USER_SUBSCRIPTION_CHANGED'
  // 데이터 접근
  | 'DATA_VIEWED'
  | 'DATA_EXPORTED'
  | 'DATA_CREATED'
  | 'DATA_UPDATED'
  | 'DATA_DELETED'
  // 반려동물 관련
  | 'PET_CREATED'
  | 'PET_UPDATED'
  | 'PET_DELETED'
  | 'PET_HEALTH_LOG_CREATED'
  | 'PET_HEALTH_ANALYZED'
  // 보안 이벤트
  | 'SECURITY_RATE_LIMIT_EXCEEDED'
  | 'SECURITY_INVALID_TOKEN'
  | 'SECURITY_UNAUTHORIZED_ACCESS'
  | 'SECURITY_SUSPICIOUS_ACTIVITY'
  | 'SECURITY_PRIVILEGE_ESCALATION'
  // 시스템 이벤트
  | 'SYSTEM_ERROR'
  | 'SYSTEM_MAINTENANCE'
  | 'SYSTEM_CONFIG_CHANGED'
  // API 이벤트
  | 'API_KEY_CREATED'
  | 'API_KEY_REVOKED'
  | 'API_RATE_LIMITED'

/**
 * 감사 이벤트 심각도
 */
export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

/**
 * 감사 로그 엔트리
 */
export interface AuditLogEntry {
  id?: string
  timestamp: Date
  eventType: AuditEventType
  severity: AuditSeverity
  userId?: string
  userEmail?: string
  ipAddress?: string
  userAgent?: string
  resourceType?: string
  resourceId?: string
  action: string
  details?: Record<string, unknown>
  previousValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  success: boolean
  errorMessage?: string
  requestId?: string
  sessionId?: string
  duration?: number
}

/**
 * 감사 로그 쿼리 옵션
 */
export interface AuditLogQueryOptions {
  userId?: string
  eventType?: AuditEventType | AuditEventType[]
  severity?: AuditSeverity | AuditSeverity[]
  resourceType?: string
  resourceId?: string
  startDate?: Date
  endDate?: Date
  success?: boolean
  limit?: number
  offset?: number
  orderBy?: 'asc' | 'desc'
}

/**
 * 감사 로그 통계
 */
export interface AuditLogStats {
  totalEvents: number
  eventsByType: Record<string, number>
  eventsBySeverity: Record<string, number>
  successRate: number
  topUsers: Array<{ userId: string; count: number }>
  topResources: Array<{ resourceType: string; count: number }>
}

// ============================================================================
// In-Memory Buffer (for high-throughput scenarios)
// ============================================================================

const BUFFER_SIZE = 100
const FLUSH_INTERVAL = 5000 // 5 seconds

let auditBuffer: AuditLogEntry[] = []
let flushTimer: NodeJS.Timeout | null = null

/**
 * 버퍼 플러시 - 모든 대기 중인 로그를 DB에 저장
 */
async function flushBuffer(): Promise<void> {
  if (auditBuffer.length === 0) return

  const entries = [...auditBuffer]
  auditBuffer = []

  try {
    // 실제 구현에서는 DB에 bulk insert
    // await prisma.auditLog.createMany({ data: entries })

    // 현재는 로거로 전송
    for (const entry of entries) {
      logger.info('Audit log', {
        audit: true,
        ...entry,
        previousValue: entry.previousValue ? '[REDACTED]' : undefined,
        newValue: entry.newValue ? '[REDACTED]' : undefined,
      })
    }
  } catch (error) {
    // 실패한 로그는 복구를 위해 버퍼에 다시 추가
    auditBuffer = [...entries, ...auditBuffer]
    logger.error('Failed to flush audit buffer', { error, entryCount: entries.length })
  }
}

/**
 * 버퍼 플러시 타이머 시작
 */
function startFlushTimer(): void {
  if (flushTimer) return
  flushTimer = setInterval(flushBuffer, FLUSH_INTERVAL)
}

/**
 * 버퍼 플러시 타이머 중지
 */
function stopFlushTimer(): void {
  if (flushTimer) {
    clearInterval(flushTimer)
    flushTimer = null
  }
}

// ============================================================================
// Audit Logger Class
// ============================================================================

/**
 * 감사 로거
 *
 * @description
 * 모든 중요 이벤트를 추적하고 기록하는 감사 로거입니다.
 *
 * @example
 * ```typescript
 * // 로그인 성공 기록
 * await auditLogger.log({
 *   eventType: 'AUTH_LOGIN_SUCCESS',
 *   severity: 'INFO',
 *   userId: user.id,
 *   userEmail: user.email,
 *   action: '사용자 로그인',
 *   ipAddress: request.ip,
 * })
 *
 * // 데이터 변경 기록
 * await auditLogger.logDataChange({
 *   userId: user.id,
 *   resourceType: 'Pet',
 *   resourceId: pet.id,
 *   action: 'UPDATE',
 *   previousValue: oldPet,
 *   newValue: newPet,
 * })
 * ```
 */
class AuditLogger {
  private useBuffer: boolean

  constructor(options: { useBuffer?: boolean } = {}) {
    this.useBuffer = options.useBuffer ?? true
    if (this.useBuffer) {
      startFlushTimer()
    }
  }

  /**
   * 감사 로그 기록
   *
   * @param entry - 로그 엔트리
   * @returns 생성된 로그 ID (비동기)
   */
  async log(entry: Omit<AuditLogEntry, 'timestamp' | 'id'>): Promise<string> {
    const logEntry: AuditLogEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date(),
    }

    // 민감 정보 마스킹
    const sanitizedEntry = this.sanitizeEntry(logEntry)

    if (this.useBuffer) {
      auditBuffer.push(sanitizedEntry)

      // 버퍼가 가득 찼으면 즉시 플러시
      if (auditBuffer.length >= BUFFER_SIZE) {
        await flushBuffer()
      }
    } else {
      // 버퍼 없이 즉시 저장
      await this.saveEntry(sanitizedEntry)
    }

    // 심각한 이벤트는 즉시 알림
    if (entry.severity === 'CRITICAL' || entry.severity === 'ERROR') {
      this.notifySecurityTeam(sanitizedEntry)
    }

    return logEntry.id!
  }

  /**
   * 인증 이벤트 로그
   */
  async logAuth(
    type: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'PASSWORD_RESET',
    data: {
      userId?: string
      userEmail?: string
      ipAddress?: string
      userAgent?: string
      success?: boolean
      errorMessage?: string
    }
  ): Promise<string> {
    const eventTypeMap: Record<string, AuditEventType> = {
      LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
      LOGIN_FAILURE: 'AUTH_LOGIN_FAILURE',
      LOGOUT: 'AUTH_LOGOUT',
      PASSWORD_CHANGE: 'AUTH_PASSWORD_CHANGE',
      PASSWORD_RESET: 'AUTH_PASSWORD_RESET',
    }

    return this.log({
      eventType: eventTypeMap[type],
      severity: type === 'LOGIN_FAILURE' ? 'WARNING' : 'INFO',
      action: this.getActionDescription(eventTypeMap[type]),
      success: data.success ?? type !== 'LOGIN_FAILURE',
      ...data,
    })
  }

  /**
   * 데이터 변경 로그
   */
  async logDataChange(data: {
    userId: string
    resourceType: string
    resourceId: string
    action: 'CREATE' | 'UPDATE' | 'DELETE'
    previousValue?: Record<string, unknown>
    newValue?: Record<string, unknown>
    ipAddress?: string
  }): Promise<string> {
    const eventTypeMap: Record<string, AuditEventType> = {
      CREATE: 'DATA_CREATED',
      UPDATE: 'DATA_UPDATED',
      DELETE: 'DATA_DELETED',
    }

    return this.log({
      eventType: eventTypeMap[data.action],
      severity: data.action === 'DELETE' ? 'WARNING' : 'INFO',
      action: `${data.resourceType} ${data.action.toLowerCase()}`,
      success: true,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      userId: data.userId,
      previousValue: data.previousValue,
      newValue: data.newValue,
      ipAddress: data.ipAddress,
    })
  }

  /**
   * 보안 이벤트 로그
   */
  async logSecurity(
    type: 'RATE_LIMIT' | 'INVALID_TOKEN' | 'UNAUTHORIZED' | 'SUSPICIOUS' | 'PRIVILEGE_ESCALATION',
    data: {
      userId?: string
      ipAddress?: string
      userAgent?: string
      details?: Record<string, unknown>
      resourceType?: string
      resourceId?: string
    }
  ): Promise<string> {
    const eventTypeMap: Record<string, AuditEventType> = {
      RATE_LIMIT: 'SECURITY_RATE_LIMIT_EXCEEDED',
      INVALID_TOKEN: 'SECURITY_INVALID_TOKEN',
      UNAUTHORIZED: 'SECURITY_UNAUTHORIZED_ACCESS',
      SUSPICIOUS: 'SECURITY_SUSPICIOUS_ACTIVITY',
      PRIVILEGE_ESCALATION: 'SECURITY_PRIVILEGE_ESCALATION',
    }

    const severityMap: Record<string, AuditSeverity> = {
      RATE_LIMIT: 'WARNING',
      INVALID_TOKEN: 'WARNING',
      UNAUTHORIZED: 'ERROR',
      SUSPICIOUS: 'ERROR',
      PRIVILEGE_ESCALATION: 'CRITICAL',
    }

    return this.log({
      eventType: eventTypeMap[type],
      severity: severityMap[type],
      action: this.getActionDescription(eventTypeMap[type]),
      success: false,
      ...data,
    })
  }

  /**
   * 반려동물 관련 이벤트 로그
   */
  async logPetEvent(
    type: 'CREATED' | 'UPDATED' | 'DELETED' | 'HEALTH_LOG' | 'ANALYZED',
    data: {
      userId: string
      petId: string
      petName?: string
      previousValue?: Record<string, unknown>
      newValue?: Record<string, unknown>
      ipAddress?: string
    }
  ): Promise<string> {
    const eventTypeMap: Record<string, AuditEventType> = {
      CREATED: 'PET_CREATED',
      UPDATED: 'PET_UPDATED',
      DELETED: 'PET_DELETED',
      HEALTH_LOG: 'PET_HEALTH_LOG_CREATED',
      ANALYZED: 'PET_HEALTH_ANALYZED',
    }

    return this.log({
      eventType: eventTypeMap[type],
      severity: type === 'DELETED' ? 'WARNING' : 'INFO',
      action: `반려동물 ${type.toLowerCase()}`,
      success: true,
      resourceType: 'Pet',
      resourceId: data.petId,
      userId: data.userId,
      previousValue: data.previousValue,
      newValue: data.newValue,
      ipAddress: data.ipAddress,
      details: { petName: data.petName },
    })
  }

  /**
   * 감사 로그 조회
   */
  async query(options: AuditLogQueryOptions): Promise<{
    entries: AuditLogEntry[]
    total: number
    hasMore: boolean
  }> {
    // 실제 구현에서는 DB 쿼리
    // 현재는 mock 데이터 반환
    logger.debug('Audit log query', { options })

    return {
      entries: [],
      total: 0,
      hasMore: false,
    }
  }

  /**
   * 감사 로그 통계 조회
   */
  async getStats(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<AuditLogStats> {
    // 실제 구현에서는 DB 집계 쿼리
    logger.debug('Audit log stats', { startDate, endDate, userId })

    return {
      totalEvents: 0,
      eventsByType: {},
      eventsBySeverity: {},
      successRate: 100,
      topUsers: [],
      topResources: [],
    }
  }

  /**
   * 사용자별 활동 리포트 생성
   */
  async generateUserActivityReport(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    userId: string
    period: { start: Date; end: Date }
    summary: {
      totalActions: number
      byType: Record<string, number>
      bySeverity: Record<string, number>
    }
    timeline: AuditLogEntry[]
  }> {
    const entries = await this.query({
      userId,
      startDate,
      endDate,
      limit: 1000,
    })

    const byType: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}

    for (const entry of entries.entries) {
      byType[entry.eventType] = (byType[entry.eventType] || 0) + 1
      bySeverity[entry.severity] = (bySeverity[entry.severity] || 0) + 1
    }

    return {
      userId,
      period: { start: startDate, end: endDate },
      summary: {
        totalActions: entries.total,
        byType,
        bySeverity,
      },
      timeline: entries.entries,
    }
  }

  /**
   * 보안 리포트 생성
   */
  async generateSecurityReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    period: { start: Date; end: Date }
    summary: {
      totalSecurityEvents: number
      criticalEvents: number
      failedLogins: number
      rateLimitExceeded: number
      unauthorizedAttempts: number
    }
    topOffenders: Array<{
      identifier: string
      eventCount: number
      severity: AuditSeverity
    }>
    recommendations: string[]
  }> {
    const securityEvents = await this.query({
      eventType: [
        'AUTH_LOGIN_FAILURE',
        'SECURITY_RATE_LIMIT_EXCEEDED',
        'SECURITY_INVALID_TOKEN',
        'SECURITY_UNAUTHORIZED_ACCESS',
        'SECURITY_SUSPICIOUS_ACTIVITY',
        'SECURITY_PRIVILEGE_ESCALATION',
      ],
      startDate,
      endDate,
    })

    // 분석 로직 (실제 구현에서는 더 상세한 분석)
    return {
      period: { start: startDate, end: endDate },
      summary: {
        totalSecurityEvents: securityEvents.total,
        criticalEvents: 0,
        failedLogins: 0,
        rateLimitExceeded: 0,
        unauthorizedAttempts: 0,
      },
      topOffenders: [],
      recommendations: [
        '정기적인 보안 감사를 수행하세요.',
        '비정상적인 로그인 패턴을 모니터링하세요.',
        '중요 데이터 접근에 대한 알림을 설정하세요.',
      ],
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateId(): string {
    return `aud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private sanitizeEntry(entry: AuditLogEntry): AuditLogEntry {
    const sanitized = { ...entry }

    // 민감 정보 필드 마스킹
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken']

    const maskObject = (obj: Record<string, unknown> | undefined): Record<string, unknown> | undefined => {
      if (!obj) return undefined

      const masked: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
          masked[key] = '[REDACTED]'
        } else if (typeof value === 'object' && value !== null) {
          masked[key] = maskObject(value as Record<string, unknown>)
        } else {
          masked[key] = value
        }
      }
      return masked
    }

    sanitized.details = maskObject(entry.details)
    sanitized.previousValue = maskObject(entry.previousValue)
    sanitized.newValue = maskObject(entry.newValue)

    return sanitized
  }

  private async saveEntry(entry: AuditLogEntry): Promise<void> {
    // 실제 구현에서는 DB에 저장
    // await prisma.auditLog.create({ data: entry })

    logger.info('Audit log', {
      audit: true,
      ...entry,
    })
  }

  private notifySecurityTeam(entry: AuditLogEntry): void {
    // 실제 구현에서는 알림 시스템 연동
    // - Slack 알림
    // - PagerDuty
    // - Email
    logger.error('SECURITY ALERT', {
      alert: true,
      eventType: entry.eventType,
      severity: entry.severity,
      action: entry.action,
      userId: entry.userId,
      ipAddress: entry.ipAddress,
    })
  }

  private getActionDescription(eventType: AuditEventType): string {
    const descriptions: Record<AuditEventType, string> = {
      AUTH_LOGIN_SUCCESS: '로그인 성공',
      AUTH_LOGIN_FAILURE: '로그인 실패',
      AUTH_LOGOUT: '로그아웃',
      AUTH_PASSWORD_CHANGE: '비밀번호 변경',
      AUTH_PASSWORD_RESET: '비밀번호 재설정',
      AUTH_MFA_ENABLED: 'MFA 활성화',
      AUTH_MFA_DISABLED: 'MFA 비활성화',
      AUTH_SESSION_EXPIRED: '세션 만료',
      USER_CREATED: '사용자 생성',
      USER_UPDATED: '사용자 정보 수정',
      USER_DELETED: '사용자 삭제',
      USER_ROLE_CHANGED: '사용자 권한 변경',
      USER_SUBSCRIPTION_CHANGED: '구독 변경',
      DATA_VIEWED: '데이터 조회',
      DATA_EXPORTED: '데이터 내보내기',
      DATA_CREATED: '데이터 생성',
      DATA_UPDATED: '데이터 수정',
      DATA_DELETED: '데이터 삭제',
      PET_CREATED: '반려동물 등록',
      PET_UPDATED: '반려동물 정보 수정',
      PET_DELETED: '반려동물 삭제',
      PET_HEALTH_LOG_CREATED: '건강 기록 추가',
      PET_HEALTH_ANALYZED: 'AI 건강 분석',
      SECURITY_RATE_LIMIT_EXCEEDED: '요청 제한 초과',
      SECURITY_INVALID_TOKEN: '유효하지 않은 토큰',
      SECURITY_UNAUTHORIZED_ACCESS: '권한 없는 접근 시도',
      SECURITY_SUSPICIOUS_ACTIVITY: '의심스러운 활동 감지',
      SECURITY_PRIVILEGE_ESCALATION: '권한 상승 시도',
      SYSTEM_ERROR: '시스템 오류',
      SYSTEM_MAINTENANCE: '시스템 유지보수',
      SYSTEM_CONFIG_CHANGED: '시스템 설정 변경',
      API_KEY_CREATED: 'API 키 생성',
      API_KEY_REVOKED: 'API 키 폐기',
      API_RATE_LIMITED: 'API 요청 제한',
    }

    return descriptions[eventType] || eventType
  }

  /**
   * 클린업 - 버퍼 플러시 및 타이머 중지
   */
  async cleanup(): Promise<void> {
    stopFlushTimer()
    await flushBuffer()
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const auditLogger = new AuditLogger({ useBuffer: true })

/**
 * 프로세스 종료 시 남은 버퍼 플러시
 */
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await auditLogger.cleanup()
  })
}
