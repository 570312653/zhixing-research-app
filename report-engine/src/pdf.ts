export type PdfRenderError = {
  kind: 'error';
  errorCode: 'PDF_RENDERER_UNAVAILABLE';
  message: string;
};

/**
 * PDF 导出边界：固定样例原型刻意不携带 Chromium 或 Playwright。
 * 未来替换此函数时，必须只接收已经通过 HTML 与合规校验的正文。
 */
export async function renderPdf(_html: string): Promise<PdfRenderError> {
  return {
    kind: 'error',
    errorCode: 'PDF_RENDERER_UNAVAILABLE',
    message: '本地固定样例原型未配置 Chromium PDF 渲染器。',
  };
}
