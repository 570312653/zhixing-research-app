const ALLOWED_TAGS = new Set([
  'article',
  'h1',
  'h2',
  'p',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
  'a',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
])

const PROHIBITED_LANGUAGE =
  /建议买入|建议卖出|满仓|保证收益|(?:用户|我|你|您)\s*(?:的\s*)?(?:持有|持仓|盈亏|盈利|亏损)|(?:立即|建议(?:立即)?|请)\s*(?:买入|卖出|加仓|减仓|清仓)|(?:目标|止损|止盈)\s*价\s*\d/u

export type ReportHtmlPolicyResult =
  | { kind: 'safe'; html: string }
  | {
      kind: 'blocked'
      errorCode: 'UNSAFE_REPORT_HTML' | 'REPORT_CONTENT_POLICY_VIOLATION'
    }

function blocked(errorCode: 'UNSAFE_REPORT_HTML' | 'REPORT_CONTENT_POLICY_VIOLATION'): ReportHtmlPolicyResult {
  return { kind: 'blocked', errorCode }
}

function decodeNumericCharacterEntities(value: string): string {
  return value.replace(
    /&#(?:([0-9]+)|[xX]([0-9a-fA-F]+));?/gu,
    (_entity, decimalDigits: string | undefined, hexadecimalDigits: string | undefined) => {
      const digits = decimalDigits ?? hexadecimalDigits
      const radix = decimalDigits === undefined ? 16 : 10
      const codePoint = digits === undefined ? Number.NaN : Number.parseInt(digits, radix)

      if (
        !Number.isSafeInteger(codePoint) ||
        codePoint < 1 ||
        codePoint > 0x10ffff ||
        (codePoint >= 0xd800 && codePoint <= 0xdfff)
      ) {
        return '\uFFFD'
      }

      return String.fromCodePoint(codePoint)
    },
  )
}

function isSafeHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.username === '' && url.password === ''
  } catch {
    return false
  }
}

function attributesAreSafe(tagName: string, attributes: string): boolean {
  if (tagName === 'td') {
    if (attributes.trim() === '') return true

    const match = /^\s+data-label\s*=\s*(?:"([^"]*)"|'([^']*)')\s*$/u.exec(attributes)
    if (!match) return false
    const value = match[1] ?? match[2] ?? ''
    const hasControlCharacter = Array.from(value).some((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      return codePoint <= 31 || codePoint === 127
    })
    return (
      value.length >= 1 &&
      value.length <= 32 &&
      !value.includes('&') &&
      !/[<>"']/u.test(value) &&
      !hasControlCharacter
    )
  }

  if (tagName !== 'a') return attributes.trim() === ''

  const match = /^\s+href\s*=\s*(?:"([^"]*)"|'([^']*)')\s*$/u.exec(attributes)
  if (!match) return false
  const href = match[1] ?? match[2] ?? ''
  if (href.includes('&')) return false
  return isSafeHttpsUrl(href)
}

export function applyReportHtmlPolicy(html: string): ReportHtmlPolicyResult {
  const stack: string[] = []
  const tagPattern = /<[^>]*>/gu
  let currentIndex = 0

  for (const match of html.matchAll(tagPattern)) {
    const index = match.index ?? 0
    if (html.slice(currentIndex, index).includes('<')) {
      return blocked('UNSAFE_REPORT_HTML')
    }

    const parsedTag = /^<(\/)?([A-Za-z][A-Za-z0-9-]*)([^<>]*)>$/u.exec(match[0])
    if (!parsedTag) return blocked('UNSAFE_REPORT_HTML')

    const isClosingTag = parsedTag[1] === '/'
    const tagName = parsedTag[2].toLocaleLowerCase()
    const attributes = parsedTag[3]
    if (!ALLOWED_TAGS.has(tagName)) return blocked('UNSAFE_REPORT_HTML')

    if (isClosingTag) {
      if (attributes.trim() !== '' || stack.pop() !== tagName) {
        return blocked('UNSAFE_REPORT_HTML')
      }
    } else {
      if (!attributesAreSafe(tagName, attributes)) return blocked('UNSAFE_REPORT_HTML')
      stack.push(tagName)
    }

    currentIndex = index + match[0].length
  }

  if (html.slice(currentIndex).includes('<') || stack.length > 0) {
    return blocked('UNSAFE_REPORT_HTML')
  }

  if (PROHIBITED_LANGUAGE.test(decodeNumericCharacterEntities(html))) {
    return blocked('REPORT_CONTENT_POLICY_VIOLATION')
  }

  return { kind: 'safe', html }
}
