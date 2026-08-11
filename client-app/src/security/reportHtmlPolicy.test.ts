import { cleanup, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { ReportHtmlRenderer } from '../components/ReportHtmlRenderer'
import { applyReportHtmlPolicy } from './reportHtmlPolicy'

describe('report HTML rejection policy', () => {
  afterEach(cleanup)

  it('accepts only the approved report structure, HTTPS links, and safe table labels', () => {
    const html = '<article><h1>固定样例</h1><h2>摘要</h2><p>正文 <strong>重点</strong> 与 <em>说明</em>。</p><ul><li><a href="https://example.test/evidence">证据</a></li></ul><ol><li>验证项</li></ol><table><thead><tr><th>项目</th></tr></thead><tbody><tr><td data-label="项目">固定值</td><td>补充值</td></tr></tbody></table></article>'

    expect(applyReportHtmlPolicy(html)).toEqual({ kind: 'safe', html })
  })

  it.each([
    ['script', '<article><script>alert(1)</script></article>'],
    ['style tag', '<article><style>body{display:none}</style></article>'],
    ['iframe', '<article><iframe src="https://example.test"></iframe></article>'],
    ['form', '<article><form></form></article>'],
    ['image', '<article><img src="https://example.test/a.png"></article>'],
    ['svg', '<article><svg></svg></article>'],
    ['mathml', '<article><math></math></article>'],
    ['object', '<article><object></object></article>'],
    ['media', '<article><video></video></article>'],
    ['metadata', '<article><meta charset="utf-8"></article>'],
    ['event attribute', '<article><p onclick="alert(1)">内容</p></article>'],
    ['class attribute', '<article class="report"><p>内容</p></article>'],
    ['style attribute', '<article><p style="color:red">内容</p></article>'],
    ['id attribute', '<article id="report"><p>内容</p></article>'],
    ['javascript URL', '<article><a href="javascript:alert(1)">内容</a></article>'],
    ['credential URL', '<article><a href="https://user:pass@example.test">内容</a></article>'],
    ['entity-encoded credential URL', '<article><a href="https://user&#58;pass&#64;evil.com">内容</a></article>'],
    ['HTTP URL', '<article><a href="http://example.test">内容</a></article>'],
    ['duplicate href', '<article><a href="https://example.test" href="https://other.test">内容</a></article>'],
    ['unquoted href', '<article><a href=https://example.test>内容</a></article>'],
    ['unsafe data label', '<table><tbody><tr><td data-label="a&amp;b">值</td></tr></tbody></table>'],
    ['control character data label', '<table><tbody><tr><td data-label="a\u0001b">值</td></tr></tbody></table>'],
    ['duplicate data label', '<table><tbody><tr><td data-label="甲" data-label="乙">值</td></tr></tbody></table>'],
    ['comment', '<article><!-- hidden --><p>内容</p></article>'],
    ['doctype', '<!DOCTYPE html><article><p>内容</p></article>'],
    ['self closing', '<article><p /></article>'],
    ['unknown tag', '<article><section>内容</section></article>'],
    ['misordered tags', '<article><p>内容</article></p>'],
    ['unclosed tag', '<article><p>内容</p>'],
  ])('blocks %s without carrying the original HTML', (_name, html) => {
    const result = applyReportHtmlPolicy(html)

    expect(result).toEqual({ kind: 'blocked', errorCode: 'UNSAFE_REPORT_HTML' })
    expect(JSON.stringify(result)).not.toContain(html)
  })

  it.each([
    '<article><p>保证收益</p></article>',
    '<article><p>建议买入</p></article>',
    '<article><p>请立即清仓</p></article>',
    '<article><p>您的持仓需要调整</p></article>',
    '<article><p>止损价 10</p></article>',
    '<article><p>&#20445;&#35777;&#25910;&#30410;</p></article>',
    '<article><p>&#x4fdd;&#x8bc1;&#x6536;&#x76ca;</p></article>',
  ])('blocks prohibited trading or return language, including numeric entities', (html) => {
    expect(applyReportHtmlPolicy(html)).toEqual({
      kind: 'blocked',
      errorCode: 'REPORT_CONTENT_POLICY_VIOLATION',
    })
  })

  it('renders safe HTML through the report renderer', () => {
    render(createElement(ReportHtmlRenderer, { html: '<article><h1>安全标题</h1><p>固定样例正文</p></article>' }))

    expect(screen.getByRole('heading', { name: '安全标题' })).toBeInTheDocument()
    expect(screen.getByText('固定样例正文')).toBeInTheDocument()
  })

  it('renders a fixed alert and never inserts or echoes blocked markup', () => {
    const malicious = '<img src=x onerror="alert(1)">恶意原文'
    const { container } = render(createElement(ReportHtmlRenderer, { html: malicious }))

    expect(screen.getByRole('alert')).toHaveTextContent('报告正文因安全校验未通过，暂时无法显示')
    expect(container.querySelector('img')).toBeNull()
    expect(container).not.toHaveTextContent('恶意原文')
    expect(container.innerHTML).not.toContain(malicious)
  })

  it('blocks an entity-encoded credential URL before innerHTML can decode it into a link', () => {
    const malicious = '<article><p><a href="https://user&#58;pass&#64;evil.com">实体凭证链接</a></p></article>'
    const { container } = render(createElement(ReportHtmlRenderer, { html: malicious }))

    expect(screen.getByRole('alert')).toHaveTextContent('报告正文因安全校验未通过，暂时无法显示')
    expect(container.querySelector('a')).toBeNull()
    expect(container).not.toHaveTextContent('实体凭证链接')
  })
})
