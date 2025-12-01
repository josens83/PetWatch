/**
 * Code Quality Report Generator
 * 코드 품질 리포트 생성기
 *
 * @description
 * 이 모듈은 코드베이스의 품질 메트릭을 분석하고 리포트를 생성합니다.
 * 복잡도, 중복, 커버리지, 문서화 상태 등을 평가합니다.
 *
 * @module code-quality-report
 * @version 1.0.0
 */

import { verifyCodeSecurity, SecurityReport } from './security-verification'

// ============================================================================
// Types
// ============================================================================

/**
 * 품질 등급
 */
export type QualityGrade = 'A' | 'B' | 'C' | 'D' | 'F'

/**
 * 코드 복잡도 메트릭
 */
export interface ComplexityMetrics {
  /** 순환 복잡도 평균 */
  cyclomaticComplexity: number
  /** 인지 복잡도 평균 */
  cognitiveComplexity: number
  /** 평균 함수 길이 (줄) */
  averageFunctionLength: number
  /** 평균 파일 길이 (줄) */
  averageFileLength: number
  /** 최대 함수 길이 */
  maxFunctionLength: number
  /** 최대 중첩 깊이 */
  maxNestingDepth: number
  /** 복잡도 등급 */
  grade: QualityGrade
}

/**
 * 중복 코드 메트릭
 */
export interface DuplicationMetrics {
  /** 중복 비율 (%) */
  duplicationPercentage: number
  /** 중복 블록 수 */
  duplicateBlocks: number
  /** 중복 라인 수 */
  duplicateLines: number
  /** 중복 등급 */
  grade: QualityGrade
}

/**
 * 테스트 커버리지 메트릭
 */
export interface CoverageMetrics {
  /** 라인 커버리지 (%) */
  lineCoverage: number
  /** 분기 커버리지 (%) */
  branchCoverage: number
  /** 함수 커버리지 (%) */
  functionCoverage: number
  /** 구문 커버리지 (%) */
  statementCoverage: number
  /** 커버되지 않은 파일 수 */
  uncoveredFiles: number
  /** 커버리지 등급 */
  grade: QualityGrade
}

/**
 * 문서화 메트릭
 */
export interface DocumentationMetrics {
  /** 문서화된 함수 비율 (%) */
  documentedFunctions: number
  /** 문서화된 클래스 비율 (%) */
  documentedClasses: number
  /** 문서화된 모듈 비율 (%) */
  documentedModules: number
  /** JSDoc 완성도 (%) */
  jsdocCompleteness: number
  /** 문서화 등급 */
  grade: QualityGrade
}

/**
 * 유지보수성 메트릭
 */
export interface MaintainabilityMetrics {
  /** 유지보수성 지수 (0-100) */
  maintainabilityIndex: number
  /** 기술 부채 (시간) */
  technicalDebt: number
  /** 코드 스멜 수 */
  codeSmells: number
  /** 유지보수성 등급 */
  grade: QualityGrade
}

/**
 * 전체 코드 품질 리포트
 */
export interface CodeQualityReport {
  /** 생성 시간 */
  timestamp: Date
  /** 프로젝트명 */
  projectName: string
  /** 분석 대상 파일 수 */
  analyzedFiles: number
  /** 총 코드 라인 수 */
  totalLines: number
  /** 전체 품질 점수 (0-100) */
  overallScore: number
  /** 전체 등급 */
  overallGrade: QualityGrade
  /** 복잡도 메트릭 */
  complexity: ComplexityMetrics
  /** 중복 메트릭 */
  duplication: DuplicationMetrics
  /** 커버리지 메트릭 */
  coverage: CoverageMetrics
  /** 문서화 메트릭 */
  documentation: DocumentationMetrics
  /** 유지보수성 메트릭 */
  maintainability: MaintainabilityMetrics
  /** 보안 리포트 */
  security: SecurityReport
  /** 개선 권장사항 */
  recommendations: QualityRecommendation[]
}

/**
 * 품질 개선 권장사항
 */
export interface QualityRecommendation {
  /** 카테고리 */
  category: 'complexity' | 'duplication' | 'coverage' | 'documentation' | 'maintainability' | 'security'
  /** 우선순위 */
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  /** 제목 */
  title: string
  /** 설명 */
  description: string
  /** 예상 개선 시간 */
  estimatedEffort?: string
  /** 관련 파일 */
  affectedFiles?: string[]
}

// ============================================================================
// Grade Calculation
// ============================================================================

/**
 * 점수를 등급으로 변환
 *
 * @param score - 점수 (0-100)
 * @returns 품질 등급
 */
export function scoreToGrade(score: number): QualityGrade {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

/**
 * 등급을 점수로 변환
 *
 * @param grade - 품질 등급
 * @returns 대표 점수
 */
export function gradeToScore(grade: QualityGrade): number {
  const scores: Record<QualityGrade, number> = {
    A: 95,
    B: 85,
    C: 75,
    D: 65,
    F: 50,
  }
  return scores[grade]
}

// ============================================================================
// Complexity Analysis
// ============================================================================

/**
 * 코드 복잡도 분석
 *
 * @param code - 분석할 코드
 * @returns 복잡도 메트릭
 */
export function analyzeComplexity(code: string): ComplexityMetrics {
  const lines = code.split('\n')

  // 간단한 복잡도 휴리스틱
  const conditionals = (code.match(/\b(if|else|switch|case|for|while|do|try|catch)\b/g) || []).length
  const logicalOperators = (code.match(/(\&\&|\|\|)/g) || []).length
  const ternaryOperators = (code.match(/\?[^:]*:/g) || []).length

  const cyclomaticComplexity = 1 + conditionals + logicalOperators + ternaryOperators

  // 함수 추출
  const functionMatches = code.match(/(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|\w+\s*\([^)]*\)\s*\{)/g) || []
  const functionCount = Math.max(1, functionMatches.length)

  // 중첩 깊이 분석
  let maxNestingDepth = 0
  let currentDepth = 0
  for (const char of code) {
    if (char === '{') {
      currentDepth++
      maxNestingDepth = Math.max(maxNestingDepth, currentDepth)
    } else if (char === '}') {
      currentDepth = Math.max(0, currentDepth - 1)
    }
  }

  const averageFunctionLength = Math.round(lines.length / functionCount)

  // 복잡도 점수 계산
  let score = 100

  // 순환 복잡도 페널티
  if (cyclomaticComplexity > 30) score -= 40
  else if (cyclomaticComplexity > 20) score -= 25
  else if (cyclomaticComplexity > 10) score -= 10

  // 중첩 깊이 페널티
  if (maxNestingDepth > 6) score -= 20
  else if (maxNestingDepth > 4) score -= 10

  // 함수 길이 페널티
  if (averageFunctionLength > 50) score -= 20
  else if (averageFunctionLength > 30) score -= 10

  return {
    cyclomaticComplexity,
    cognitiveComplexity: Math.round(cyclomaticComplexity * 1.2),
    averageFunctionLength,
    averageFileLength: lines.length,
    maxFunctionLength: averageFunctionLength * 2, // Estimation
    maxNestingDepth,
    grade: scoreToGrade(score),
  }
}

// ============================================================================
// Duplication Analysis
// ============================================================================

/**
 * 코드 중복 분석
 *
 * @param code - 분석할 코드
 * @returns 중복 메트릭
 */
export function analyzeDuplication(code: string): DuplicationMetrics {
  const lines = code.split('\n').filter((l) => l.trim().length > 0)
  const lineHashes = new Map<string, number>()

  // 라인별 해시 계산 및 중복 카운트
  let duplicateLines = 0
  for (const line of lines) {
    const normalized = line.trim().replace(/\s+/g, ' ')
    if (normalized.length < 10) continue // 짧은 라인 무시

    const count = lineHashes.get(normalized) || 0
    lineHashes.set(normalized, count + 1)
    if (count > 0) duplicateLines++
  }

  // 중복 블록 추정 (연속 중복 라인 그룹)
  const duplicateBlocks = Math.ceil(duplicateLines / 5)

  const duplicationPercentage = lines.length > 0
    ? Math.round((duplicateLines / lines.length) * 100)
    : 0

  // 점수 계산
  let score = 100
  if (duplicationPercentage > 20) score -= 40
  else if (duplicationPercentage > 10) score -= 25
  else if (duplicationPercentage > 5) score -= 10

  return {
    duplicationPercentage,
    duplicateBlocks,
    duplicateLines,
    grade: scoreToGrade(score),
  }
}

// ============================================================================
// Documentation Analysis
// ============================================================================

/**
 * 문서화 상태 분석
 *
 * @param code - 분석할 코드
 * @returns 문서화 메트릭
 */
export function analyzeDocumentation(code: string): DocumentationMetrics {
  // JSDoc 주석 카운트
  const jsdocBlocks = (code.match(/\/\*\*[\s\S]*?\*\//g) || []).length

  // 함수/클래스 카운트
  const functions = (code.match(/(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:async\s+)?(?:\w+\s*)?\([^)]*\)\s*\{)/g) || []).length
  const classes = (code.match(/class\s+\w+/g) || []).length
  const exports = (code.match(/export\s+(?:default\s+)?(?:function|class|const|let|var)/g) || []).length

  // 문서화 비율 계산
  const totalItems = Math.max(1, functions + classes)
  const documentedItems = Math.min(jsdocBlocks, totalItems)

  const documentedFunctions = functions > 0 ? Math.round((documentedItems / functions) * 100) : 100
  const documentedClasses = classes > 0 ? Math.round((Math.min(jsdocBlocks, classes) / classes) * 100) : 100

  // JSDoc 완성도 분석
  let jsdocCompleteness = 0
  if (jsdocBlocks > 0) {
    const jsdocs = code.match(/\/\*\*[\s\S]*?\*\//g) || []
    let totalScore = 0

    for (const jsdoc of jsdocs) {
      let blockScore = 50 // 기본 점수

      if (/@param/.test(jsdoc)) blockScore += 15
      if (/@returns?/.test(jsdoc)) blockScore += 15
      if (/@example/.test(jsdoc)) blockScore += 10
      if (/@description/.test(jsdoc)) blockScore += 5
      if (/@throws/.test(jsdoc)) blockScore += 5

      totalScore += Math.min(100, blockScore)
    }

    jsdocCompleteness = Math.round(totalScore / jsdocs.length)
  }

  // 전체 점수
  const score = Math.round(
    (documentedFunctions * 0.4) +
    (documentedClasses * 0.2) +
    (jsdocCompleteness * 0.4)
  )

  return {
    documentedFunctions,
    documentedClasses,
    documentedModules: exports > 0 ? Math.round((jsdocBlocks / exports) * 100) : 0,
    jsdocCompleteness,
    grade: scoreToGrade(score),
  }
}

// ============================================================================
// Maintainability Analysis
// ============================================================================

/**
 * 유지보수성 분석
 *
 * @param code - 분석할 코드
 * @param complexity - 복잡도 메트릭
 * @param duplication - 중복 메트릭
 * @returns 유지보수성 메트릭
 */
export function analyzeMaintainability(
  code: string,
  complexity: ComplexityMetrics,
  duplication: DuplicationMetrics
): MaintainabilityMetrics {
  const lines = code.split('\n').length

  // 유지보수성 지수 계산 (Microsoft Visual Studio 공식 참고)
  // MI = 171 - 5.2 * ln(aveV) - 0.23 * aveG - 16.2 * ln(aveLOC)
  // 단순화된 버전 사용

  const complexityFactor = Math.min(complexity.cyclomaticComplexity, 50)
  const duplicationFactor = duplication.duplicationPercentage
  const lengthFactor = Math.min(lines, 1000)

  const maintainabilityIndex = Math.max(0, Math.min(100,
    171 - (complexityFactor * 0.5) - (duplicationFactor * 0.3) - (lengthFactor * 0.02)
  ))

  // 기술 부채 추정 (시간)
  const technicalDebt = Math.round(
    (100 - maintainabilityIndex) * 0.5 + // 유지보수성 관련
    complexity.cyclomaticComplexity * 0.1 + // 복잡도 관련
    duplication.duplicateBlocks * 0.5 // 중복 관련
  )

  // 코드 스멜 카운트
  let codeSmells = 0

  // 긴 함수
  if (complexity.maxFunctionLength > 50) codeSmells++

  // 깊은 중첩
  if (complexity.maxNestingDepth > 4) codeSmells++

  // 높은 복잡도
  if (complexity.cyclomaticComplexity > 15) codeSmells++

  // 높은 중복
  if (duplication.duplicationPercentage > 10) codeSmells++

  // TODO 주석
  const todos = (code.match(/\/\/\s*TODO|\/\*\s*TODO/gi) || []).length
  codeSmells += Math.min(todos, 5)

  // 하드코딩된 값
  const hardcoded = (code.match(/["']\d{3,}["']|["'][a-zA-Z0-9]{32,}["']/g) || []).length
  codeSmells += Math.min(hardcoded, 3)

  return {
    maintainabilityIndex: Math.round(maintainabilityIndex),
    technicalDebt,
    codeSmells,
    grade: scoreToGrade(maintainabilityIndex),
  }
}

// ============================================================================
// Recommendations Generation
// ============================================================================

/**
 * 품질 개선 권장사항 생성
 *
 * @param metrics - 분석된 메트릭
 * @returns 권장사항 목록
 */
export function generateRecommendations(
  complexity: ComplexityMetrics,
  duplication: DuplicationMetrics,
  documentation: DocumentationMetrics,
  maintainability: MaintainabilityMetrics,
  security: SecurityReport
): QualityRecommendation[] {
  const recommendations: QualityRecommendation[] = []

  // 복잡도 관련
  if (complexity.cyclomaticComplexity > 15) {
    recommendations.push({
      category: 'complexity',
      priority: 'HIGH',
      title: '높은 순환 복잡도 개선',
      description: `순환 복잡도가 ${complexity.cyclomaticComplexity}입니다. 10 이하로 낮추는 것이 좋습니다. 함수를 더 작은 단위로 분리하세요.`,
      estimatedEffort: '2-4 시간',
    })
  }

  if (complexity.maxNestingDepth > 4) {
    recommendations.push({
      category: 'complexity',
      priority: 'MEDIUM',
      title: '깊은 중첩 구조 개선',
      description: `최대 중첩 깊이가 ${complexity.maxNestingDepth}단계입니다. Early return 패턴이나 함수 추출을 통해 3단계 이하로 줄이세요.`,
      estimatedEffort: '1-2 시간',
    })
  }

  if (complexity.averageFunctionLength > 30) {
    recommendations.push({
      category: 'complexity',
      priority: 'MEDIUM',
      title: '긴 함수 분리',
      description: `평균 함수 길이가 ${complexity.averageFunctionLength}줄입니다. 20줄 이하의 작은 함수로 분리하세요.`,
      estimatedEffort: '2-3 시간',
    })
  }

  // 중복 관련
  if (duplication.duplicationPercentage > 10) {
    recommendations.push({
      category: 'duplication',
      priority: 'HIGH',
      title: '코드 중복 제거',
      description: `코드 중복률이 ${duplication.duplicationPercentage}%입니다. 공통 함수나 유틸리티로 추출하여 5% 이하로 줄이세요.`,
      estimatedEffort: '3-5 시간',
    })
  }

  // 문서화 관련
  if (documentation.documentedFunctions < 50) {
    recommendations.push({
      category: 'documentation',
      priority: 'MEDIUM',
      title: 'JSDoc 문서화 추가',
      description: `함수 문서화율이 ${documentation.documentedFunctions}%입니다. 공개 API에 JSDoc을 추가하세요.`,
      estimatedEffort: '2-4 시간',
    })
  }

  if (documentation.jsdocCompleteness < 70) {
    recommendations.push({
      category: 'documentation',
      priority: 'LOW',
      title: 'JSDoc 완성도 개선',
      description: `JSDoc 완성도가 ${documentation.jsdocCompleteness}%입니다. @param, @returns, @example 태그를 추가하세요.`,
      estimatedEffort: '1-2 시간',
    })
  }

  // 유지보수성 관련
  if (maintainability.technicalDebt > 10) {
    recommendations.push({
      category: 'maintainability',
      priority: 'MEDIUM',
      title: '기술 부채 해소',
      description: `추정 기술 부채가 ${maintainability.technicalDebt}시간입니다. TODO 주석 처리, 코드 정리를 진행하세요.`,
      estimatedEffort: `${maintainability.technicalDebt}시간`,
    })
  }

  if (maintainability.codeSmells > 3) {
    recommendations.push({
      category: 'maintainability',
      priority: 'LOW',
      title: '코드 스멜 제거',
      description: `${maintainability.codeSmells}개의 코드 스멜이 감지되었습니다. 리팩토링을 통해 제거하세요.`,
      estimatedEffort: '2-3 시간',
    })
  }

  // 보안 관련
  if (!security.overallPassed) {
    recommendations.push({
      category: 'security',
      priority: 'HIGH',
      title: '보안 취약점 수정',
      description: `${security.criticalIssues}개의 Critical, ${security.highIssues}개의 High 보안 이슈가 있습니다. 즉시 수정이 필요합니다.`,
      estimatedEffort: '1-4 시간',
    })
  }

  // 우선순위순 정렬
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

// ============================================================================
// Main Report Generation
// ============================================================================

/**
 * 코드 품질 리포트 생성
 *
 * @param code - 분석할 코드
 * @param projectName - 프로젝트명
 * @param coverage - 커버리지 메트릭 (선택)
 * @returns 코드 품질 리포트
 *
 * @example
 * ```typescript
 * const code = fs.readFileSync('src/lib/utils.ts', 'utf-8')
 * const report = generateCodeQualityReport(code, 'PetWatch')
 * console.log(`Overall Grade: ${report.overallGrade}`)
 * ```
 */
export function generateCodeQualityReport(
  code: string,
  projectName: string,
  coverage?: Partial<CoverageMetrics>
): CodeQualityReport {
  const lines = code.split('\n').filter((l) => l.trim().length > 0)

  // 각 메트릭 분석
  const complexity = analyzeComplexity(code)
  const duplication = analyzeDuplication(code)
  const documentation = analyzeDocumentation(code)
  const maintainability = analyzeMaintainability(code, complexity, duplication)
  const security = verifyCodeSecurity(code, { logResults: false })

  // 커버리지 메트릭 (기본값 또는 제공된 값)
  const coverageMetrics: CoverageMetrics = {
    lineCoverage: coverage?.lineCoverage ?? 0,
    branchCoverage: coverage?.branchCoverage ?? 0,
    functionCoverage: coverage?.functionCoverage ?? 0,
    statementCoverage: coverage?.statementCoverage ?? 0,
    uncoveredFiles: coverage?.uncoveredFiles ?? 0,
    grade: scoreToGrade(coverage?.lineCoverage ?? 0),
  }

  // 권장사항 생성
  const recommendations = generateRecommendations(
    complexity,
    duplication,
    documentation,
    maintainability,
    security
  )

  // 전체 점수 계산
  const weights = {
    complexity: 0.25,
    duplication: 0.15,
    coverage: 0.25,
    documentation: 0.15,
    maintainability: 0.20,
  }

  const overallScore = Math.round(
    gradeToScore(complexity.grade) * weights.complexity +
    gradeToScore(duplication.grade) * weights.duplication +
    coverageMetrics.lineCoverage * weights.coverage +
    gradeToScore(documentation.grade) * weights.documentation +
    gradeToScore(maintainability.grade) * weights.maintainability
  )

  return {
    timestamp: new Date(),
    projectName,
    analyzedFiles: 1,
    totalLines: lines.length,
    overallScore,
    overallGrade: scoreToGrade(overallScore),
    complexity,
    duplication,
    coverage: coverageMetrics,
    documentation,
    maintainability,
    security,
    recommendations,
  }
}

// ============================================================================
// Report Formatting
// ============================================================================

/**
 * 리포트를 마크다운으로 변환
 *
 * @param report - 코드 품질 리포트
 * @returns 마크다운 문자열
 */
export function formatReportAsMarkdown(report: CodeQualityReport): string {
  const gradeEmoji: Record<QualityGrade, string> = {
    A: '🏆',
    B: '👍',
    C: '📊',
    D: '⚠️',
    F: '❌',
  }

  let md = `# 코드 품질 리포트 ${gradeEmoji[report.overallGrade]}

**프로젝트**: ${report.projectName}
**분석 시간**: ${report.timestamp.toISOString()}
**분석 파일 수**: ${report.analyzedFiles}
**총 코드 라인**: ${report.totalLines}

## 전체 요약

| 항목 | 점수 | 등급 |
|------|------|------|
| **전체** | ${report.overallScore}/100 | ${report.overallGrade} |
| 복잡도 | - | ${report.complexity.grade} |
| 중복 | ${100 - report.duplication.duplicationPercentage}% | ${report.duplication.grade} |
| 커버리지 | ${report.coverage.lineCoverage}% | ${report.coverage.grade} |
| 문서화 | ${report.documentation.documentedFunctions}% | ${report.documentation.grade} |
| 유지보수성 | ${report.maintainability.maintainabilityIndex}/100 | ${report.maintainability.grade} |

## 상세 메트릭

### 복잡도

| 메트릭 | 값 |
|--------|-----|
| 순환 복잡도 | ${report.complexity.cyclomaticComplexity} |
| 인지 복잡도 | ${report.complexity.cognitiveComplexity} |
| 평균 함수 길이 | ${report.complexity.averageFunctionLength}줄 |
| 최대 중첩 깊이 | ${report.complexity.maxNestingDepth}단계 |

### 중복

| 메트릭 | 값 |
|--------|-----|
| 중복 비율 | ${report.duplication.duplicationPercentage}% |
| 중복 블록 | ${report.duplication.duplicateBlocks}개 |
| 중복 라인 | ${report.duplication.duplicateLines}줄 |

### 문서화

| 메트릭 | 값 |
|--------|-----|
| 함수 문서화율 | ${report.documentation.documentedFunctions}% |
| 클래스 문서화율 | ${report.documentation.documentedClasses}% |
| JSDoc 완성도 | ${report.documentation.jsdocCompleteness}% |

### 유지보수성

| 메트릭 | 값 |
|--------|-----|
| 유지보수성 지수 | ${report.maintainability.maintainabilityIndex}/100 |
| 기술 부채 | ${report.maintainability.technicalDebt}시간 |
| 코드 스멜 | ${report.maintainability.codeSmells}개 |

### 보안

| 메트릭 | 값 |
|--------|-----|
| 전체 통과 | ${report.security.overallPassed ? '예' : '아니오'} |
| Critical 이슈 | ${report.security.criticalIssues}개 |
| High 이슈 | ${report.security.highIssues}개 |

`

  if (report.recommendations.length > 0) {
    md += `## 개선 권장사항

`
    for (const rec of report.recommendations) {
      const priorityBadge = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢'
      md += `### ${priorityBadge} ${rec.title}

- **카테고리**: ${rec.category}
- **우선순위**: ${rec.priority}
- **설명**: ${rec.description}
${rec.estimatedEffort ? `- **예상 작업 시간**: ${rec.estimatedEffort}` : ''}

`
    }
  }

  md += `---
*이 리포트는 자동 생성되었습니다.*
`

  return md
}

/**
 * 리포트를 JSON으로 변환
 *
 * @param report - 코드 품질 리포트
 * @returns JSON 문자열
 */
export function formatReportAsJson(report: CodeQualityReport): string {
  return JSON.stringify(report, null, 2)
}
