import { describe, expect, it } from 'vitest'
import { formatRelativeTime } from './utils'

describe('formatRelativeTime', () => {
  it('formats recent timestamps', () => { expect(formatRelativeTime(new Date(Date.now() - 3_600_000).toISOString())).toBe('1h ago') })
  it('formats very recent timestamps', () => { expect(formatRelativeTime(new Date().toISOString())).toBe('just now') })
})
