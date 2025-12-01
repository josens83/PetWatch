/**
 * Security Verification System
 * 보안 자가 검증 시스템 - 모든 코드에 대해 보안 체크리스트를 수행
 *
 * @description
 * 이 모듈은 코드 생성/수정 시 보안 취약점을 자동으로 검증합니다.
 * OWASP Top 10을 기반으로 주요 보안 위협을 검사합니다.
 *
 * @module security-verification
 * @version 1.0.0
 */

import { logger } from './logger'
import { prisma } from './db'

// ============================================================================
// Types
// ============================================================================

/**
 * 보안 검증 결과
 */
export interface SecurityCheckResult {
  passed: boolean
  category: SecurityCategory
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  recommendation?: string
  codeLocation?: string
}

/**
 * 보안 검사 카테고리 (OWASP Top 10 기반)
 */
export type SecurityCategory =
  | 'SQL_INJECTION'
  | 'XSS'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'SENSITIVE_DATA'
  | 'SECURITY_MISCONFIGURATION'
  | 'CSRF'
  | 'INPUT_VALIDATION'
  | 'LOGGING'
  | 'RATE_LIMITING'

/**
 * 전체 보안 리포트
 */
export interface SecurityReport {
  timestamp: Date
  overallPassed: boolean
  totalChecks: number
  passedChecks: number
  failedChecks: number
  criticalIssues: number
  highIssues: number
  mediumIssues: number
  lowIssues: number
  results: SecurityCheckResult[]
  recommendations: string[]
}

// ============================================================================
// Security Checkers
// ============================================================================

/**
 * SQL Injection 검사
 *
 * @description
 * 파라미터화된 쿼리 사용 여부를 검증합니다.
 * Prisma ORM 사용 시 기본적으로 안전하지만, raw query 사용 시 검증이 필요합니다.
 *
 * @param code - 검사할 코드 문자열
 * @returns 검사 결과
 *
 * @example
 * // 안전한 코드
 * const safe = "prisma.user.findMany({ where: { id } })"
 *
 * // 위험한 코드
 * const unsafe = `prisma.$queryRaw\`SELECT * FROM users WHERE id = ${userId}\``
 */
export function checkSqlInjection(code: string): SecurityCheckResult {
  const unsafePatterns = [
    /\$queryRaw\s*`[^`]*\$\{/,  // Template literal in raw query
    /\$executeRaw\s*`[^`]*\$\{/,
    /query\s*\([^)]*\+/,        // String concatenation in query
    /SELECT.*FROM.*WHERE.*\+/i,
    /INSERT.*INTO.*VALUES.*\+/i,
    /UPDATE.*SET.*WHERE.*\+/i,
    /DELETE.*FROM.*WHERE.*\+/i,
  ]

  for (const pattern of unsafePatterns) {
    if (pattern.test(code)) {
      return {
        passed: false,
        category: 'SQL_INJECTION',
        severity: 'CRITICAL',
        message: 'SQL Injection 취약점이 감지되었습니다.',
        recommendation: '파라미터화된 쿼리 또는 Prisma ORM의 안전한 메서드를 사용하세요.',
      }
    }
  }

  return {
    passed: true,
    category: 'SQL_INJECTION',
    severity: 'LOW',
    message: 'SQL Injection 취약점이 감지되지 않았습니다.',
  }
}

/**
 * XSS (Cross-Site Scripting) 검사
 *
 * @description
 * 사용자 입력이 적절히 이스케이프되는지 검증합니다.
 * React의 경우 기본적으로 JSX에서 이스케이프되지만,
 * dangerouslySetInnerHTML 사용 시 위험합니다.
 *
 * @param code - 검사할 코드 문자열
 * @returns 검사 결과
 */
export function checkXss(code: string): SecurityCheckResult {
  const unsafePatterns = [
    /dangerouslySetInnerHTML/,
    /innerHTML\s*=/,
    /document\.write\s*\(/,
    /\.html\s*\([^)]*\$\{/,
    /eval\s*\(/,
    /new\s+Function\s*\(/,
  ]

  for (const pattern of unsafePatterns) {
    if (pattern.test(code)) {
      return {
        passed: false,
        category: 'XSS',
        severity: 'HIGH',
        message: 'XSS 취약점이 감지되었습니다.',
        recommendation: 'DOMPurify를 사용하여 HTML을 정제하거나, React의 기본 이스케이프를 활용하세요.',
      }
    }
  }

  return {
    passed: true,
    category: 'XSS',
    severity: 'LOW',
    message: 'XSS 취약점이 감지되지 않았습니다.',
  }
}

/**
 * 민감 정보 노출 검사
 *
 * @description
 * 하드코딩된 비밀번호, API 키, 토큰 등을 검사합니다.
 *
 * @param code - 검사할 코드 문자열
 * @returns 검사 결과
 */
export function checkSensitiveData(code: string): SecurityCheckResult {
  const sensitivePatterns = [
    /password\s*[:=]\s*["'][^"']+["']/i,
    /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
    /secret\s*[:=]\s*["'][^"']+["']/i,
    /token\s*[:=]\s*["'][A-Za-z0-9_-]{20,}["']/i,
    /private[_-]?key\s*[:=]\s*["'][^"']+["']/i,
    /Bearer\s+[A-Za-z0-9_-]{20,}/,
  ]

  // 환경 변수 참조는 허용
  const envPattern = /process\.env\./

  for (const pattern of sensitivePatterns) {
    const match = code.match(pattern)
    if (match && !envPattern.test(match[0])) {
      return {
        passed: false,
        category: 'SENSITIVE_DATA',
        severity: 'CRITICAL',
        message: '민감한 정보가 하드코딩되어 있습니다.',
        recommendation: '환경 변수를 사용하여 민감 정보를 관리하세요. (process.env.XXX)',
      }
    }
  }

  return {
    passed: true,
    category: 'SENSITIVE_DATA',
    severity: 'LOW',
    message: '하드코딩된 민감 정보가 감지되지 않았습니다.',
  }
}

/**
 * 입력 검증 검사
 *
 * @description
 * 외부 입력에 대한 검증 로직 존재 여부를 확인합니다.
 *
 * @param code - 검사할 코드 문자열
 * @returns 검사 결과
 */
export function checkInputValidation(code: string): SecurityCheckResult {
  // API 라우트에서 body 사용 시 검증 여부 확인
  const bodyUsage = /request\.json\(\)|req\.body/
  const validationPattern = /schema\.parse|schema\.safeParse|validate\(|zod|yup|joi/i

  if (bodyUsage.test(code) && !validationPattern.test(code)) {
    return {
      passed: false,
      category: 'INPUT_VALIDATION',
      severity: 'HIGH',
      message: '입력 검증이 누락되었습니다.',
      recommendation: 'Zod 스키마를 사용하여 모든 입력을 검증하세요.',
    }
  }

  return {
    passed: true,
    category: 'INPUT_VALIDATION',
    severity: 'LOW',
    message: '입력 검증이 적절히 구현되어 있습니다.',
  }
}

/**
 * 인증/인가 검사
 *
 * @description
 * API 라우트에서 적절한 인증 검사가 수행되는지 확인합니다.
 *
 * @param code - 검사할 코드 문자열
 * @returns 검사 결과
 */
export function checkAuthentication(code: string): SecurityCheckResult {
  // API 라우트 패턴 감지
  const apiRoutePattern = /export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)/

  if (apiRoutePattern.test(code)) {
    const authPattern = /getServerSession|requireAuth|session\?\.user|token/

    if (!authPattern.test(code)) {
      return {
        passed: false,
        category: 'AUTHENTICATION',
        severity: 'HIGH',
        message: 'API 라우트에 인증 검사가 누락되었습니다.',
        recommendation: 'getServerSession 또는 requireAuth를 사용하여 인증을 검증하세요.',
      }
    }
  }

  return {
    passed: true,
    category: 'AUTHENTICATION',
    severity: 'LOW',
    message: '인증 검사가 적절히 구현되어 있습니다.',
  }
}

// ============================================================================
// Main Security Verification Function
// ============================================================================

/**
 * 코드에 대한 전체 보안 검증 수행
 *
 * @description
 * 모든 보안 체커를 실행하고 종합 리포트를 생성합니다.
 *
 * @param code - 검사할 코드 문자열
 * @param options - 검증 옵션
 * @returns 보안 리포트
 *
 * @example
 * ```typescript
 * const code = fs.readFileSync('src/app/api/pets/route.ts', 'utf-8')
 * const report = verifyCodeSecurity(code)
 *
 * if (!report.overallPassed) {
 *   console.error('보안 검증 실패:', report.recommendations)
 * }
 * ```
 *
 * @performance O(n) - 코드 길이에 비례
 * @sideEffects 로깅 시스템에 결과 기록
 */
export function verifyCodeSecurity(
  code: string,
  options: {
    logResults?: boolean
    throwOnCritical?: boolean
  } = {}
): SecurityReport {
  const { logResults = true, throwOnCritical = false } = options

  const checkers = [
    checkSqlInjection,
    checkXss,
    checkSensitiveData,
    checkInputValidation,
    checkAuthentication,
  ]

  const results: SecurityCheckResult[] = checkers.map((checker) => checker(code))

  const criticalIssues = results.filter((r) => !r.passed && r.severity === 'CRITICAL').length
  const highIssues = results.filter((r) => !r.passed && r.severity === 'HIGH').length
  const mediumIssues = results.filter((r) => !r.passed && r.severity === 'MEDIUM').length
  const lowIssues = results.filter((r) => !r.passed && r.severity === 'LOW').length

  const report: SecurityReport = {
    timestamp: new Date(),
    overallPassed: criticalIssues === 0 && highIssues === 0,
    totalChecks: results.length,
    passedChecks: results.filter((r) => r.passed).length,
    failedChecks: results.filter((r) => !r.passed).length,
    criticalIssues,
    highIssues,
    mediumIssues,
    lowIssues,
    results,
    recommendations: results
      .filter((r) => !r.passed && r.recommendation)
      .map((r) => `[${r.severity}] ${r.category}: ${r.recommendation}`),
  }

  if (logResults) {
    if (report.overallPassed) {
      logger.info('Security verification passed', {
        passedChecks: report.passedChecks,
        totalChecks: report.totalChecks,
      })
    } else {
      logger.warn('Security verification failed', {
        criticalIssues,
        highIssues,
        recommendations: report.recommendations,
      })
    }
  }

  if (throwOnCritical && criticalIssues > 0) {
    throw new Error(
      `Critical security issues detected: ${results
        .filter((r) => r.severity === 'CRITICAL')
        .map((r) => r.message)
        .join(', ')}`
    )
  }

  return report
}

// ============================================================================
// Security Report Generation
// ============================================================================

/**
 * 보안 검증 리포트를 마크다운 형식으로 생성
 *
 * @param report - 보안 리포트
 * @returns 마크다운 형식의 리포트
 */
export function generateSecurityReportMarkdown(report: SecurityReport): string {
  const statusEmoji = report.overallPassed ? '✅' : '❌'

  let markdown = `# 보안 자가 검증 결과 ${statusEmoji}

**검증 시간**: ${report.timestamp.toISOString()}

## 요약

| 항목 | 수치 |
|------|------|
| 전체 통과 | ${report.overallPassed ? '예' : '아니오'} |
| 총 검사 수 | ${report.totalChecks} |
| 통과 | ${report.passedChecks} |
| 실패 | ${report.failedChecks} |
| Critical 이슈 | ${report.criticalIssues} |
| High 이슈 | ${report.highIssues} |
| Medium 이슈 | ${report.mediumIssues} |
| Low 이슈 | ${report.lowIssues} |

## 상세 결과

`

  for (const result of report.results) {
    const icon = result.passed ? '✅' : '❌'
    markdown += `### ${icon} ${result.category}

- **상태**: ${result.passed ? '통과' : '실패'}
- **심각도**: ${result.severity}
- **메시지**: ${result.message}
${result.recommendation ? `- **권장사항**: ${result.recommendation}` : ''}

`
  }

  if (report.recommendations.length > 0) {
    markdown += `## 권장 조치사항

${report.recommendations.map((r) => `- ${r}`).join('\n')}
`
  }

  return markdown
}

// ============================================================================
// Runtime Security Monitoring
// ============================================================================

/**
 * 런타임 보안 이벤트 모니터링
 *
 * @description
 * 의심스러운 활동을 실시간으로 감지하고 기록합니다.
 */
export const securityMonitor = {
  /**
   * 로그인 실패 추적
   */
  async trackLoginFailure(
    email: string,
    ip: string,
    userAgent: string
  ): Promise<void> {
    logger.warn('Login failure', { email, ip, userAgent })

    // 연속 실패 횟수 확인 (Redis 또는 DB에서)
    // 임계값 초과 시 알림
  },

  /**
   * 비정상적인 API 사용 패턴 감지
   */
  async trackAnomalousActivity(
    userId: string,
    action: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    logger.warn('Anomalous activity detected', { userId, action, metadata })
  },

  /**
   * 권한 상승 시도 감지
   */
  async trackPrivilegeEscalation(
    userId: string,
    attemptedAction: string,
    resourceId: string
  ): Promise<void> {
    logger.error('Privilege escalation attempt', {
      userId,
      attemptedAction,
      resourceId,
    })
  },
}
