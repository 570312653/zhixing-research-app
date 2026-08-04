const allowedTags = new Set([
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
]);

const prohibitedPhrases =
  /建议买入|建议卖出|满仓|保证收益|(?:用户|我|你|您)\s*(?:的\s*)?(?:持有|持仓|盈亏|盈利|亏损)|(?:立即|建议(?:立即)?|请)\s*(?:买入|卖出|加仓|减仓|清仓)|(?:目标|止损|止盈)\s*价\s*\d/u;

export type HtmlPolicyResult =
  | { ok: true; value: string }
  | {
      ok: false;
      errorCode: 'UNSAFE_HTML' | 'COMPLIANCE_VIOLATION';
      message: string;
    };

export type TextComplianceResult =
  | { ok: true }
  | {
      ok: false;
      errorCode: 'COMPLIANCE_VIOLATION';
      message: string;
    };

function unsafe(message: string): HtmlPolicyResult {
  return { ok: false, errorCode: 'UNSAFE_HTML', message };
}

function decodeNumericCharacterEntities(value: string): string {
  return value.replace(
    /&#(?:([0-9]+)|[xX]([0-9a-fA-F]+));?/gu,
    (_entity, decimalDigits: string | undefined, hexadecimalDigits: string | undefined) => {
      const digits = decimalDigits ?? hexadecimalDigits;
      const radix = decimalDigits === undefined ? 16 : 10;
      const codePoint = digits === undefined ? Number.NaN : Number.parseInt(digits, radix);

      if (
        !Number.isSafeInteger(codePoint) ||
        codePoint < 1 ||
        codePoint > 0x10ffff ||
        (codePoint >= 0xd800 && codePoint <= 0xdfff)
      ) {
        return '\uFFFD';
      }

      return String.fromCodePoint(codePoint);
    },
  );
}

export function validateTextCompliance(value: string): TextComplianceResult {
  if (prohibitedPhrases.test(decodeNumericCharacterEntities(value))) {
    return {
      ok: false,
      errorCode: 'COMPLIANCE_VIOLATION',
      message: '报告包含不允许的交易或收益表述。',
    };
  }

  return { ok: true };
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.username === '' && url.password === '';
  } catch {
    return false;
  }
}

function validateAttributes(tagName: string, attributes: string): HtmlPolicyResult {
  if (tagName === 'td') {
    if (attributes.trim() === '') {
      return { ok: true, value: attributes };
    }

    const dataLabelMatch =
      /^\s+data-label\s*=\s*(?:"([^"]*)"|'([^']*)')\s*$/u.exec(attributes);
    if (!dataLabelMatch) {
      return unsafe('<td> 只允许一个带引号的 data-label 属性。');
    }

    const dataLabel = dataLabelMatch[1] ?? dataLabelMatch[2] ?? '';
    if (
      dataLabel.length < 1 ||
      dataLabel.length > 32 ||
      dataLabel.includes('&') ||
      /[<>"'\u0000-\u001f\u007f]/u.test(dataLabel)
    ) {
      return unsafe('<td> 的 data-label 必须是 1–32 个安全文本字符。');
    }

    return { ok: true, value: attributes };
  }

  if (tagName !== 'a') {
    return attributes.trim() === ''
      ? { ok: true, value: attributes }
      : unsafe(`标签 <${tagName}> 不允许属性。`);
  }

  const hrefMatch = /^\s+href\s*=\s*(?:"([^"]*)"|'([^']*)')\s*$/u.exec(
    attributes,
  );
  if (!hrefMatch) {
    return unsafe('<a> 只允许带引号的 href 属性。');
  }

  const href = hrefMatch[1] ?? hrefMatch[2] ?? '';
  return isHttpsUrl(href)
    ? { ok: true, value: attributes }
    : unsafe('<a> 的 href 必须是 HTTPS 链接。');
}

export function validateHtmlPolicy(html: string): HtmlPolicyResult {
  const stack: string[] = [];
  const tagPattern = /<[^>]*>/gu;
  let currentIndex = 0;

  for (const match of html.matchAll(tagPattern)) {
    const index = match.index ?? 0;
    if (html.slice(currentIndex, index).includes('<')) {
      return unsafe('HTML 包含无法解析的标签起始符。');
    }

    const parsedTag = /^<(\/)?([A-Za-z][A-Za-z0-9-]*)([^<>]*)>$/u.exec(
      match[0],
    );
    if (!parsedTag) return unsafe('HTML 包含无法解析的标签。');

    const isClosingTag = parsedTag[1] === '/';
    const tagName = parsedTag[2].toLowerCase();
    const attributes = parsedTag[3];
    if (!allowedTags.has(tagName)) return unsafe(`不允许标签 <${tagName}>。`);

    if (isClosingTag) {
      if (attributes.trim() !== '') {
        return unsafe(`闭合标签 </${tagName}> 不允许属性。`);
      }
      if (stack.pop() !== tagName) {
        return unsafe('HTML 标签嵌套或闭合顺序无效。');
      }
    } else {
      const attributeResult = validateAttributes(tagName, attributes);
      if (!attributeResult.ok) return attributeResult;
      stack.push(tagName);
    }

    currentIndex = index + match[0].length;
  }

  if (html.slice(currentIndex).includes('<')) {
    return unsafe('HTML 包含无法解析的标签起始符。');
  }
  if (stack.length > 0) return unsafe('HTML 存在未闭合标签。');
  const complianceResult = validateTextCompliance(html);
  if (!complianceResult.ok) return complianceResult;

  return { ok: true, value: html };
}
