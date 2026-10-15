import { ReportPdfExporter } from './index.exporter';

describe('ReportPdfExporter', () => {
  it('keeps the print frame and the file name until the browser finishes printing', async () => {
    const print = vi.fn();
    vi.spyOn(HTMLIFrameElement.prototype, 'contentWindow', 'get').mockImplementation(function (this: HTMLIFrameElement) {
      const view = this.contentDocument!.defaultView!;
      view.print = print;
      return view;
    });
    const originalTitle = document.title;

    await new ReportPdfExporter().export('# Relatório', 'relatorio-x');

    const frame = document.querySelector('iframe')!;
    expect(print).toHaveBeenCalled();
    expect(frame.contentDocument!.body.innerHTML).toContain('<h1>Relatório</h1>');
    expect(document.title).toBe('relatorio-x');

    frame.contentDocument!.defaultView!.dispatchEvent(new Event('afterprint'));
    expect(document.querySelector('iframe')).toBeNull();
    expect(document.title).toBe(originalTitle);
    vi.restoreAllMocks();
  });
});
