import { describe, expect, it } from 'vitest'
import { scanCodeForSecrets, evaluateRepositorySecurity } from './security'

describe('AST Security Scanner Engine', () => {
  it('detects exposed AWS Access Keys', () => {
    const code = `
      const awsKey = "AKIAIOSFODNN7EXAMPLE";
      const s3 = new S3({ accessKeyId: awsKey });
    `
    const findings = scanCodeForSecrets(code, 'src/aws.ts')
    expect(findings.length).toBe(1)
    expect(findings[0].ruleId).toBe('SEC-001')
    expect(findings[0].severity).toBe('critical')
    expect(findings[0].file).toBe('src/aws.ts')
    expect(findings[0].matchSnippet).toBe('AKIA...MPLE')
  })

  it('detects exposed GitHub Personal Access Tokens', () => {
    const code = `
      const token = "ghp_111122223333444455556666777788889999";
    `
    const findings = scanCodeForSecrets(code, 'src/github.ts')
    expect(findings.length).toBe(1)
    expect(findings[0].ruleId).toBe('SEC-002')
    expect(findings[0].severity).toBe('critical')
  })

  it('detects unencrypted private key blocks', () => {
    const code = `
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y1+
-----END RSA PRIVATE KEY-----
    `
    const findings = scanCodeForSecrets(code, 'keys/id_rsa')
    expect(findings.length).toBe(1)
    expect(findings[0].ruleId).toBe('SEC-005')
  })

  it('evaluates clean repository as 100/100 score', () => {
    const files = [
      { name: 'src/app.ts', content: 'export const app = new Hono();' },
      { name: 'src/utils.ts', content: 'export function sum(a: number, b: number) { return a + b; }' },
    ]
    const audit = evaluateRepositorySecurity(files)
    expect(audit.score).toBe(100)
    expect(audit.status).toBe('passed')
    expect(audit.findings.length).toBe(0)
    expect(audit.scannedFilesCount).toBe(2)
  })

  it('evaluates vulnerable repository with proper score deductions', () => {
    const files = [
      { name: 'src/app.ts', content: 'const key = "sk_live_123456789012345678901234";' },
    ]
    const audit = evaluateRepositorySecurity(files)
    expect(audit.score).toBe(65)
    expect(audit.status).toBe('warning')
    expect(audit.findings.length).toBe(1)
  })
})
