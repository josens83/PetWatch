/**
 * Security Verification System Tests
 * 보안 자가 검증 시스템 테스트
 */

import {
  checkSqlInjection,
  checkXss,
  checkSensitiveData,
  checkInputValidation,
  checkAuthentication,
  verifyCodeSecurity,
  generateSecurityReportMarkdown,
} from '@/lib/security-verification'

describe('Security Verification System', () => {
  // ============================================================================
  // SQL Injection Tests
  // ============================================================================
  describe('checkSqlInjection', () => {
    describe('Happy Path - Safe Code', () => {
      it('should pass for Prisma ORM standard queries', () => {
        const code = `
          const users = await prisma.user.findMany({
            where: { id: userId },
            include: { pets: true }
          })
        `
        const result = checkSqlInjection(code)
        expect(result.passed).toBe(true)
        expect(result.category).toBe('SQL_INJECTION')
        expect(result.severity).toBe('LOW')
      })

      it('should pass for parameterized Prisma queries', () => {
        const code = `
          const pet = await prisma.pet.findFirst({
            where: {
              AND: [
                { ownerId: session.user.id },
                { name: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }
          })
        `
        const result = checkSqlInjection(code)
        expect(result.passed).toBe(true)
      })

      it('should pass for safe $queryRaw with Prisma.sql', () => {
        const code = `
          const result = await prisma.$queryRaw(
            Prisma.sql\`SELECT * FROM users WHERE id = \${userId}\`
          )
        `
        // This is actually safe because Prisma.sql handles escaping
        const result = checkSqlInjection(code)
        expect(result.passed).toBe(true)
      })
    })

    describe('Edge Cases - Unsafe Code', () => {
      it('should fail for template literal injection in $queryRaw', () => {
        const code = `
          const result = await prisma.$queryRaw\`SELECT * FROM users WHERE id = \${userId}\`
        `
        const result = checkSqlInjection(code)
        expect(result.passed).toBe(false)
        expect(result.severity).toBe('CRITICAL')
      })

      it('should fail for string concatenation in SQL', () => {
        const code = `
          const query = "SELECT * FROM users WHERE name = '" + userName + "'"
        `
        const result = checkSqlInjection(code)
        expect(result.passed).toBe(false)
      })

      it('should fail for $executeRaw with template literal', () => {
        const code = `
          await prisma.$executeRaw\`UPDATE users SET name = \${name} WHERE id = \${id}\`
        `
        const result = checkSqlInjection(code)
        expect(result.passed).toBe(false)
      })

      it('should fail for INSERT with string concatenation', () => {
        const code = `
          const sql = "INSERT INTO logs VALUES ('" + logMessage + "')"
        `
        const result = checkSqlInjection(code)
        expect(result.passed).toBe(false)
      })

      it('should fail for DELETE with string concatenation', () => {
        const code = `
          const deleteQuery = "DELETE FROM users WHERE id = " + userId
        `
        const result = checkSqlInjection(code)
        expect(result.passed).toBe(false)
      })
    })

    describe('Error Cases', () => {
      it('should handle empty code', () => {
        const result = checkSqlInjection('')
        expect(result.passed).toBe(true)
      })

      it('should handle code with only comments', () => {
        const code = `
          // This is a comment
          /* Multi-line
             comment */
        `
        const result = checkSqlInjection(code)
        expect(result.passed).toBe(true)
      })
    })
  })

  // ============================================================================
  // XSS Tests
  // ============================================================================
  describe('checkXss', () => {
    describe('Happy Path - Safe Code', () => {
      it('should pass for React JSX with proper escaping', () => {
        const code = `
          return (
            <div>
              <h1>{user.name}</h1>
              <p>{sanitizedContent}</p>
            </div>
          )
        `
        const result = checkXss(code)
        expect(result.passed).toBe(true)
      })

      it('should pass for DOMPurify sanitized content', () => {
        const code = `
          import DOMPurify from 'dompurify'
          const clean = DOMPurify.sanitize(dirty)
          element.innerHTML = clean
        `
        // Note: Our check still flags innerHTML, as it should be reviewed
        const result = checkXss(code)
        expect(result.passed).toBe(false)
      })
    })

    describe('Edge Cases - Unsafe Code', () => {
      it('should fail for dangerouslySetInnerHTML', () => {
        const code = `
          return <div dangerouslySetInnerHTML={{ __html: userInput }} />
        `
        const result = checkXss(code)
        expect(result.passed).toBe(false)
        expect(result.severity).toBe('HIGH')
      })

      it('should fail for innerHTML assignment', () => {
        const code = `
          document.getElementById('content').innerHTML = userContent
        `
        const result = checkXss(code)
        expect(result.passed).toBe(false)
      })

      it('should fail for document.write', () => {
        const code = `
          document.write('<script>' + userScript + '</script>')
        `
        const result = checkXss(code)
        expect(result.passed).toBe(false)
      })

      it('should fail for eval usage', () => {
        const code = `
          const result = eval(userExpression)
        `
        const result = checkXss(code)
        expect(result.passed).toBe(false)
      })

      it('should fail for new Function constructor', () => {
        const code = `
          const fn = new Function('return ' + userCode)
        `
        const result = checkXss(code)
        expect(result.passed).toBe(false)
      })

      it('should fail for jQuery html with template literal', () => {
        const code = `
          $(element).html(\`<div>\${userInput}</div>\`)
        `
        const result = checkXss(code)
        expect(result.passed).toBe(false)
      })
    })
  })

  // ============================================================================
  // Sensitive Data Tests
  // ============================================================================
  describe('checkSensitiveData', () => {
    describe('Happy Path - Safe Code', () => {
      it('should pass for environment variable usage', () => {
        const code = `
          const apiKey = process.env.API_KEY
          const dbUrl = process.env.DATABASE_URL
        `
        const result = checkSensitiveData(code)
        expect(result.passed).toBe(true)
      })

      it('should pass for placeholder values', () => {
        const code = `
          const config = {
            apiKey: 'YOUR_API_KEY_HERE',
            secret: 'placeholder'
          }
        `
        // This might still pass as it's not a real key pattern
        const result = checkSensitiveData(code)
        expect(result.passed).toBe(true)
      })
    })

    describe('Edge Cases - Unsafe Code', () => {
      it('should fail for hardcoded password', () => {
        const code = `
          const password = "mySecretPassword123"
        `
        const result = checkSensitiveData(code)
        expect(result.passed).toBe(false)
        expect(result.severity).toBe('CRITICAL')
      })

      it('should fail for hardcoded API key', () => {
        const code = `
          const apiKey = "sk_live_1234567890abcdef"
        `
        const result = checkSensitiveData(code)
        expect(result.passed).toBe(false)
      })

      it('should fail for hardcoded secret', () => {
        const code = `
          const secret = "super_secret_value_here"
        `
        const result = checkSensitiveData(code)
        expect(result.passed).toBe(false)
      })

      it('should fail for hardcoded Bearer token', () => {
        const code = `
          const headers = {
            Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
          }
        `
        const result = checkSensitiveData(code)
        expect(result.passed).toBe(false)
      })

      it('should fail for private key', () => {
        const code = `
          const private_key = "-----BEGIN PRIVATE KEY-----"
        `
        const result = checkSensitiveData(code)
        expect(result.passed).toBe(false)
      })
    })
  })

  // ============================================================================
  // Input Validation Tests
  // ============================================================================
  describe('checkInputValidation', () => {
    describe('Happy Path - Validated Code', () => {
      it('should pass for Zod schema validation', () => {
        const code = `
          const body = await request.json()
          const validated = schema.parse(body)
        `
        const result = checkInputValidation(code)
        expect(result.passed).toBe(true)
      })

      it('should pass for safeParse usage', () => {
        const code = `
          const body = await request.json()
          const result = schema.safeParse(body)
          if (!result.success) throw new ValidationError()
        `
        const result = checkInputValidation(code)
        expect(result.passed).toBe(true)
      })

      it('should pass for yup validation', () => {
        const code = `
          const data = req.body
          await yupSchema.validate(data)
        `
        const result = checkInputValidation(code)
        expect(result.passed).toBe(true)
      })
    })

    describe('Edge Cases - Missing Validation', () => {
      it('should fail for request.json without validation', () => {
        const code = `
          const body = await request.json()
          await prisma.user.create({ data: body })
        `
        const result = checkInputValidation(code)
        expect(result.passed).toBe(false)
        expect(result.severity).toBe('HIGH')
      })

      it('should fail for req.body without validation', () => {
        const code = `
          const { name, email } = req.body
          db.users.insert({ name, email })
        `
        const result = checkInputValidation(code)
        expect(result.passed).toBe(false)
      })
    })

    describe('No Body Usage', () => {
      it('should pass when no body is used', () => {
        const code = `
          const users = await prisma.user.findMany()
          return users
        `
        const result = checkInputValidation(code)
        expect(result.passed).toBe(true)
      })
    })
  })

  // ============================================================================
  // Authentication Tests
  // ============================================================================
  describe('checkAuthentication', () => {
    describe('Happy Path - Authenticated Routes', () => {
      it('should pass for route with getServerSession', () => {
        const code = `
          export async function GET(request: Request) {
            const session = await getServerSession(authOptions)
            if (!session) return unauthorized()
            return NextResponse.json({ data })
          }
        `
        const result = checkAuthentication(code)
        expect(result.passed).toBe(true)
      })

      it('should pass for route with requireAuth', () => {
        const code = `
          export async function POST(request: Request) {
            await requireAuth()
            const body = await request.json()
            return NextResponse.json({ success: true })
          }
        `
        const result = checkAuthentication(code)
        expect(result.passed).toBe(true)
      })

      it('should pass for route checking session.user', () => {
        const code = `
          export async function DELETE(request: Request) {
            if (!session?.user) throw new Error('Unauthorized')
            await deleteResource()
          }
        `
        const result = checkAuthentication(code)
        expect(result.passed).toBe(true)
      })
    })

    describe('Edge Cases - Missing Authentication', () => {
      it('should fail for API route without auth check', () => {
        const code = `
          export async function GET(request: Request) {
            const users = await prisma.user.findMany()
            return NextResponse.json(users)
          }
        `
        const result = checkAuthentication(code)
        expect(result.passed).toBe(false)
        expect(result.severity).toBe('HIGH')
      })

      it('should fail for POST without auth', () => {
        const code = `
          export async function POST(request: Request) {
            const body = await request.json()
            const user = await prisma.user.create({ data: body })
            return NextResponse.json(user)
          }
        `
        const result = checkAuthentication(code)
        expect(result.passed).toBe(false)
      })
    })

    describe('Non-API Code', () => {
      it('should pass for non-API route code', () => {
        const code = `
          function calculateSum(a: number, b: number) {
            return a + b
          }
        `
        const result = checkAuthentication(code)
        expect(result.passed).toBe(true)
      })
    })
  })

  // ============================================================================
  // Full Security Report Tests
  // ============================================================================
  describe('verifyCodeSecurity', () => {
    it('should generate comprehensive report for safe code', () => {
      const code = `
        export async function GET(request: Request) {
          const session = await getServerSession(authOptions)
          if (!session) return unauthorized()

          const users = await prisma.user.findMany({
            where: { organizationId: session.user.orgId }
          })

          return NextResponse.json(users)
        }
      `
      const report = verifyCodeSecurity(code, { logResults: false })

      expect(report.overallPassed).toBe(true)
      expect(report.criticalIssues).toBe(0)
      expect(report.highIssues).toBe(0)
      expect(report.passedChecks).toBeGreaterThan(0)
    })

    it('should detect multiple vulnerabilities', () => {
      const code = `
        export async function POST(request: Request) {
          const body = await request.json()
          const password = "admin123"

          const result = await prisma.$queryRaw\`
            SELECT * FROM users WHERE name = \${body.name}
          \`

          return <div dangerouslySetInnerHTML={{ __html: body.content }} />
        }
      `
      const report = verifyCodeSecurity(code, { logResults: false })

      expect(report.overallPassed).toBe(false)
      expect(report.criticalIssues).toBeGreaterThan(0)
      expect(report.recommendations.length).toBeGreaterThan(0)
    })

    it('should throw on critical issues when configured', () => {
      const code = `
        const apiKey = "sk_live_12345678901234567890"
      `

      expect(() => {
        verifyCodeSecurity(code, { throwOnCritical: true, logResults: false })
      }).toThrow()
    })

    it('should not throw for non-critical issues', () => {
      const code = `
        export async function GET(request: Request) {
          return NextResponse.json({ ok: true })
        }
      `

      expect(() => {
        verifyCodeSecurity(code, { throwOnCritical: true, logResults: false })
      }).not.toThrow()
    })
  })

  // ============================================================================
  // Report Generation Tests
  // ============================================================================
  describe('generateSecurityReportMarkdown', () => {
    it('should generate valid markdown for passing report', () => {
      const report = verifyCodeSecurity('const x = 1', { logResults: false })
      const markdown = generateSecurityReportMarkdown(report)

      expect(markdown).toContain('# 보안 자가 검증 결과')
      expect(markdown).toContain('통과')
    })

    it('should include recommendations for failing report', () => {
      const code = `const password = "secret123"`
      const report = verifyCodeSecurity(code, { logResults: false })
      const markdown = generateSecurityReportMarkdown(report)

      expect(markdown).toContain('권장 조치사항')
      expect(markdown).toContain('환경 변수')
    })

    it('should include all severity levels in summary', () => {
      const report = verifyCodeSecurity('', { logResults: false })
      const markdown = generateSecurityReportMarkdown(report)

      expect(markdown).toContain('Critical 이슈')
      expect(markdown).toContain('High 이슈')
      expect(markdown).toContain('Medium 이슈')
      expect(markdown).toContain('Low 이슈')
    })
  })

  // ============================================================================
  // Performance Tests
  // ============================================================================
  describe('Performance', () => {
    it('should complete verification under 100ms for typical code', () => {
      const code = `
        export async function GET(request: Request) {
          const session = await getServerSession(authOptions)
          if (!session?.user?.id) throw new AuthenticationError()

          const body = await request.json()
          const validated = schema.parse(body)

          const result = await prisma.user.findUnique({
            where: { id: session.user.id }
          })

          return NextResponse.json(result)
        }
      `.repeat(10) // Simulate larger file

      const start = performance.now()
      verifyCodeSecurity(code, { logResults: false })
      const duration = performance.now() - start

      expect(duration).toBeLessThan(100)
    })

    it('should handle very large files without timing out', () => {
      const code = 'const x = 1;\n'.repeat(10000)

      const start = performance.now()
      verifyCodeSecurity(code, { logResults: false })
      const duration = performance.now() - start

      expect(duration).toBeLessThan(1000)
    })
  })
})
