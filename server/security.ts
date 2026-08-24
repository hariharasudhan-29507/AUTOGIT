export interface SecurityFinding {
  ruleId: string
  title: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  file?: string
  line?: number
  matchSnippet?: string
  remediation: string
}

export interface SecurityAuditResult {
  score: number
  status: 'passed' | 'warning' | 'failed'
  findings: SecurityFinding[]
  scannedFilesCount: number
  scannedAt: string
}

interface SecretPattern {
  ruleId: string
  title: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  regex: RegExp
  remediation: string
}

const SECRET_PATTERNS: SecretPattern[] = [
  {
    ruleId: 'SEC-001',
    title: 'Exposed AWS Access Key ID',
    severity: 'critical',
    description: 'Found standard AWS Access Key ID pattern.',
    regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    remediation: 'Revoke key in AWS IAM immediately and migrate to AWS IAM Roles or environment variables.',
  },
  {
    ruleId: 'SEC-002',
    title: 'Exposed GitHub Personal Access Token',
    severity: 'critical',
    description: 'Found GitHub personal access token (ghp_ or github_pat_ prefix).',
    regex: /(?:ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})/g,
    remediation: 'Revoke token in GitHub Developer Settings and use GitHub Secrets in CI/CD.',
  },
  {
    ruleId: 'SEC-003',
    title: 'Exposed Stripe API Secret Key',
    severity: 'critical',
    description: 'Found Stripe live secret key token.',
    regex: /sk_live_[0-9a-zA-Z]{24,34}/g,
    remediation: 'Roll the API key in Stripe Dashboard and store in server-side KMS.',
  },
  {
    ruleId: 'SEC-004',
    title: 'Exposed OpenAI / LLM API Key',
    severity: 'high',
    description: 'Found OpenAI or AI platform secret API key pattern.',
    regex: /sk-(?:proj-)?[a-zA-Z0-9]{32,64}/g,
    remediation: 'Revoke and rotate API key immediately in provider console.',
  },
  {
    ruleId: 'SEC-005',
    title: 'Exposed Private Cryptographic Key',
    severity: 'critical',
    description: 'Found unencrypted RSA, OpenSSH, or EC private key header.',
    regex: /-----BEGIN (?:RSA|OPENSSH|EC|DSA|PGP) PRIVATE KEY-----/g,
    remediation: 'Remove private key file from git history using git-filter-repo and regenerate keypair.',
  },
  {
    ruleId: 'SEC-006',
    title: 'Database Connection String with Credentials',
    severity: 'high',
    description: 'Found database URI containing embedded username and password.',
    regex: /(?:postgres|postgresql|mysql|mongodb):\/\/[^:\s]+:[^@\s]+@[^/\s]+(?::\d+)?\/[^\s]+/gi,
    remediation: 'Extract credentials into secure environment variables and use connection poolers.',
  },
]

export function scanCodeForSecrets(content: string, filename = 'code.ts'): SecurityFinding[] {
  const findings: SecurityFinding[] = []
  const lines = content.split('\n')

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]
    for (const pattern of SECRET_PATTERNS) {
      pattern.regex.lastIndex = 0
      const match = pattern.regex.exec(line)
      if (match) {
        // Redact match for security
        const raw = match[0]
        const redacted = raw.length > 8 ? `${raw.slice(0, 4)}...${raw.slice(-4)}` : '****'
        findings.push({
          ruleId: pattern.ruleId,
          title: pattern.title,
          severity: pattern.severity,
          description: pattern.description,
          file: filename,
          line: lineIdx + 1,
          matchSnippet: redacted,
          remediation: pattern.remediation,
        })
      }
    }
  }

  return findings
}

export function evaluateRepositorySecurity(files: Array<{ name: string; content: string }>): SecurityAuditResult {
  const allFindings: SecurityFinding[] = []

  for (const file of files) {
    const findings = scanCodeForSecrets(file.content, file.name)
    allFindings.push(...findings)
  }

  // Calculate score
  let score = 100
  for (const finding of allFindings) {
    if (finding.severity === 'critical') score -= 35
    else if (finding.severity === 'high') score -= 20
    else if (finding.severity === 'medium') score -= 10
    else if (finding.severity === 'low') score -= 5
  }

  score = Math.max(0, Math.min(100, score))
  const status: SecurityAuditResult['status'] = score >= 90 ? 'passed' : score >= 60 ? 'warning' : 'failed'

  return {
    score,
    status,
    findings: allFindings,
    scannedFilesCount: files.length,
    scannedAt: new Date().toISOString(),
  }
}
